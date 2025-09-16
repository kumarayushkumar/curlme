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
import { colorize, error, info, success, warning } from '../output.js'

/**
 * Handles the login process using GitHub OAuth device flow
 */
export async function handleLogin() {
  try {
    if (isAuthenticated()) {
      info('You are already logged in!')
      return
    }

    const existingDeviceCode = getDeviceCode()
    if (existingDeviceCode) {
      info('Completing GitHub authentication...')
      try {
        const response = await apiClient.post('/login', {
          device_code: existingDeviceCode
        })
        if (response?.success && response?.data?.token) {
          saveToken(response.data.token)
          clearDeviceCode()
          success('Login successful!')
          info('You are now authenticated with curlme')
          return
        }
        if (response?.error === 'authorization_pending') {
          warning(
            'GitHub authorization is still pending. Please complete it in your browser.'
          )
          return
        }
        // Any other outcome: clear device code and proceed to start a new flow
        clearDeviceCode()
      } catch {
        clearDeviceCode()
      }
    }

    info('Starting GitHub authentication...')
    const start = await apiClient.post('/login')
    if (start?.success && start?.data?.device_code) {
      const newDeviceCode = start.data.device_code
      const userCode = start.data.user_code
      const verificationUri = start.data.verification_uri
      saveDeviceCode(newDeviceCode)

      console.log('\n' + '='.repeat(60))
      console.log(colorize('GitHub Authentication Required', 'bold'))
      console.log('='.repeat(60))
      console.log(`1. Visit: ${colorize(verificationUri, 'blue')}`)
      console.log(`2. Enter code: ${colorize(userCode, 'yellow')}`)
      console.log('3. Authorize the application')
      console.log('='.repeat(60))

      try {
        const openCmd =
          process.platform === 'darwin'
            ? 'open'
            : process.platform === 'win32'
              ? 'start'
              : 'xdg-open'
        exec(`${openCmd} ${verificationUri}`)
        info('Opening browser automatically...')
      } catch {}

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

      if (answer === 'y' || answer === 'yes') {
        try {
          const finish = await apiClient.post('/login', {
            device_code: newDeviceCode
          })
          if (finish?.success && finish?.data?.token) {
            saveToken(finish.data.token)
            clearDeviceCode()
            success('Login successful!')
            info('You are now authenticated with curlme')
            return
          }
          if (finish?.error === 'authorization_pending') {
            warning(
              'Authorization is still pending. Please complete it and try again.'
            )
            return
          }
          if (finish?.error === 'access_denied') {
            error('Authorization was denied. Please try again.')
            clearDeviceCode()
            return
          }
          error('Unexpected response from GitHub. Please try again.')
          clearDeviceCode()
        } catch (err: any) {
          error(`Authentication failed: ${err.message}`)
          clearDeviceCode()
        }
      } else {
        info(
          'Authentication cancelled. Run `curlme login` when ready to authenticate.'
        )
      }
    }
  } catch (err: any) {
    error(`Login failed: ${err.message}`)
  }
}

/**
 * Handles the logout process by clearing stored tokens and device codes
 */
export function handleLogout() {
  clearToken()
  clearDeviceCode()
  success('Logged out successfully')
}
