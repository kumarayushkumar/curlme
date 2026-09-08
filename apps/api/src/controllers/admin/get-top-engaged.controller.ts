/**
 * Controller for ranking users by how much they contribute
 */

import { prisma } from '../../config/database.js'

export type TopEngagedUser = {
  rank: number
  username: string
  designation: string | null
  posts_count: number
  replies_count: number
  contributions: number
  total_likes_received: number
  follower_count: number
}

type Tally = {
  posts: number
  replies: number
  likesReceived: number
}

/**
 * Folds a set of grouped rows into the running per user tally
 *
 * @param {Map<string, Tally>} tallies - Accumulator keyed by user ID
 * @param {Array} rows - Grouped counts for either posts or replies
 * @param {'posts' | 'replies'} field - Which tally field the rows belong to
 */
const accumulate = (
  tallies: Map<string, Tally>,
  rows: Array<{
    userId: string
    _count: number
    _sum: { likesCount: number | null }
  }>,
  field: 'posts' | 'replies'
): void => {
  for (const row of rows) {
    const tally = tallies.get(row.userId) ?? {
      posts: 0,
      replies: 0,
      likesReceived: 0
    }

    tally[field] = row._count
    tally.likesReceived += row._sum.likesCount ?? 0
    tallies.set(row.userId, tally)
  }
}

/**
 * Ranks the accounts producing the most posts and replies
 *
 * Both totals are aggregated by the database and only the merged top slice is
 * hydrated into user records, so exactly three queries run regardless of limit.
 * The summed like counts stay in the tally purely as a deterministic tiebreak;
 * the reported total comes from the denormalised `totalLikesReceived`, which is
 * authoritative and already covers both posts and replies.
 *
 * @param {number} limit - How many accounts to return
 * @returns {Promise<TopEngagedUser[]>} - Active accounts ordered by total contributions
 */
const getTopEngagedController = async (
  limit: number
): Promise<TopEngagedUser[]> => {
  // Promise.all rather than $transaction: wrapping groupBy in a transaction
  // array widens Prisma's inferred aggregate types back to unions.
  const [postGroups, replyGroups] = await Promise.all([
    prisma.post.groupBy({
      by: ['userId'],
      _count: true,
      _sum: { likesCount: true },
      orderBy: { userId: 'asc' }
    }),
    prisma.reply.groupBy({
      by: ['userId'],
      _count: true,
      _sum: { likesCount: true },
      orderBy: { userId: 'asc' }
    })
  ])

  const tallies = new Map<string, Tally>()
  accumulate(tallies, postGroups, 'posts')
  accumulate(tallies, replyGroups, 'replies')

  const ranked = [...tallies.entries()]
    .map(([userId, tally]) => ({
      userId,
      ...tally,
      contributions: tally.posts + tally.replies
    }))
    .sort(
      (a, b) =>
        b.contributions - a.contributions || b.likesReceived - a.likesReceived
    )
    .slice(0, limit)

  if (ranked.length === 0) return []

  // Deactivated accounts keep their content, so they still show up in the
  // aggregates above and have to be dropped here.
  const users = await prisma.user.findMany({
    where: { id: { in: ranked.map(entry => entry.userId) }, isActive: true },
    select: {
      id: true,
      username: true,
      followerCount: true,
      totalLikesReceived: true,
      designation: { select: { label: true } }
    }
  })

  const usersById = new Map(users.map(user => [user.id, user]))

  // Ranks are assigned after the inactive rows are dropped so the numbering
  // stays contiguous rather than showing gaps where an account was removed.
  return ranked
    .flatMap(entry => {
      const user = usersById.get(entry.userId)

      return user ? [{ entry, user }] : []
    })
    .map(({ entry, user }, index) => ({
      rank: index + 1,
      username: user.username,
      designation: user.designation?.label ?? null,
      posts_count: entry.posts,
      replies_count: entry.replies,
      contributions: entry.contributions,
      total_likes_received: user.totalLikesReceived,
      follower_count: user.followerCount
    }))
}

export default getTopEngagedController
