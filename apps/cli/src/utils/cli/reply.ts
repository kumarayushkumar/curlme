/**
 * Handlers for reply-related CLI commands
 */

import { apiClient } from '../api.js'
import { displayAsText, error, success } from '../output.js'

/**
 * Handles creating a reply to a post
 *
 * @param {string} postId - The ID of the post to reply to
 * @param {string} content - The content of the reply
 * @return {Promise<void>}
 */
export async function handleReply(
  postId: string,
  content: string
): Promise<void> {
  if (!postId) {
    error('Post ID is required')
    console.log('Usage: curlme reply <post-id> "Your reply content"')
    return
  }

  if (!content.trim()) {
    error('Reply content cannot be empty')
    console.log('Usage: curlme reply <post-id> "Your reply content"')
    return
  }

  const response = await apiClient.post(
    `/api/create-reply/${postId}`,
    { content },
    true
  )
  if (response) success(response.message)
}

/**
 * Handles deleting a reply by ID
 *
 * @param {string} replyId - The ID of the reply to delete
 * @return {Promise<void>}
 */
export async function handleDeleteReply(replyId: string): Promise<void> {
  if (!replyId) {
    error('Reply ID is required')
    console.log('Usage: curlme reply-delete <reply-id>')
    return
  }

  const response = await apiClient.delete(`/api/delete-reply/${replyId}`, true)
  if (response) success(response.message)
}

/**
 * Handles liking/unliking a reply by ID
 *
 * @param {string} replyId - The ID of the reply to like/unlike
 * @return {Promise<void>}
 */
export async function handleLikeReply(replyId: string): Promise<void> {
  if (!replyId) {
    error('Reply ID is required')
    console.log('Usage: curlme reply-like <reply-id>')
    return
  }

  const response = await apiClient.post(
    `/api/toggle-like-reply/${replyId}`,
    {},
    true
  )
  if (response) success(response.message)
}
