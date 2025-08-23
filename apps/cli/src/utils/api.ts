import axios from 'axios'
import { getToken } from './config.js'
export class ApiClient {
  private baseURL: string

  constructor() {
    this.baseURL = 'https://api.curlme.dev'
  }

  async request(
    endpoint: string,
    options: {
      method?: 'GET' | 'POST' | 'DELETE'
      data?: any
      requireAuth?: boolean
    } = {}
  ) {
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

  async get(endpoint: string, requireAuth = false) {
    return this.request(endpoint, { method: 'GET', requireAuth })
  }

  async post(endpoint: string, data?: any, requireAuth = false) {
    return this.request(endpoint, { method: 'POST', data, requireAuth })
  }

  async delete(endpoint: string, requireAuth = false) {
    return this.request(endpoint, { method: 'DELETE', requireAuth })
  }
}

export const apiClient = new ApiClient()
