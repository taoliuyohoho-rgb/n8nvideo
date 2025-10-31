// 输入标准化原子能力

import type { NormalizedInput, InputValidationResult } from './types'

export class InputNormalizer {
  /**
   * 统一的输入标准化入口
   */
  async normalize(input: any): Promise<NormalizedInput> {
    if (input.type === 'user') {
      return this.normalizeUserInput(input.inputType || 'text', input.content, input.images, input.metadata)
    } else if (input.type === 'scraping') {
      return this.normalizeScrapedContent(input.content, input.metadata)
    } else if (input.type === 'ai-generated') {
      return this.normalizeAIGeneratedContent(input.inputType || 'text', input.content, input.images, input.metadata)
    } else {
      // 默认处理
      return {
        type: 'text',
        content: String(input.content || ''),
        metadata: {
          originalType: 'text',
          source: 'user',
          processedAt: new Date(),
          quality: 'medium'
        }
      }
    }
  }

  /**
   * 标准化用户输入
   */
  async normalizeUserInput(
    type: 'text' | 'image' | 'video' | 'multimodal',
    content: string | Buffer,
    images?: (Buffer | string)[],
    metadata?: any
  ): Promise<NormalizedInput> {
    const normalizedContent = this.normalizeContent(content, type)
    const normalizedImages = images ? this.normalizeImages(images) : undefined

    return {
      type,
      content: normalizedContent,
      images: normalizedImages,
      metadata: {
        originalType: type,
        source: 'user',
        processedAt: new Date(),
        quality: this.assessQuality(normalizedContent, normalizedImages),
        ...metadata
      }
    }
  }

  /**
   * 标准化爬取内容
   */
  async normalizeScrapedContent(
    content: string,
    url: string,
    platform?: string,
    metadata?: any
  ): Promise<NormalizedInput> {
    const normalizedContent = this.normalizeTextContent(content)
    
    return {
      type: 'text',
      content: normalizedContent,
      metadata: {
        originalType: 'url',
        source: 'scraping',
        processedAt: new Date(),
        quality: this.assessTextQuality(normalizedContent),
        url,
        platform: platform || 'generic',
        scrapedAt: new Date(),
        ...metadata
      }
    }
  }

  /**
   * 标准化AI生成内容
   */
  async normalizeAIGeneratedContent(
    type: 'text' | 'image' | 'video' | 'multimodal',
    content: string | Buffer,
    model: string,
    prompt: string,
    images?: (Buffer | string)[],
    metadata?: any
  ): Promise<NormalizedInput> {
    const normalizedContent = this.normalizeContent(content, type)
    const normalizedImages = images ? this.normalizeImages(images) : undefined

    return {
      type,
      content: normalizedContent,
      images: normalizedImages,
      metadata: {
        originalType: `ai-generated-${type}`,
        source: 'ai',
        processedAt: new Date(),
        quality: this.assessQuality(normalizedContent, normalizedImages),
        model,
        prompt,
        generatedAt: new Date(),
        ...metadata
      }
    }
  }

  /**
   * 验证标准化后的输入
   */
  validateNormalizedInput(input: NormalizedInput): InputValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // 验证基本结构
    if (!input.type) {
      errors.push('输入类型不能为空')
    }

    if (!input.content) {
      errors.push('输入内容不能为空')
    }

    if (!input.metadata) {
      errors.push('元数据不能为空')
    }

    // 验证类型特定内容
    switch (input.type) {
      case 'text':
        this.validateTextInput(input.content, errors, warnings)
        break
      case 'image':
        this.validateImageInput(input.content, errors, warnings)
        break
      case 'video':
        this.validateVideoInput(input.content, errors, warnings)
        break
      case 'multimodal':
        this.validateMultimodalInput(input, errors, warnings)
        break
    }

    // 验证元数据
    this.validateMetadata(input.metadata, errors, warnings)

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * 标准化内容
   */
  private normalizeContent(content: string | Buffer, type: string): string {
    if (Buffer.isBuffer(content)) {
      return content.toString('base64')
    }

    if (type === 'text' || type === 'multimodal') {
      return this.normalizeTextContent(content)
    }

    return content
  }

