// AI生成内容处理原子能力

import type { AIGeneratedData, NormalizedInput, InputValidationResult } from './types'

export interface AIGenerationConfig {
  model: string
  prompt: string
  parameters?: Record<string, any>
  generatedAt: Date
}

export class AIGeneratedHandler {
  /**
   * 统一处理入口
   */
  async handle(input: any): Promise<NormalizedInput> {
    const { type, content, metadata } = input
    
    if (type === 'text') {
      return await this.handleGeneratedText({
        model: metadata?.model || 'unknown',
        prompt: metadata?.prompt || '',
        generatedAt: new Date(),
        parameters: metadata?.parameters
      })
    } else if (type === 'image') {
      return await this.handleGeneratedImage(
        content as Buffer | string,
        {
          model: metadata?.model || 'unknown',
          prompt: metadata?.prompt || '',
          generatedAt: new Date(),
          parameters: metadata?.parameters
        }
      )
    } else if (type === 'video') {
      return await this.handleGeneratedVideo(
        content as Buffer | string,
        {
          model: metadata?.model || 'unknown',
          prompt: metadata?.prompt || '',
          generatedAt: new Date(),
          parameters: metadata?.parameters
        }
      )
    } else if (type === 'multimodal') {
      return await this.handleGeneratedMultimodal(
        content as string,
        [], // 空的图片数组，因为这是文本数据
        {
          model: metadata?.model || 'unknown',
          prompt: metadata?.prompt || '',
          generatedAt: new Date(),
          parameters: metadata?.parameters
        }
      )
    } else {
      throw new Error(`不支持的AI生成类型: ${type}`)
    }
  }

  /**
   * 处理AI生成的文本内容
   */
  async handleGeneratedText(config: AIGenerationConfig): Promise<NormalizedInput> {
    const validation = this.validateGeneratedContent(config)
    if (!validation.isValid) {
      throw new Error(`AI生成内容验证失败: ${validation.errors.join(', ')}`)
    }

    return {
      type: 'text',
      content: this.cleanGeneratedText(config.prompt),
      metadata: {
        originalType: 'ai-generated',
        source: 'ai',
        processedAt: new Date(),
        quality: this.assessGeneratedQuality(config),
        model: config.model,
        prompt: config.prompt,
        generatedAt: config.generatedAt,
        parameters: config.parameters || {}
      }
    }
  }

  /**
   * 处理AI生成的图片内容
   */
  async handleGeneratedImage(
    imageData: Buffer | string, 
    config: AIGenerationConfig
  ): Promise<NormalizedInput> {
    const validation = this.validateGeneratedImage(imageData, config)
    if (!validation.isValid) {
      throw new Error(`AI生成图片验证失败: ${validation.errors.join(', ')}`)
    }

    const base64Image = Buffer.isBuffer(imageData) 
      ? imageData.toString('base64')
      : imageData

    return {
      type: 'image',
      content: base64Image,
      images: [base64Image],
      metadata: {
        originalType: 'ai-generated-image',
        source: 'ai',
        processedAt: new Date(),
        quality: this.assessGeneratedImageQuality(imageData, config),
        model: config.model,
        prompt: config.prompt,
        generatedAt: config.generatedAt,
        parameters: config.parameters || {}
      }
    }
  }

  /**
   * 处理AI生成的视频内容
   */
  async handleGeneratedVideo(
    videoData: Buffer | string, 
    config: AIGenerationConfig
  ): Promise<NormalizedInput> {
    const validation = this.validateGeneratedVideo(videoData, config)
    if (!validation.isValid) {
      throw new Error(`AI生成视频验证失败: ${validation.errors.join(', ')}`)
    }

    const base64Video = Buffer.isBuffer(videoData) 
      ? videoData.toString('base64')
      : videoData

    return {
      type: 'video',
      content: base64Video,
      metadata: {
        originalType: 'ai-generated-video',
        source: 'ai',
        processedAt: new Date(),
        quality: this.assessGeneratedVideoQuality(videoData, config),
        model: config.model,
        prompt: config.prompt,
        generatedAt: config.generatedAt,
        parameters: config.parameters || {}
      }
    }
  }

