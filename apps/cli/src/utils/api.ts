/**
 * API client for communicating with the curlme backend
 */

import axios from 'axios'
import { getToken } from './config.js'
import { error } from './output.js'

export class ApiClient {
  private baseURL: string

  constructor() {
    this.baseURL =
      process.env.NODE_ENV === 'development'
        ? 'http://localhost:8000'
        : 'http://api.curlme.dev'
    if (process.env.NODE_ENV === 'development') {
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
      method?: 'GET' | 'POST' | 'DELETE'
      data?: any
      requireAuth?: boolean
    } = {}
  ): Promise<any> {
    const { method = 'GET', data, requireAuth = false } = options

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }

    if (requireAuth) {
      const token = getToken()
      if (!token) {
        error('Authentication required. Please run: curlme login')
        return null
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
        if (errorData?.error === 'authorization_pending') {
          error(
            'Authorization is still pending. Please complete it and try again.'
          )
        }
        if (errorData?.error === 'authorization_pending_or_denied') {
          error('Please complete GitHub authorization.')
        } else {
          error(
            `API Error: ${err.response.status} - ${err.response.statusText}`
          )
        }
      } else {
        error(`Network Error: ${err.message}`)
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
