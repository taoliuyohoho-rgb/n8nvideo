/**
 * 业务层类型定义
 * 用于前端组件和业务逻辑
 */

export interface BusinessProduct {
  id: string
  name: string
  description: string
  category: string
  subcategory: string
  sellingPoints: string[]
  skuImages: string[]
  targetCountries: string[]
  painPoints: string[]
  targetAudience: string[]
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

export interface BusinessPersona {
  id: string
  name: string
  coreIdentity: PersonaCoreIdentity
  vibe: PersonaVibe
  look: PersonaLook
  communicationStyle: PersonaCommunicationStyle
  categoryId?: string
  category?: string
  subcategory?: string
  productName?: string
  createdAt: Date
  updatedAt: Date
}

export interface PersonaCoreIdentity {
  name: string
  age: number
  occupation: string
  location: string
}

export interface PersonaVibe {
  traits: string[]
  communicationStyle: string
}

export interface PersonaLook {
  age: string
  gender: string
  style: string
  ethnicity: string
}

export interface PersonaCommunicationStyle {
  tone: string
  language: string
  formality: string
}

export interface BusinessStyle {
  id: string
  name: string
  description: string
  productId?: string
  category?: string
  subcategory?: string
  tone?: string
  energy?: string
  durationSec?: number
  lines: ScriptLines
  shots: ScriptShots
  technical: ScriptTechnical
  templatePerformance?: number
  createdAt: Date
  updatedAt: Date
}

export interface ScriptLines {
  opening: string
  main: string[]
  closing: string
}

export interface ScriptShots {
  opening: string
  main: string[]
  closing: string
}

export interface ScriptTechnical {
  camera: string[]
  lighting: string[]
  audio: string[]
}

export interface BusinessUser {
  id: string
  email: string
  name: string
  role: string
  organizationId: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface BusinessUserSubmission {
  id: string
  userId: string
  type: string
  targetId?: string
  data: Record<string, unknown>
  originalData?: Record<string, unknown>
  source?: string
  sourceVideoId?: string
  sourceUrl?: string
  status?: string
  createdAt: Date
  updatedAt: Date
}

// API 响应类型
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T = unknown> extends ApiResponse<T[]> {
  pagination?: {
    page: number
    limit: number
    total: number
    hasMore: boolean
  }
}

// 表单数据类型
export interface ProductFormData {
  name: string
  description: string
  category: string
  subcategory: string
  sellingPoints: string[]
  skuImages: string[]
  targetCountries: string[]
  painPoints: string[]
  targetAudience: string[]
}

export interface PersonaFormData {
  name: string
  coreIdentity: PersonaCoreIdentity
  vibe: PersonaVibe
  look: PersonaLook
  communicationStyle: PersonaCommunicationStyle
  categoryId?: string
  category?: string
  subcategory?: string
  productName?: string
}

// 分析结果类型
export interface AnalysisResult {
  sellingPoints: string[]
  painPoints: string[]
  targetAudience: string[]
  confidence: number
  source: string
}

export interface CompetitorAnalysisResult {
  productId: string
  productName: string
  analysis: AnalysisResult
  combinedInsights: {
    sellingPoints: string[]
    painPoints: string[]
  }
  confidence: number
}

// 推荐系统类型
export interface RecommendationItem {
  id: string
  type: 'persona' | 'style' | 'prompt'
  title?: string
  summary?: string
  content?: string
  fineScore?: number
  confidence?: number
}

export interface RecommendationResponse {
  items: RecommendationItem[]
  chosenItemId: string
  alternatives: string[]
  categoryId?: string
  decisionId: string
}
