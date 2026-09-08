/**
 * Controller for the raw "who follows whom" edge list
 */

import { prisma } from '../../config/database.js'

export type FollowEdge = {
  follower: string
  follower_designation: string | null
  following: string
  following_designation: string | null
  mutual: boolean
  followed_at: string
}

const EDGE_USER_SELECT = {
  username: true,
  designation: { select: { label: true } }
} as const

/**
 * Builds a set of "followerId:followingId" keys for the reverse of each edge
 * that also exists, which is what makes a follow mutual.
 *
 * @param {Array<{followerId: string, followingId: string}>} edges - The edges being rendered
 * @returns {Promise<Set<string>>} - Keys of the edges that are reciprocated
 */
const findMutualKeys = async (
  edges: Array<{ followerId: string; followingId: string }>
): Promise<Set<string>> => {
  if (edges.length === 0) return new Set()

  const reciprocated = await prisma.follow.findMany({
    where: {
      OR: edges.map(edge => ({
        followerId: edge.followingId,
        followingId: edge.followerId
      }))
    },
    select: { followerId: true, followingId: true }
  })

  // Store the reverse orientation so a lookup by the original edge matches.
  return new Set(
    reciprocated.map(edge => `${edge.followingId}:${edge.followerId}`)
  )
}

/**
 * Lists the most recent follow relationships
 *
 * An edge is only shown when both accounts are still active, so a soft deleted
 * account disappears from the graph without its Follow rows being destroyed.
 *
 * @param {number} limit - How many edges to return
 * @returns {Promise<FollowEdge[]>} - Newest follow edges between active accounts, each flagged if reciprocated
 */
const getFollowGraphController = async (
  limit: number
): Promise<FollowEdge[]> => {
  const edges = await prisma.follow.findMany({
    where: { follower: { isActive: true }, following: { isActive: true } },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      createdAt: true,
      followerId: true,
      followingId: true,
      follower: { select: EDGE_USER_SELECT },
      following: { select: EDGE_USER_SELECT }
    }
  })

  const mutualKeys = await findMutualKeys(edges)

  return edges.map(edge => ({
    follower: edge.follower.username,
    follower_designation: edge.follower.designation?.label ?? null,
    following: edge.following.username,
    following_designation: edge.following.designation?.label ?? null,
    mutual: mutualKeys.has(`${edge.followerId}:${edge.followingId}`),
    followed_at: edge.createdAt.toISOString()
  }))
}

export default getFollowGraphController
