import { apiClient } from '../api.js'
import { error, formatOutput, info } from '../output.js'

export async function handleProfile(username?: string) {
  try {
    let endpoint = '/profile'

    if (username) {
      endpoint = `/profile/${username}`
      info(`Fetching profile for @${username}...`)
    } else {
      info('Fetching your profile...')
    }

    const response = await apiClient.get(endpoint, true)
    formatOutput(response)
  } catch (err: any) {
    if (username) {
      error(`Failed to fetch profile for @${username}: ${err.message}`)
    } else {
      error(`Failed to fetch profile: ${err.message}`)
    }
  }
}
