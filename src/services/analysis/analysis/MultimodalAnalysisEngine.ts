// 多模态分析引擎原子能力

import { TextAnalysisEngine } from './TextAnalysisEngine'
import { ImageAnalysisEngine } from './ImageAnalysisEngine'
import { VideoAnalysisEngine } from './VideoAnalysisEngine'
import type { AnalysisRequest, MultimodalAnalysisResult } from './types'

export class MultimodalAnalysisEngine {
  private textEngine: TextAnalysisEngine
  private imageEngine: ImageAnalysisEngine
  private videoEngine: VideoAnalysisEngine

  constructor() {
    this.textEngine = new TextAnalysisEngine()
    this.imageEngine = new ImageAnalysisEngine()
    this.videoEngine = new VideoAnalysisEngine()
  }

  /**
   * 分析多模态内容
   */
  async analyzeMultimodal(request: AnalysisRequest): Promise<MultimodalAnalysisResult> {
    const startTime = Date.now()

    try {
      // 1. 并行分析文本和图片
      const [textResult, imageResults] = await Promise.all([
        this.analyzeText(request),
        this.analyzeImages(request)
      ])

      // 2. 如果有视频内容，也进行分析
      let videoResult = null
      if (request.type === 'multimodal' && request.content) {
        try {
          videoResult = await this.videoEngine.analyzeVideo(request)
        } catch (error) {
          console.warn('视频分析失败:', error)
        }
      }

      // 3. 合并分析结果
      const combinedInsights = this.combineInsights(textResult, imageResults, videoResult)

      return {
        success: true,
        data: {
          textAnalysis: textResult.data,
          imageAnalysis: this.mergeImageResults(imageResults),
          combinedInsights
        },
        metadata: {
          modelUsed: `${textResult.metadata.modelUsed}, ${imageResults[0]?.metadata.modelUsed || 'unknown'}`,
          promptUsed: `${textResult.metadata.promptUsed}, ${imageResults[0]?.metadata.promptUsed || 'unknown'}`,
          processingTime: Date.now() - startTime,
          timestamp: new Date()
        }
      }
    } catch (error) {
      return {
        success: false,
        data: {
          textAnalysis: {
            sellingPoints: [],
            painPoints: [],
            targetAudience: '',
            keywords: [],
            sentiment: 'neutral',
            confidence: 0
          },
          imageAnalysis: {
            objects: [],
            text: '',
            colors: [],
            scene: '',
            quality: 'low'
          },
          combinedInsights: {
            sellingPoints: [],
            painPoints: [],
            targetAudience: '',
            visualElements: [],
            textElements: []
          }
        },
        metadata: {
          modelUsed: 'unknown',
          promptUsed: 'unknown',
          processingTime: Date.now() - startTime,
          timestamp: new Date()
        },
        error: error instanceof Error ? error.message : '多模态分析失败'
      }
    }
  }

  /**
   * 分析文本内容
   */
  private async analyzeText(request: AnalysisRequest) {
    const textRequest: AnalysisRequest = {
      ...request,
      type: 'text'
    }
    return this.textEngine.analyzeText(textRequest)
  }

  /**
   * 分析图片内容
   */
  private async analyzeImages(request: AnalysisRequest) {
    if (!request.images || request.images.length === 0) {
      return []
    }

    const imageResults = []
    for (const image of request.images) {
      const imageRequest: AnalysisRequest = {
        ...request,
        content: image,
        type: 'image'
      }
      const result = await this.imageEngine.analyzeImage(imageRequest)
      imageResults.push(result)
    }
    return imageResults
  }

  /**
   * 合并图片分析结果
   */
  private mergeImageResults(imageResults: any[]) {
    if (imageResults.length === 0) {
      return {
        objects: [],
        text: '',
        colors: [],
        scene: '',
        quality: 'low' as const
      }
    }

    // 合并所有图片的物体
    const allObjects = imageResults.flatMap(result => result.data.objects || [])
    
    // 合并所有图片的文字
    const allTexts = imageResults
      .map(result => result.data.text || '')
      .filter(text => text.trim().length > 0)
      .join(' ')

    // 合并所有图片的颜色
    const allColors = imageResults.flatMap(result => result.data.colors || [])
    const colorMap = new Map<string, number>()
    allColors.forEach(color => {
      const existing = colorMap.get(color.color) || 0
      colorMap.set(color.color, existing + color.percentage)
    })
    const mergedColors = Array.from(colorMap.entries())
      .map(([color, percentage]) => ({ color, percentage: percentage / imageResults.length }))
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 10)

    // 合并场景描述
    const scenes = imageResults
      .map(result => result.data.scene || '')
      .filter(scene => scene.trim().length > 0)

    // 计算平均质量
    const qualities = imageResults.map(result => result.data.quality)
    const qualityCounts = { high: 0, medium: 0, low: 0 }
    qualities.forEach(quality => {
      if (quality in qualityCounts) {
        qualityCounts[quality as keyof typeof qualityCounts]++
      }
    })
    const avgQuality = qualityCounts.high > qualityCounts.medium && qualityCounts.high > qualityCounts.low 
      ? 'high' as const
      : qualityCounts.medium > qualityCounts.low 
        ? 'medium' as const
        : 'low' as const