  /**
   * 处理AI生成的多模态内容
   */
  async handleGeneratedMultimodal(
    text: string,
    images: (Buffer | string)[],
    config: AIGenerationConfig
  ): Promise<NormalizedInput> {
    const textValidation = this.validateGeneratedContent({ ...config, prompt: text })
    const imageValidations = await Promise.all(
      images.map(img => this.validateGeneratedImage(img, config))
    )

    const allValid = textValidation.isValid && imageValidations.every(v => v.isValid)
    if (!allValid) {
      const errors = [
        ...textValidation.errors,
        ...imageValidations.flatMap(v => v.errors)
      ]
      throw new Error(`AI生成多模态内容验证失败: ${errors.join(', ')}`)
    }

    const base64Images = images.map(img => 
      Buffer.isBuffer(img) ? img.toString('base64') : img
    )

    return {
      type: 'multimodal',
      content: this.cleanGeneratedText(text),
      images: base64Images,
      metadata: {
        originalType: 'ai-generated-multimodal',
        source: 'ai',
        processedAt: new Date(),
        quality: this.assessGeneratedMultimodalQuality(text, images, config),
        model: config.model,
        prompt: config.prompt,
        generatedAt: config.generatedAt,
        parameters: config.parameters || {}
      }
    }
  }

  /**
   * 验证AI生成的内容
   */
  private validateGeneratedContent(config: AIGenerationConfig): InputValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    if (!config.model) {
      errors.push('AI模型不能为空')
    }

    if (!config.prompt || config.prompt.trim().length === 0) {
      errors.push('生成提示不能为空')
    }

    if (config.prompt.length > 10000) {
      warnings.push('生成提示过长，可能影响处理性能')
    }

    // 检查模型是否支持
    const supportedModels = [
      'gpt-3.5-turbo',
      'gpt-4',
      'gpt-4-turbo',
      'gemini-pro',
      'gemini-2.5-flash',
      'claude-3-sonnet',
      'claude-3-opus'
    ]

