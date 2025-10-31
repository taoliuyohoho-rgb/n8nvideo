// 统一商品分析服务
// 整合所有商品分析相关功能，提供统一的API接口
//
// ⚠️ 警告：此服务使用旧的编排器架构，已知存在以下问题：
// 1. 竞品分析场景下无法正确提取 painPoints 和 targetAudience
// 2. this 上下文丢失导致运行时错误
// 3. 类型转换复杂且易出错
//
// 建议：
// - 竞品分析请直接使用 runCompetitorContract（src/services/ai/contracts.ts）
// - 其他场景如需使用此服务，请先验证功能正常
// - 长期计划：废弃此服务，所有场景改用 Contract 层

import { analyzeContent, getScenarioCapabilities } from './orchestration'
import { prisma } from '@/lib/prisma'
import { logger } from '@/src/services/logger/Logger'

export interface ProductAnalysisRequest {
  productId: string
  inputType: 'text' | 'image' | 'video' | 'multimodal' | 'url'
  content: string | string[] // 文本内容或图片URL数组
  context?: {
    language?: string
    businessModule?: string
    customPrompt?: string
    chosenModelId?: string
    chosenPromptId?: string
  }
  options?: {
    enableCaching?: boolean
    enableParallelProcessing?: boolean
    maxRetries?: number
  }
}

export interface ProductAnalysisResult {
  success: boolean
  data?: {
    productId: string
    analysisType: string
    insights: {
      sellingPoints: string[]
      painPoints: string[]
      targetAudience?: string
      summary?: string
      keywords?: string[]
    }
    metadata: {
      aiModelUsed?: string
      promptUsed?: string
      processingTime: number
      confidence?: number
      source: string
    }
  }
  error?: string
}

export class UnifiedProductAnalysisService {
  private readonly logger = logger.withContext({ service: 'UnifiedProductAnalysisService' })

