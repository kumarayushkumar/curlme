/**
 * Controller for listing the followers or the followees of a user
 */

import { prisma } from '../../config/database.js'
import { err, ok, type Result } from '../../utils/result.js'

export type FollowDirection = 'followers' | 'following'

export type FollowListError = 'user_not_found'

export type FollowEntry = {
  username: string
  name: string
  designation: string | null
  follower_count: number
  followed_at: string
}

export type FollowList = {
  username: string
  direction: FollowDirection
  entries: FollowEntry[]
  pagination: {
    currentPage: number
    limit: number
    hasNextPage: boolean
    hasPreviousPage: boolean
    totalOnPage: number
  }
}

const PROFILE_SELECT = {
  username: true,
  name: true,
  followerCount: true,
  designation: { select: { label: true } }
} as const

type FollowRow = {
  createdAt: Date
  user: {
    username: string
    name: string
    followerCount: number
    designation: { label: string } | null
  }
}

/**
 * Loads the accounts that follow the given user, skipping soft deleted ones
 *
 * @param {string} userId - The user being followed
 * @param {number} skip - Rows to skip for the requested page
 * @param {number} take - Rows to read, one more than the page size
 * @returns {Promise<FollowRow[]>} - The follow edges with their follower attached
 */
const loadFollowers = async (
  userId: string,
  skip: number,
  take: number
): Promise<FollowRow[]> => {
  const rows = await prisma.follow.findMany({
    where: { followingId: userId, follower: { isActive: true } },
    select: { createdAt: true, follower: { select: PROFILE_SELECT } },
    orderBy: { createdAt: 'desc' },
    skip,
    take
  })

  return rows.map(row => ({ createdAt: row.createdAt, user: row.follower }))
}

/**
 * Loads the accounts the given user follows, skipping soft deleted ones
 *
 * @param {string} userId - The user doing the following
 * @param {number} skip - Rows to skip for the requested page
 * @param {number} take - Rows to read, one more than the page size
 * @returns {Promise<FollowRow[]>} - The follow edges with their followee attached
 */
const loadFollowing = async (
  userId: string,
  skip: number,
  take: number
): Promise<FollowRow[]> => {
  const rows = await prisma.follow.findMany({
    where: { followerId: userId, following: { isActive: true } },
    select: { createdAt: true, following: { select: PROFILE_SELECT } },
    orderBy: { createdAt: 'desc' },
    skip,
    take
  })

  return rows.map(row => ({ createdAt: row.createdAt, user: row.following }))
}

/** Keeps the two directions a table lookup instead of a branch. */
const DIRECTION_LOADERS: Record<
  FollowDirection,
  (userId: string, skip: number, take: number) => Promise<FollowRow[]>
> = {
  followers: loadFollowers,
  following: loadFollowing
}

/**
 * Converts a follow row into the client facing entry
 *
 * @param {FollowRow} row - A follow edge with the related account attached
 * @returns {FollowEntry} - The listing entry for that account
 */
const toEntry = (row: FollowRow): FollowEntry => ({
  username: row.user.username,
  name: row.user.name,
  designation: row.user.designation?.label ?? null,
  follower_count: row.user.followerCount,
  followed_at: row.createdAt.toISOString()
})

/**
 * Lists one page of a user's followers or followees
 *
 * Soft deleted accounts are left out of the entries, so a page can hold fewer
 * rows than the limit without meaning the listing has ended.
 *
 * @param {string} username - The user whose graph is being read
 * @param {FollowDirection} direction - Whether to list followers or followees
 * @param {number} page - Page number, 1 based
 * @param {number} limit - Page size
 * @returns {Promise<Result<FollowList, FollowListError>>} - The page of entries, or a missing user
 */
const listFollowsController = async (
  username: string,
  direction: FollowDirection,
  page: number,
  limit: number
): Promise<Result<FollowList, FollowListError>> => {
  const user = await prisma.user.findUnique({
    where: { username },
    select: { id: true, username: true }
  })

  if (!user) return err('user_not_found')

  // Fetch one extra row to learn whether another page exists.
  const rows = await DIRECTION_LOADERS[direction](
    user.id,
    (page - 1) * limit,
    limit + 1
  )

  const hasNextPage = rows.length > limit
  const visible = hasNextPage ? rows.slice(0, limit) : rows

  return ok({
    username: user.username,
    direction,
    entries: visible.map(toEntry),
    pagination: {
      currentPage: page,
      limit,
      hasNextPage,
      hasPreviousPage: page > 1,
      totalOnPage: visible.length
    }
  })
}

export default listFollowsController
