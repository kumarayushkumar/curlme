/**
 * API client for communicating with the curlme backend
 */

import axios from 'axios'
import { clearToken, getToken } from './config.js'
import { handleLogin } from './cli/auth.js'
import { error, heading } from './output.js'

/**
 * Chooses which server the CLI talks to.
 *
 * `CURLME_API_URL` wins, so anyone running their own deployment can point the
 * CLI at it without pretending to be in development mode. Otherwise the
 * NODE_ENV default applies.
 *
 * @returns {string} - The base URL, without a trailing slash
 */
function resolveBaseURL(): string {
  const override = process.env.CURLME_API_URL?.trim()

  if (override) return override.replace(/\/+$/, '')

  return process.env.NODE_ENV === 'development'
    ? 'http://localhost:8000'
    : 'http://api.curlme.dev'
}

export class ApiClient {
  private baseURL: string

  constructor() {
    this.baseURL = resolveBaseURL()
    if (process.env.NODE_ENV === 'development' || process.env.CURLME_API_URL) {
      console.log(`API Client initialized with baseURL: ${this.baseURL}`)
    }
  }

  /**
   * Makes HTTP requests to the API
   *
   * @param {string} endpoint - API endpoint path
   * @param {Object} options - Request options
   * @returns {Promise<any>} API response data
   */
  async request(
    endpoint: string,
    options: {
      method?: 'GET' | 'POST' | 'DELETE' | 'PATCH'
      data?: any
      requireAuth?: boolean
    } = {}
  ): Promise<any> {
    const { method = 'GET', data, requireAuth = false } = options

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }

    if (requireAuth) {
      let token = getToken()
      if (!token) {
        heading('Authentication required.')
        console.log(
          'Have a password account? Press Ctrl+C and run `curlme signin`.'
        )
        console.log('Otherwise, continuing with GitHub...\n')
        await handleLogin()
        token = getToken()
        if (!token) return null
      }
      headers.Authorization = `Bearer ${token}`
    }

    try {
      const response = await axios({
        method,
        url: `${this.baseURL}${endpoint}`,
        headers,
        data
      })

      const responseData = response.data

      if (responseData && responseData.success === false) {
        error(`${responseData.message || 'Request failed'}`)
        return null
      }

      return responseData
    } catch (err: any) {
      if (err.response) {
        const errorData = err.response.data
        if (errorData?.error === 'token_expired') {
          clearToken()
          heading('Session expired. Logging you in again...')
          await handleLogin()
          process.exit(0)
        } else if (errorData?.error === 'authorization_pending') {
          error(
            'Authorization is still pending. Please complete it and try again.'
          )
        } else if (errorData?.error === 'authorization_pending_or_denied') {
          error('Please complete GitHub authorization.')
        } else if (errorData?.message) {
          error(errorData.message)
        } else {
          error(
            `API Error: ${err.response.status} - ${err.response.statusText}`
          )
          error(`from ${this.baseURL}`)
          if (!process.env.CURLME_API_URL) {
            console.log(
              'If you are running your own server, point the CLI at it with:'
            )
            console.log('  export CURLME_API_URL=http://localhost:8000')
          }
        }
      } else {
        error(`Network Error: ${err.message}`)
        error(`Could not reach ${this.baseURL}`)
        console.log(
          'Set CURLME_API_URL to point the CLI at your own server, e.g.'
        )
        console.log('  export CURLME_API_URL=http://localhost:8000')
        process.exit(1) // Exit on network errors
      }
      return null
    }
  }

  /**
   * Sends a GET request to the specified endpoint
   *
   * @param {string} endpoint - API endpoint path
   * @param {boolean} requireAuth - Whether authentication is required
   * @returns {Promise<any>} API response data
   */
  async get(endpoint: string, requireAuth: boolean = false): Promise<any> {
    return this.request(endpoint, { method: 'GET', requireAuth })
  }

  /**
   * Sends a POST request to the specified endpoint with optional data
   *
   * @param {string} endpoint - API endpoint path
   * @param {any} [data] - Optional data to send in the request body
   * @param {boolean} requireAuth - Whether authentication is required
   * @returns {Promise<any>} API response data
   */
  async post(
    endpoint: string,
    data?: any,
    requireAuth: boolean = false
  ): Promise<any> {
    return this.request(endpoint, { method: 'POST', data, requireAuth })
  }

  /**
   * Sends a PATCH request to the specified endpoint with optional data
   *
   * @param {string} endpoint - API endpoint path
   * @param {any} [data] - Optional data to send in the request body
   * @param {boolean} requireAuth - Whether authentication is required
   * @returns {Promise<any>} API response data
   */
  async patch(
    endpoint: string,
    data?: any,
    requireAuth: boolean = false
  ): Promise<any> {
    return this.request(endpoint, { method: 'PATCH', data, requireAuth })
  }

  /**
   * Sends a DELETE request to the specified endpoint
   *
   * @param {string} endpoint - API endpoint path
   * @param {boolean} requireAuth - Whether authentication is required
   * @returns {Promise<any>} API response data
   */
  async delete(endpoint: string, requireAuth: boolean = false): Promise<any> {
    return this.request(endpoint, { method: 'DELETE', requireAuth })
  }
}

export const apiClient = new ApiClient()
