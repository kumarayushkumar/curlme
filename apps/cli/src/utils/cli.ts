import { exec } from 'child_process'
import * as readline from 'readline'
import { apiClient } from './api.js'
import {
  clearDeviceCode,
  clearToken,
  getDeviceCode,
  isAuthenticated,
  saveDeviceCode,
  saveToken
} from './config.js'
import {
  colorize,
  error,
  formatOutput,
  info,
  success,
  warning
} from './output.js'

// Authentication
async function handleLogin() {
  try {
    if (isAuthenticated()) {
      info('You are already logged in!')
      return
    }

    const existingDeviceCode = getDeviceCode()
    if (existingDeviceCode) {
      info('Completing GitHub authentication...')
      try {
        const response = await apiClient.post('/login', {
          device_code: existingDeviceCode
        })
        if (response?.success && response?.data?.token) {
          saveToken(response.data.token)
          clearDeviceCode()
          success('Login successful!')
          info('You are now authenticated with curlme')
          return
        }
        if (response?.error === 'authorization_pending') {
          warning(
            'GitHub authorization is still pending. Please complete it in your browser.'
          )
          return
        }
        // Any other outcome: clear device code and proceed to start a new flow
        clearDeviceCode()
      } catch {
        clearDeviceCode()
      }
    }

    info('Starting GitHub authentication...')
    const start = await apiClient.post('/login')
    if (start?.success && start?.data?.device_code) {
      const newDeviceCode = start.data.device_code
      const userCode = start.data.user_code
      const verificationUri = start.data.verification_uri
      saveDeviceCode(newDeviceCode)

      console.log('\n' + '='.repeat(60))
      console.log(colorize('GitHub Authentication Required', 'bold'))
      console.log('='.repeat(60))
      console.log(`1. Visit: ${colorize(verificationUri, 'blue')}`)
      console.log(`2. Enter code: ${colorize(userCode, 'yellow')}`)
      console.log('3. Authorize the application')
      console.log('='.repeat(60))

      try {
        const openCmd =
          process.platform === 'darwin'
            ? 'open'
            : process.platform === 'win32'
              ? 'start'
              : 'xdg-open'
        exec(`${openCmd} ${verificationUri}`)
        info('Opening browser automatically...')
      } catch {}

      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      })
      const answer = await new Promise<string>(resolve => {
        rl.question(
          '\nHave you authorized the application? (y/N): ',
          (ans: string) => {
            rl.close()
            resolve(ans.toLowerCase())
          }
        )
      })

      if (answer === 'y' || answer === 'yes') {
        try {
          const finish = await apiClient.post('/login', {
            device_code: newDeviceCode
          })
          if (finish?.success && finish?.data?.token) {
            saveToken(finish.data.token)
            clearDeviceCode()
            success('Login successful!')
            info('You are now authenticated with curlme')
            return
          }
          if (finish?.error === 'authorization_pending') {
            warning(
              'Authorization is still pending. Please complete it and try again.'
            )
            return
          }
          if (finish?.error === 'access_denied') {
            error('Authorization was denied. Please try again.')
            clearDeviceCode()
            return
          }
          error('Unexpected response from GitHub. Please try again.')
          clearDeviceCode()
        } catch (err: any) {
          error(`Authentication failed: ${err.message}`)
          clearDeviceCode()
        }
      } else {
        info(
          'Authentication cancelled. Run `curlme login` when ready to authenticate.'
        )
      }
    }
  } catch (err: any) {
    error(`Login failed: ${err.message}`)
  }
}

function handleLogout() {
  clearToken()
  clearDeviceCode()
  success('Logged out successfully')
}

async function handleProfile(username?: string) {
  try {
    let endpoint = '/profile'

    if (username) {
      // Fetch specific user's profile
      endpoint = `/profile/${username}`
      info(`Fetching profile for @${username}...`)
    } else {
      // Fetch own profile
      info('Fetching your profile...')
    }

    const response = await apiClient.get(endpoint, true)
    formatOutput(response)
  } catch (err: any) {
    if (username) {
      error(`Failed to fetch profile for @${username}: ${err.message}`)
    } else {
      error(`Failed to fetch profile: ${err.message}`)
    }
  }
}

