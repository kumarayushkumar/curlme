/**
 * Table rendering for the statistics and listing commands, built on cli-table3
 */

import Table from 'cli-table3'
import { colorize } from './output.js'

export type Alignment = 'left' | 'right' | 'center'

export type Column<T> = {
  header: string
  value: (row: T) => string
  align?: Alignment
}

/**
 * Drops the horizontal rule that cli-table3 draws between every row, which
 * keeps long statistics tables readable. The bold header still separates
 * itself from the body.
 */
const COMPACT_CHARS = {
  mid: '',
  'left-mid': '',
  'mid-mid': '',
  'right-mid': ''
} as const

/**
 * Renders rows as a bordered table
 *
 * @param {T[]} rows - The records to render
 * @param {Column<T>[]} columns - Header, accessor and alignment per column
 * @returns {string} - The rendered table
 */
export function renderTable<T>(rows: T[], columns: Column<T>[]): string {
  const table = new Table({
    head: columns.map(column => colorize(column.header, 'bold')),
    colAligns: columns.map(column => column.align ?? 'left'),
    // Colour is applied to the cell contents instead, so cli-table3 never has
    // to reach for its optional colour dependency.
    style: { head: [], border: [], 'padding-left': 1, 'padding-right': 1 },
    chars: COMPACT_CHARS
  })

  rows.forEach(row => table.push(columns.map(column => column.value(row))))

  return table.toString()
}

/**
 * Prints a titled table, or a note when there is nothing to show
 *
 * @param {string} title - Heading printed above the table
 * @param {T[]} rows - The records to render
 * @param {Column<T>[]} columns - Column definitions
 * @param {string} emptyMessage - Shown instead of the table when rows is empty
 */
export function printTable<T>(
  title: string,
  rows: T[],
  columns: Column<T>[],
  emptyMessage: string
): void {
  console.log(`\n${colorize(title, 'highlight')}`)

  if (rows.length === 0) {
    console.log(colorize(emptyMessage, 'grey'))
    return
  }

  console.log(renderTable(rows, columns))
}

/**
 * Prints a two column table of label and value pairs
 *
 * @param {string} title - Heading printed above the table
 * @param {Array<[string, string | number]>} entries - Label and value pairs
 */
export function printKeyValues(
  title: string,
  entries: Array<[string, string | number]>
): void {
  printTable(
    title,
    entries,
    [
      { header: 'metric', value: entry => entry[0] },
      { header: 'value', value: entry => String(entry[1]), align: 'right' }
    ],
    'no data'
  )
}
