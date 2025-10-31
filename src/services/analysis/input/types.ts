// 数据输入层类型定义

export interface InputData {
  type: 'text' | 'image' | 'video' | 'url' | 'file'
  content: string | Buffer
  metadata?: {
    filename?: string
    mimeType?: string
    size?: number
    encoding?: string
    [key: string]: any
  }
}

export interface UserInputData extends InputData {
  source: 'user'
  userId?: string
  sessionId?: string
}

export interface WebScrapingData extends InputData {
  source: 'scraping'
  url: string
  platform?: string
  scrapedAt: Date
  headers?: Record<string, string>
}

export interface AIGeneratedData extends InputData {
  source: 'ai'
  model?: string
  prompt?: string
  generatedAt: Date
  parameters?: Record<string, any>
}

export interface NormalizedInput {
  type: 'text' | 'image' | 'video' | 'multimodal'
  content: string
  images?: string[]
  metadata: {
    originalType: string
    source: 'user' | 'scraping' | 'ai'
    processedAt: Date
    quality?: 'high' | 'medium' | 'low'
    [key: string]: any
  }
}

export interface InputValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  suggestions?: string[]
}
