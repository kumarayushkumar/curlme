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

export async function handleCommand(command: string, args: string[]) {
  switch (command) {
    case 'login':
      await handleLogin()
      break
    case 'logout':
      handleLogout()
      break
    case 'profile':
      await handleProfile(args[0]) // Pass username as first argument
      break
    case 'post':
      await handlePost(args.join(' '))
      break
    case 'delete-post':
      await handleDeletePost(args[0])
      break
    case 'like-post':
      await handleLikePost(args[0])
      break
    case 'reply':
      await handleReply(args[0], args.slice(1).join(' '))
      break
    case 'delete-reply':
      await handleDeleteReply(args[0])
      break
    case 'like-reply':
      await handleLikeReply(args[0])
      break
    case 'feed':
      await handleFeed()
      break
    case 'help':
    case '--help':
    case '-h':
      showHelp()
      break
    default:
      error(`Unknown command: ${command}`)
      info('Run "curlme help" for available commands')
      break
  }
}

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

        if (response.includes('token:')) {
          const tokenMatch = response.match(/token:\s*(.+)/)
          if (tokenMatch) {
            const token = tokenMatch[1].trim()
            saveToken(token)
            clearDeviceCode()
            success('Login successful!')
            info('You are now authenticated with curlme')
            return
          }
        }

        if (response.includes('authorization_pending')) {
          warning(
            'GitHub authorization is still pending. Please complete it in your browser.'
          )
          return
        }

        clearDeviceCode()
      } catch (err) {
        clearDeviceCode()
      }
    }

    // Start new login flow
    info('Starting GitHub authentication...')
    const response = await apiClient.post('/login')

    if (response.includes('device_code:')) {
      const deviceCodeMatch = response.match(/device_code:\s*(.+)/)
      const userCodeMatch = response.match(/user_code:\s*(.+)/)
      const verificationUriMatch = response.match(/verification_uri:\s*(.+)/)

      if (deviceCodeMatch && userCodeMatch && verificationUriMatch) {
        const newDeviceCode = deviceCodeMatch[1].trim()
        const userCode = userCodeMatch[1].trim()
        const verificationUri = verificationUriMatch[1].trim()

        saveDeviceCode(newDeviceCode)

        console.log('\\n' + '='.repeat(60))
        console.log(colorize('GitHub Authentication Required', 'bold'))
        console.log('='.repeat(60))
        console.log(`1. Visit: ${colorize(verificationUri, 'blue')}`)
        console.log(`2. Enter code: ${colorize(userCode, 'yellow')}`)
        console.log(`3. Authorize the application`)
        console.log('='.repeat(60))

        // Try to open browser automatically
        try {
          const openCmd =
            process.platform === 'darwin'
              ? 'open'
              : process.platform === 'win32'
                ? 'start'
                : 'xdg-open'
          exec(`${openCmd} ${verificationUri}`)
          info('Opening browser automatically...')
        } catch {
          // Browser opening failed, manual instruction already shown
        }

        // Wait for user confirmation
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout
        })

        const answer = await new Promise<string>(resolve => {
          rl.question(
            '\\nHave you authorized the application? (y/N): ',
            (answer: string) => {
              rl.close()
              resolve(answer.toLowerCase())
            }
          )
        })

        if (answer === 'y' || answer === 'yes') {
          // Check for authorization
          try {
            const response = await apiClient.post('/login', {
              device_code: newDeviceCode
            })

            if (response.includes('token:')) {
              const tokenMatch = response.match(/token:\s*(.+)/)
              if (tokenMatch) {
                const token = tokenMatch[1].trim()
                saveToken(token)
                clearDeviceCode()
                success('Login successful!')
                info('You are now authenticated with curlme')
                return
              }
            }

            if (response.includes('authorization_pending')) {
              warning(
                'Authorization is still pending. Please complete it and try again.'
              )
              return
            }

            if (response.includes('access_denied')) {
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

    const response = await apiClient.post('/posts', { content }, true)
    formatOutput(response)
  } catch (err: any) {
    error(`Failed to create post: ${err.message}`)
  }
}

async function handleFeed() {
  try {
    const response = await apiClient.get('/feed', true)
    formatOutput(response)
  } catch (err: any) {
    error(`Failed to fetch feed: ${err.message}`)
  }
}

// Post Management Functions
async function handleDeletePost(postId: string) {
  try {
    if (!postId) {
      error('Post ID is required')
      info('Usage: curlme delete-post <post-id>')
      return
    }

    const response = await apiClient.delete(`/posts/${postId}`, true)
    formatOutput(response)
  } catch (err: any) {
    error(`Failed to delete post: ${err.message}`)
  }
}

async function handleLikePost(postId: string) {
  try {
    if (!postId) {
      error('Post ID is required')
      info('Usage: curlme like-post <post-id>')
      return
    }

    const response = await apiClient.post(`/posts/${postId}/like`, {}, true)
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
      `/posts/${postId}/replies`,
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
      info('Usage: curlme delete-reply <reply-id>')
      return
    }

    const response = await apiClient.delete(`/replies/${replyId}`, true)
    formatOutput(response)
  } catch (err: any) {
    error(`Failed to delete reply: ${err.message}`)
  }
}

async function handleLikeReply(replyId: string) {
  try {
    if (!replyId) {
      error('Reply ID is required')
      info('Usage: curlme like-reply <reply-id>')
      return
    }

    const response = await apiClient.post(`/replies/${replyId}/like`, {}, true)
    formatOutput(response)
  } catch (err: any) {
    error(`Failed to like reply: ${err.message}`)
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
  delete-post <post-id>      Delete your post
  like-post <post-id>        Like/unlike a post

  ${colorize('Replies:', 'yellow')}
  reply <post-id> <content>  Reply to a post
  delete-reply <reply-id>    Delete your reply
  like-reply <reply-id>      Like/unlike a reply

  ${colorize('Feed:', 'yellow')}
  feed                       Show recent posts

  ${colorize('Help:', 'yellow')}
  help                       Show this help message

${colorize('Examples:', 'bold')}
  ${colorize('Basic Usage:', 'cyan')}
  curlme login
  curlme post "Hello from the terminal!"
  curlme feed
  curlme profile
  curlme profile johndoe

  ${colorize('Post Management:', 'cyan')}
  curlme delete-post abc123
  curlme like-post abc123

  ${colorize('Reply Management:', 'cyan')}
  curlme reply abc123 "Great post!"
  curlme delete-reply def456
  curlme like-reply def456
`)
}