  /**
   * 执行商品分析
   */
  async analyzeProduct(request: ProductAnalysisRequest): Promise<ProductAnalysisResult> {
    const startTime = Date.now()
    const traceId = `product-analysis-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    this.logger.info('开始商品分析', { 
      traceId, 
      productId: request.productId, 
      inputType: request.inputType 
    })

    try {
      // 1. 验证商品存在
      const product = await this.validateProduct(request.productId)
      if (!product) {
        return {
          success: false,
          error: '商品不存在'
        }
      }

      // 2. 确定分析场景
      const scenario = this.determineAnalysisScenario(request.inputType, request.content)
      
      // 3. 构建分析输入
      const analysisInput = this.buildAnalysisInput(request, scenario)
      
      // 4. 执行分析
      const analysisResult = await analyzeContent({
        input: analysisInput,
        businessScenario: scenario,
        context: {
          productId: request.productId,
          productName: product.name,
          productCategory: product.category,
          language: request.context?.language || 'zh',
          businessModule: request.context?.businessModule || 'product-analysis'
        },
        options: {
          enableCaching: request.options?.enableCaching ?? true,
          enableParallelProcessing: request.options?.enableParallelProcessing ?? true,
          maxRetries: request.options?.maxRetries ?? 3,
          chosenModelId: request.context?.chosenModelId,
          chosenPromptId: request.context?.chosenPromptId
        }
      })

      if (!analysisResult.success) {
        this.logger.error('分析失败', { traceId, error: analysisResult.error })
        return {
          success: false,
          error: analysisResult.error || '分析失败'
        }
      }

      // 5. 处理分析结果
      const processedResult = await this.processAnalysisResult(
        analysisResult.data, 
        request.productId, 
        scenario
      )

      const processingTime = Date.now() - startTime
      
      this.logger.info('商品分析完成', { 
        traceId, 
        productId: request.productId, 
        processingTime,
        insightsCount: processedResult.insights.sellingPoints.length + processedResult.insights.painPoints.length
      })

      return {
        success: true,
        data: {
          productId: request.productId,
          analysisType: scenario,
          insights: processedResult.insights,
          metadata: {
            aiModelUsed: (analysisResult.metadata as any)?.aiModelUsed,
            promptUsed: (analysisResult.metadata as any)?.promptUsed,
            processingTime,
            confidence: processedResult.confidence,
            source: 'unified-analysis'
          }
        }
      }

    } catch (error: any) {
      const processingTime = Date.now() - startTime
      this.logger.error('商品分析异常', { 
        traceId, 
        productId: request.productId, 
        error: error.message,
        processingTime
      })
      
      return {
        success: false,
        error: error.message || '分析过程中发生未知错误'
      }
    }
  }

  /**
   * 批量分析商品
   */
  async analyzeProductsBatch(requests: ProductAnalysisRequest[]): Promise<ProductAnalysisResult[]> {
    this.logger.info('开始批量商品分析', { count: requests.length })
    
    const results = await Promise.allSettled(
      requests.map(request => this.analyzeProduct(request))
    )

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value
      } else {
        this.logger.error('批量分析中单个商品分析失败', { 
          index, 
          productId: requests[index]?.productId,
          error: result.reason 
        })
        return {
          success: false,
          error: result.reason?.message || '批量分析失败'
        }
      }
    })
  }

  /**
   * 获取商品分析能力
   */
  getCapabilities() {
    return {
      supportedInputTypes: ['text', 'image', 'video', 'multimodal', 'url'],
      supportedScenarios: [
        'product-analysis',
        'competitor-analysis', 
        'text-analysis',
        'image-analysis',
        'video-analysis'
      ],
      features: [
        '智能卖点提取',
        '痛点识别',
        '目标受众分析',
        '关键词提取',
        '多模态分析',
        '竞品对比',
        '批量处理'
      ]
    }
  }

  /**
   * 验证商品存在
   */
  private async validateProduct(productId: string) {
    try {
      return await prisma.product.findUnique({
        where: { id: productId },
        select: {
          id: true,
          name: true,
          category: true,
          subcategory: true
        }
      })
    } catch (error) {
      this.logger.error('验证商品失败', { productId, error })
      return null
    }
  }

  /**
   * 确定分析场景
   */
  private determineAnalysisScenario(inputType: string, content: any): string {
    // 如果内容包含URL，优先使用竞品分析
    if (typeof content === 'string' && content.startsWith('http')) {
      return 'competitor-analysis'
    }
    
    // 根据输入类型确定场景
    switch (inputType) {
      case 'image':
        return 'image-analysis'
      case 'video':
        return 'video-analysis'
      case 'multimodal':
        return 'product-analysis'
      case 'text':
      case 'url':
      default:
        return 'product-analysis'
    }
  }

  /**
   * 构建分析输入
   */
  private buildAnalysisInput(request: ProductAnalysisRequest, scenario: string) {
    const { inputType, content } = request

    if (inputType === 'image' && Array.isArray(content)) {
      return {
        type: 'user',
        inputType: 'image',
        content: content[0] || '',
        images: content,
        metadata: {
          source: 'user',
          productId: request.productId,
          scenario
        }
      }
    }

    if (inputType === 'multimodal' && Array.isArray(content)) {
      return {
        type: 'user',
        inputType: 'multimodal',
        content: content[0] || '',
        images: content,
        metadata: {
          source: 'user',
          productId: request.productId,
          scenario
        }
      }
    }

    if (typeof content === 'string' && content.startsWith('http')) {
      return {
        type: 'scraping',
        content,
        metadata: {
          source: 'scraping',
          url: content,
          productId: request.productId,
          scenario
        }
      }
    }

    return {
      type: 'user',
      inputType: inputType as any,
      content: Array.isArray(content) ? content[0] : content,
      metadata: {
        source: 'user',
        productId: request.productId,
        scenario
      }
    }
  }

  /**
   * 处理分析结果
   */
  private async processAnalysisResult(data: any, productId: string, scenario: string) {
    // 提取洞察信息
    const insights = {
      sellingPoints: data?.combinedInsights?.sellingPoints || data?.sellingPoints || [],
      painPoints: data?.combinedInsights?.painPoints || data?.painPoints || [],
      targetAudience: data?.combinedInsights?.targetAudience || data?.targetAudience,
      summary: data?.combinedInsights?.summary || data?.summary,
      keywords: data?.combinedInsights?.keywords || data?.keywords || []
    }

    // 计算置信度
    const confidence = this.calculateConfidence(insights)

    // 可选：更新商品信息到数据库
    if (insights.sellingPoints.length > 0 || insights.painPoints.length > 0) {
      await this.updateProductInsights(productId, insights)
    }

    return {
      insights,
      confidence
    }
  }

  /**
   * 计算分析置信度
   */
  private calculateConfidence(insights: any): number {
    let score = 0
    let factors = 0

    if (insights.sellingPoints?.length > 0) {
      score += Math.min(insights.sellingPoints.length * 0.2, 0.4)
      factors++
    }

    if (insights.painPoints?.length > 0) {
      score += Math.min(insights.painPoints.length * 0.2, 0.4)
      factors++
    }

    if (insights.targetAudience) {
      score += 0.2
      factors++
    }

    if (insights.summary) {
      score += 0.1
      factors++
    }

    return factors > 0 ? Math.min(score, 1) : 0
  }

  /**
   * 更新商品洞察信息
   */
  private async updateProductInsights(productId: string, insights: any) {
    try {
      const updateData: any = {
        updatedAt: new Date()
      }

      if (insights.sellingPoints?.length > 0) {
        updateData.sellingPoints = JSON.stringify(insights.sellingPoints)
      }

      if (insights.painPoints?.length > 0) {
        updateData.painPoints = JSON.stringify(insights.painPoints)
      }

      if (insights.targetAudience) {
        updateData.targetAudience = insights.targetAudience
      }

      await prisma.product.update({
        where: { id: productId },
        data: updateData
      })

      this.logger.info('商品洞察信息已更新', { productId, updateFields: Object.keys(updateData) })
    } catch (error) {
      this.logger.error('更新商品洞察信息失败', { productId, error })
    }
  }
}

// 创建单例实例
export const unifiedProductAnalysisService = new UnifiedProductAnalysisService()

// 便捷方法
export const analyzeProduct = (request: ProductAnalysisRequest) => 
  unifiedProductAnalysisService.analyzeProduct(request)

export const analyzeProductsBatch = (requests: ProductAnalysisRequest[]) => 
  unifiedProductAnalysisService.analyzeProductsBatch(requests)

export const getProductAnalysisCapabilities = () => 
  unifiedProductAnalysisService.getCapabilities()
