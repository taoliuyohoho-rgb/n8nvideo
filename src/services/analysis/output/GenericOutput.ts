// 通用输出原子能力

import type { OutputRequest, OutputResult, GenericAnalysisOutputData } from './types'

export class GenericOutput {
  /**
   * 处理通用分析输出
   */
  async processOutput(request: OutputRequest): Promise<OutputResult> {
    const startTime = Date.now()
    const { analysisResult, context } = request
    // 优先使用编排层传入的业务场景；兼容旧逻辑从 context 读取
    const businessScenario = request.businessScenario || (context?.businessScenario as string) || 'generic'

    try {

      // 1. 验证分析结果
      const validatedData = this.validateAnalysisResult(analysisResult)

      // 2. 根据业务场景格式化输出
      const formattedData = this.formatOutputByScenario(validatedData, businessScenario, context)

      // 3. 生成通用输出数据
      const outputData = this.generateGenericOutput(formattedData, businessScenario, context)

      return {
        success: true,
        data: outputData,
        metadata: {
          scenario: businessScenario,
          processedAt: new Date(),
          processingTime: Date.now() - startTime
        }
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        metadata: {
          scenario: businessScenario,
          processedAt: new Date(),
          processingTime: Date.now() - startTime
        },
        error: error instanceof Error ? error.message : '通用输出处理失败'
      }
    }
  }

  /**
   * 验证分析结果
   */
  private validateAnalysisResult(analysisResult: unknown): Record<string, unknown> {
    if (!analysisResult || typeof analysisResult !== 'object') {
      throw new Error('分析结果格式无效')
    }

    const result = analysisResult as Record<string, unknown>
    return {
      type: result.type || 'unknown',
      result: result.data || result.result || result,
      metadata: result.metadata || {},
      success: result.success !== false
    }
  }

  /**
   * 根据业务场景格式化输出
   */
  private formatOutputByScenario(data: Record<string, unknown>, scenario: string, context?: Record<string, unknown>): Record<string, unknown> {
    const formatters: Record<string, (data: Record<string, unknown>, context?: Record<string, unknown>) => Record<string, unknown>> = {
      'product-analysis': this.formatProductAnalysis.bind(this),
      'competitor-analysis': this.formatCompetitorAnalysis.bind(this),
      'video-analysis': this.formatVideoAnalysis.bind(this),
      'image-analysis': this.formatImageAnalysis.bind(this),
      'text-analysis': this.formatTextAnalysis.bind(this),
      'generic': this.formatGeneric.bind(this)
    }

    const formatter = formatters[scenario] || formatters['generic']
    return formatter(data, context)
  }

  /**
   * 格式化商品分析结果
   */
  private formatProductAnalysis(data: Record<string, unknown>, context?: Record<string, unknown>): Record<string, unknown> {
    const result = (data.result || {}) as Record<string, unknown>
    
    return {
      productId: context?.productId || 'unknown',
      sellingPoints: this.ensureArray(result.sellingPoints),
      painPoints: this.ensureArray(result.painPoints),
      targetAudience: this.ensureString(result.targetAudience),
      keywords: this.ensureArray(result.keywords),
      sentiment: this.ensureSentiment(result.sentiment),
      confidence: this.ensureNumber(result.confidence),
      summary: this.ensureString(result.summary),
      entities: this.ensureArray(result.entities),
      timestamp: new Date()
    }
  }

  /**
   * 格式化竞品分析结果
   */
  private formatCompetitorAnalysis(data: Record<string, unknown>, context?: Record<string, unknown>): Record<string, unknown> {
    const result = (data.result || {}) as Record<string, unknown>
    
    return {
      competitorId: context?.competitorId || 'unknown',
      productId: context?.productId || 'unknown',
      sellingPoints: this.ensureArray(result.sellingPoints),
      painPoints: this.ensureArray(result.painPoints),
      targetAudience: this.ensureString(result.targetAudience),
      visualElements: this.ensureArray(result.visualElements),
      textElements: this.ensureArray(result.textElements),
      marketInsights: this.ensureArray(result.marketInsights),
      recommendations: this.ensureArray(result.recommendations),
      timestamp: new Date()
    }
  }

