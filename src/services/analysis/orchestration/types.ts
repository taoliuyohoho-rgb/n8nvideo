// 编排层类型定义

export interface AnalysisOrchestrationRequest {
  input: {
    type: 'text' | 'image' | 'video' | 'multimodal'
    content: string | string[]
    metadata?: Record<string, any>
  }
  businessScenario: 'product-analysis' | 'competitor-analysis' | 'video-analysis' | 'image-analysis' | 'text-analysis' | 'generic'
  context?: {
    productId?: string
    userId?: string
    sessionId?: string
    language?: string
    businessModule?: string
    [key: string]: any
  }
  options?: {
    enableCaching?: boolean
    enableParallelProcessing?: boolean
    maxRetries?: number
    timeout?: number
    [key: string]: any
  }
}

export interface AnalysisOrchestrationResult {
  success: boolean
  data: any
  metadata: {
    scenario: string
    processingTime: number
    steps: Array<{
      step: string
      duration: number
      success: boolean
      error?: string
    }>
    timestamp: Date
  }
  error?: string
}

export interface OrchestrationStep {
  name: string
  execute: (request: AnalysisOrchestrationRequest) => Promise<any>
  dependencies?: string[]
  optional?: boolean
}

export interface OrchestrationPipeline {
  steps: OrchestrationStep[]
  execute: (request: AnalysisOrchestrationRequest) => Promise<AnalysisOrchestrationResult>
}
