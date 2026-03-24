/**
 * Configuration management for storing user tokens and device codes
 */

import fs from 'fs'
import os from 'os'
import path from 'path'

const isDev = process.env.NODE_ENV === 'development'
const ENV_SUFFIX = isDev ? '.dev' : ''
const CONFIG_DIR = path.join(os.homedir(), '.curlme')
const TOKEN_FILE = path.join(CONFIG_DIR, `token${ENV_SUFFIX}`)
const DEVICE_CODE_FILE = path.join(CONFIG_DIR, `device_code${ENV_SUFFIX}`)

// Ensure config directory exists
if (!fs.existsSync(CONFIG_DIR)) {
  fs.mkdirSync(CONFIG_DIR, { recursive: true })
}

/**
 * Saves the authentication token to a file
 * @param {string} token - The authentication token to save
 */
export function saveToken(token: string): void {
  fs.writeFileSync(TOKEN_FILE, token, 'utf8')
}

/**
 * Retrieves the authentication token from the file
 * @returns {string | null} The authentication token or null if not found
 */
export function getToken(): string | null {
  try {
    return fs.readFileSync(TOKEN_FILE, 'utf8').trim()
  } catch {
    return null
  }
}

/**
 *  Clears the saved authentication token
 */
export function clearToken(): void {
  try {
    fs.unlinkSync(TOKEN_FILE)
  } catch {}
}

/**
 * Saves the device code to a file
 * @param {string} deviceCode - The device code to save
 */
export function saveDeviceCode(deviceCode: string): void {
  fs.writeFileSync(DEVICE_CODE_FILE, deviceCode, 'utf8')
}

/**
 * Retrieves the device code from the file
 * @returns {string | null} The device code or null if not found
 */
export function getDeviceCode(): string | null {
  try {
    return fs.readFileSync(DEVICE_CODE_FILE, 'utf8').trim()
  } catch {
    return null
  }
}

/**
 * Clears the saved device code
 */
export function clearDeviceCode(): void {
  try {
    fs.unlinkSync(DEVICE_CODE_FILE)
  } catch {}
}

/**
 * Checks if a JWT token has expired by decoding the payload
 * @param {string} token - The JWT token to check
 * @returns {boolean} True if the token is expired
 */
function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(
      Buffer.from(token.split('.')[1], 'base64').toString()
    )
    return payload.exp * 1000 < Date.now()
  } catch {
    return true
  }
}

/**
 *  Checks if the user is authenticated with a valid (non-expired) token
 * @returns {boolean} True if authenticated, false otherwise
 */
export function isAuthenticated(): boolean {
  const token = getToken()
  if (!token) return false

  if (isTokenExpired(token)) {
    clearToken()
    return false
  }

  return true
}
