// 文本分析引擎原子能力

import { AiExecutor } from '../../ai/AiExecutor'
import { recommendRank } from '../../recommendation/recommend'
import type { AnalysisRequest, TextAnalysisResult, ModelRecommendation, PromptRecommendation } from './types'

export class TextAnalysisEngine {
  private aiExecutor: AiExecutor

  constructor() {
    this.aiExecutor = new AiExecutor()
  }

  /**
   * 分析文本内容
   */
  async analyzeText(request: AnalysisRequest): Promise<TextAnalysisResult> {
    const startTime = Date.now()

    try {
      // 1. 获取模型和Prompt推荐
      const { model, prompt } = await this.getRecommendations(request)

      // 2. 构建分析提示
      const analysisPrompt = this.buildAnalysisPrompt(request, prompt)

      // 3. 调用AI分析
      const aiResponse = await this.aiExecutor.execute({
        provider: model.provider as 'gemini' | 'claude' | 'deepseek' | 'doubao',
        prompt: analysisPrompt,
        useSearch: false
      })

      // 4. 解析AI响应
      const analysisData = this.parseAIResponse(aiResponse)

      // 5. 后处理和验证
      const processedData = this.postProcessAnalysis(analysisData, request)

      return {
        success: true,
        data: processedData,
        metadata: {
          modelUsed: `${model.provider}/${model.modelId}`,
          promptUsed: prompt.name,
          processingTime: Date.now() - startTime,
          timestamp: new Date()
        }
      }
    } catch (error) {
      return {
        success: false,
        data: {
          sellingPoints: [],
          painPoints: [],
          targetAudience: '',
          keywords: [],
          sentiment: 'neutral',
          confidence: 0
        },
        metadata: {
          modelUsed: 'unknown',
          promptUsed: 'unknown',
          processingTime: Date.now() - startTime,
          timestamp: new Date()
        },
        error: error instanceof Error ? error.message : '文本分析失败'
      }
    }
  }

  /**
   * 获取模型和Prompt推荐
   */
  private async getRecommendations(request: AnalysisRequest): Promise<{
    model: ModelRecommendation
    prompt: PromptRecommendation
  }> {
    // 获取模型推荐
    const modelResult = await recommendRank({
      scenario: 'task->model',
      task: {
        taskType: 'product-analysis',
        contentType: 'text',
        language: request.context?.language || 'zh',
        jsonRequirement: true,
        budgetTier: 'mid'
      },
      context: {
        channel: 'web'
      }
    })

    // 获取Prompt推荐
    const promptResult = await recommendRank({
      scenario: 'task->prompt',
      task: {
        taskType: 'product-analysis',
        contentType: 'text',
        language: request.context?.language || 'zh',
        jsonRequirement: true,
        budgetTier: 'mid'
      },
      context: {
        channel: 'web'
      }
    })

    if (!modelResult.chosen || !promptResult.chosen) {
      throw new Error('获取推荐失败')
    }

    const model = modelResult.chosen
    const prompt = promptResult.chosen

    if (!model || !prompt) {
      throw new Error('没有可用的推荐')
    }

    return {
      model: {
        modelId: model.id,
        provider: model.title?.split('/')[0] || 'unknown',
        score: model.fineScore || model.coarseScore || 0,
        reason: model.summary || '推荐模型'
      },
      prompt: {
        promptId: prompt.id,
        name: prompt.title || 'Unknown',
        content: prompt.summary || '',
        score: prompt.fineScore || prompt.coarseScore || 0,
        reason: prompt.summary || '推荐Prompt'
      }
    }
  }

