/**
 * Handlers for post-related CLI commands
 */

import { apiClient } from '../api.js'
import { displayAsText, error, success } from '../output.js'

/**
 * Handles creating a new post with given content
 *
 * @param {string} content - The content of the post
 * @returns {Promise<void>}
 */
export async function handlePost(content: string): Promise<void> {
  if (!content.trim()) {
    error('Post content cannot be empty')
    console.log('Usage: curlme post "Your post content"')
    return
  }

  const response = await apiClient.post('/api/create-post', { content }, true)
  if (response) success(response.message)
}

/**
 * Handles deleting a post by ID
 *
 * @param {string} postId - The ID of the post to delete
 * @returns {Promise<void>}
 */
export async function handleDeletePost(postId: string): Promise<void> {
  if (!postId) {
    error('Post ID is required')
    console.log('Usage: curlme post-delete <post-id>')
    return
  }

  const response = await apiClient.delete(`/api/delete-post/${postId}`, true)
  if (response) {
    success(response.message)
  }
}

/**
 * Handles liking/unliking a post by ID
 *
 * @param {string} postId - The ID of the post to like/unlike
 * @returns {Promise<void>}
 */
export async function handleLikePost(postId: string): Promise<void> {
  if (!postId) {
    error('Post ID is required')
    console.log('Usage: curlme post-like <post-id>')
    return
  }

  const response = await apiClient.post(
    `/api/toggle-like-post/${postId}`,
    {},
    true
  )
  if (response) success(response.message)
}

/**
 * Handles viewing a post by ID with optional pagination for replies
 *
 * @param {string} postId - The ID of the post to view
 * @param {string} [page] - Optional page number for replies pagination
 */
export async function handlePostView(
  postId: string,
  page?: string
): Promise<void> {
  if (!postId) {
    error('Post ID is required')
    console.log('Usage: curlme post-view <post-id> [page]')
    return
  }

  const pageNum = page ? parseInt(page) : 1
  if (isNaN(pageNum) || pageNum < 1) {
    error('Page must be a positive number')
    console.log('Usage: curlme post-view <post-id> [page]')
    return
  }

  const queryParams = `?page=${pageNum}`
  const response = await apiClient.get(
    `/api/get-post/${postId}${queryParams}`,
    true
  )

  if (response) displayAsText(response.data.post)
}