  /**
   * 标准化文本内容
   */
  private normalizeTextContent(text: string): string {
    return text
      .trim()
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/\s+/g, ' ')
      .replace(/[^\x00-\x7F]/g, (char) => {
        // 保留常见的中文字符，移除其他特殊字符
        return /[\u4e00-\u9fff]/.test(char) ? char : ' '
      })
      .trim()
  }

  /**
   * 标准化图片数组
   */
  private normalizeImages(images: (Buffer | string)[]): string[] {
    return images.map(img => 
      Buffer.isBuffer(img) ? img.toString('base64') : img
    )
  }

  /**
   * 评估内容质量
   */
  private assessQuality(content: string, images?: string[]): 'high' | 'medium' | 'low' {
    if (images && images.length > 0) {
      return this.assessMultimodalQuality(content, images)
    } else {
      return this.assessTextQuality(content)
    }
  }

  /**
   * 评估文本质量
   */
  private assessTextQuality(text: string): 'high' | 'medium' | 'low' {
    const length = text.length
    const wordCount = text.split(/\s+/).length
    const sentenceCount = text.split(/[.!?]+/).length
    const paragraphCount = text.split(/\n\s*\n/).length

    let score = 0

    // 长度评分
    if (length > 1000) score += 3
    else if (length > 500) score += 2
    else if (length > 100) score += 1

    // 词汇丰富度评分
    if (wordCount > 100) score += 2
    else if (wordCount > 50) score += 1

    // 句子结构评分
    if (sentenceCount > 10) score += 2
    else if (sentenceCount > 5) score += 1

    // 段落结构评分
    if (paragraphCount > 3) score += 1

    if (score >= 6) return 'high'
    else if (score >= 3) return 'medium'
    else return 'low'
  }

  /**
   * 评估多模态质量
   */
  private assessMultimodalQuality(text: string, images: string[]): 'high' | 'medium' | 'low' {
    const textQuality = this.assessTextQuality(text)
    const imageCount = images.length
    const avgImageSize = images.reduce((sum, img) => sum + img.length, 0) / imageCount

    let score = 0

    // 文本质量评分
    if (textQuality === 'high') score += 3
    else if (textQuality === 'medium') score += 2
    else score += 1

    // 图片数量评分
    if (imageCount >= 3) score += 2
    else if (imageCount >= 1) score += 1

    // 图片质量评分
    if (avgImageSize > 100000) score += 2 // 100KB
    else if (avgImageSize > 50000) score += 1 // 50KB

    if (score >= 6) return 'high'
    else if (score >= 3) return 'medium'
    else return 'low'
  }

  /**
   * 验证文本输入
   */
  private validateTextInput(content: string, errors: string[], warnings: string[]): void {
    if (!content || content.trim().length === 0) {
      errors.push('文本内容不能为空')
    }

    if (content.length > 50000) {
      warnings.push('文本内容过长，可能影响处理性能')
    }

    if (content.length < 10) {
      warnings.push('文本内容过短，分析结果可能不够准确')
    }

    // 检查编码问题
    if (content.includes('')) {
      warnings.push('检测到可能的编码问题')
    }
  }

  /**
   * 验证图片输入
   */
  private validateImageInput(content: string, errors: string[], warnings: string[]): void {
    if (!content) {
      errors.push('图片内容不能为空')
      return
    }

    try {
      const buffer = Buffer.from(content, 'base64')
      
      if (buffer.length === 0) {
        errors.push('图片数据无效')
      }

      if (buffer.length > 20 * 1024 * 1024) { // 20MB
        warnings.push('图片文件过大')
      }

      if (buffer.length < 1024) { // 1KB
        warnings.push('图片文件过小，可能质量不佳')
      }

      // 检查图片格式
      const isValidFormat = this.isValidImageFormat(buffer)
      if (!isValidFormat) {
        errors.push('不支持的图片格式')
      }
    } catch (error) {
      errors.push('图片数据格式错误')
    }
  }

  /**
   * 验证视频输入
   */
  private validateVideoInput(content: string, errors: string[], warnings: string[]): void {
    if (!content) {
      errors.push('视频内容不能为空')
      return
    }

    try {
      const buffer = Buffer.from(content, 'base64')
      
      if (buffer.length === 0) {
        errors.push('视频数据无效')
      }

      if (buffer.length > 100 * 1024 * 1024) { // 100MB
        warnings.push('视频文件过大')
      }

      if (buffer.length < 10 * 1024) { // 10KB
        warnings.push('视频文件过小，可能质量不佳')
      }
    } catch (error) {
      errors.push('视频数据格式错误')
    }
  }

  /**
   * 验证多模态输入
   */
  private validateMultimodalInput(
    input: NormalizedInput, 
    errors: string[], 
    warnings: string[]
  ): void {
    this.validateTextInput(input.content, errors, warnings)

    if (input.images && input.images.length > 0) {
      input.images.forEach((img, index) => {
        this.validateImageInput(img, errors, warnings)
      })
    } else {
      warnings.push('多模态输入缺少图片内容')
    }
  }

  /**
   * 验证元数据
   */
  private validateMetadata(metadata: any, errors: string[], warnings: string[]): void {
    if (!metadata.source) {
      errors.push('元数据缺少来源信息')
    }

    if (!metadata.processedAt) {
      errors.push('元数据缺少处理时间')
    }

    if (!metadata.quality) {
      warnings.push('元数据缺少质量评估')
    }

    // 验证时间格式
    if (metadata.processedAt && !(metadata.processedAt instanceof Date)) {
      warnings.push('处理时间格式不正确')
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
