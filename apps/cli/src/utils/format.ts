/**
 * Small formatting helpers shared by the table based commands
 */

/**
 * Renders an ISO timestamp as a short local date and time
 *
 * @param {string | null | undefined} value - ISO timestamp
 * @returns {string} - Localised date, or a dash when there is nothing to show
 */
export function formatDate(value: string | null | undefined): string {
  if (!value) return '-'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'

  return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`
}

/**
 * Shortens text to fit a table cell without wrapping
 *
 * @param {string} value - Text to shorten
 * @param {number} max - Maximum number of characters to keep
 * @returns {string} - The text, truncated with an ellipsis when too long
 */
export function truncate(value: string, max: number): string {
  const collapsed = value.replace(/\s+/g, ' ').trim()

  if (collapsed.length <= max) return collapsed

  return `${collapsed.slice(0, Math.max(max - 1, 1))}…`
}

/**
 * Renders a value that may be absent
 *
 * @param {string | number | null | undefined} value - The value to render
 * @returns {string} - The value as text, or a dash when absent
 */
export function orDash(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return '-'

  return String(value)
}