async function handlePost(content: string) {
  try {
    if (!content.trim()) {
      error('Post content cannot be empty')
      info('Usage: curlme post "Your post content"')
      return
    }

    const response = await apiClient.post('/create-post', { content }, true)
    formatOutput(response)
  } catch (err: any) {
    error(`Failed to create post: ${err.message}`)
  }
}

async function handleFeed(page?: string) {
  try {
    const pageNum = page ? parseInt(page) : 1
    if (isNaN(pageNum) || pageNum < 1) {
      error('Page must be a positive number')
      info('Usage: curlme feed [page]')
      return
    }

    const queryParams = pageNum > 1 ? `?page=${pageNum}` : ''
    const response = await apiClient.get(`/feed${queryParams}`, true)

    formatOutput(response)

    // Show pagination info if it exists
    if (response?.data?.pagination) {
      const { currentPage, hasNextPage, totalPostsOnPage } =
        response.data.pagination
      console.log('\n' + colorize('Pagination Info:', 'bold'))
      console.log(`Page: ${currentPage} | Posts on page: ${totalPostsOnPage}`)

      if (!hasNextPage) {
        console.log(colorize('✓ This is the last page', 'green'))
      } else {
        console.log(
          colorize(
            `➤ Next page available: curlme feed ${currentPage + 1}`,
            'cyan'
          )
        )
      }
    }
  } catch (err: any) {
    error(`Failed to fetch feed: ${err.message}`)
  }
}

// Post Management Functions
async function handleDeletePost(postId: string) {
  try {
    if (!postId) {
      error('Post ID is required')
      info('Usage: curlme post-delete <post-id>')
      return
    }

    const response = await apiClient.delete(`/delete-post/${postId}`, true)
    formatOutput(response)
  } catch (err: any) {
    error(`Failed to delete post: ${err.message}`)
  }
}

async function handleLikePost(postId: string) {
  try {
    if (!postId) {
      error('Post ID is required')
      info('Usage: curlme post-like <post-id>')
      return
    }

    const response = await apiClient.post(
      `/toggle-like-post/${postId}`,
      {},
      true
    )
    formatOutput(response)
  } catch (err: any) {
    error(`Failed to like post: ${err.message}`)
  }
}

// Reply Management Functions
async function handleReply(postId: string, content: string) {
  try {
    if (!postId) {
      error('Post ID is required')
      info('Usage: curlme reply <post-id> "Your reply content"')
      return
    }

    if (!content.trim()) {
      error('Reply content cannot be empty')
      info('Usage: curlme reply <post-id> "Your reply content"')
      return
    }

    const response = await apiClient.post(
      `/create-reply/${postId}`,
      { content },
      true
    )
    formatOutput(response)
  } catch (err: any) {
    error(`Failed to create reply: ${err.message}`)
  }
}

async function handleDeleteReply(replyId: string) {
  try {
    if (!replyId) {
      error('Reply ID is required')
      info('Usage: curlme reply-delete <reply-id>')
      return
    }

    const response = await apiClient.delete(`/delete-reply/${replyId}`, true)
    formatOutput(response)
  } catch (err: any) {
    error(`Failed to delete reply: ${err.message}`)
  }
}

async function handleLikeReply(replyId: string) {
  try {
    if (!replyId) {
      error('Reply ID is required')
      info('Usage: curlme reply-like <reply-id>')
      return
    }

    const response = await apiClient.post(
      `/toggle-like-reply/${replyId}`,
      {},
      true
    )
    formatOutput(response)
  } catch (err: any) {
    error(`Failed to like reply: ${err.message}`)
  }
}