  /**
   * 格式化视频分析结果
   */
  private formatVideoAnalysis(data: Record<string, unknown>, context?: Record<string, unknown>): Record<string, unknown> {
    const result = (data.result || {}) as Record<string, unknown>
    const audio = (result.audio || {}) as Record<string, unknown>
    
    return {
      videoId: context?.videoId || 'unknown',
      frames: this.ensureArray(result.frames),
      audio: {
        transcript: this.ensureString(audio.transcript),
        sentiment: this.ensureSentiment(audio.sentiment),
        language: this.ensureString(audio.language)
      },
      summary: this.ensureString(result.summary),
      duration: this.ensureNumber(result.duration),
      tags: this.ensureArray(result.tags),
      quality: this.ensureQuality(result.quality),
      timestamp: new Date()
    }
  }

  /**
   * 格式化图片分析结果
   */
  private formatImageAnalysis(data: Record<string, unknown>, context?: Record<string, unknown>): Record<string, unknown> {
    const result = (data.result || {}) as Record<string, unknown>
    
    return {
      imageId: context?.imageId || 'unknown',
      objects: this.ensureArray(result.objects),
      text: this.ensureString(result.text),
      colors: this.ensureArray(result.colors),
      scene: this.ensureString(result.scene),
      quality: this.ensureQuality(result.quality),
      timestamp: new Date()
    }
  }

  /**
   * 格式化文本分析结果
   */
  private formatTextAnalysis(data: Record<string, unknown>, context?: Record<string, unknown>): Record<string, unknown> {
    const result = (data.result || {}) as Record<string, unknown>
    
    return {
      textId: context?.textId || 'unknown',
      sellingPoints: this.ensureArray(result.sellingPoints),
      painPoints: this.ensureArray(result.painPoints),
      targetAudience: this.ensureString(result.targetAudience),
      keywords: this.ensureArray(result.keywords),
      sentiment: this.ensureSentiment(result.sentiment),
      confidence: this.ensureNumber(result.confidence),
      entities: this.ensureArray(result.entities),
      summary: this.ensureString(result.summary),
      timestamp: new Date()
    }
  }

  /**
   * 格式化通用结果
   */
  private formatGeneric(data: Record<string, unknown>, context?: Record<string, unknown>): Record<string, unknown> {
    const metadata = (data.metadata || {}) as Record<string, unknown>
    return {
      analysisId: context?.analysisId || `analysis_${Date.now()}`,
      type: data.type || 'unknown',
      result: data.result || {},
      metadata: {
        ...metadata,
        processedAt: new Date(),
        context: context || {}
      },
      timestamp: new Date()
    }
  }

  /**
   * 生成通用输出数据
   */
  private generateGenericOutput(formattedData: Record<string, unknown>, scenario: string, context?: Record<string, unknown>): GenericAnalysisOutputData {
    return {
      analysisId: (context?.analysisId as string) || `analysis_${Date.now()}`,
      type: (formattedData.type as string) || 'generic',
      result: formattedData,
      metadata: {
        scenario,
        context: context || {},
        processedAt: new Date()
      },
      createdAt: new Date()
    }
  }

  /**
   * 确保数据为数组
   */
  private ensureArray(data: unknown): unknown[] {
    if (Array.isArray(data)) {
      return data
    }
    if (typeof data === 'string' && data.trim()) {
      return [data.trim()]
    }
    return []
  }

  /**
   * 确保数据为字符串
   */
  private ensureString(data: unknown): string {
    if (typeof data === 'string') {
      return data.trim()
    }
    if (typeof data === 'number') {
      return data.toString()
    }
    return ''
  }

  /**
   * 确保数据为数字
   */
  private ensureNumber(data: unknown): number {
    if (typeof data === 'number' && !isNaN(data)) {
      return data
    }
    if (typeof data === 'string') {
      const parsed = parseFloat(data)
      if (!isNaN(parsed)) {
        return parsed
      }
    }
    return 0
  }

  /**
   * 确保情感数据有效
   */
  private ensureSentiment(data: unknown): 'positive' | 'negative' | 'neutral' {
    if (typeof data === 'string') {
      const normalized = data.toLowerCase()
      if (['positive', 'negative', 'neutral'].includes(normalized)) {
        return normalized as 'positive' | 'negative' | 'neutral'
      }
    }
    return 'neutral'
  }

  /**
   * 确保质量数据有效
   */
  private ensureQuality(data: unknown): 'high' | 'medium' | 'low' {
    if (typeof data === 'string') {
      const normalized = data.toLowerCase()
      if (['high', 'medium', 'low'].includes(normalized)) {
        return normalized as 'high' | 'medium' | 'low'
      }
    }
    return 'medium'
  }
}
