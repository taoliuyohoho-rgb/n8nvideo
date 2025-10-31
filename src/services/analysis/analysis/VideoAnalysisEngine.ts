// 视频分析引擎原子能力

import { AiExecutor } from '../../ai/AiExecutor'
import { recommendRank } from '../../recommendation/recommend'
import type { AnalysisRequest, VideoAnalysisResult, ModelRecommendation, PromptRecommendation } from './types'

export class VideoAnalysisEngine {
  private aiExecutor: AiExecutor

  constructor() {
    this.aiExecutor = new AiExecutor()
  }

  /**
   * 分析视频内容
   */
  async analyzeVideo(request: AnalysisRequest): Promise<VideoAnalysisResult> {
    const startTime = Date.now()

    try {
      // 1. 获取模型和Prompt推荐
      const { model, prompt } = await this.getRecommendations(request)

      // 2. 提取关键帧
      const keyFrames = await this.extractKeyFrames(request.content)

      // 3. 分析关键帧
      const frameAnalyses = await this.analyzeKeyFrames(keyFrames, model, prompt)

      // 4. 分析音频（如果有）
      const audioAnalysis = await this.analyzeAudio(request.content)

      // 5. 综合分析结果
      const combinedAnalysis = this.combineAnalysisResults(frameAnalyses, audioAnalysis)

      return {
        success: true,
        data: combinedAnalysis,
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
          frames: [],
          audio: {
            transcript: '',
            sentiment: 'neutral',
            language: 'zh'
          },
          summary: '',
          duration: 0
        },
        metadata: {
          modelUsed: 'unknown',
          promptUsed: 'unknown',
          processingTime: Date.now() - startTime,
          timestamp: new Date()
        },
        error: error instanceof Error ? error.message : '视频分析失败'
      }
    }
  }

  /**
   * 提取关键帧
   */
  private async extractKeyFrames(videoContent: string): Promise<Array<{
    timestamp: number
    frameData: string
  }>> {
    // 这里应该调用视频处理服务提取关键帧
    // 目前返回模拟数据
    return [
      {
        timestamp: 0,
        frameData: videoContent // 假设第一个关键帧就是视频内容
      },
      {
        timestamp: 5,
        frameData: videoContent
      },
      {
        timestamp: 10,
        frameData: videoContent
      }
    ]
  }

  /**
   * 分析关键帧
   */
  private async analyzeKeyFrames(
    keyFrames: Array<{ timestamp: number; frameData: string }>,
    model: ModelRecommendation,
    prompt: PromptRecommendation
  ): Promise<Array<{
    timestamp: number
    objects: Array<{
      name: string
      confidence: number
    }>
    text?: string
  }>> {
    const analyses = []

    for (const frame of keyFrames) {
      try {
        const analysisPrompt = this.buildFrameAnalysisPrompt(prompt)
        
        const aiResponse = await this.aiExecutor.execute({
          provider: model.provider as any,
          prompt: analysisPrompt,
          useSearch: false,
          images: [`data:image/jpeg;base64,${frame.frameData}`]
        })

        const analysisData = this.parseFrameAnalysis(aiResponse)
        analyses.push({
          timestamp: frame.timestamp,
          objects: analysisData.objects || [],
          text: analysisData.text || ''
        })
      } catch (error) {
        console.warn(`关键帧分析失败 (${frame.timestamp}s):`, error)
        analyses.push({
          timestamp: frame.timestamp,
          objects: [],
          text: ''
        })
      }
    }

    return analyses
  }

  /**
   * 分析音频
   */
  private async analyzeAudio(videoContent: string): Promise<{
    transcript?: string
    sentiment?: 'positive' | 'negative' | 'neutral'
    language?: string
  }> {
    // 这里应该调用音频处理服务
    // 目前返回模拟数据
    return {
      transcript: '这是视频的音频转录内容',
      sentiment: 'neutral',
      language: 'zh'
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
        contentType: 'video',
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
        taskType: 'video-analysis',
        contentType: 'video',
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
   * 构建帧分析提示
   */
  private buildFrameAnalysisPrompt(prompt: PromptRecommendation): string {
    const basePrompt = prompt.content

    // 添加特定指令
    const specificInstructions = [
      '请分析这个视频帧并严格按照以下JSON格式返回结果：',
      '{',
      '  "objects": [',
      '    {',
      '      "name": "物体名称",',
      '      "confidence": 0.9',
      '    }',
      '  ],',
      '  "text": "帧中的文字内容"',
      '}',
      '',
      '要求：',
      '1. 识别帧中的所有重要物体',
      '2. 提取帧中的文字内容',
      '3. 如果是商品视频，重点分析商品特征',
      '4. 如果是广告视频，分析营销元素'
    ]

    return basePrompt + '\n\n' + specificInstructions.join('\n')
  }

  /**
   * 解析帧分析结果
   */
  private parseFrameAnalysis(response: string): any {
    try {
      return JSON.parse(response)
    } catch (error) {
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
      return { objects: [], text: '' }
    }
  }

  /**
   * 综合分析结果
   */
  private combineAnalysisResults(
    frameAnalyses: Array<{
      timestamp: number
      objects: Array<{ name: string; confidence: number }>
      text?: string
    }>,
    audioAnalysis: {
      transcript?: string
      sentiment?: 'positive' | 'negative' | 'neutral'
      language?: string
    }
  ): VideoAnalysisResult['data'] {
    // 合并所有帧的物体
    const allObjects = frameAnalyses.flatMap(frame => 
      frame.objects.map(obj => ({
        ...obj,
        timestamp: frame.timestamp
      }))
    )

    // 合并所有帧的文字
    const allTexts = frameAnalyses
      .map(frame => frame.text)
      .filter(text => text && text.trim().length > 0)
      .join(' ')

    // 生成视频摘要
    const summary = this.generateVideoSummary(frameAnalyses, audioAnalysis)

    return {
      frames: frameAnalyses,
      audio: {
        transcript: audioAnalysis.transcript || '',
        sentiment: audioAnalysis.sentiment || 'neutral',
        language: audioAnalysis.language || 'zh'
      },
      summary,
      duration: this.calculateDuration(frameAnalyses)
    }
  }

  /**
   * 生成视频摘要
   */
  private generateVideoSummary(
    frameAnalyses: Array<{
      timestamp: number
      objects: Array<{ name: string; confidence: number }>
      text?: string
    }>,
    audioAnalysis: {
      transcript?: string
      sentiment?: 'positive' | 'negative' | 'neutral'
      language?: string
    }
  ): string {
    const objectCounts = new Map<string, number>()
    
    frameAnalyses.forEach(frame => {
      frame.objects.forEach(obj => {
        const count = objectCounts.get(obj.name) || 0
        objectCounts.set(obj.name, count + 1)
      })
    })

    const topObjects = Array.from(objectCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name]) => name)

    const hasAudio = audioAnalysis.transcript && audioAnalysis.transcript.trim().length > 0
    const hasText = frameAnalyses.some(frame => frame.text && frame.text.trim().length > 0)

    let summary = `视频时长约${this.calculateDuration(frameAnalyses)}秒，`
    
    if (topObjects.length > 0) {
      summary += `主要包含：${topObjects.join('、')}。`
    }
    
    if (hasAudio) {
      summary += `包含音频内容。`
    }
    
    if (hasText) {
      summary += `包含文字内容。`
    }

    return summary
  }

  /**
   * 计算视频时长
   */
  private calculateDuration(frameAnalyses: Array<{ timestamp: number }>): number {
    if (frameAnalyses.length === 0) return 0
    
    const lastFrame = frameAnalyses[frameAnalyses.length - 1]
    return lastFrame.timestamp
  }
}
