/**
 * 统一API客户端
 * 封装所有API调用，提供统一的错误处理和类型安全
 */

import { API_CONSTANTS } from '@/src/core/constants/AppConstants'

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
  }
  details?: string
}

export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  headers?: Record<string, string>
  body?: any
  timeout?: number
  retries?: number
}

export class ApiClient {
  private baseUrl: string
  private defaultTimeout: number
  private defaultRetries: number

  constructor(baseUrl: string = '', options: { timeout?: number; retries?: number } = {}) {
    this.baseUrl = baseUrl
    this.defaultTimeout = options.timeout || API_CONSTANTS.DEFAULT_TIMEOUT
    this.defaultRetries = options.retries || API_CONSTANTS.DEFAULT_RETRIES
  }

  /**
   * 通用请求方法
   */
  async request<T = any>(
    endpoint: string,
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      headers = {},
      body,
      timeout = this.defaultTimeout,
      retries = this.defaultRetries
    } = options

    const url = `${this.baseUrl}${endpoint}`
    const requestHeaders = {
      'Content-Type': 'application/json',
      ...headers
    }

    let lastError: Error | null = null

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), timeout)

        const response = await fetch(url, {
          method,
          headers: requestHeaders,
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal
        })

        clearTimeout(timeoutId)

        const data = await response.json()

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${data.error?.message || data.message || 'Unknown error'}`)
        }

        return data
      } catch (error) {
        lastError = error as Error
        
        // 如果是最后一次尝试，直接抛出错误
        if (attempt === retries) {
          break
        }

        // 指数退避
        const delay = Math.pow(2, attempt) * API_CONSTANTS.BASE_BACKOFF_MS
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    return {
      success: false,
      error: {
        code: 'REQUEST_FAILED',
        message: lastError?.message || 'Request failed'
      }
    }
  }

  /**
   * GET请求
   */
  async get<T = any>(endpoint: string, options: Omit<ApiRequestOptions, 'method' | 'body'> = {}) {
    return this.request<T>(endpoint, { ...options, method: 'GET' })
  }

  /**
   * POST请求
   */
  async post<T = any>(endpoint: string, body?: any, options: Omit<ApiRequestOptions, 'method'> = {}) {
    return this.request<T>(endpoint, { ...options, method: 'POST', body })
  }

  /**
   * PUT请求
   */
  async put<T = any>(endpoint: string, body?: any, options: Omit<ApiRequestOptions, 'method'> = {}) {
    return this.request<T>(endpoint, { ...options, method: 'PUT', body })
  }

  /**
   * DELETE请求
   */
  async delete<T = any>(endpoint: string, options: Omit<ApiRequestOptions, 'method' | 'body'> = {}) {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' })
  }

  /**
   * PATCH请求
   */
  async patch<T = any>(endpoint: string, body?: any, options: Omit<ApiRequestOptions, 'method'> = {}) {
    return this.request<T>(endpoint, { ...options, method: 'PATCH', body })
  }
}

// 创建默认实例
export const apiClient = new ApiClient()

// 创建带前缀的实例
export const createApiClient = (baseUrl: string, options?: { timeout?: number; retries?: number }) => {
  return new ApiClient(baseUrl, options)
}
