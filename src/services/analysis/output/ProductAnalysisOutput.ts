// 商品分析输出原子能力

import { prisma } from '@/lib/prisma'
import type { OutputRequest, OutputResult, ProductAnalysisOutputData } from './types'

export class ProductAnalysisOutput {
  /**
   * 处理商品分析输出
   */
  async processOutput(request: OutputRequest): Promise<OutputResult> {
    const startTime = Date.now()

    try {
      const { analysisResult, context } = request
      const productId = context?.productId

      if (!productId) {
        throw new Error('商品ID不能为空')
      }

      // 1. 验证分析结果
      const validatedData = this.validateAnalysisResult(analysisResult, productId)

      // 2. 更新商品信息到数据库
      await this.updateProduct(productId, validatedData)

      // 3. 创建分析记录（可选，用于审计）
      await this.createAnalysisRecord(productId, validatedData, analysisResult)

      // 4. 返回标准化的商品分析输出数据
      return {
        success: true,
        data: validatedData,
        metadata: {
          scenario: 'product-analysis',
          processedAt: new Date(),
          processingTime: Date.now() - startTime
        }
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        metadata: {
          scenario: 'product-analysis',
          processedAt: new Date(),
          processingTime: Date.now() - startTime
        },
        error: error instanceof Error ? error.message : '商品分析输出处理失败'
      }
    }
  }

  /**
   * 验证分析结果
   */
  private validateAnalysisResult(analysisResult: unknown, productId: string): ProductAnalysisOutputData {
    if (!analysisResult || typeof analysisResult !== 'object') {
      throw new Error('分析结果格式无效')
    }
    const result = analysisResult as Record<string, unknown>
    const data = (result.data || result) as Record<string, unknown>

    return {
      productId,
      sellingPoints: this.validateArray(data.sellingPoints, '卖点'),
      painPoints: this.validateArray(data.painPoints, '痛点'),
      targetAudience: this.validateString(data.targetAudience, '目标受众'),
      keywords: this.validateArray(data.keywords, '关键词'),
      sentiment: this.validateSentiment(data.sentiment),
      confidence: this.validateConfidence(data.confidence),
      entities: this.validateEntities(Array.isArray(data.entities) ? data.entities : []),
      summary: this.validateString(data.summary, '摘要'),
      updatedAt: new Date()
    }
  }

  /**
   * 更新商品信息
   */
  private async updateProduct(productId: string, data: ProductAnalysisOutputData) {
    // 获取现有商品信息
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        sellingPoints: true,
        painPoints: true,
        targetAudience: true
      }
    })

    if (!existingProduct) {
      throw new Error('商品不存在')
    }

    // 合并现有数据和新数据
    const existingSellingPoints = this.parseJsonArray(existingProduct.sellingPoints)
    const existingPainPoints = this.parseJsonArray(existingProduct.painPoints)
    const existingTargetAudience = this.parseJsonArray(existingProduct.targetAudience)

    const mergedSellingPoints = this.mergeArrays(existingSellingPoints, data.sellingPoints)
    const mergedPainPoints = this.mergeArrays(existingPainPoints, data.painPoints)
    const mergedTargetAudience = this.mergeArrays(existingTargetAudience, [data.targetAudience])

    // 更新商品
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        sellingPoints: JSON.stringify(mergedSellingPoints),
        painPoints: JSON.stringify(mergedPainPoints),
        targetAudience: JSON.stringify(mergedTargetAudience),
        updatedAt: new Date()
      }
    })

    return updatedProduct
  }

  /**
   * 创建分析记录
   */
  private async createAnalysisRecord(
    productId: string, 
    data: ProductAnalysisOutputData, 
    originalResult: unknown
  ) {
    // 这里可以创建分析历史记录
    // 目前返回模拟数据
    return {
      id: `analysis_${Date.now()}`,
      productId,
      type: 'product-analysis' as const,
      result: data,
      originalResult,
      createdAt: new Date()
    }
  }

  /**
   * 验证数组数据
   */
  private validateArray(arr: unknown, fieldName: string): string[] {
    if (!Array.isArray(arr)) {
      console.warn(`${fieldName}不是数组格式`)
      return []
    }

    return arr
      .filter(item => typeof item === 'string' && item.trim().length > 0)
      .map(item => item.trim())
      .slice(0, 20) // 限制数量
  }

  /**
   * 验证字符串数据
   */
  private validateString(str: unknown, fieldName: string): string {
    if (typeof str !== 'string') {
      console.warn(`${fieldName}不是字符串格式`)
      return ''
    }

    return str.trim()
  }

  /**
   * 验证情感分析结果
   */
  private validateSentiment(sentiment: unknown): 'positive' | 'negative' | 'neutral' {
    if (typeof sentiment === 'string') {
      const normalized = sentiment.toLowerCase()
      if (['positive', 'negative', 'neutral'].includes(normalized)) {
        return normalized as 'positive' | 'negative' | 'neutral'
      }
    }
    return 'neutral'
  }

  /**
   * 验证置信度
   */
  private validateConfidence(confidence: unknown): number {
    if (typeof confidence === 'number' && confidence >= 0 && confidence <= 1) {
      return confidence
    }
    return 0.5
  }

  /**
   * 验证实体数据
   */
  private validateEntities(entities: unknown[]): Array<{
    text: string
    type: string
    confidence: number
  }> {
    if (!Array.isArray(entities)) return []

    return entities
      .filter((entity): entity is { text: string; type: string; confidence?: unknown } => 
        entity !== null && 
        typeof entity === 'object' &&
        'text' in entity &&
        'type' in entity &&
        typeof entity.text === 'string' &&
        typeof entity.type === 'string'
      )
      .map(entity => ({
        text: entity.text.trim(),
        type: entity.type.trim(),
        confidence: this.validateConfidence(entity.confidence)
      }))
      .slice(0, 50) // 限制数量
  }

  /**
   * 解析JSON数组
   */
  private parseJsonArray(data: unknown): string[] {
    if (Array.isArray(data)) {
      return data.filter(item => typeof item === 'string')
    }
    
    if (typeof data === 'string') {
      try {
        const parsed = JSON.parse(data)
        return Array.isArray(parsed) ? parsed.filter(item => typeof item === 'string') : []
      } catch {
        return []
      }
    }
    
    return []
  }

  /**
   * 合并数组数据
   */
  private mergeArrays(existing: string[], newItems: string[]): string[] {
    const combined = [...existing, ...newItems]
    const unique = Array.from(new Set(combined))
    return unique.slice(0, 50) // 限制总数量
  }
}
