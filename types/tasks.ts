// 任务相关类型定义
export interface TaskCandidate {
  id: string
  name: string
  description: string
  recommendedCategories?: string[]
  targetCountries?: string[]
  tonePool?: string[]
  matchScore?: number
}

export interface CompetitorInsights {
  sellingPoints?: string[]
  painPoints?: string[]
  confidence?: number
}

export interface CompetitorAnalysis {
  id: string
  url: string
  title: string
  description: string
  combinedInsights?: CompetitorInsights
  confidence?: number
}

export interface AnalysisResult {
  competitors: CompetitorAnalysis[]
  averageConfidence: number
  insights: {
    sellingPoints: string[]
    painPoints: string[]
  }
}

export interface TaskPayload {
  url?: string
  urls?: string[]
  category?: string
  targetCountry?: string
  targetAudience?: string
  [key: string]: unknown
}

export interface TaskResult {
  success: boolean
  data?: unknown
  error?: string
  metadata?: Record<string, unknown>
}

export interface AITask {
  id: string
  type: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  payload: TaskPayload
  result?: TaskResult
  error?: string
  progress: number
  createdAt: Date
  startedAt?: Date
  completedAt?: Date
}

// 模板相关类型
export interface Template {
  id: string
  name: string
  description: string
  category: string
  content: string
  metadata: Record<string, unknown>
}

// 分析请求类型
export interface AnalysisRequest {
  input: {
    type: 'text' | 'url' | 'file'
    content: string
  }
  options?: Record<string, unknown>
}

export interface AnalysisResponse {
  success: boolean
  data?: AnalysisResult
  error?: string
}