    return {
      objects: allObjects.slice(0, 20), // 限制数量
      text: allTexts,
      colors: mergedColors,
      scene: scenes.join('; '),
      quality: avgQuality
    }
  }

  /**
   * 合并分析洞察
   */
  private combineInsights(
    textResult: any,
    imageResults: any[],
    videoResult: any
  ): MultimodalAnalysisResult['data']['combinedInsights'] {
    // 从文本分析中提取信息
    const textSellingPoints = textResult.data.sellingPoints || []
    const textPainPoints = textResult.data.painPoints || []
    const textTargetAudience = textResult.data.targetAudience || ''
    const textKeywords = textResult.data.keywords || []

    // 从图片分析中提取信息
    const imageObjects = imageResults.flatMap(result => result.data.objects || [])
    const imageTexts = imageResults
      .map(result => result.data.text || '')
      .filter(text => text.trim().length > 0)
    const imageScenes = imageResults
      .map(result => result.data.scene || '')
      .filter(scene => scene.trim().length > 0)

    // 从视频分析中提取信息（如果有）
    const videoObjects = videoResult?.data?.frames?.flatMap((frame: any) => frame.objects || []) || []
    const videoTexts = videoResult?.data?.frames?.map((frame: any) => frame.text || '').filter((text: string) => text.trim().length > 0) || []

    // 合并卖点
    const allSellingPoints = [
      ...textSellingPoints,
      ...this.extractSellingPointsFromObjects(imageObjects),
      ...this.extractSellingPointsFromObjects(videoObjects)
    ]
    const uniqueSellingPoints = Array.from(new Set(allSellingPoints)).slice(0, 10)

    // 合并痛点
    const allPainPoints = [
      ...textPainPoints,
      ...this.extractPainPointsFromObjects(imageObjects),
      ...this.extractPainPointsFromObjects(videoObjects)
    ]
    const uniquePainPoints = Array.from(new Set(allPainPoints)).slice(0, 10)

    // 合并目标受众
    const targetAudience = this.combineTargetAudience(
      textTargetAudience,
      imageScenes,
      videoResult?.data?.audio?.transcript
    )

    // 提取视觉元素
    const visualElements = [
      ...imageObjects.map((obj: any) => obj.name),
      ...videoObjects.map((obj: any) => obj.name),
      ...imageScenes
    ].filter(Boolean)

    // 提取文字元素
    const textElements = [
      ...textKeywords,
      ...imageTexts,
      ...videoTexts
    ].filter(Boolean)

    return {
      sellingPoints: uniqueSellingPoints,
      painPoints: uniquePainPoints,
      targetAudience,
      visualElements: Array.from(new Set(visualElements)).slice(0, 20),
      textElements: Array.from(new Set(textElements)).slice(0, 20)
    }
  }

  /**
   * 从物体中提取卖点
   */
  private extractSellingPointsFromObjects(objects: any[]): string[] {
    const sellingPointKeywords = [
      'premium', 'quality', 'durable', 'efficient', 'innovative',
      'premium', 'quality', 'durable', 'efficient', 'innovative',
      'premium', 'quality', 'durable', 'efficient', 'innovative'
    ]

    return objects
      .filter(obj => obj.confidence > 0.7)
      .map(obj => obj.name)
      .filter(name => 
        sellingPointKeywords.some(keyword => 
          name.toLowerCase().includes(keyword.toLowerCase())
        )
      )
  }

  /**
   * 从物体中提取痛点
   */
  private extractPainPointsFromObjects(objects: any[]): string[] {
    const painPointKeywords = [
      'problem', 'issue', 'difficulty', 'challenge', 'concern',
      'problem', 'issue', 'difficulty', 'challenge', 'concern'
    ]

    return objects
      .filter(obj => obj.confidence > 0.7)
      .map(obj => obj.name)
      .filter(name => 
        painPointKeywords.some(keyword => 
          name.toLowerCase().includes(keyword.toLowerCase())
        )
      )
  }

  /**
   * 合并目标受众信息
   */
  private combineTargetAudience(
    textAudience: string,
    imageScenes: string[],
    videoTranscript?: string
  ): string {
    const audienceParts = [textAudience]

    // 从场景描述中提取受众信息
    imageScenes.forEach(scene => {
      if (scene.includes('young') || scene.includes('youth')) {
        audienceParts.push('年轻群体')
      }
      if (scene.includes('family') || scene.includes('children')) {
        audienceParts.push('家庭用户')
      }
      if (scene.includes('professional') || scene.includes('business')) {
        audienceParts.push('专业人士')
      }
    })

    // 从视频转录中提取受众信息
    if (videoTranscript) {
      if (videoTranscript.includes('年轻人') || videoTranscript.includes('青年')) {
        audienceParts.push('年轻群体')
      }
      if (videoTranscript.includes('家庭') || videoTranscript.includes('孩子')) {
        audienceParts.push('家庭用户')
      }
    }

    // 去重并合并
    const uniqueAudience = Array.from(new Set(audienceParts.filter(Boolean)))
    return uniqueAudience.join('、') || '通用受众'
  }
}
