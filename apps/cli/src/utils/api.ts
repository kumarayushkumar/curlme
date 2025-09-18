/**
 * API client for communicating with the curlme backend
 */

import axios from 'axios'
import dotenv from 'dotenv'
import { getToken } from './config.js'
dotenv.config()

export class ApiClient {
  private baseURL: string

  constructor() {
    this.baseURL =
      process.env.NODE_ENV === 'development'
        ? 'http://localhost:8000'
        : 'http://167.71.237.89'
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
        throw new Error('Authentication required. Please run: curlme login')
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

      return response.data
    } catch (error: any) {
      if (error.response) {
        throw new Error(
          `API Error: ${error.response.status} - ${error.response.statusText}`
        )
      }
      throw new Error(`Network Error: ${error.message}`)
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
