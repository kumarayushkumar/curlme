/**
 * Handles fetching and displaying the feed with interactive navigation
 */

import { apiClient } from '../api.js'
import { colorize, displayAsText } from '../output.js'

/**
 * Handles fetching and displaying the feed with interactive navigation
 *
 * @returns {Promise<void>}
 */
export async function handleFeed(): Promise<void> {
  let currentPage = 1
  let isLoading = false
  let feedData: any = null

  const displayFeed = async (page: number) => {
    if (isLoading) return

    isLoading = true

    console.clear()
    console.log(colorize('Loading feed...', 'grey'))

    const queryParams = `?page=${page}`
    const response = await apiClient.get(`/api/feed${queryParams}`, true)

    console.clear()

    if (!response) {
      isLoading = false
      console.log(
        colorize('Failed to load feed. Press any key to continue...', 'red')
      )
      return
    }

    feedData = response

    console.log(colorize('Curlme Feed', 'bold'))
    displayAsText(response.data.feed.posts)

    if (response?.data?.pagination) {
      const {
        currentPage: apiPage,
        hasNextPage,
        totalPostsOnPage,
        hasPreviousPage
      } = response.data.pagination
      console.log(
        colorize(`Page ${apiPage} | ${totalPostsOnPage} posts`, 'bold')
      )
    }

    isLoading = false
    showDefaultMessage()
  }

  // Enable raw mode to capture keys directly
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true)
    process.stdin.setEncoding('utf8')
  }

  let currentStatusMessage = ''
  let statusMessageLines = 0

  const clearStatusMessage = () => {
    if (statusMessageLines > 0) {
      // Move cursor up and clear lines
      for (let i = 0; i < statusMessageLines; i++) {
        process.stdout.write('\x1B[1A') // Move cursor up one line
        process.stdout.write('\x1B[2K') // Clear entire line
      }
      statusMessageLines = 0
      currentStatusMessage = ''
    }
  }

  // Function to show status message (replaces previous one)
  const showStatusMessage = (
    message: string,
    color: keyof typeof import('../output.js').colors = 'grey',
    autoRevert: boolean = true
  ) => {
    clearStatusMessage()
    const formattedMessage = colorize(message, color)
    console.log(formattedMessage)
    statusMessageLines = 1
    currentStatusMessage = message

    if (autoRevert) {
      setTimeout(() => {
        showDefaultMessage()
      }, 1000)
    }
  }

  // Function to show default navigation message
  const showDefaultMessage = () => {
    clearStatusMessage()
    console.log(colorize('↑/↓ - Navigate pages  r - Refresh  q - Exit', 'grey'))
    statusMessageLines = 1
    currentStatusMessage = 'default'
  }

  // Debouncing variables
  let lastKeyPressTime = 0
  let lastNavigationTime = 0
  const debounceMs = 200 // 200ms debounce
  const navigationDebounceMs = 300 // 300ms debounce for navigation to prevent rapid API calls

  // Key handler
  const handleKeyPress = (chunk: Buffer) => {
    const key = chunk.toString()
    const now = Date.now()

    // Debounce rapid key presses (except for quit commands)
    if (key !== 'q' && key !== 'Q' && key !== '\u0003') {
      if (now - lastKeyPressTime < debounceMs) {
        return
      }
    }
    lastKeyPressTime = now

    switch (key) {
      case '\u001b[A': // Up arrow
        if (
          currentPage > 1 &&
          !isLoading &&
          now - lastNavigationTime > navigationDebounceMs
        ) {
          clearStatusMessage()
          currentPage--
          lastNavigationTime = now
          displayFeed(currentPage)
        } else if (
          currentPage === 1 &&
          currentStatusMessage !== 'Already on first page'
        ) {
          showStatusMessage('Already on first page', 'grey')
        }
        break

      case '\u001b[B': // Down arrow
        const hasNext = feedData?.data?.feed.pagination?.hasNextPage
        if (
          hasNext &&
          !isLoading &&
          now - lastNavigationTime > navigationDebounceMs
        ) {
          clearStatusMessage()
          currentPage++
          lastNavigationTime = now
          displayFeed(currentPage)
        } else if (
          !hasNext &&
          feedData?.data?.feed.pagination &&
          currentStatusMessage !== 'Already on last page'
        ) {
          showStatusMessage('Already on last page', 'grey')
        }
        break

      case 'r':
      case 'R':
        if (!isLoading && now - lastNavigationTime > navigationDebounceMs) {
          showStatusMessage('Refreshing...', 'grey')
          lastNavigationTime = now
          displayFeed(currentPage)
        }
        break

      case 'q':
      case 'Q':
      case '\u0003':
        cleanup()
        break

      case '\r': // Enter/Return
      case '\n': // Newline
      case '\u001b[C': // Right arrow
      case '\u001b[D': // Left arrow
        // Intentionally ignore these keys
        break

      default:
        break
    }
  }

  const cleanup = () => {
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(false)
    }
    process.stdin.removeListener('data', handleKeyPress)
    console.log(colorize('\nExiting interactive feed...', 'grey'))
    process.exit(0)
  }

  // Handle process termination
  process.on('SIGINT', cleanup)
  process.on('SIGTERM', cleanup)

  // Set up key listener
  process.stdin.on('data', handleKeyPress)
  process.stdout.write('\x1Bc')

  await displayFeed(currentPage)
}
