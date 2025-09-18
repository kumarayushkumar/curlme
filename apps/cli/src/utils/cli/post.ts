/**
 * Handlers for post-related CLI commands
 */

import * as readline from 'readline'
import { apiClient } from '../api.js'
import { colorize, error, formatOutput, info } from '../output.js'

/**
 * Handles creating a new post with given content
 * @param {string} content - The content of the post
 */
export async function handlePost(content: string) {
  try {
    if (!content.trim()) {
      error('Post content cannot be empty')
      info('Usage: curlme post "Your post content"')
      return
    }

    const response = await apiClient.post('/api/create-post', { content }, true)
    formatOutput(response)
  } catch (err: any) {
    error(`Failed to create post: ${err.message}`)
  }
}

/**
 * Handles fetching and displaying the feed with optional pagination
 * @param {string} [page] - Optional page number for pagination
 */
export async function handleFeed(page?: string) {
  try {
    const pageNum = page ? parseInt(page) : 1
    if (isNaN(pageNum) || pageNum < 1) {
      error('Page must be a positive number')
      info('Usage: curlme feed [page]')
      return
    }

    const queryParams = pageNum > 1 ? `?page=${pageNum}` : ''
    const response = await apiClient.get(`/api/feed${queryParams}`, true)

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

/**
 * Handles the interactive feed mode with keyboard navigation
 */
export async function handleInteractiveFeed() {
  let currentPage = 1
  let isLoading = false
  let feedData: any = null

  // Function to clear screen and show feed
  const displayFeed = async (page: number) => {
    if (isLoading) return

    // Clear screen
    console.clear()

    try {
      isLoading = true

      // Show loading message
      console.log(colorize('📡 Loading feed...', 'cyan'))

      const queryParams = page > 1 ? `?page=${page}` : ''
      const response = await apiClient.get(`/api/feed${queryParams}`, true)

      // Clear screen again to remove loading message
      console.clear()

      feedData = response

      // Display header
      console.log(colorize('🌐 curlme Feed (Interactive Mode)', 'bold'))
      console.log(colorize('━'.repeat(50), 'white'))

      formatOutput(response)

      // Show pagination info and controls
      if (response?.data?.pagination) {
        const {
          currentPage: apiPage,
          hasNextPage,
          totalPostsOnPage,
          hasPreviousPage
        } = response.data.pagination
        console.log('\n' + colorize('━'.repeat(50), 'white'))
        console.log(
          colorize(`📄 Page ${apiPage} | ${totalPostsOnPage} posts`, 'bold')
        )

        // Navigation instructions
        console.log('\n' + colorize('Navigation:', 'yellow'))
        if (hasPreviousPage) {
          console.log(colorize('  ↑ Up Arrow   - Previous page', 'green'))
        }
        if (hasNextPage) {
          console.log(colorize('  ↓ Down Arrow - Next page', 'green'))
        }
        console.log(colorize('  r            - Refresh page', 'cyan'))
        console.log(colorize('  h, ?         - Show help', 'blue'))
        console.log(colorize('  q, Ctrl+C    - Exit', 'red'))

        if (!hasNextPage && !hasPreviousPage) {
          console.log(
            colorize('  (Single page - no navigation available)', 'white')
          )
        }
      }
    } catch (err: any) {
      console.clear()
      error(`Failed to fetch feed: ${err.message}`)
      console.log(colorize('\nPress q to exit or try again...', 'yellow'))
    } finally {
      isLoading = false
    }
  }

  // Setup readline interface for key handling
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  // Enable raw mode to capture arrow keys
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true)
  }

  // Key handler
  const handleKeyPress = (chunk: Buffer) => {
    const key = chunk.toString()

    // Handle different key inputs
    switch (key) {
      case '\u001b[A': // Up arrow
        if (currentPage > 1 && !isLoading) {
          currentPage--
          displayFeed(currentPage)
        } else if (currentPage === 1) {
          console.log(colorize('\n📍 Already on first page', 'yellow'))
        }
        break

      case '\u001b[B': // Down arrow
        if (feedData?.data?.pagination?.hasNextPage && !isLoading) {
          currentPage++
          displayFeed(currentPage)
        } else if (
          feedData?.data?.pagination &&
          !feedData.data.pagination.hasNextPage
        ) {
          console.log(colorize('\n📍 Already on last page', 'yellow'))
        }
        break

      case 'r':
      case 'R':
        // Refresh current page
        if (!isLoading) {
          console.log(colorize('\n🔄 Refreshing...', 'cyan'))
          displayFeed(currentPage)
        }
        break

      case 'h':
      case 'H':
      case '?':
        // Show help
        if (!isLoading) {
          console.log(colorize('\n📖 Interactive Feed Help:', 'bold'))
          console.log(colorize('  ↑/↓  - Navigate pages', 'green'))
          console.log(colorize('  r    - Refresh current page', 'cyan'))
          console.log(colorize('  h/?  - Show this help', 'blue'))
          console.log(colorize('  q    - Exit', 'red'))
        }
        break

      case 'q':
      case 'Q':
      case '\u0003': // Ctrl+C
        cleanup()
        break

      case '\r': // Enter
      case '\n':
        // Ignore enter key
        break

      default:
        // For any other key, show brief help
        if (!isLoading) {
          console.log(
            colorize(
              '\n💡 Press h for help, ↑↓ to navigate, q to quit',
              'yellow'
            )
          )
        }
    }
  }

  // Cleanup function
  const cleanup = () => {
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(false)
    }
    process.stdin.removeListener('data', handleKeyPress)
    rl.close()
    console.log(colorize('\n👋 Exiting interactive feed...', 'cyan'))
    process.exit(0)
  }

  // Handle process termination
  process.on('SIGINT', cleanup)
  process.on('SIGTERM', cleanup)

  // Set up key listener
  process.stdin.on('data', handleKeyPress)

  // Welcome message
  console.clear()
  console.log(colorize('🚀 Starting Interactive Feed...', 'cyan'))
  console.log(
    colorize(
      'Use ↑↓ arrow keys to navigate, r to refresh, h for help, q to quit',
      'yellow'
    )
  )
  console.log('')

  // Load first page
  await displayFeed(currentPage)
}

/**
 * Handles deleting a post by ID
 * @param {string} postId - The ID of the post to delete
 */
export async function handleDeletePost(postId: string) {
  try {
    if (!postId) {
      error('Post ID is required')
      info('Usage: curlme post-delete <post-id>')
      return
    }

    const response = await apiClient.delete(`/api/delete-post/${postId}`, true)
    formatOutput(response)
  } catch (err: any) {
    error(`Failed to delete post: ${err.message}`)
  }
}

/**
 * Handles liking/unliking a post by ID
 * @param {string} postId - The ID of the post to like/unlike
 */
export async function handleLikePost(postId: string) {
  try {
    if (!postId) {
      error('Post ID is required')
      info('Usage: curlme post-like <post-id>')
      return
    }

    const response = await apiClient.post(
      `/api/toggle-like-post/${postId}`,
      {},
      true
    )
    formatOutput(response)
  } catch (err: any) {
    error(`Failed to like post: ${err.message}`)
  }
}

/**
 * Handles viewing a post by ID with optional pagination for replies
 * @param {string} postId - The ID of the post to view
 * @param {string} [page] - Optional page number for replies pagination
 */
export async function handlePostView(postId: string, page?: string) {
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
      `/api/get-post/${postId}${queryParams}`,
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
