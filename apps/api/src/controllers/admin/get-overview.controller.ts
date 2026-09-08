/**
 * Controller for the platform wide counters shown on the admin dashboard
 */

import { prisma } from '../../config/database.js'

export type AdminOverview = {
  users: {
    total: number
    active: number
    inactive: number
    admins: number
    creators: number
    consumers: number
    unclassified: number
    password_accounts: number
    github_accounts: number
    joined_last_24h: number
  }
  content: {
    posts: number
    replies: number
    likes: number
    total_likes_received_all: number
    posts_last_24h: number
    replies_last_24h: number
  }
  graph: {
    follows: number
    follows_last_24h: number
    users_following_someone: number
    users_with_followers: number
  }
}

/**
 * Collects the headline platform counters
 *
 * Every count runs inside one transaction so the numbers describe a single
 * consistent snapshot rather than drifting against each other. `inactive` and
 * `github_accounts` are derived from that same snapshot instead of costing an
 * extra query.
 *
 * @returns {Promise<AdminOverview>} - Grouped counters for users, content and the follow graph
 */
const getOverviewController = async (): Promise<AdminOverview> => {
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

  const [
    totalUsers,
    activeUsers,
    admins,
    creators,
    consumers,
    unclassified,
    passwordAccounts,
    joinedLast24h,
    posts,
    replies,
    likes,
    likesReceived,
    postsLast24h,
    repliesLast24h,
    follows,
    followsLast24h,
    usersFollowingSomeone,
    usersWithFollowers
  ] = await prisma.$transaction([
    prisma.user.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.user.count({ where: { role: 'ADMIN' } }),
    prisma.user.count({ where: { designation: { category: 'CREATOR' } } }),
    prisma.user.count({ where: { designation: { category: 'CONSUMER' } } }),
    prisma.user.count({ where: { designationId: null } }),
    prisma.user.count({ where: { passwordHash: { not: null } } }),
    prisma.user.count({ where: { createdAt: { gte: dayAgo } } }),
    prisma.post.count(),
    prisma.reply.count(),
    prisma.like.count(),
    prisma.user.aggregate({ _sum: { totalLikesReceived: true } }),
    prisma.post.count({ where: { createdAt: { gte: dayAgo } } }),
    prisma.reply.count({ where: { createdAt: { gte: dayAgo } } }),
    prisma.follow.count(),
    prisma.follow.count({ where: { createdAt: { gte: dayAgo } } }),
    prisma.user.count({ where: { followingCount: { gt: 0 } } }),
    prisma.user.count({ where: { followerCount: { gt: 0 } } })
  ])

  return {
    users: {
      total: totalUsers,
      active: activeUsers,
      inactive: totalUsers - activeUsers,
      admins,
      creators,
      consumers,
      unclassified,
      password_accounts: passwordAccounts,
      github_accounts: totalUsers - passwordAccounts,
      joined_last_24h: joinedLast24h
    },
    content: {
      posts,
      replies,
      likes,
      total_likes_received_all: likesReceived._sum.totalLikesReceived ?? 0,
      posts_last_24h: postsLast24h,
      replies_last_24h: repliesLast24h
    },
    graph: {
      follows,
      follows_last_24h: followsLast24h,
      users_following_someone: usersFollowingSomeone,
      users_with_followers: usersWithFollowers
    }
  }
}

export default getOverviewController
