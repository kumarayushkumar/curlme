/**
 * Authentication handlers for GitHub OAuth device flow
 */

import { exec } from 'child_process'
import * as readline from 'readline'
import { apiClient } from '../api.js'
import {
  clearDeviceCode,
  clearToken,
  getDeviceCode,
  isAuthenticated,
  saveDeviceCode,
  saveToken
} from '../config.js'
import { colorize, error, heading, success } from '../output.js'

/**
 * Handles the login process using GitHub OAuth device flow
 *
 * @return {Promise<void>}
 */
export async function handleLogin(): Promise<void> {
  if (isAuthenticated()) {
    success('You are already logged in!')
    return
  }

  const existingDeviceCode = getDeviceCode()
  if (existingDeviceCode) {
    console.log('Completing GitHub authentication...')
    const response = await apiClient.post('/api/login', {
      device_code: existingDeviceCode
    })
    if (response) {
      saveToken(response.data.token)
      clearDeviceCode()
      success('Login successful!')
    } else {
      console.log(
        'GitHub authorization is still pending. Please complete it in your browser.'
      )
    }
    return
  }

  heading('Starting GitHub authentication...')
  const start = await apiClient.post('/api/login')
  if (start) {
    const newDeviceCode = start.data.device_code
    const userCode = start.data.user_code
    const verificationUri = start.data.verification_uri
    saveDeviceCode(newDeviceCode)

    console.log('\nGitHub Authentication Required')

    console.log(`1. Visit: ${verificationUri}`)
    console.log(`2. Enter code: ${colorize(userCode, 'highlight')}`)
    console.log(`3. Authorize the application\n`)

    const openCmd =
      process.platform === 'darwin'
        ? 'open'
        : process.platform === 'win32'
          ? 'start'
          : 'xdg-open'
    exec(`${openCmd} ${verificationUri}`)
    console.log('Opening browser automatically...')

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })
    const answer = await new Promise<string>(resolve => {
      rl.question(
        '\nHave you authorized the application? (y/N): ',
        (ans: string) => {
          rl.close()
          resolve(ans.toLowerCase())
        }
      )
    })
    console.log('\n')
    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      const finish = await apiClient.post('/api/login', {
        device_code: newDeviceCode
      })
      if (finish) {
        saveToken(finish.data.token)
        clearDeviceCode()
        success('Login successful!')
      }
    }
    clearDeviceCode()
  }
}

/**
 * Handles the logout process by clearing stored tokens and device codes
 *
 * @return {void}
 */
export function handleLogout(): void {
  clearToken()
  clearDeviceCode()
  success('Logged out successfully')
}
