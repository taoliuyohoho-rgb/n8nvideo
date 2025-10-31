// Prompt模板输出原子能力

import { prisma } from '@/lib/prisma'
import type { OutputRequest, OutputResult, PromptTemplateOutputData } from './types'

export class PromptTemplateOutput {
  /**
   * 处理Prompt模板输出
   */
  async processOutput(request: OutputRequest): Promise<OutputResult> {
    const startTime = Date.now()

    try {
      const { analysisResult, context } = request

      // 1. 验证分析结果
      const validatedData = this.validateAnalysisResult(analysisResult)

      // 2. 生成Prompt模板
      const template = await this.generatePromptTemplate(validatedData, context)

      // 3. 保存模板到数据库
      const savedTemplate = await this.savePromptTemplate(template)

      return {
        success: true,
        data: {
          template: savedTemplate
        },
        metadata: {
          scenario: 'prompt-template',
          processedAt: new Date(),
          processingTime: Date.now() - startTime
        }
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        metadata: {
          scenario: 'prompt-template',
          processedAt: new Date(),
          processingTime: Date.now() - startTime
        },
        error: error instanceof Error ? error.message : 'Prompt模板输出处理失败'
      }
    }
  }

  /**
   * 验证分析结果
   */
  private validateAnalysisResult(analysisResult: any): any {
    const data = analysisResult.data || analysisResult

    return {
      businessModule: data.businessModule || 'product-analysis',
      content: this.validateString(data.content, '模板内容'),
      variables: this.validateVariables(data.variables || {}),
      performance: this.validateNumber(data.performance, '性能评分'),
      usageCount: this.validateNumber(data.usageCount, '使用次数'),
      isActive: this.validateBoolean(data.isActive, '是否启用')
    }
  }

