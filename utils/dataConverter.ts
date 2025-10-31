/**
 * 数据转换工具函数
 * 用于在数据库类型和业务类型之间转换
 */

import type { DatabaseProduct, DatabasePersona, DatabaseStyle, DatabaseUser, DatabaseUserSubmission } from '@/types/database'
import type { 
  BusinessProduct, 
  BusinessPersona, 
  BusinessStyle, 
  BusinessUser, 
  BusinessUserSubmission,
  PersonaCoreIdentity,
  PersonaVibe,
  PersonaLook,
  PersonaCommunicationStyle,
  ScriptLines,
  ScriptShots,
  ScriptTechnical
} from '@/types/business'

/**
 * 解析数组字段，处理字符串和数组两种格式
 */
export function parseArrayField(field: string | string[] | null | undefined): string[] {
  if (!field) return []

  const extractFromArray = (arr: unknown[]): string[] => {
    return arr
      .map((item) => {
        if (typeof item === 'string') return item
        if (item && typeof item === 'object') {
          const obj = item as Record<string, unknown>
          const candidate = obj.text ?? obj.painPoint ?? obj.point ?? obj.label ?? obj.value
          return candidate != null ? String(candidate) : ''
        }
        return ''
      })
      .map(s => String(s).trim())
      .filter(Boolean)
  }

  if (Array.isArray(field)) return extractFromArray(field)

  if (typeof field === 'string') {
    const s = field.trim()
    if (!s) return []
    try {
      const parsed = JSON.parse(s)
      if (Array.isArray(parsed)) return extractFromArray(parsed)
      return []
    } catch {
      // 容错：逗号/分号/顿号/竖线/换行分隔
      return s.split(/[、，,;；\n\r\t|\/]/).map(x => x.trim()).filter(Boolean)
    }
  }
  return []
}

/**
 * 解析对象字段，处理字符串和对象两种格式
 */
export function parseObjectField<T = Record<string, unknown>>(
  field: string | T | null | undefined,
  defaultValue: T
): T {
  if (!field) return defaultValue
  if (typeof field === 'object' && field !== null) return field as T
  if (typeof field === 'string') {
    try {
      const parsed = JSON.parse(field)
      return typeof parsed === 'object' && parsed !== null ? parsed : defaultValue
    } catch {
      return defaultValue
    }
  }
  return defaultValue
}

/**
 * 将数据库商品转换为业务商品
 */
export function convertDatabaseProductToBusiness(dbProduct: DatabaseProduct): BusinessProduct {
  return {
    id: dbProduct.id,
    name: dbProduct.name,
    description: dbProduct.description,
    category: dbProduct.category,
    subcategory: dbProduct.subcategory,
    sellingPoints: parseArrayField(dbProduct.sellingPoints),
    skuImages: parseArrayField(dbProduct.skuImages),
    targetCountries: parseArrayField(dbProduct.targetCountries),
    painPoints: parseArrayField(dbProduct.painPoints),
    targetAudience: parseArrayField(dbProduct.targetAudience),
    source: dbProduct.source,
    sourceUserId: dbProduct.sourceUserId,
    isUserGenerated: dbProduct.isUserGenerated,
    needsReview: dbProduct.needsReview,
    lastUserUpdate: dbProduct.lastUserUpdate,
    painPointsLastUpdate: dbProduct.painPointsLastUpdate,
    painPointsSource: dbProduct.painPointsSource,
    createdAt: dbProduct.createdAt,
    updatedAt: dbProduct.updatedAt
  }
}

/**
 * 将业务商品转换为数据库商品
 */
export function convertBusinessProductToDatabase(businessProduct: BusinessProduct): Omit<DatabaseProduct, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    name: businessProduct.name,
    description: businessProduct.description,
    category: businessProduct.category,
    subcategory: businessProduct.subcategory,
    sellingPoints: JSON.stringify(businessProduct.sellingPoints),
    skuImages: JSON.stringify(businessProduct.skuImages),
    targetCountries: JSON.stringify(businessProduct.targetCountries),
    painPoints: JSON.stringify(businessProduct.painPoints),
    targetAudience: JSON.stringify(businessProduct.targetAudience),
    source: businessProduct.source,
    sourceUserId: businessProduct.sourceUserId,
    isUserGenerated: businessProduct.isUserGenerated,
    needsReview: businessProduct.needsReview,
    lastUserUpdate: businessProduct.lastUserUpdate,
    painPointsLastUpdate: businessProduct.painPointsLastUpdate,
    painPointsSource: businessProduct.painPointsSource
  }
}

/**
 * 将数据库人设转换为业务人设
 */
