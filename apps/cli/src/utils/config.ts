import fs from 'fs'
import os from 'os'
import path from 'path'

const CONFIG_DIR = path.join(os.homedir(), '.curlme')
const TOKEN_FILE = path.join(CONFIG_DIR, 'token')
const DEVICE_CODE_FILE = path.join(CONFIG_DIR, 'device_code')

// Ensure config directory exists
if (!fs.existsSync(CONFIG_DIR)) {
  fs.mkdirSync(CONFIG_DIR, { recursive: true })
}

export function saveToken(token: string): void {
  fs.writeFileSync(TOKEN_FILE, token, 'utf8')
}

export function getToken(): string | null {
  try {
    return fs.readFileSync(TOKEN_FILE, 'utf8').trim()
  } catch {
    return null
  }
}

export function clearToken(): void {
  try {
    fs.unlinkSync(TOKEN_FILE)
  } catch {}
}

export function saveDeviceCode(deviceCode: string): void {
  fs.writeFileSync(DEVICE_CODE_FILE, deviceCode, 'utf8')
}

export function getDeviceCode(): string | null {
  try {
    return fs.readFileSync(DEVICE_CODE_FILE, 'utf8').trim()
  } catch {
    return null
  }
}

export function clearDeviceCode(): void {
  try {
    fs.unlinkSync(DEVICE_CODE_FILE)
  } catch {}
}

export function isAuthenticated(): boolean {
  return getToken() !== null
}