  /**
   * 生成Prompt模板
   */
  private async generatePromptTemplate(data: any, context?: any): Promise<PromptTemplateOutputData> {
    const templateId = `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const name = this.generateTemplateName(data.businessModule, context)
    const content = this.generateTemplateContent(data, context)

    return {
      templateId,
      name,
      content,
      variables: data.variables,
      businessModule: data.businessModule,
      performance: data.performance,
      usageCount: data.usageCount || 0,
      isActive: data.isActive !== false,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  }

  /**
   * 生成模板名称
   */
  private generateTemplateName(businessModule: string, context?: any): string {
    const moduleNames: Record<string, string> = {
      'product-analysis': '商品分析',
      'competitor-analysis': '竞品分析',
      'video-analysis': '视频分析',
      'image-analysis': '图片分析',
      'text-analysis': '文本分析'
    }

    const baseName = moduleNames[businessModule] || '通用分析'
    const timestamp = new Date().toISOString().split('T')[0]
    
    return `${baseName}模板_${timestamp}`
  }

  /**
   * 生成模板内容
   */
  private generateTemplateContent(data: any, context?: any): string {
    const businessModule = data.businessModule || 'product-analysis'
    
    const templates: Record<string, string> = {
      'product-analysis': this.generateProductAnalysisTemplate(data, context),
      'competitor-analysis': this.generateCompetitorAnalysisTemplate(data, context),
      'video-analysis': this.generateVideoAnalysisTemplate(data, context),
      'image-analysis': this.generateImageAnalysisTemplate(data, context),
      'text-analysis': this.generateTextAnalysisTemplate(data, context)
    }

    return templates[businessModule] || this.generateGenericTemplate(data, context)
  }

  /**
   * 生成商品分析模板
   */
  private generateProductAnalysisTemplate(data: any, context?: any): string {
    return `请分析以下商品内容，提取关键信息：

商品内容：{{content}}

请按照以下JSON格式返回分析结果：
{
  "sellingPoints": ["卖点1", "卖点2", "卖点3"],
  "painPoints": ["痛点1", "痛点2", "痛点3"],
  "targetAudience": "目标受众描述",
  "keywords": ["关键词1", "关键词2", "关键词3"],
  "sentiment": "positive|negative|neutral",
  "confidence": 0.85,
  "summary": "内容摘要"
}

要求：
1. 卖点和痛点各提取3-5个最重要的
2. 目标受众要具体明确
3. 关键词要准确相关
4. 情感分析要客观准确
5. 置信度要基于分析质量给出`
  }

  /**
   * 生成竞品分析模板
   */
  private generateCompetitorAnalysisTemplate(data: any, context?: any): string {
    return `请分析以下竞品内容，提取关键信息：

竞品内容：{{content}}

请按照以下JSON格式返回分析结果：
{
  "sellingPoints": ["卖点1", "卖点2", "卖点3"],
  "painPoints": ["痛点1", "痛点2", "痛点3"],
  "targetAudience": "目标受众描述",
  "visualElements": ["视觉元素1", "视觉元素2"],
  "textElements": ["文字元素1", "文字元素2"],
  "marketInsights": ["市场洞察1", "市场洞察2"],
  "recommendations": ["建议1", "建议2"]
}

要求：
1. 重点分析竞品的营销策略
2. 识别差异化和优势点
3. 提供市场洞察和策略建议`
  }

  /**
   * 生成视频分析模板
   */
  private generateVideoAnalysisTemplate(data: any, context?: any): string {
    return `请分析以下视频内容，提取关键信息：

视频内容：{{content}}

请按照以下JSON格式返回分析结果：
{
  "frames": [
    {
      "timestamp": 0,
      "objects": [{"name": "物体名称", "confidence": 0.9}],
      "text": "帧中的文字内容"
    }
  ],
  "audio": {
    "transcript": "音频转录内容",
    "sentiment": "positive|negative|neutral",
    "language": "zh"
  },
  "summary": "视频摘要",
  "duration": 30,
  "tags": ["标签1", "标签2"]
}

要求：
1. 分析视频的关键帧内容
2. 提取音频信息
3. 生成视频摘要和标签`
  }

  /**
   * 生成图片分析模板
   */
  private generateImageAnalysisTemplate(data: any, context?: any): string {
    return `请分析以下图片内容，提取关键信息：

图片内容：{{content}}

请按照以下JSON格式返回分析结果：
{
  "objects": [
    {
      "name": "物体名称",
      "confidence": 0.9,
      "boundingBox": {"x": 0, "y": 0, "width": 100, "height": 100}
    }
  ],
  "text": "图片中的文字内容（OCR结果）",
  "colors": [{"color": "#FF0000", "percentage": 30}],
  "scene": "场景描述",
  "quality": "high|medium|low"
}

要求：
1. 识别图片中的所有重要物体
2. 提取图片中的文字内容
3. 分析主要颜色及其占比
4. 描述图片场景`
  }

  /**
   * 生成文本分析模板
   */
  private generateTextAnalysisTemplate(data: any, context?: any): string {
    return `请分析以下文本内容，提取关键信息：

文本内容：{{content}}

请按照以下JSON格式返回分析结果：
{
  "sellingPoints": ["卖点1", "卖点2", "卖点3"],
  "painPoints": ["痛点1", "痛点2", "痛点3"],
  "targetAudience": "目标受众描述",
  "keywords": ["关键词1", "关键词2", "关键词3"],
  "sentiment": "positive|negative|neutral",
  "confidence": 0.85,
  "entities": [{"text": "实体", "type": "类型", "confidence": 0.9}],
  "summary": "内容摘要"
}

要求：
1. 提取关键信息点
2. 分析情感倾向
3. 识别重要实体
4. 生成内容摘要`
  }

  /**
   * 生成通用模板
   */
  private generateGenericTemplate(data: any, context?: any): string {
    return `请分析以下内容，提取关键信息：

内容：{{content}}

请按照以下JSON格式返回分析结果：
{
  "analysis": "分析结果",
  "insights": ["洞察1", "洞察2", "洞察3"],
  "recommendations": ["建议1", "建议2"],
  "confidence": 0.85
}

要求：
1. 提供深入的分析
2. 给出实用的洞察
3. 提供可行的建议`
  }

  /**
   * 保存Prompt模板
   */
  private async savePromptTemplate(template: PromptTemplateOutputData) {
    try {
      const savedTemplate = await prisma.promptTemplate.create({
        data: {
          id: template.templateId,
          name: template.name,
          businessModule: template.businessModule,
          content: template.content,
          variables: JSON.stringify(template.variables),
          performance: template.performance,
          usageCount: template.usageCount,
          isActive: template.isActive,
          isDefault: false,
          createdBy: 'system',
          createdAt: template.createdAt,
          updatedAt: template.updatedAt
        }
      })

      return savedTemplate
    } catch (error) {
      console.error('保存Prompt模板失败:', error)
      // 返回模拟数据
      return {
        id: template.templateId,
        name: template.name,
        content: template.content,
        businessModule: template.businessModule,
        variables: template.variables,
        performance: template.performance,
        usageCount: template.usageCount,
        isActive: template.isActive,
        createdAt: template.createdAt,
        updatedAt: template.updatedAt
      }
    }
  }

  /**
   * 验证字符串数据
   */
  private validateString(str: any, fieldName: string): string {
    if (typeof str !== 'string') {
      console.warn(`${fieldName}不是字符串格式`)
      return ''
    }
    return str.trim()
  }

  /**
   * 验证数字数据
   */
  private validateNumber(num: any, fieldName: string): number {
    if (typeof num !== 'number' || isNaN(num)) {
      console.warn(`${fieldName}不是有效数字`)
      return 0
    }
    return num
  }

  /**
   * 验证布尔数据
   */
  private validateBoolean(bool: any, fieldName: string): boolean {
    if (typeof bool !== 'boolean') {
      console.warn(`${fieldName}不是布尔格式`)
      return true
    }
    return bool
  }

  /**
   * 验证变量数据
   */
  private validateVariables(variables: any): Record<string, any> {
    if (typeof variables !== 'object' || variables === null) {
      return {}
    }
    return variables
  }
}