  /**
   * 构建分析提示
   */
  private buildAnalysisPrompt(request: AnalysisRequest, prompt: PromptRecommendation): string {
    // 允许通过 context.customPrompt 覆盖系统推荐的 Prompt
    let basePrompt = (request.context as Record<string, unknown>)?.customPrompt as string || prompt.content

    // 替换变量
    basePrompt = basePrompt.replace(/\{\{content\}\}/g, request.content)
    basePrompt = basePrompt.replace(/\{\{language\}\}/g, request.context?.language || 'zh')
    basePrompt = basePrompt.replace(/\{\{businessModule\}\}/g, request.context?.businessModule || 'product-analysis')
    basePrompt = basePrompt.replace(/\{\{productName\}\}/g, (request.context as Record<string, unknown>)?.productName as string || '')
    basePrompt = basePrompt.replace(/\{\{productCategory\}\}/g, (request.context as Record<string, unknown>)?.productCategory as string || '')
    // 可选变量：是否包含图片及数量
    const hasImages = Array.isArray((request as Record<string, unknown>).images) && (request as Record<string, unknown>).images.length > 0
    basePrompt = basePrompt.replace(/\{\{#if hasImages\}\}([\s\S]*?)\{\{\/if\}\}/g, hasImages ? '$1' : '')
    basePrompt = basePrompt.replace(/\{\{imageCount\}\}/g, hasImages ? String((request as Record<string, unknown>).images.length) : '0')

    // 添加特定指令
    const specificInstructions = this.getSpecificInstructions(request)
    basePrompt += '\n\n' + specificInstructions

    return basePrompt
  }

  /**
   * 获取特定指令
   */
  private getSpecificInstructions(request: AnalysisRequest): string {
    const instructions = [
      '请严格按照以下JSON格式返回分析结果：',
      '{',
      '  "sellingPoints": ["卖点1", "卖点2", "卖点3"],',
      '  "painPoints": ["痛点1", "痛点2", "痛点3"],',
      '  "targetAudience": "目标受众描述",',
      '  "keywords": ["关键词1", "关键词2", "关键词3"],',
      '  "sentiment": "positive|negative|neutral",',
      '  "confidence": 0.85,',
      '  "entities": [{"text": "实体", "type": "类型", "confidence": 0.9}],',
      '  "summary": "内容摘要"',
      '}',
      '',
      '要求：',
      '1. 卖点和痛点各提取3-5个最重要的',
      '2. 目标受众要具体明确',
      '3. 关键词要准确相关',
      '4. 情感分析要客观准确',
      '5. 置信度要基于分析质量给出',
      '6. 实体识别要准确',
      '7. 摘要要简洁明了'
    ]

    return instructions.join('\n')
  }

  /**
   * 解析AI响应
   */
  private parseAIResponse(response: string): Record<string, unknown> {
    // 1) 优先提取三引号代码块中的 JSON
    const fence = response.match(/```(?:json)?\s*([\s\S]*?)```/i)
    if (fence && fence[1]) {
      try { return JSON.parse(fence[1]) } catch {}
    }

    // 2) 直接 JSON
    try { return JSON.parse(response) } catch {}

    // 3) 宽松匹配第一个大括号块
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      try { return JSON.parse(jsonMatch[0]) } catch {}
    }

    // 4) 失败
    throw new Error('无法解析AI响应为JSON格式')
  }

  /**
   * 后处理分析结果
   */
  private postProcessAnalysis(data: Record<string, unknown>, request: AnalysisRequest): TextAnalysisResult['data'] {
    return {
      sellingPoints: this.cleanArray(data.sellingPoints || []),
      painPoints: this.cleanArray(data.painPoints || []),
      targetAudience: this.cleanString(data.targetAudience || ''),
      keywords: this.cleanArray(data.keywords || []),
      sentiment: this.validateSentiment(data.sentiment),
      confidence: this.validateConfidence(data.confidence),
      entities: this.cleanEntities(data.entities || []),
      summary: this.cleanString(data.summary || '')
    }
  }

  /**
   * 清理数组数据
   */
  private cleanArray(arr: unknown[]): string[] {
    if (!Array.isArray(arr)) return []
    
    return arr
      .filter(item => item && typeof item === 'string')
      .map(item => item.trim())
      .filter(item => item.length > 0)
      .slice(0, 10) // 限制数量
  }

  /**
   * 清理字符串数据
   */
  private cleanString(str: unknown): string {
    if (typeof str !== 'string') return ''
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
    return 0.5 // 默认置信度
  }

  /**
   * 清理实体数据
   */
  private cleanEntities(entities: unknown[]): Array<{
    text: string
    type: string
    confidence: number
  }> {
    if (!Array.isArray(entities)) return []
    
    return entities
      .filter(entity => 
        entity && 
        typeof entity === 'object' &&
        typeof entity.text === 'string' &&
        typeof entity.type === 'string'
      )
      .map(entity => ({
        text: entity.text.trim(),
        type: entity.type.trim(),
        confidence: this.validateConfidence(entity.confidence)
      }))
      .slice(0, 20) // 限制数量
  }
}
