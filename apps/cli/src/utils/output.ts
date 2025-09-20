/**
 * Output formatting and colorization utilities for CLI
 */

export const colors = {
  red: '\x1b[38;2;255;44;44m',
  highlight: '\x1b[38;2;254;173;11m', // orange
  green: '\x1b[38;2;51;255;0m',
  yellow: '\x1b[38;2;255;255;0m',
  grey: '\x1b[38;2;150;150;150m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
}

/**
 * Applies ANSI color codes to text for terminal output
 *
 * @param {string} text - The text to colorize
 * @param {keyof typeof colors} color - The color to apply (key of colors object)
 * @return {string} - Colorized text
 */
export function colorize(text: string, color: keyof typeof colors): string {
  return `${colors[color]}${text}${colors.reset}`
}

/**
 * Displays a success message in green color
 *
 * @param {string} message - The success message to display
 * @return {void}
 */
export function success(message: string): void {
  console.log(`${colors.green}${message}${colors.reset}`)
}

/**
 * Displays an error message in red color
 *
 * @param {string} message - The error message to display
 * @return {void}
 */
export function error(message: string): void {
  console.log(`${colors.red}${message}${colors.reset}`)
}

/**
 * Displays a heading message in yellow color
 *
 * @param {string} message - The heading message to display
 * @return {void}
 */
export function heading(message: string): void {
  console.log(`${colors.yellow}${message}${colors.reset}`)
}

/**
 * Displays a highlighted message in highlight color
 *
 * @param {string} message - The message to highlight
 * @return {void}
 */
export function highlight(message: string): void {
  console.log(`${colors.highlight}${message}${colors.reset}`)
}

/**
 * Converts JSON data to readable text format with appropriate formatting
 *
 * @param data - The data to format (object, array, or primitive)
 * @param title - Optional title for the output
 * @param indent - Indentation level for nested objects
 * @return {string} - Formatted text representation of the data
 */
export function jsonToText(data: any, indent: number = 0): string {
  const indentStr = ' '.repeat(indent)
  let output = ''

  if (data === null || data === undefined) {
    return output + `${indentStr}${colorize('(empty)', 'grey')}\n`
  }

  if (typeof data === 'string') {
    return output + `${indentStr}${data}\n`
  }

  if (typeof data === 'number' || typeof data === 'boolean') {
    return output + `${indentStr}${colorize(String(data), 'highlight')}\n`
  }

  if (Array.isArray(data)) {
    if (data.length === 0) {
      return output + `${indentStr}${colorize('(no items)', 'grey')}\n`
    }

    data.forEach((item, index) => {
      if (typeof item === 'object') {
        output += '\n'
        output += jsonToText(item, indent + 1)
      } else {
        output += `${item}\n`
      }
    })
    return output
  }

  if (typeof data === 'object') {
    const entries = Object.entries(data)

    entries.forEach(([key, value]) => {
      if (value === null || value === undefined) {
        output += `${indentStr}${key + ':'} ${colorize('(not set)', 'grey')}\n`
      } else if (typeof value === 'object') {
        output += `${indentStr}${key + ':'}\n`
        output += jsonToText(value, indent + 1)
      } else {
        let formattedValue = String(value)

        if (
          key.includes('date') ||
          key.includes('created') ||
          key.includes('updated') ||
          key.includes('joined') ||
          key.includes('login')
        ) {
          if (typeof value === 'string' || typeof value === 'number') {
            const date = new Date(value)
            if (!isNaN(date.getTime())) {
              formattedValue = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`
            }
          }
        }

        if (key.includes('count') || key.includes('total')) {
          formattedValue = colorize(formattedValue, 'highlight')
        }

        if (key === 'id' || key.includes('_id')) {
          formattedValue = colorize(formattedValue, 'grey')
        }

        output += `${indentStr}${key + ':'} ${formattedValue}\n`
      }
    })

    return output
  }

  return output + `${indentStr}${data}\n`
}

/**
 * Displays data as formatted text in the console
 *
 * @param data - The data to display as text
 * @return {void}
 */
export function displayAsText(data: any): void {
  console.log('\n' + jsonToText(data) + '\n')
}
