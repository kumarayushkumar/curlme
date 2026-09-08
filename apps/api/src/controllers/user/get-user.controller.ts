/**
 * Controller for retrieving user profiles
 */

import type { Role } from '@prisma/client'
import { prisma } from '../../config/database.js'
import {
  DESIGNATION_SELECT,
  type DesignationView
} from '../../utils/user-view.js'

export type Profile = {
  id: string
  username: string
  name: string
  bio: string | null
  role: Role
  is_active: boolean
  designation: DesignationView
  joined: string
  follower_count: number
  following_count: number
  post_count: number
  total_likes_received: number
  replies_count: number
  /** Omitted when viewing your own profile, where the question does not apply. */
  is_following?: boolean
  follows_you?: boolean
  recent_posts: Array<{
    id: string
    content: string
    likes: number
    created: string
  }>
}

type FollowState = {
  is_following: boolean
  follows_you: boolean
}

/**
 * Resolves both directions of the follow relationship between the viewer and
 * the profile being read, using a single query for the pair of edges.
 *
 * @param {string} viewerId - The user making the request
 * @param {string} targetId - The user whose profile is being read
 * @returns {Promise<Partial<FollowState>>} - Both directions, or empty for your own profile
 */
const getFollowState = async (
  viewerId: string,
  targetId: string
): Promise<Partial<FollowState>> => {
  if (viewerId === targetId) return {}

  const edges = await prisma.follow.findMany({
    where: {
      OR: [
        { followerId: viewerId, followingId: targetId },
        { followerId: targetId, followingId: viewerId }
      ]
    },
    select: { followerId: true }
  })

  return {
    is_following: edges.some(edge => edge.followerId === viewerId),
    follows_you: edges.some(edge => edge.followerId === targetId)
  }
}

/**
 * Reports whether a profile may be shown to the viewer that asked for it. A
 * soft deleted account is invisible to everyone but its owner, who keeps
 * reading their own profile so they can see the account is inactive.
 *
 * @param {{id: string, isActive: boolean}} user - The profile row that was found
 * @param {string} viewerId - The user making the request
 * @returns {boolean} - True when the profile may be returned
 */
const isVisibleTo = (
  user: { id: string; isActive: boolean },
  viewerId: string
): boolean => user.isActive || user.id === viewerId

/**
 * Retrieves a user profile, either the viewer's own or another user's
 *
 * `post_count` comes from the denormalised counter on the user rather than a
 * COUNT over their posts, so the profile stays one query cheaper as the table
 * grows. Replies have no such counter and are still counted.
 *
 * @param {string} viewerId - The authenticated user making the request
 * @param {string} [username] - Username to look up; omitted for your own profile
 * @returns {Promise<Profile|null>} - User profile data, or null when it is missing or hidden
 */
const getUserController = async (
  viewerId: string,
  username?: string
): Promise<Profile | null> => {
  const whereClause = username ? { username } : { id: viewerId }

  const user = await prisma.user.findUnique({
    where: whereClause,
    select: {
      id: true,
      username: true,
      name: true,
      bio: true,
      role: true,
      isActive: true,
      createdAt: true,
      followerCount: true,
      followingCount: true,
      postCount: true,
      totalLikesReceived: true,
      designation: { select: DESIGNATION_SELECT },
      Post: {
        select: {
          id: true,
          content: true,
          likesCount: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      },
      _count: {
        select: {
          Reply: true
        }
      }
    }
  })

  if (!user) return null
  if (!isVisibleTo(user, viewerId)) return null

  const followState = await getFollowState(viewerId, user.id)

  return {
    id: user.id,
    username: user.username,
    name: user.name,
    bio: user.bio,
    role: user.role,
    is_active: user.isActive,
    designation: user.designation,
    joined: user.createdAt.toISOString(),
    follower_count: user.followerCount,
    following_count: user.followingCount,
    post_count: user.postCount,
    total_likes_received: user.totalLikesReceived,
    replies_count: user._count.Reply,
    ...followState,
    recent_posts: user.Post.map(post => ({
      id: post.id,
      content: post.content,
      likes: post.likesCount,
      created: post.createdAt.toISOString()
    }))
  }
}

export default getUserController
