/**
 * Shared shape for a user as exposed by the API, so no endpoint can leak the
 * password digest by accident.
 */

import type { DesignationCategory, Role } from '@prisma/client'

export type DesignationView = {
  slug: string
  label: string
  category: DesignationCategory
  topic: string | null
  group: string
} | null

export type AccountView = {
  id: string
  username: string
  name: string
  bio: string | null
  role: Role
  is_active: boolean
  designation: DesignationView
  follower_count: number
  following_count: number
  post_count: number
  total_likes_received: number
  joined: string
}

/** Structural shape a record must satisfy to be rendered as an AccountView. */
export type UserWithDesignation = {
  id: string
  username: string
  name: string
  bio: string | null
  role: Role
  isActive: boolean
  followerCount: number
  followingCount: number
  postCount: number
  totalLikesReceived: number
  createdAt: Date
  designation: {
    slug: string
    label: string
    category: DesignationCategory
    topic: string | null
    group: string
  } | null
}

/**
 * Projects a user record onto the public account shape
 *
 * @param {UserWithDesignation} user - User record including its designation
 * @returns {AccountView} - The client facing representation
 */
export const toAccountView = (user: UserWithDesignation): AccountView => ({
  id: user.id,
  username: user.username,
  name: user.name,
  bio: user.bio,
  role: user.role,
  is_active: user.isActive,
  designation: user.designation
    ? {
        slug: user.designation.slug,
        label: user.designation.label,
        category: user.designation.category,
        topic: user.designation.topic,
        group: user.designation.group
      }
    : null,
  follower_count: user.followerCount,
  following_count: user.followingCount,
  post_count: user.postCount,
  total_likes_received: user.totalLikesReceived,
  joined: user.createdAt.toISOString()
})

/** Prisma `select` for a designation rendered inside an account. */
export const DESIGNATION_SELECT = {
  slug: true,
  label: true,
  category: true,
  topic: true,
  group: true
} as const

/** Prisma `select` that satisfies `UserWithDesignation`. */
export const ACCOUNT_SELECT = {
  id: true,
  username: true,
  name: true,
  bio: true,
  role: true,
  isActive: true,
  followerCount: true,
  followingCount: true,
  postCount: true,
  totalLikesReceived: true,
  createdAt: true,
  designation: { select: DESIGNATION_SELECT }
} as const
