/**
 * Handlers for reply-related CLI commands
 */

import { apiClient } from '../api.js'
import { error, formatOutput, info } from '../output.js'

/**
 * Handles creating a reply to a post
 * @param {string} postId - The ID of the post to reply to
 * @param {string} content - The content of the reply
 */
export async function handleReply(postId: string, content: string) {
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
      `/api/create-reply/${postId}`,
      { content },
      true
    )
    formatOutput(response)
  } catch (err: any) {
    error(`Failed to create reply: ${err.message}`)
  }
}

/**
 * Handles deleting a reply by ID
 * @param {string} replyId - The ID of the reply to delete
 */
export async function handleDeleteReply(replyId: string) {
  try {
    if (!replyId) {
      error('Reply ID is required')
      info('Usage: curlme reply-delete <reply-id>')
      return
    }

    const response = await apiClient.delete(
      `/api/delete-reply/${replyId}`,
      true
    )
    formatOutput(response)
  } catch (err: any) {
    error(`Failed to delete reply: ${err.message}`)
  }
}

/**
 * Handles liking/unliking a reply by ID
 * @param {string} replyId - The ID of the reply to like/unlike
 */
export async function handleLikeReply(replyId: string) {
  try {
    if (!replyId) {
      error('Reply ID is required')
      info('Usage: curlme reply-like <reply-id>')
      return
    }

    const response = await apiClient.post(
      `/api/toggle-like-reply/${replyId}`,
      {},
      true
    )
    formatOutput(response)
  } catch (err: any) {
    error(`Failed to like reply: ${err.message}`)
  }
}
