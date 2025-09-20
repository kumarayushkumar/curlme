/**
 * Simple version checking using your API
 */

import { apiClient } from './api.js'
import { colorize } from './output.js'

/**
 * Get the current local version from package.json
 */
async function getCurrentVersion(): Promise<string> {
  try {
    const fs = await import('fs')
    const path = await import('path')
    const { fileURLToPath } = await import('url')

    const __filename = fileURLToPath(import.meta.url)
    const __dirname = path.dirname(__filename)
    const packageJsonPath = path.join(__dirname, '../../package.json')

    const packageContent = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
    return packageContent.version
  } catch (error) {
    return '0.0.0'
  }
}

/**
 * Get the latest version from your API
 */
export async function getLatestVersionFromAPI(): Promise<string | null> {
  try {
    const data = await apiClient.request('/')
    const versionLine = data.data.message.find((line: string) =>
      line.trim().startsWith('cli-version:')
    )
    if (versionLine) {
      return versionLine.trim().split(': ')[1]
    }
    return null
  } catch (error) {
    return null
  }
}

/**
 * Get the latest version from your API (internal function)
 */
async function getLatestVersion(): Promise<string | null> {
  return getLatestVersionFromAPI()
}

/**
 * Compare two version strings
 */
function isNewerVersion(localVersion: string, remoteVersion: string): boolean {
  const local = localVersion.split('.').map(Number)
  const remote = remoteVersion.split('.').map(Number)

  for (let i = 0; i < Math.max(local.length, remote.length); i++) {
    const localPart = local[i] || 0
    const remotePart = remote[i] || 0

    if (remotePart > localPart) return true
    if (localPart > remotePart) return false
  }

  return false
}

/**
 * Check if an update is required (mandatory)
 */
export async function isUpdateRequired(): Promise<boolean> {
  try {
    const currentVersion = await getCurrentVersion()
    const latestVersion = await getLatestVersion()

    if (!latestVersion) {
      return false
    }

    return isNewerVersion(currentVersion, latestVersion)
  } catch (error) {
    return false
  }
}

/**
 * Display mandatory update message and exit
 */
export function displayMandatoryUpdateMessage(latestVersion: string): void {
  console.log()
  console.log(colorize(`Update to latest version: ${latestVersion}`, 'yellow'))
  console.log()
  console.log('All updates are mandatory for security and compatibility.')
  console.log()
  console.log(
    `Please update using: ${colorize('npm update -g curlme', 'bold')}`
  )
  console.log()
}
