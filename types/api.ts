// API 响应类型定义
export interface ApiResponse<T = unknown> {
  success: boolean
  data: T
  message: string
  timestamp: Date
}

export interface ApiError {
  success: false
  error: {
    code: string
    message: string
    details?: Record<string, unknown>
  }
  timestamp: Date
}

export interface PaginatedApiResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// 通用状态类型
export type LoadingState = 'idle' | 'loading' | 'success' | 'error'

export interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: string | null
  lastUpdated: Date | null
}

// 请求参数类型
export interface CreateRequest<T> {
  data: T
}

export interface UpdateRequest<T> {
  id: string
  data: Partial<T>
}

export interface DeleteRequest {
  id: string
}

export interface ListRequest {
  page?: number
  limit?: number
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  filters?: Record<string, unknown>
}

// 批量操作类型
export interface BatchOperation<T> {
  operation: 'create' | 'update' | 'delete'
  items: T[]
}

export interface BatchResponse<T> {
  success: boolean
  results: Array<{
    item: T
    success: boolean
    error?: string
  }>
  summary: {
    total: number
    successful: number
    failed: number
  }
}

// 文件上传类型
export interface FileUpload {
  file: File
  category: string
  metadata?: Record<string, unknown>
}

export interface FileUploadResponse {
  id: string
  url: string
  filename: string
  size: number
  mimeType: string
  uploadedAt: Date
}

// 验证错误类型
export interface ValidationError {
  field: string
  message: string
  value?: unknown
}

export interface ValidationResponse {
  success: false
  errors: ValidationError[]
}

// 搜索和过滤类型
export interface SearchParams {
  query: string
  filters?: Record<string, unknown>
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

export interface FilterOption {
  key: string
  label: string
  type: 'text' | 'select' | 'date' | 'number' | 'boolean'
  options?: Array<{ value: string; label: string }>
  multiple?: boolean
}

// 导出和导入类型
export interface ExportRequest {
  format: 'json' | 'csv' | 'xlsx'
  filters?: Record<string, unknown>
  fields?: string[]
}

export interface ImportRequest {
  file: File
  format: 'json' | 'csv' | 'xlsx'
  mapping?: Record<string, string>
  validateOnly?: boolean
}

export interface ImportResponse {
  success: boolean
  imported: number
  errors: Array<{
    row: number
    field: string
    message: string
  }>
  warnings: Array<{
    row: number
    field: string
    message: string
  }>
}