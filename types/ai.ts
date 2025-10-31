// AI 相关类型定义
export interface AIModel {
  id: string
  name: string
  provider: string
  type: 'text' | 'vision' | 'video' | 'multimodal'
  capabilities: string[]
  maxTokens?: number
  costPerToken?: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface AIRequest {
  model: string
  prompt: string
  maxTokens?: number
  temperature?: number
  topP?: number
  frequencyPenalty?: number
  presencePenalty?: number
  stop?: string[]
  stream?: boolean
}

export interface AIResponse {
  id: string
  model: string
  content: string
  usage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  finishReason: 'stop' | 'length' | 'content_filter' | 'null'
  createdAt: Date
}

export interface AIError {
  code: string
  message: string
  type: 'invalid_request' | 'rate_limit' | 'server_error' | 'authentication_error'
  details?: Record<string, unknown>
}

export interface AIExecutionResult<T = unknown> {
  success: boolean
  data?: T
  error?: AIError
  executionTime: number
  model: string
  requestId: string
}

// 视频生成相关类型
export interface VideoGenerationRequest {
  prompt: string
  duration?: number
  resolution?: '720p' | '1080p' | '4k'
  style?: string
  aspectRatio?: '16:9' | '9:16' | '1:1'
  seed?: number
}

export interface VideoGenerationResponse {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  videoUrl?: string
  thumbnailUrl?: string
  duration?: number
  resolution?: string
  createdAt: Date
  completedAt?: Date
  error?: string
}

// 分析相关类型
export interface AnalysisRequest {
  type: 'text' | 'image' | 'video' | 'multimodal'
  content: string | File
  prompt?: string
  options?: Record<string, unknown>
}

export interface AnalysisResult {
  id: string
  type: string
  content: string
  insights: Record<string, unknown>
  confidence: number
  metadata: Record<string, unknown>
  createdAt: Date
}

// 推荐系统相关类型
export interface RecommendationRequest {
  userId: string
  context: Record<string, unknown>
  limit?: number
  filters?: Record<string, unknown>
}

export interface RecommendationResult {
  id: string
  userId: string
  recommendations: Array<{
    itemId: string
    score: number
    reason: string
    metadata: Record<string, unknown>
  }>
  context: Record<string, unknown>
  createdAt: Date
}

// 任务相关类型
export interface AITask {
  id: string
  type: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  input: Record<string, unknown>
  output?: Record<string, unknown>
  error?: string
  progress: number
  createdAt: Date
  startedAt?: Date
  completedAt?: Date
}

export interface TaskQueue {
  id: string
  name: string
  tasks: AITask[]
  maxConcurrency: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// 配置相关类型
export interface AIConfiguration {
  models: AIModel[]
  defaultModel: string
  maxRetries: number
  timeout: number
  enableFallback: boolean
  costLimit: number
  rateLimit: {
    requestsPerMinute: number
    tokensPerMinute: number
  }
}

// 监控和指标类型
export interface AIMetrics {
  model: string
  requests: number
  tokens: number
  cost: number
  avgResponseTime: number
  successRate: number
  errorRate: number
  timestamp: Date
}

export interface AIMonitoring {
  models: AIMetrics[]
  totalRequests: number
  totalTokens: number
  totalCost: number
  avgResponseTime: number
  overallSuccessRate: number
  period: {
    start: Date
    end: Date
  }
}
