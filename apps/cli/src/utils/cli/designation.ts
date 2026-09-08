/**
 * Handler for browsing the designation catalogue
 */

import { apiClient } from '../api.js'
import { orDash } from '../format.js'
import { colorize, error } from '../output.js'
import { printTable, type Column } from '../table.js'

type DesignationRow = {
  slug: string
  label: string
  category: 'CREATOR' | 'CONSUMER'
  topic: string | null
  group: string
  users_count: number
}

const DESIGNATION_COLUMNS: Column<DesignationRow>[] = [
  { header: 'slug', value: row => row.slug },
  { header: 'label', value: row => row.label },
  { header: 'category', value: row => row.category.toLowerCase() },
  { header: 'topic', value: row => orDash(row.topic) },
  { header: 'group', value: row => row.group },
  { header: 'users', value: row => String(row.users_count), align: 'right' }
]

const VALID_CATEGORIES = ['creator', 'consumer']

const USAGE = 'Usage: curlme designations [creator|consumer] [group]'

/**
 * Builds the query string for the optional catalogue filters
 *
 * The category is an enum on the server, so it is upper cased here. The group
 * is free text and is sent exactly as the user typed it.
 *
 * @param {string} [category] - Optional 'creator' or 'consumer' filter
 * @param {string} [group] - Optional group filter
 * @returns {string} - A query string fragment, empty when nothing was filtered
 */
function buildQuery(category?: string, group?: string): string {
  const params: string[] = []

  if (category) {
    params.push(`category=${encodeURIComponent(category.toUpperCase())}`)
  }

  if (group) {
    params.push(`group=${encodeURIComponent(group)}`)
  }

  return params.length > 0 ? `?${params.join('&')}` : ''
}

/**
 * Lists the designations available at registration, optionally filtered
 *
 * @param {string} [category] - Optional 'creator' or 'consumer' filter
 * @param {string} [group] - Optional group filter, matched against the group column
 * @returns {Promise<void>}
 */
export async function handleDesignations(
  category?: string,
  group?: string
): Promise<void> {
  if (category && !VALID_CATEGORIES.includes(category.toLowerCase())) {
    error(`Unknown category '${category}'`)
    console.log(USAGE)
    return
  }

  const response = await apiClient.get(
    `/api/designations${buildQuery(category, group)}`
  )

  if (!response) return

  printTable(
    'Designations',
    response.data.designations as DesignationRow[],
    DESIGNATION_COLUMNS,
    'no designations configured'
  )

  console.log(
    colorize('Pick one of these slugs when you run `curlme register`.', 'grey')
  )
}