    if (!supportedModels.includes(config.model)) {
      warnings.push(`模型 ${config.model} 可能不被支持`)
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * 验证AI生成的图片
   */
  private validateGeneratedImage(
    imageData: Buffer | string, 
    config: AIGenerationConfig
  ): InputValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    if (!imageData) {
      errors.push('图片数据不能为空')
      return { isValid: false, errors, warnings }
    }

    const buffer = Buffer.isBuffer(imageData) ? imageData : Buffer.from(imageData, 'base64')
    
    if (buffer.length === 0) {
      errors.push('图片数据无效')
    }

    if (buffer.length > 20 * 1024 * 1024) { // 20MB
      warnings.push('生成的图片文件过大')
    }

    // 检查是否为有效的图片格式
    const isValidImage = this.isValidImageFormat(buffer)
    if (!isValidImage) {
      errors.push('不支持的图片格式')
    }

    // 检查生成参数
    if (config.parameters) {
      const { width, height, quality } = config.parameters
      
      if (width && height) {
        const totalPixels = width * height
        if (totalPixels > 4194304) { // 2048x2048
          warnings.push('图片分辨率过高，可能影响处理性能')
        }
      }

      if (quality && (quality < 0.1 || quality > 1.0)) {
        warnings.push('图片质量参数应在0.1-1.0之间')
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * 验证AI生成的视频
   */
  private validateGeneratedVideo(
    videoData: Buffer | string, 
    config: AIGenerationConfig
  ): InputValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    if (!videoData) {
      errors.push('视频数据不能为空')
      return { isValid: false, errors, warnings }
    }

    const buffer = Buffer.isBuffer(videoData) ? videoData : Buffer.from(videoData, 'base64')
    
    if (buffer.length === 0) {
      errors.push('视频数据无效')
    }

    if (buffer.length > 100 * 1024 * 1024) { // 100MB
      warnings.push('生成的视频文件过大')
    }

    // 检查生成参数
    if (config.parameters) {
      const { duration, fps, resolution } = config.parameters
      
      if (duration && duration > 60) {
        warnings.push('视频时长过长，可能影响处理性能')
      }

      if (fps && (fps < 15 || fps > 60)) {
        warnings.push('视频帧率应在15-60fps之间')
      }

      if (resolution?.includes('x')) {
        const [width, height] = resolution.split('x').map(Number)
        if (width * height > 2073600) { // 1920x1080
          warnings.push('视频分辨率过高，可能影响处理性能')
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * 清理生成的文本
   */
  private cleanGeneratedText(text: string): string {
    return text
      .trim()
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/^```[\s\S]*?```$/gm, '') // 移除代码块标记
      .replace(/^---[\s\S]*?---$/gm, '') // 移除分隔线
  }

  /**
   * 评估生成内容质量
   */
  private assessGeneratedQuality(config: AIGenerationConfig): 'high' | 'medium' | 'low' {
    const promptLength = config.prompt.length
    const hasParameters = config.parameters && Object.keys(config.parameters).length > 0
    
    if (promptLength > 500 && hasParameters) {
      return 'high'
    } else if (promptLength > 100) {
      return 'medium'
    } else {
      return 'low'
    }
  }

  /**
   * 评估生成图片质量
   */
  private assessGeneratedImageQuality(
    imageData: Buffer | string, 
    config: AIGenerationConfig
  ): 'high' | 'medium' | 'low' {
    const buffer = Buffer.isBuffer(imageData) ? imageData : Buffer.from(imageData, 'base64')
    const size = buffer.length
    const parameters = config.parameters || {}
    
    const hasHighRes = parameters.width && parameters.height && 
      (parameters.width * parameters.height) > 1000000
    const hasHighQuality = parameters.quality && parameters.quality > 0.8
    
    if (size > 2 * 1024 * 1024 && (hasHighRes || hasHighQuality)) {
      return 'high'
    } else if (size > 500 * 1024) {
      return 'medium'
    } else {
      return 'low'
    }
  }

  /**
   * 评估生成视频质量
   */
  private assessGeneratedVideoQuality(
    videoData: Buffer | string, 
    config: AIGenerationConfig
  ): 'high' | 'medium' | 'low' {
    const buffer = Buffer.isBuffer(videoData) ? videoData : Buffer.from(videoData, 'base64')
    const size = buffer.length
    const parameters = config.parameters || {}
    
    const hasHighRes = parameters.resolution?.includes('1920x1080')
    const hasHighFps = parameters.fps && parameters.fps >= 30
    
    if (size > 50 * 1024 * 1024 && (hasHighRes || hasHighFps)) {
      return 'high'
    } else if (size > 10 * 1024 * 1024) {
      return 'medium'
    } else {
      return 'low'
    }
  }

  /**
   * 评估生成多模态质量
   */
  private assessGeneratedMultimodalQuality(
    text: string, 
    images: (Buffer | string)[], 
    config: AIGenerationConfig
  ): 'high' | 'medium' | 'low' {
    const textQuality = this.assessGeneratedQuality(config)
    const imageQualities = images.map(img => this.assessGeneratedImageQuality(img, config))
    
    const hasHighQualityImage = imageQualities.includes('high')
    const hasHighQualityText = textQuality === 'high'
    
    if (hasHighQualityImage && hasHighQualityText) {
      return 'high'
    } else if (hasHighQualityImage || hasHighQualityText) {
      return 'medium'
    } else {
      return 'low'
    }
  }

  /**
   * 检查是否为有效的图片格式
   */
  private isValidImageFormat(buffer: Buffer): boolean {
    if (!buffer || buffer.length < 4) {
      return false
    }

    const signatures = [
      [0xFF, 0xD8, 0xFF], // JPEG
      [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A], // PNG
      [0x47, 0x49, 0x46, 0x38], // GIF (GIF8)
      [0x52, 0x49, 0x46, 0x46], // WEBP (RIFF)
      [0x3C, 0x3F, 0x78, 0x6D, 0x6C], // SVG
      [0x42, 0x4D], // BMP
      [0x00, 0x00, 0x01, 0x00], // ICO
      [0x00, 0x00, 0x02, 0x00], // CUR
    ]

    return signatures.some(signature => {
      if (buffer.length < signature.length) {
        return false
      }
      return signature.every((byte, index) => buffer[index] === byte)
    })
  }
}
