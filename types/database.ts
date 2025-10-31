/**
 * 数据库层类型定义
 * 对应 Prisma 生成的数据库模型
 */

export interface DatabaseProduct {
  id: string
  name: string
  description: string
  category: string
  subcategory: string
  sellingPoints: string | string[]  // 数据库可能返回字符串或数组
  skuImages: string | string[]
  targetCountries: string | string[]
  painPoints: string | string[]
  targetAudience: string | string[]
  targetAudiences?: string | string[]  // 新字段
  country?: string | string[]  // 新字段
  source?: string
  sourceUserId?: string
  isUserGenerated?: boolean
  needsReview?: boolean
  lastUserUpdate?: Date
  painPointsLastUpdate?: Date
  painPointsSource?: string
  createdAt: Date
  updatedAt: Date
}

export interface DatabasePersona {
  id: string
  name: string
  coreIdentity: string | object
  vibe: string | object
  look: string | object
  communicationStyle: string | object
  categoryId?: string
  category?: string
  subcategory?: string
  productName?: string
  createdAt: Date
  updatedAt: Date
}

export interface DatabaseStyle {
  id: string
  name: string
  description: string
  productId?: string
  category?: string
  subcategory?: string
  tone?: string
  energy?: string
  durationSec?: number
  lines?: string | object
  shots?: string | object
  technical?: string | object
  templatePerformance?: number
  createdAt: Date
  updatedAt: Date
}

export interface DatabaseUser {
  id: string
  email: string
  name: string
  password: string | null
  role: string
  organizationId: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface DatabaseUserSubmission {
  id: string
  userId: string
  type: string
  targetId?: string
  data: string
  originalData?: string
  source?: string
  sourceVideoId?: string
  sourceUrl?: string
  status?: string
  createdAt: Date
  updatedAt: Date
}