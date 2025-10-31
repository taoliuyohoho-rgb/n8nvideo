/**
 * 项目统一类型定义
 * 集中管理所有业务类型，避免类型重复和不一致
 */

// ==================== 基础类型 ====================

// 用户角色
export type UserRole = 'admin' | 'viewer' | 'editor'

// 商品映射状态
export type MappingStatus = 'pending' | 'confirmed' | 'rejected'

// 任务状态
export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed'

// 视频生成状态
export type VideoStatus = 'pending' | 'processing' | 'completed' | 'failed'

// 风格状态
export type StyleStatus = 'active' | 'inactive' | 'archived'

// ==================== API 响应类型 ====================

// 通用API响应
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// 分页响应
export interface PaginatedResponse<T = unknown> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

// ==================== 业务实体类型 ====================

// 商品表单数据
export interface ProductFormData {
  name: string
  description: string
  category: string
  subcategory?: string
  sellingPoints: string[] // 明确为数组类型
  targetCountries: string[] // 明确为数组类型
  targetAudience?: Record<string, unknown>
  skuImages?: string
  images?: string[]
  country?: string[]
}

// 风格表单数据
export interface StyleFormData {
  name: string
  description: string
  category: string
  templatePerformance?: number
  status: StyleStatus
  config: Record<string, unknown>
}

// 用户表单数据
export interface UserFormData {
  name: string
  email: string
  role: UserRole
  isActive: boolean
}

// ==================== 任务相关类型 ====================

// 任务基础信息
export interface Task {
  id: string
  type: string
  status: TaskStatus
  priority: number
  payload: Record<string, unknown>
  result: TaskResult | null
  error: string | null
  progress: number
  traceId: string | null
  ownerId: string | null
  workerName: string | null
  retryCount: number
  maxRetries: number
  createdAt: string
  startedAt: string | null
  completedAt: string | null
}

// 任务结果
export interface TaskResult {
  success: boolean
  data?: unknown
  error?: string
  metadata?: Record<string, unknown>
}

// 任务日志
export interface TaskLog {
  id: string
  level: 'debug' | 'info' | 'warn' | 'error'
  message: string
  data: Record<string, unknown>
  timestamp: string
  taskId: string
}

// ==================== 视频生成类型 ====================

// 视频生成请求
export interface VideoGenerationRequest {
  productId: string
  styleId: string
  prompt?: string
  duration?: number
  quality?: 'low' | 'medium' | 'high'
  format?: 'mp4' | 'webm' | 'mov'
}

// 视频生成结果
export interface VideoGenerationResult {
  id: string
  status: VideoStatus
  videoUrl?: string
  thumbnailUrl?: string
  duration?: number
  fileSize?: number
  error?: string
  createdAt: string
  completedAt?: string
}

// ==================== 表单验证类型 ====================

// 表单验证错误
export interface FormValidationError {
  field: string
  message: string
  code: string
}

// 表单状态
export interface FormState<T = Record<string, unknown>> {
  data: T
  errors: FormValidationError[]
  isSubmitting: boolean
  isValid: boolean
}

// ==================== 类型守卫函数 ====================

// 状态类型守卫
export function isValidMappingStatus(status: string): status is MappingStatus {
  return ['pending', 'confirmed', 'rejected'].includes(status)
}

export function isValidTaskStatus(status: string): status is TaskStatus {
  return ['pending', 'running', 'completed', 'failed'].includes(status)
}

export function isValidUserRole(role: string): role is UserRole {
  return ['admin', 'viewer', 'editor'].includes(role)
}

// 数组类型守卫
export function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(item => typeof item === 'string')
}

// ==================== 工具类型 ====================

// 使所有属性可选
export type Partial<T> = {
  [P in keyof T]?: T[P]
}

// 使所有属性必需
export type Required<T> = {
  [P in keyof T]-?: T[P]
}

// 选择特定属性
export type Pick<T, K extends keyof T> = {
  [P in K]: T[P]
}

// 排除特定属性
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>

// ==================== 导出所有类型 ====================

// 基础类型
export * from './api'

// 业务类型 - 使用别名避免冲突
export type { User as AdminUser, Persona as AdminPersona, AIConfig as AdminAIConfig, Prompt as AdminPrompt } from './admin'
export type { AIModel, AIRequest, AIResponse, AITask as AITaskType } from './ai'
export type { TaskCandidate, CompetitorAnalysis, AnalysisResult as TaskAnalysisResult } from './tasks'

// 数据库类型
export * from './database'
