/**
 * Handlers for the follow graph CLI commands
 */

import { apiClient } from '../api.js'
import { formatDate, orDash } from '../format.js'
import { colorize, error, success } from '../output.js'
import { printTable, type Column } from '../table.js'

type FollowEntry = {
  username: string
  name: string
  designation: string | null
  follower_count: number
  followed_at: string
}

const FOLLOW_COLUMNS: Column<FollowEntry>[] = [
  { header: 'username', value: entry => `@${entry.username}` },
  { header: 'name', value: entry => entry.name },
  { header: 'designation', value: entry => orDash(entry.designation) },
  {
    header: 'followers',
    value: entry => String(entry.follower_count),
    align: 'right'
  },
  { header: 'since', value: entry => formatDate(entry.followed_at) }
]

/**
 * Follows another user
 *
 * @param {string} username - The username to follow
 * @returns {Promise<void>}
 */
export async function handleFollow(username: string): Promise<void> {
  if (!username) {
    error('Username is required')
    console.log('Usage: curlme follow <username>')
    return
  }

  const response = await apiClient.post(`/api/follow/${username}`, {}, true)
  if (!response) return

  success(response.message)
  console.log(
    colorize(
      `@${username} now has ${response.data.follower_count} follower(s)`,
      'grey'
    )
  )
}

/**
 * Unfollows another user
 *
 * @param {string} username - The username to unfollow
 * @returns {Promise<void>}
 */
export async function handleUnfollow(username: string): Promise<void> {
  if (!username) {
    error('Username is required')
    console.log('Usage: curlme unfollow <username>')
    return
  }

  const response = await apiClient.delete(`/api/unfollow/${username}`, true)
  if (!response) return

  success(response.message)
}

/**
 * Builds a handler that lists one direction of the follow graph
 *
 * @param {'followers' | 'following'} direction - Which side of the graph to list
 * @param {string} label - Wording used in the table heading
 * @returns {(username?: string, page?: string) => Promise<void>} - The command handler
 */
const listFollowsHandler = (
  direction: 'followers' | 'following',
  label: string
) => {
  return async (username?: string, page?: string): Promise<void> => {
    const pageNum = page ? Number.parseInt(page, 10) : 1

    if (Number.isNaN(pageNum) || pageNum < 1) {
      error('Page must be a positive number')
      console.log(`Usage: curlme ${direction} [username] [page]`)
      return
    }

    const target = username ? `/${username}` : ''
    const response = await apiClient.get(
      `/api/${direction}${target}?page=${pageNum}`,
      true
    )

    if (!response) return

    const { entries, pagination, username: owner } = response.data

    printTable(
      `${label} @${owner}`,
      entries as FollowEntry[],
      FOLLOW_COLUMNS,
      direction === 'followers' ? 'nobody yet' : 'not following anyone yet'
    )

    console.log(
      colorize(
        `Page ${pagination.currentPage} | ${pagination.totalOnPage} shown` +
          (pagination.hasNextPage
            ? ` | more on page ${pagination.currentPage + 1}`
            : ''),
        'grey'
      )
    )
  }
}

export const handleFollowers = listFollowsHandler('followers', 'Followers of')
export const handleFollowing = listFollowsHandler('following', 'Followed by')
