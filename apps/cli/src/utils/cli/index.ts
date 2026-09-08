/**
 * Main CLI command handler and dispatcher
 */

import { apiClient } from '../api.js'
import { colorize, displayAsText, error } from '../output.js'
import { handleAdmin } from './admin.js'
import {
  handleLogin,
  handleLogout,
  handleRegister,
  handleSignin
} from './auth.js'
import { handleDesignations } from './designation.js'
import { handleFeed } from './feed.js'
import {
  handleFollow,
  handleFollowers,
  handleFollowing,
  handleUnfollow
} from './follow.js'
import {
  handleDeletePost,
  handleLikePost,
  handlePost,
  handlePostView
} from './post.js'
import { handleDeleteReply, handleLikeReply, handleReply } from './reply.js'
import { handleBio, handleProfile } from './user.js'
import { handleVoiceRoom } from './voiceroom.js'

/**
 * Handles the curlme feedback command to fetch and display feedback message
 *
 * @returns {Promise<void>}
 */
async function handleFeedback(): Promise<void> {
  const response = await apiClient.get('/feedback')
  if (response) {
    displayAsText(response)
  }
}

/**
 * Displays help information for the CLI
 *
 * @returns {void}
 */
function showHelp(): void {
  console.log(`
${colorize('Curlme', 'highlight')} - Social media for developers

${colorize('Usage:', 'bold')}
  curlme <command> [options]

${colorize('Commands:', 'bold')}
  ${colorize('Authentication:', 'yellow')}
  register [username]          Create an account with a password
  signin [username]            Sign in with your password
  login                        Authenticate with GitHub
  logout                       Clear authentication token

  ${colorize('Profile:', 'yellow')}
  profile                      Show your profile
  profile <username>           Show another user's profile
  bio "<text>"                 Edit your bio (pass "" to clear it)
  designations [category] [group]
                               List designations (creator or consumer, by group)

  ${colorize('Following:', 'yellow')}
  follow <username>            Follow a user
  unfollow <username>          Unfollow a user
  followers [username] [page]  Who follows you, or another user
  following [username] [page]  Who you follow, or who another user follows

  ${colorize('Posts:', 'yellow')}
  post "<content>"             Create a new post
  post-view <post-id> [page]   View a post and its replies (with pagination)
  post-delete <post-id>        Delete your post
  post-like <post-id>          Like/unlike a post

  ${colorize('Replies:', 'yellow')}
  reply <post-id> "<content>"  Reply to a post
  reply-delete <reply-id>      Delete your reply
  reply-like <reply-id>        Like/unlike a reply

  ${colorize('Feed:', 'yellow')}
  feed                         Show feed (interactive mode with ↑↓ navigation)

  ${colorize('Voice:', 'yellow')}
  voiceroom                    Join the global voice room

  ${colorize('Admin:', 'yellow')}
  admin [subcommand]           Platform statistics, run 'curlme admin help'

  ${colorize('Feedback:', 'yellow')}
  feedback                     Contact support or report issues

  ${colorize('Help:', 'yellow')}
  help                         Show this help message
`)
}

type CommandHandler = (args: string[]) => Promise<void> | void

/**
 * Command table. A lookup keeps dispatch flat as commands are added, and makes
 * the set of valid commands a single readable list.
 */
const COMMANDS: Record<string, CommandHandler> = {
  // authentication
  register: args => handleRegister(args[0]),
  signin: args => handleSignin(args[0]),
  login: () => handleLogin(),
  logout: () => handleLogout(),

  // profile
  profile: args => handleProfile(args[0]),
  bio: args => handleBio(args),
  designations: args => handleDesignations(args[0], args[1]),

  // following
  follow: args => handleFollow(args[0] as string),
  unfollow: args => handleUnfollow(args[0] as string),
  followers: args => handleFollowers(args[0], args[1]),
  following: args => handleFollowing(args[0], args[1]),

  // posts
  post: args => handlePost(args.join(' ').trim()),
  'post-view': args => handlePostView(args[0] as string, args[1]),
  'post-delete': args => handleDeletePost(args[0] as string),
  'post-like': args => handleLikePost(args[0] as string),

  // replies
  reply: args => handleReply(args[0] as string, args.slice(1).join(' ').trim()),
  'reply-delete': args => handleDeleteReply(args[0] as string),
  'reply-like': args => handleLikeReply(args[0] as string),

  // reading
  feed: () => handleFeed(),
  voiceroom: () => handleVoiceRoom(),

  // administration
  admin: args => handleAdmin(args),

  // meta
  feedback: () => handleFeedback(),
  help: () => showHelp()
}

/**
 * Main command handler that routes to specific command functions
 *
 * @param {string} command - The command to execute
 * @param {string[]} args - Arguments for the command
 * @return {Promise<void>}
 */
export async function handleCommand(
  command: string,
  args: string[]
): Promise<void> {
  // Object.hasOwn, not a bare lookup: otherwise `curlme toString` would find
  // Object.prototype.toString and silently call it instead of showing help.
  const handler = Object.hasOwn(COMMANDS, command)
    ? COMMANDS[command]
    : undefined

  if (!handler) {
    error(`Unknown command '${command}'`)
    showHelp()
    return
  }

  await handler(args)
}
