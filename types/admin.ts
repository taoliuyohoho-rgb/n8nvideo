// 管理员相关类型定义
export interface Persona {
  id: string
  name: string
  description: string
  characteristics: string[]
  targetAudience: string
  painPoints: string[]
  preferences: string[]
  createdAt: Date
  updatedAt: Date
}

export interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'user'
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  lastLoginAt?: Date
}

export interface ModelInfo {
  id: string
  name: string
  provider: string
  status: 'active' | 'inactive'
  capabilities: string[]
  costPerToken?: number
  maxTokens?: number
  createdAt: Date
  updatedAt: Date
}

export interface SegmentMetrics {
  segment: string
  count: number
  percentage: number
  avgScore: number
  trend: 'up' | 'down' | 'stable'
  lastUpdated: Date
}

export interface DecisionStats {
  totalDecisions: number
  successRate: number
  avgResponseTime: number
  errorRate: number
  lastUpdated: Date
}

export interface AIConfig {
  models: ModelInfo[]
  defaultProvider: string
  maxRetries: number
  timeout: number
  enableFallback: boolean
  costLimit: number
}

export interface Prompt {
  id: string
  name: string
  content: string
  category: string
  version: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// 表单数据类型
export interface PersonaFormData {
  name: string
  description: string
  characteristics: string[]
  targetAudience: string
  painPoints: string[]
  preferences: string[]
}

export interface UserFormData {
  email: string
  name: string
  role: 'admin' | 'user'
  isActive: boolean
}

export interface AIConfigFormData {
  defaultProvider: string
  maxRetries: number
  timeout: number
  enableFallback: boolean
  costLimit: number
}

// 统计数据类型
export interface AdminStats {
  totalUsers: number
  totalPersonas: number
  totalTasks: number
  activeModels: number
  recentActivity: ActivityItem[]
}

export interface ActivityItem {
  id: string
  type: 'user_created' | 'persona_created' | 'task_completed' | 'model_updated'
  description: string
  timestamp: Date
  userId?: string
  userName?: string
}

// 分页数据类型
export interface PaginationParams {
  page: number
  limit: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  search?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
