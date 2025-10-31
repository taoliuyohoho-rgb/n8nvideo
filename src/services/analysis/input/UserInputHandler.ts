// 用户输入处理原子能力

import type { UserInputData, NormalizedInput, InputValidationResult } from './types'

export class UserInputHandler {
  /**
   * 统一处理入口
   */
  async handle(input: any): Promise<NormalizedInput> {
    const { type, content, images, metadata } = input

    if (type === 'text') {
      return await this.handleTextInput(content, metadata)
    } else if (type === 'image') {
      return await this.handleImageInput(content, metadata)
    } else if (type === 'multimodal') {
      return await this.handleMultimodalInput(content, images || [], metadata)
    } else {
      throw new Error(`不支持的输入类型: ${type}`)
    }
  }

  /**
   * 处理用户文本输入
   */
  async handleTextInput(text: string, metadata?: any): Promise<NormalizedInput> {
    const validation = this.validateTextInput(text)
    if (!validation.isValid) {
      throw new Error(`文本输入验证失败: ${validation.errors.join(', ')}`)
    }

    return {
      type: 'text',
      content: this.cleanText(text),
      metadata: {
        originalType: 'text',
        source: 'user',
        processedAt: new Date(),
        quality: this.assessTextQuality(text),
        ...metadata
      }
    }
  }

  /**
   * 处理用户图片输入
   */
  async handleImageInput(imageData: Buffer | string, metadata?: any): Promise<NormalizedInput> {
    const validation = this.validateImageInput(imageData)
    if (!validation.isValid) {
      throw new Error(`图片输入验证失败: ${validation.errors.join(', ')}`)
    }

    const base64Image = Buffer.isBuffer(imageData) 
      ? imageData.toString('base64')
      : imageData

    return {
      type: 'image',
      content: base64Image,
      images: [base64Image],
      metadata: {
        originalType: 'image',
        source: 'user',
        processedAt: new Date(),
        quality: this.assessImageQuality(imageData),
        ...metadata
      }
    }
  }

  /**
   * 处理用户多模态输入
   */
  async handleMultimodalInput(
    text: string, 
    images: (Buffer | string)[], 
    metadata?: any
  ): Promise<NormalizedInput> {
    const textValidation = this.validateTextInput(text)
    const imageValidations = await Promise.all(
      images.map(img => this.validateImageInput(img))
    )

    const allValid = textValidation.isValid && imageValidations.every(v => v.isValid)
    if (!allValid) {
      const errors = [
        ...textValidation.errors,
        ...imageValidations.flatMap(v => v.errors)
      ]
      // 去重错误信息
      const uniqueErrors = [...new Set(errors)]
      throw new Error(`多模态输入验证失败: ${uniqueErrors.join(', ')}`)
    }

    const base64Images = images.map(img => 
      Buffer.isBuffer(img) ? img.toString('base64') : img
    )

    return {
      type: 'multimodal',
      content: this.cleanText(text),
      images: base64Images,
      metadata: {
        originalType: 'multimodal',
        source: 'user',
        processedAt: new Date(),
        quality: this.assessMultimodalQuality(text, images),
        ...metadata
      }
    }
  }

  /**
   * 验证文本输入
   */
  private validateTextInput(text: string): InputValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    if (!text || text.trim().length === 0) {
      errors.push('文本内容不能为空')
    }

    if (text.length > 10000) {
      warnings.push('文本内容过长，可能影响处理性能')
    }

    if (text.length < 10) {
      warnings.push('文本内容过短，分析结果可能不够准确')
    }

    // 检查是否包含敏感内容
    const sensitivePatterns = [/密码|password/i, /密钥|key/i, /token/i]
    if (sensitivePatterns.some(pattern => pattern.test(text))) {
      warnings.push('检测到可能包含敏感信息的内容')
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * 验证图片输入
   */
  private validateImageInput(imageData: Buffer | string): InputValidationResult {
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

    if (buffer.length > 10 * 1024 * 1024) { // 10MB
      warnings.push('图片文件过大，可能影响处理性能')
    }

    // 检查图片格式
    const isValidImage = this.isValidImageFormat(buffer)
    if (!isValidImage) {
      errors.push('不支持的图片格式')
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * 清理文本内容
   */
  private cleanText(text: string): string {
    return text
      .trim()
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
  }

  /**
   * 评估文本质量
   */
  private assessTextQuality(text: string): 'high' | 'medium' | 'low' {
    const length = text.length
    const wordCount = text.split(/\s+/).length
    const sentenceCount = text.split(/[.!?]+/).length

    if (length > 500 && wordCount > 50 && sentenceCount > 5) {
      return 'high'
    } else if (length > 100 && wordCount > 10 && sentenceCount > 2) {
      return 'medium'
    } else {
      return 'low'
    }
  }

  /**
   * 评估图片质量
   */
  private assessImageQuality(imageData: Buffer | string): 'high' | 'medium' | 'low' {
    const buffer = Buffer.isBuffer(imageData) ? imageData : Buffer.from(imageData, 'base64')
    
    if (buffer.length > 2 * 1024 * 1024) { // 2MB
      return 'high'
    } else if (buffer.length > 500 * 1024) { // 500KB
      return 'medium'
    } else {
      return 'low'
    }
  }

  /**
   * 评估多模态质量
   */
  private assessMultimodalQuality(text: string, images: (Buffer | string)[]): 'high' | 'medium' | 'low' {
    const textQuality = this.assessTextQuality(text)
    const imageQualities = images.map(img => this.assessImageQuality(img))
    
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
      console.log('[UserInputHandler] 图片验证失败: 缓冲区为空或过小', { bufferLength: buffer?.length })
      return false
    }

    // 记录图片数据的开头字节用于调试
    const firstBytes = Array.from(buffer.slice(0, 16)).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' ')
    console.log('[UserInputHandler] 图片数据开头字节:', firstBytes)

    // 检查常见图片格式的魔数
    const signatures = [
      { name: 'JPEG', bytes: [0xFF, 0xD8, 0xFF] },
      { name: 'PNG', bytes: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A] },
      { name: 'GIF', bytes: [0x47, 0x49, 0x46, 0x38] },
      { name: 'WEBP', bytes: [0x52, 0x49, 0x46, 0x46] },
      { name: 'SVG', bytes: [0x3C, 0x3F, 0x78, 0x6D, 0x6C] },
      { name: 'BMP', bytes: [0x42, 0x4D] },
      { name: 'ICO', bytes: [0x00, 0x00, 0x01, 0x00] },
      { name: 'CUR', bytes: [0x00, 0x00, 0x02, 0x00] },
    ]

    for (const signature of signatures) {
      if (buffer.length >= signature.bytes.length) {
        const matches = signature.bytes.every((byte, index) => buffer[index] === byte)
        if (matches) {
          console.log('[UserInputHandler] 检测到图片格式:', signature.name)
          return true
        }
      }
    }

    console.log('[UserInputHandler] 图片格式验证失败: 未匹配任何已知格式')
    return false
  }
}
