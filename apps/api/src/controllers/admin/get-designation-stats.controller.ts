/**
 * Controller for the breakdown of accounts across designations
 */

import type { DesignationCategory } from '@prisma/client'
import { prisma } from '../../config/database.js'

export type DesignationStat = {
  label: string
  slug: string
  category: DesignationCategory
  topic: string | null
  group: string
  active: boolean
  users_count: number
  followers_total: number
}

/** Per designation totals derived from the active accounts holding it. */
type ActiveUserRollup = {
  users_count: number
  followers_total: number
}

const EMPTY_ROLLUP: ActiveUserRollup = { users_count: 0, followers_total: 0 }

/**
 * Orders the report by adoption: most held designation first, ties broken
 * alphabetically so the output is stable between runs
 *
 * @param {DesignationStat} a - Left hand row
 * @param {DesignationStat} b - Right hand row
 * @returns {number} - Standard comparator result
 */
const compareByAdoption = (a: DesignationStat, b: DesignationStat): number => {
  return b.users_count - a.users_count || a.label.localeCompare(b.label)
}

/**
 * Counts active accounts and sums their followers, grouped by designation
 *
 * Soft deleted accounts are excluded here rather than through the relation
 * count on `Designation`, which Prisma cannot filter.
 *
 * @returns {Promise<Map<string, ActiveUserRollup>>} - Rollup keyed by designation id
 */
const getActiveUserRollups = async (): Promise<
  Map<string, ActiveUserRollup>
> => {
  const rows = await prisma.user.groupBy({
    by: ['designationId'],
    where: { isActive: true },
    _count: true,
    _sum: { followerCount: true },
    orderBy: { designationId: 'asc' }
  })

  const rollups = new Map<string, ActiveUserRollup>()

  for (const row of rows) {
    if (row.designationId === null) continue

    rollups.set(row.designationId, {
      users_count: row._count,
      followers_total: row._sum.followerCount ?? 0
    })
  }

  return rollups
}

/**
 * Reports how many active accounts hold each designation and how many
 * followers those accounts have between them, which is what shows whether a
 * category is actually growing an audience.
 *
 * @returns {Promise<DesignationStat[]>} - One row per designation, most used first
 */
const getDesignationStatsController = async (): Promise<DesignationStat[]> => {
  // Promise.all rather than $transaction: wrapping groupBy in a transaction
  // array widens Prisma's inferred aggregate types back to unions.
  const [designations, rollups] = await Promise.all([
    prisma.designation.findMany({
      select: {
        id: true,
        slug: true,
        label: true,
        category: true,
        topic: true,
        group: true,
        active: true
      },
      orderBy: { label: 'asc' }
    }),
    getActiveUserRollups()
  ])

  const stats = designations.map(designation => {
    const rollup = rollups.get(designation.id) ?? EMPTY_ROLLUP

    return {
      label: designation.label,
      slug: designation.slug,
      category: designation.category,
      topic: designation.topic,
      group: designation.group,
      active: designation.active,
      users_count: rollup.users_count,
      followers_total: rollup.followers_total
    }
  })

  return stats.sort(compareByAdoption)
}

export default getDesignationStatsController
