/**
 * Controller for listing the designations an account can register under
 */

import type { DesignationCategory } from '@prisma/client'
import { prisma } from '../../config/database.js'

export type DesignationEntry = {
  slug: string
  label: string
  category: DesignationCategory
  topic: string | null
  group: string
  users_count: number
}

/** Optional narrowing applied to the catalogue. */
export type DesignationFilters = {
  category?: DesignationCategory
  group?: string
}

/**
 * Lists the active designations, optionally narrowed by category or group
 *
 * The list lives in the database so new designations can be added without a
 * release; nothing in the API or the CLI hardcodes the options.
 *
 * Ordering is what a picker needs rather than what a report needs: CREATOR is
 * declared first in the Postgres enum, so `category: 'asc'` already puts
 * creators ahead of consumers, then rows fall into their group and finally
 * sort alphabetically inside it.
 *
 * @param {DesignationFilters} [filters] - Optional category and group filters
 * @returns {Promise<DesignationEntry[]>} - The available designations
 */
const listDesignationsController = async (
  filters: DesignationFilters = {}
): Promise<DesignationEntry[]> => {
  const designations = await prisma.designation.findMany({
    where: {
      active: true,
      ...(filters.category ? { category: filters.category } : {}),
      ...(filters.group ? { group: filters.group } : {})
    },
    select: {
      slug: true,
      label: true,
      category: true,
      topic: true,
      group: true,
      _count: { select: { users: true } }
    },
    orderBy: [{ category: 'asc' }, { group: 'asc' }, { label: 'asc' }]
  })

  return designations.map(designation => ({
    slug: designation.slug,
    label: designation.label,
    category: designation.category,
    topic: designation.topic,
    group: designation.group,
    users_count: designation._count.users
  }))
}

export default listDesignationsController