async function handlePostView(postId: string, page?: string) {
  try {
    if (!postId) {
      error('Post ID is required')
      info('Usage: curlme post-view <post-id> [page]')
      return
    }

    const pageNum = page ? parseInt(page) : 1
    if (isNaN(pageNum) || pageNum < 1) {
      error('Page must be a positive number')
      info('Usage: curlme post-view <post-id> [page]')
      return
    }

    const queryParams = pageNum > 1 ? `?page=${pageNum}` : ''
    const response = await apiClient.get(
      `/get-post/${postId}${queryParams}`,
      true
    )

    formatOutput(response)

    // Show pagination info if it exists
    if (response?.data?.pagination) {
      const { currentPage, hasNextPage, totalRepliesOnPage } =
        response.data.pagination
      console.log('\n' + colorize('Pagination Info:', 'bold'))
      console.log(
        `Page: ${currentPage} | Replies on page: ${totalRepliesOnPage}`
      )

      if (!hasNextPage) {
        console.log(colorize('✓ This is the last page', 'green'))
      } else {
        console.log(
          colorize(
            `➤ Next page available: curlme post-view ${postId} ${currentPage + 1}`,
            'cyan'
          )
        )
      }
    }
  } catch (err: any) {
    error(`Failed to view post: ${err.message}`)
  }
}

async function handleCurlmeInfo() {
  try {
    const response = await apiClient.get('/curlme')
    formatOutput(response)
  } catch (err: any) {
    error(`Failed to get curlme info: ${err.message}`)
  }
}

function showHelp() {
  console.log(`
${colorize('curlme', 'cyan')} - Social media for developers

${colorize('Usage:', 'bold')}
  curlme <command> [options]

${colorize('Commands:', 'bold')}
  ${colorize('Authentication:', 'yellow')}
  login                      Authenticate with GitHub
  logout                     Clear authentication token

  ${colorize('Profile:', 'yellow')}
  profile [username]         Show your profile or another user's profile

  ${colorize('Posts:', 'yellow')}
  post <content>             Create a new post
  post-view <post-id> [page] View a post and its replies (with pagination)
  post-delete <post-id>      Delete your post
  post-like <post-id>        Like/unlike a post

  ${colorize('Replies:', 'yellow')}
  reply <post-id> <content>  Reply to a post
  reply-delete <reply-id>    Delete your reply
  reply-like <reply-id>      Like/unlike a reply

  ${colorize('Feed:', 'yellow')}
  feed [page]               Show recent posts (with pagination)

  ${colorize('Info:', 'yellow')}
  info                       Show curlme welcome message
  curlme                     Show curlme welcome message

  ${colorize('Help:', 'yellow')}
  help                       Show this help message

${colorize('Examples:', 'bold')}
  ${colorize('Basic Usage:', 'cyan')}
  curlme login
  curlme info
  curlme post "Hello from the terminal!"
  curlme feed
  curlme feed 2
  curlme profile
  curlme profile johndoe

  ${colorize('Post Management:', 'cyan')}
  curlme post-view abc123
  curlme post-view abc123 2
  curlme post-delete abc123
  curlme post-like abc123

  ${colorize('Reply Management:', 'cyan')}
  curlme reply abc123 "Great post!"
  curlme delete-reply def456
  curlme like-reply def456
`)
}

export async function handleCommand(command: string, args: string[]) {
  try {
    switch (command) {
      case 'login':
        await handleLogin()
        break
      case 'logout':
        handleLogout()
        break
      case 'profile':
        await handleProfile(args[0])
        break
      case 'post': {
        const content = args.join(' ').trim()
        await handlePost(content)
        break
      }
      case 'post-view':
        await handlePostView(args[0], args[1])
        break
      case 'post-delete':
        await handleDeletePost(args[0])
        break
      case 'post-like':
        await handleLikePost(args[0])
        break
      case 'reply': {
        const postId = args[0]
        const content = args.slice(1).join(' ').trim()
        await handleReply(postId, content)
        break
      }
      case 'reply-delete':
        await handleDeleteReply(args[0])
        break
      case 'reply-like':
        await handleLikeReply(args[0])
        break
      case 'feed':
        await handleFeed(args[0])
        break
      case 'info':
      case 'curlme':
        await handleCurlmeInfo()
        break
      case 'help':
      default:
        showHelp()
        break
    }
  } catch (err: any) {
    error(err?.message || 'Command failed')
  }
}
