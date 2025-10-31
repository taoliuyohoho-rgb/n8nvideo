// 数据分析层类型定义

export interface AnalysisRequest {
  content: string
  images?: string[]
  type: 'text' | 'image' | 'video' | 'multimodal'
  context?: {
    productId?: string
    businessModule?: string
    language?: string
    [key: string]: any
  }
}

export interface AnalysisResult {
  success: boolean
  data: {
    sellingPoints?: string[]
    painPoints?: string[]
    targetAudience?: string
    keywords?: string[]
    sentiment?: 'positive' | 'negative' | 'neutral'
    confidence?: number
    [key: string]: any
  }
  metadata: {
    modelUsed: string
    promptUsed: string
    processingTime: number
    timestamp: Date
    [key: string]: any
  }
  error?: string
}

export interface TextAnalysisResult extends AnalysisResult {
  data: {
    sellingPoints: string[]
    painPoints: string[]
    targetAudience: string
    keywords: string[]
    sentiment: 'positive' | 'negative' | 'neutral'
    confidence: number
    entities?: Array<{
      text: string
      type: string
      confidence: number
    }>
    summary?: string
  }
}

export interface ImageAnalysisResult extends AnalysisResult {
  data: {
    objects: Array<{
      name: string
      confidence: number
      boundingBox?: {
        x: number
        y: number
        width: number
        height: number
      }
    }>
    text?: string // OCR结果
    colors?: Array<{
      color: string
      percentage: number
    }>
    scene?: string
    quality: 'high' | 'medium' | 'low'
  }
}

export interface VideoAnalysisResult extends AnalysisResult {
  data: {
    frames: Array<{
      timestamp: number
      objects: Array<{
        name: string
        confidence: number
      }>
      text?: string
    }>
    audio?: {
      transcript?: string
      sentiment?: 'positive' | 'negative' | 'neutral'
      language?: string
    }
    summary: string
    duration: number
  }
}

export interface MultimodalAnalysisResult extends AnalysisResult {
  data: {
    textAnalysis: TextAnalysisResult['data']
    imageAnalysis: ImageAnalysisResult['data']
    combinedInsights: {
      sellingPoints: string[]
      painPoints: string[]
      targetAudience: string
      visualElements: string[]
      textElements: string[]
    }
  }
}

export interface ModelRecommendation {
  modelId: string
  provider: string
  score: number
  reason: string
  parameters?: Record<string, any>
}

export interface PromptRecommendation {
  promptId: string
  name: string
  content: string
  score: number
  reason: string
  variables?: Record<string, any>
}
