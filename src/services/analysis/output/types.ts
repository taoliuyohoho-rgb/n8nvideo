// 数据输出层类型定义

export interface OutputRequest {
  analysisResult: unknown
  businessScenario: 'product-analysis' | 'prompt-template' | 'competitor-analysis' | 'video-analysis' | 'generic'
  context?: {
    productId?: string
    userId?: string
    sessionId?: string
    competitorId?: string
    videoId?: string
    imageId?: string
    textId?: string
    analysisId?: string
    [key: string]: unknown
  }
}

export interface OutputResult {
  success: boolean
  data: ProductAnalysisOutputData | PromptTemplateOutputData | CompetitorAnalysisOutputData | VideoAnalysisOutputData | GenericAnalysisOutputData | null
  metadata: {
    scenario: string
    processedAt: Date
    processingTime: number
    [key: string]: unknown
  }
  error?: string
}

export interface ProductAnalysisOutputData {
  productId: string
  sellingPoints: string[]
  painPoints: string[]
  targetAudience: string
  keywords: string[]
  sentiment: 'positive' | 'negative' | 'neutral'
  confidence: number
  entities: Array<{
    text: string
    type: string
    confidence: number
  }>
  summary: string
  updatedAt: Date
}

export interface PromptTemplateOutputData {
  templateId: string
  name: string
  content: string
  variables: Record<string, unknown>
  businessModule: string
  performance?: number
  usageCount: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface CompetitorAnalysisOutputData {
  competitorId: string
  productId: string
  sellingPoints: string[]
  painPoints: string[]
  targetAudience: string
  visualElements: string[]
  textElements: string[]
  marketInsights: string[]
  recommendations: string[]
  analyzedAt: Date
}

export interface VideoAnalysisOutputData {
  videoId: string
  frames: Array<{
    timestamp: number
    objects: Array<{
      name: string
      confidence: number
    }>
    text?: string
  }>
  audio: {
    transcript: string
    sentiment: 'positive' | 'negative' | 'neutral'
    language: string
  }
  summary: string
  duration: number
  tags: string[]
  quality: 'high' | 'medium' | 'low'
  analyzedAt: Date
}

export interface GenericAnalysisOutputData {
  analysisId: string
  type: string | 'text' | 'image' | 'video' | 'multimodal'
  result: Record<string, unknown>
  metadata: Record<string, unknown>
  createdAt: Date
}
