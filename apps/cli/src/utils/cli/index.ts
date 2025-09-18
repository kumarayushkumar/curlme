/**
 * Main CLI command handler and dispatcher
 */

import { apiClient } from '../api.js'
import { colorize, error, formatOutput } from '../output.js'
import { handleLogin, handleLogout } from './auth.js'
import {
  handleDeletePost,
  handleFeed,
  handleInteractiveFeed,
  handleLikePost,
  handlePost,
  handlePostView
} from './post.js'
import { handleDeleteReply, handleLikeReply, handleReply } from './reply.js'
import { handleProfile } from './user.js'

/**
 * Handles the curlme feedback command to fetch and display feedback message
 */
async function handleFeedback() {
  try {
    const response = await apiClient.get('/feedback')
    formatOutput(response)
  } catch (err: any) {
    error(`Failed to get: ${err.message}`)
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
  profile                    Show your profile
  profile <username>         Show another user's profile

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
  feed                       Show feed (static mode, first page)
  feed [page]                Show specific page (static mode)
  feed -i                    Show feed (interactive mode with ↑↓ navigation)

  ${colorize('Feedback:', 'yellow')}
  feedback                   Contact support or report issues

  ${colorize('Help:', 'yellow')}
  help                       Show this help message
`)
}

/**
 * Main command handler that routes to specific command functions
 * @param {string} command - The command to execute
 * @param {string[]} args - Arguments for the command
 */
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
        if (args[0] === '-i') {
          await handleInteractiveFeed()
        } else {
          await handleFeed(args[0])
        }
        break
      case 'feedback':
        await handleFeedback()
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
