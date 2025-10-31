// 图片分析引擎原子能力

import { AiExecutor } from '../../ai/AiExecutor'
import { recommendRank } from '../../recommendation/recommend'
import type { AnalysisRequest, ImageAnalysisResult, ModelRecommendation, PromptRecommendation } from './types'

export class ImageAnalysisEngine {
  private aiExecutor: AiExecutor

  constructor() {
    this.aiExecutor = new AiExecutor()
  }

  /**
   * 分析图片内容
   */
  async analyzeImage(request: AnalysisRequest): Promise<ImageAnalysisResult> {
    const startTime = Date.now()

    try {
      // 1. 获取模型和Prompt推荐
      const { model, prompt } = await this.getRecommendations(request)

      // 2. 构建分析提示
      const analysisPrompt = this.buildAnalysisPrompt(request, prompt)

      // 3. 调用AI分析
      const aiResponse = await this.aiExecutor.execute({
        provider: model.provider as any,
        prompt: analysisPrompt,
        useSearch: false,
        images: [`data:image/jpeg;base64,${request.content}`]
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
          objects: [],
          text: '',
          colors: [],
          scene: '',
          quality: 'low'
        },
        metadata: {
          modelUsed: 'unknown',
          promptUsed: 'unknown',
          processingTime: Date.now() - startTime,
          timestamp: new Date()
        },
        error: error instanceof Error ? error.message : '图片分析失败'
      }
    }
  }

  /**
   * 批量分析多张图片
   */
  async analyzeImages(request: AnalysisRequest): Promise<ImageAnalysisResult[]> {
    if (!request.images || request.images.length === 0) {
      return []
    }

    const results: ImageAnalysisResult[] = []
    
    for (const image of request.images) {
      const imageRequest: AnalysisRequest = {
        ...request,
        content: image,
        type: 'image'
      }
      
      try {
        const result = await this.analyzeImage(imageRequest)
        results.push(result)
      } catch (error) {
        console.warn(`图片分析失败:`, error)
        // 继续处理其他图片
      }
    }

    return results
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
        contentType: 'image',
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
        taskType: 'image-analysis',
        contentType: 'image',
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
    let basePrompt = prompt.content

    // 替换变量
    basePrompt = basePrompt.replace(/\{\{language\}\}/g, request.context?.language || 'zh')
    basePrompt = basePrompt.replace(/\{\{businessModule\}\}/g, request.context?.businessModule || 'image-analysis')

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
      '请分析这张图片并严格按照以下JSON格式返回结果：',
      '{',
      '  "objects": [',
      '    {',
      '      "name": "物体名称",',
      '      "confidence": 0.9,',
      '      "boundingBox": {"x": 0, "y": 0, "width": 100, "height": 100}',
      '    }',
      '  ],',
      '  "text": "图片中的文字内容（OCR结果）",',
      '  "colors": [',
      '    {"color": "#FF0000", "percentage": 30}',
      '  ],',
      '  "scene": "场景描述",',
      '  "quality": "high|medium|low"',
      '}',
      '',
      '要求：',
      '1. 识别图片中的所有重要物体',
      '2. 提取图片中的文字内容',
      '3. 分析主要颜色及其占比',
      '4. 描述图片场景',
      '5. 评估图片质量',
      '6. 如果是商品图片，重点分析商品特征',
      '7. 如果是广告图片，分析营销元素'
    ]

    return instructions.join('\n')
  }

  /**
   * 解析AI响应
   */
  private parseAIResponse(response: string): any {
    try {
      // 尝试直接解析JSON
      return JSON.parse(response)
    } catch (error) {
      // 尝试提取JSON部分
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
      
      // 如果都失败，返回默认结构
      throw new Error('无法解析AI响应为JSON格式')
    }
  }

  /**
   * 后处理分析结果
   */
  private postProcessAnalysis(data: any, request: AnalysisRequest): ImageAnalysisResult['data'] {
    return {
      objects: this.cleanObjects(data.objects || []),
      text: this.cleanString(data.text || ''),
      colors: this.cleanColors(data.colors || []),
      scene: this.cleanString(data.scene || ''),
      quality: this.validateQuality(data.quality)
    }
  }

  /**
   * 清理物体数据
   */
  private cleanObjects(objects: any[]): Array<{
    name: string
    confidence: number
    boundingBox?: {
      x: number
      y: number
      width: number
      height: number
    }
  }> {
    if (!Array.isArray(objects)) return []
    
    return objects
      .filter(obj => 
        obj && 
        typeof obj === 'object' &&
        typeof obj.name === 'string'
      )
      .map(obj => ({
        name: obj.name.trim(),
        confidence: this.validateConfidence(obj.confidence),
        boundingBox: this.validateBoundingBox(obj.boundingBox)
      }))
      .filter(obj => obj.confidence > 0.3) // 过滤低置信度结果
      .slice(0, 20) // 限制数量
  }

  /**
   * 清理颜色数据
   */
  private cleanColors(colors: any[]): Array<{
    color: string
    percentage: number
  }> {
    if (!Array.isArray(colors)) return []
    
    return colors
      .filter(color => 
        color && 
        typeof color === 'object' &&
        typeof color.color === 'string' &&
        typeof color.percentage === 'number'
      )
      .map(color => ({
        color: this.validateColor(color.color),
        percentage: Math.max(0, Math.min(100, color.percentage))
      }))
      .filter(color => color.percentage > 5) // 过滤占比太小的颜色
      .slice(0, 10) // 限制数量
  }

  /**
   * 清理字符串数据
   */
  private cleanString(str: any): string {
    if (typeof str !== 'string') return ''
    return str.trim()
  }

  /**
   * 验证置信度
   */
  private validateConfidence(confidence: any): number {
    if (typeof confidence === 'number' && confidence >= 0 && confidence <= 1) {
      return confidence
    }
    return 0.5 // 默认置信度
  }

  /**
   * 验证边界框
   */
  private validateBoundingBox(bbox: any): {
    x: number
    y: number
    width: number
    height: number
  } | undefined {
    if (!bbox || typeof bbox !== 'object') return undefined
    
    const { x, y, width, height } = bbox
    
    if (
      typeof x === 'number' && x >= 0 &&
      typeof y === 'number' && y >= 0 &&
      typeof width === 'number' && width > 0 &&
      typeof height === 'number' && height > 0
    ) {
      return { x, y, width, height }
    }
    
    return undefined
  }

  /**
   * 验证颜色格式
   */
  private validateColor(color: string): string {
    // 检查是否为有效的颜色格式
    const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
    if (colorRegex.test(color)) {
      return color.toUpperCase()
    }
    
    // 如果不是十六进制格式，返回默认颜色
    return '#000000'
  }

  /**
   * 验证质量等级
   */
  private validateQuality(quality: any): 'high' | 'medium' | 'low' {
    if (typeof quality === 'string') {
      const normalized = quality.toLowerCase()
      if (['high', 'medium', 'low'].includes(normalized)) {
        return normalized as 'high' | 'medium' | 'low'
      }
    }
    return 'medium' // 默认质量
  }
}
