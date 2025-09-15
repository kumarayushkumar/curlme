import { apiClient } from '../api.js'
import { error, formatOutput, info } from '../output.js'

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
      `/create-reply/${postId}`,
      { content },
      true
    )
    formatOutput(response)
  } catch (err: any) {
    error(`Failed to create reply: ${err.message}`)
  }
}

export async function handleDeleteReply(replyId: string) {
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

export async function handleLikeReply(replyId: string) {
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
