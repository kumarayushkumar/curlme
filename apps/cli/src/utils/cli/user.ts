/**
 * Handlers for user-related CLI commands
 */

import { apiClient } from '../api.js'
import { displayAsText, error, heading, success } from '../output.js'

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

/**
 * Updates your own bio
 *
 * Passing an empty string clears it.
 *
 * @param {string[]} args - The bio text, joined from the remaining arguments
 * @return {Promise<void>}
 */
export async function handleBio(args: string[]): Promise<void> {
  const bio = args.join(' ').trim()

  if (args.length === 0) {
    error('Bio text is required')
    console.log('Usage: curlme bio "Your bio"   (use "" to clear it)')
    return
  }

  const response = await apiClient.patch('/api/profile', { bio }, true)

  if (!response) return

  success(bio ? 'Bio updated' : 'Bio cleared')
}
