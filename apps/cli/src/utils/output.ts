// Simple output utilities without external dependencies for now
// Can be enhanced with chalk later when dependencies are installed

export const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
}

export function colorize(text: string, color: keyof typeof colors): string {
  return `${colors[color]}${text}${colors.reset}`
}

export function success(message: string): void {
  console.log(`${colors.green} ${message}${colors.reset}`)
}

export function error(message: string): void {
  console.log(`${colors.red} ${message}${colors.reset}`)
}

export function info(message: string): void {
  console.log(`${colors.blue} ${message}${colors.reset}`)
}

export function warning(message: string): void {
  console.log(`${colors.yellow} ${message}${colors.reset}`)
}

export function log(message: string): void {
  console.log(message)
}

export function formatOutput(data: any): void {
  if (typeof data === 'string') {
    console.log('\n' + data + '\n')
  } else {
    console.log('\n' + JSON.stringify(data, null, 2) + '\n')
  }
}
