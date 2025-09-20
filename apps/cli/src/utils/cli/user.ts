/**
 * Handlers for user-related CLI commands
 */

import { apiClient } from '../api.js'
import { displayAsText, heading } from '../output.js'

/**
 * Handles fetching user profile by username or current user if no username is provided
 *
 * @param {string} [username] - Optional username to fetch profile for
 * @return {Promise<void>}
 */
export async function handleProfile(username?: string): Promise<void> {
  let endpoint = '/profile'

  if (username) {
    endpoint = `/api/profile/${username}`
    heading(`Fetching profile for @${username}...`)
  } else {
    endpoint = '/api/profile'
    heading('Fetching your profile...')
  }
  const response = await apiClient.get(endpoint, true)

  if (response) displayAsText(response.data.profile)
}
