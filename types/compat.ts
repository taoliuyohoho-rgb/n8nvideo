// 临时类型兼容层
// 用于解决类型冲突，让项目能够编译通过
// TODO: 逐步替换为具体类型

export type CompatibleUser = any
export type CompatiblePersona = any
export type CompatibleAIConfig = any
export interface CompatiblePrompt {
  id: string
  name: string
  businessModule: string
  content: string
  variables: string[]
  description?: string
  performance?: number
  usageCount: number
  successRate?: number
  isActive: boolean
  isDefault: boolean
  createdBy?: string
  inputRequirements?: string
  outputRequirements?: string
  outputRules?: string
  createdAt: string
  updatedAt: string
}
export type CompatibleStyle = any
export type CompatibleProduct = any
export type CompatibleTask = any
export type CompatiblePainPoint = any

// 表单数据类型
export interface CompatiblePersonaFormData {
  name: string
  description: string
  characteristics: string[]
  targetAudience: string
  painPoints: string[]
  preferences: string[]
}

export interface CompatibleUserFormData {
  email: string
  name: string
  role: 'admin' | 'user'
  isActive: boolean
}

// API 响应类型
export interface CompatibleApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

// 分页响应类型
export interface CompatiblePaginatedResponse<T = any> extends CompatibleApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