export function convertDatabasePersonaToBusiness(dbPersona: DatabasePersona): BusinessPersona {
  return {
    id: dbPersona.id,
    name: dbPersona.name,
    coreIdentity: parseObjectField(dbPersona.coreIdentity, {
      name: '',
      age: 25,
      occupation: '用户',
      location: '未知'
    }) as PersonaCoreIdentity,
    vibe: parseObjectField(dbPersona.vibe, {
      traits: [],
      communicationStyle: ''
    }) as PersonaVibe,
    look: parseObjectField(dbPersona.look, {
      age: '',
      gender: '',
      style: '',
      ethnicity: ''
    }) as PersonaLook,
    communicationStyle: parseObjectField(dbPersona.communicationStyle, {
      tone: '',
      language: '',
      formality: ''
    }) as PersonaCommunicationStyle,
    categoryId: dbPersona.categoryId,
    category: dbPersona.category,
    subcategory: dbPersona.subcategory,
    productName: dbPersona.productName,
    createdAt: dbPersona.createdAt,
    updatedAt: dbPersona.updatedAt
  }
}

/**
 * 将数据库风格转换为业务风格
 */
export function convertDatabaseStyleToBusiness(dbStyle: DatabaseStyle): BusinessStyle {
  return {
    id: dbStyle.id,
    name: dbStyle.name,
    description: dbStyle.description,
    productId: dbStyle.productId,
    category: dbStyle.category,
    subcategory: dbStyle.subcategory,
    tone: dbStyle.tone,
    energy: dbStyle.energy,
    durationSec: dbStyle.durationSec,
    lines: parseObjectField(dbStyle.lines, {
      opening: '',
      main: [],
      closing: ''
    }) as ScriptLines,
    shots: parseObjectField(dbStyle.shots, {
      opening: '',
      main: [],
      closing: ''
    }) as ScriptShots,
    technical: parseObjectField(dbStyle.technical, {
      camera: [],
      lighting: [],
      audio: []
    }) as ScriptTechnical,
    templatePerformance: dbStyle.templatePerformance,
    createdAt: dbStyle.createdAt,
    updatedAt: dbStyle.updatedAt
  }
}

/**
 * 将数据库用户转换为业务用户
 */
export function convertDatabaseUserToBusiness(dbUser: DatabaseUser): BusinessUser {
  return {
    id: dbUser.id,
    email: dbUser.email,
    name: dbUser.name,
    role: dbUser.role,
    organizationId: dbUser.organizationId,
    isActive: dbUser.isActive,
    createdAt: dbUser.createdAt,
    updatedAt: dbUser.updatedAt
  }
}

/**
 * 将数据库用户提交转换为业务用户提交
 */
export function convertDatabaseUserSubmissionToBusiness(dbSubmission: DatabaseUserSubmission): BusinessUserSubmission {
  return {
    id: dbSubmission.id,
    userId: dbSubmission.userId,
    type: dbSubmission.type,
    targetId: dbSubmission.targetId,
    data: parseObjectField(dbSubmission.data, {}),
    originalData: dbSubmission.originalData ? parseObjectField(dbSubmission.originalData, {}) : undefined,
    source: dbSubmission.source,
    sourceVideoId: dbSubmission.sourceVideoId,
    sourceUrl: dbSubmission.sourceUrl,
    status: dbSubmission.status,
    createdAt: dbSubmission.createdAt,
    updatedAt: dbSubmission.updatedAt
  }
}

/**
 * 安全地解析 JSON 字符串
 */
export function safeJsonParse<T = unknown>(jsonString: string, defaultValue: T): T {
  try {
    const parsed = JSON.parse(jsonString)
    return parsed as T
  } catch {
    return defaultValue
  }
}

/**
 * 安全地字符串化对象
 */
export function safeJsonStringify(obj: unknown): string {
  try {
    return JSON.stringify(obj)
  } catch {
    return '{}'
  }
}

/**
 * 合并数组字段，去重并过滤空值
 */
export function mergeArrayFields(...arrays: (string[] | undefined)[]): string[] {
  const merged = arrays
    .filter(Boolean)
    .flat()
    .map(item => String(item).trim())
    .filter(Boolean)
  
  return Array.from(new Set(merged))
}

/**
 * 验证商品数据
 */
export function validateProductData(data: unknown): data is BusinessProduct {
  if (!data || typeof data !== 'object') return false
  
  const product = data as Record<string, unknown>
  
  return (
    typeof product.id === 'string' &&
    typeof product.name === 'string' &&
    typeof product.description === 'string' &&
    typeof product.category === 'string' &&
    typeof product.subcategory === 'string' &&
    Array.isArray(product.sellingPoints) &&
    Array.isArray(product.skuImages) &&
    Array.isArray(product.targetCountries) &&
    Array.isArray(product.painPoints) &&
    Array.isArray(product.targetAudience)
  )
}
