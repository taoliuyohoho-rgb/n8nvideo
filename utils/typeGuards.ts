/**
 * 类型守卫函数
 * 用于运行时类型检查
 */

import type { BusinessProduct, BusinessPersona, BusinessStyle, BusinessUser } from '@/types/business'

/**
 * 检查是否为字符串数组
 */
export function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(item => typeof item === 'string')
}

/**
 * 检查是否为数字数组
 */
export function isNumberArray(value: unknown): value is number[] {
  return Array.isArray(value) && value.every(item => typeof item === 'number')
}

/**
 * 检查是否为对象
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

/**
 * 检查是否为非空字符串
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

/**
 * 检查是否为有效的日期
 */
export function isValidDate(value: unknown): value is Date {
  return value instanceof Date && !isNaN(value.getTime())
}

/**
 * 检查是否为有效的商品数据
 */
export function isBusinessProduct(value: unknown): value is BusinessProduct {
  if (!isObject(value)) return false
  
  return (
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.description === 'string' &&
    typeof value.category === 'string' &&
    typeof value.subcategory === 'string' &&
    isStringArray(value.sellingPoints) &&
    isStringArray(value.skuImages) &&
    isStringArray(value.targetCountries) &&
    isStringArray(value.painPoints) &&
    isStringArray(value.targetAudience) &&
    isValidDate(value.createdAt) &&
    isValidDate(value.updatedAt)
  )
}

/**
 * 检查是否为有效的人设数据
 */
export function isBusinessPersona(value: unknown): value is BusinessPersona {
  if (!isObject(value)) return false
  
  return (
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    isObject(value.coreIdentity) &&
    isObject(value.vibe) &&
    isObject(value.look) &&
    isObject(value.communicationStyle) &&
    isValidDate(value.createdAt) &&
    isValidDate(value.updatedAt)
  )
}

/**
 * 检查是否为有效的风格数据
 */
export function isBusinessStyle(value: unknown): value is BusinessStyle {
  if (!isObject(value)) return false
  
  return (
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.description === 'string' &&
    isObject(value.lines) &&
    isObject(value.shots) &&
    isObject(value.technical) &&
    isValidDate(value.createdAt) &&
    isValidDate(value.updatedAt)
  )
}

/**
 * 检查是否为有效的用户数据
 */
export function isBusinessUser(value: unknown): value is BusinessUser {
  if (!isObject(value)) return false
  
  return (
    typeof value.id === 'string' &&
    typeof value.email === 'string' &&
    typeof value.name === 'string' &&
    typeof value.role === 'string' &&
    (value.organizationId === null || typeof value.organizationId === 'string') &&
    typeof value.isActive === 'boolean' &&
    isValidDate(value.createdAt) &&
    isValidDate(value.updatedAt)
  )
}

/**
 * 检查是否为有效的 API 响应
 */
export function isApiResponse(value: unknown): value is { success: boolean; data?: unknown; error?: string; message?: string } {
  if (!isObject(value)) return false
  
  return (
    typeof value.success === 'boolean' &&
    (value.data === undefined || true) && // data 可以是任何类型
    (value.error === undefined || typeof value.error === 'string') &&
    (value.message === undefined || typeof value.message === 'string')
  )
}

/**
 * 检查是否为成功的 API 响应
 */
export function isSuccessApiResponse<T = unknown>(value: unknown): value is { success: true; data: T; message?: string } {
  return isApiResponse(value) && value.success === true && value.data !== undefined
}

/**
 * 检查是否为错误的 API 响应
 */
export function isErrorApiResponse(value: unknown): value is { success: false; error: string; message?: string } {
  return isApiResponse(value) && value.success === false && typeof value.error === 'string'
}

/**
 * 检查是否为有效的分页响应
 */
export function isPaginatedResponse<T = unknown>(value: unknown): value is {
  success: boolean
  data: T[]
  pagination?: {
    page: number
    limit: number
    total: number
    hasMore: boolean
  }
  error?: string
  message?: string
} {
  if (!isApiResponse(value)) return false
  
  const paginatedValue = value as {
    success: boolean
    data: unknown
    pagination?: unknown
    error?: string
    message?: string
  }
  
  return (
    Array.isArray(paginatedValue.data) &&
    (paginatedValue.pagination === undefined || (
      isObject(paginatedValue.pagination) &&
      typeof (paginatedValue.pagination as any).page === 'number' &&
      typeof (paginatedValue.pagination as any).limit === 'number' &&
      typeof (paginatedValue.pagination as any).total === 'number' &&
      typeof (paginatedValue.pagination as any).hasMore === 'boolean'
    ))
  )
}

/**
 * 检查是否为有效的表单数据
 */
export function isProductFormData(value: unknown): value is {
  name: string
  description: string
  category: string
  subcategory: string
  sellingPoints: string[]
  skuImages: string[]
  targetCountries: string[]
  painPoints: string[]
  targetAudience: string[]
} {
  if (!isObject(value)) return false
  
  return (
    typeof value.name === 'string' &&
    typeof value.description === 'string' &&
    typeof value.category === 'string' &&
    typeof value.subcategory === 'string' &&
    isStringArray(value.sellingPoints) &&
    isStringArray(value.skuImages) &&
    isStringArray(value.targetCountries) &&
    isStringArray(value.painPoints) &&
    isStringArray(value.targetAudience)
  )
}

/**
 * 检查是否为有效的分析结果
 */
export function isAnalysisResult(value: unknown): value is {
  sellingPoints: string[]
  painPoints: string[]
  targetAudience: string[]
  confidence: number
  source: string
} {
  if (!isObject(value)) return false
  
  return (
    isStringArray(value.sellingPoints) &&
    isStringArray(value.painPoints) &&
    isStringArray(value.targetAudience) &&
    typeof value.confidence === 'number' &&
    typeof value.source === 'string'
  )
}

/**
 * 检查是否为有效的推荐项
 */
export function isRecommendationItem(value: unknown): value is {
  id: string
  type: 'persona' | 'style' | 'prompt'
  title?: string
  summary?: string
  content?: string
  fineScore?: number
  confidence?: number
} {
  if (!isObject(value)) return false
  
  return (
    typeof value.id === 'string' &&
    (value.type === 'persona' || value.type === 'style' || value.type === 'prompt') &&
    (value.title === undefined || typeof value.title === 'string') &&
    (value.summary === undefined || typeof value.summary === 'string') &&
    (value.content === undefined || typeof value.content === 'string') &&
    (value.fineScore === undefined || typeof value.fineScore === 'number') &&
    (value.confidence === undefined || typeof value.confidence === 'number')
  )
}

/**
 * 安全地获取对象属性
 */
export function safeGet<T = unknown>(obj: unknown, path: string, defaultValue: T): T {
  if (!isObject(obj)) return defaultValue
  
  const keys = path.split('.')
  let current: unknown = obj
  
  for (const key of keys) {
    if (isObject(current) && key in current) {
      current = current[key]
    } else {
      return defaultValue
    }
  }
  
  return current as T
}

/**
 * 安全地设置对象属性
 */
export function safeSet(obj: Record<string, unknown>, path: string, value: unknown): void {
  const keys = path.split('.')
  let current = obj
  
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]
    if (!(key in current) || !isObject(current[key])) {
      current[key] = {}
    }
    current = current[key] as Record<string, unknown>
  }
  
  current[keys[keys.length - 1]] = value
}
