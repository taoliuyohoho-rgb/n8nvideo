// 网络爬取处理原子能力

import type { WebScrapingData, NormalizedInput, InputValidationResult } from './types'

export interface ScrapingConfig {
  timeout?: number
  userAgent?: string
  headers?: Record<string, string>
  retries?: number
  delay?: number
}

export class WebScrapingHandler {
  private config: ScrapingConfig

  constructor(config: ScrapingConfig = {}) {
    this.config = {
      timeout: 30000,
      userAgent: 'Mozilla/5.0 (compatible; AnalysisBot/1.0)',
      retries: 3,
      delay: 1000,
      ...config
    }
  }

  /**
   * 统一处理入口
   */
  async handle(input: any): Promise<NormalizedInput> {
    const { content, metadata } = input
    
    if (metadata?.url) {
      return await this.scrapeUrl(content, metadata.platform)
    } else {
      throw new Error('WebScrapingHandler 需要 URL 信息')
    }
  }

  /**
   * 爬取网页内容
   */
  async scrapeUrl(url: string, platform?: string): Promise<NormalizedInput> {
    const validation = this.validateUrl(url)
    if (!validation.isValid) {
      throw new Error(`URL验证失败: ${validation.errors.join(', ')}`)
    }

    try {
      const content = await this.fetchContent(url)
      const platformType = platform || this.detectPlatform(url)
      
      return {
        type: 'text',
        content: this.extractTextContent(content, platformType),
        metadata: {
          originalType: 'url',
          source: 'scraping',
          processedAt: new Date(),
          quality: this.assessContentQuality(content),
          url,
          platform: platformType,
          scrapedAt: new Date(),
          ...this.extractMetadata(content, platformType)
        }
      }
    } catch (error) {
      throw new Error(`爬取失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 批量爬取多个URL
   */
  async scrapeUrls(urls: string[], platform?: string): Promise<NormalizedInput[]> {
    const results: NormalizedInput[] = []
    
    for (const url of urls) {
      try {
        const result = await this.scrapeUrl(url, platform)
        results.push(result)
        
        // 添加延迟避免被限制
        if (this.config.delay && this.config.delay > 0) {
          await new Promise(resolve => setTimeout(resolve, this.config.delay))
        }
      } catch (error) {
        console.warn(`爬取URL失败 ${url}:`, error)
        // 继续处理其他URL，不中断整个流程
      }
    }
    
    return results
  }

  /**
   * 爬取社交媒体内容
   */
  async scrapeSocialMedia(url: string): Promise<NormalizedInput> {
    const platform = this.detectPlatform(url)
    
    switch (platform) {
      case 'tiktok':
        return this.scrapeTikTok(url)
      case 'youtube':
        return this.scrapeYouTube(url)
      case 'instagram':
        return this.scrapeInstagram(url)
      case 'facebook':
        return this.scrapeFacebook(url)
      default:
        return this.scrapeUrl(url, platform)
    }
  }

  /**
   * 获取网页内容
   */
  private async fetchContent(url: string): Promise<string> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': this.config.userAgent!,
          ...this.config.headers
        }
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.text()
    } catch (error) {
      clearTimeout(timeoutId)
      throw error
    }
  }

  /**
   * 验证URL
   */
  private validateUrl(url: string): InputValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    try {
      const urlObj = new URL(url)
      
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        errors.push('只支持HTTP和HTTPS协议')
      }

      if (urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1') {
        warnings.push('本地URL可能无法访问')
      }

      // 检查是否为可疑URL
      const suspiciousPatterns = [
        /\.exe$/i,
        /\.zip$/i,
        /\.rar$/i,
        /\.pdf$/i
      ]
      
      if (suspiciousPatterns.some(pattern => pattern.test(urlObj.pathname))) {
        warnings.push('检测到可能的文件下载链接')
      }

    } catch (error) {
      errors.push('无效的URL格式')
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * 检测平台类型
   */
  private detectPlatform(url: string): string {
    const urlObj = new URL(url)
    const hostname = urlObj.hostname.toLowerCase()

    if (hostname.includes('tiktok.com')) return 'tiktok'
    if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) return 'youtube'
    if (hostname.includes('instagram.com')) return 'instagram'
    if (hostname.includes('facebook.com')) return 'facebook'
    if (hostname.includes('twitter.com') || hostname.includes('x.com')) return 'twitter'
    if (hostname.includes('linkedin.com')) return 'linkedin'
    if (hostname.includes('amazon.com')) return 'amazon'
    if (hostname.includes('taobao.com')) return 'taobao'
    if (hostname.includes('jd.com')) return 'jd'
    
    return 'generic'
  }

  /**
   * 提取文本内容
   */
  private extractTextContent(html: string, platform: string): string {
    // 移除脚本和样式标签
    const content = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '')

    // 提取标题
    const titleMatch = content.match(/<title[^>]*>([^<]+)<\/title>/i)
    const title = titleMatch ? titleMatch[1].trim() : ''

    // 提取描述
    const descMatch = content.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)
    const description = descMatch ? descMatch[1].trim() : ''

    // 提取主要内容
    let mainContent = ''
    
    // 尝试提取主要内容区域
    const contentSelectors = [
      'main',
      'article',
      '.content',
      '.post-content',
      '.entry-content',
      '#content'
    ]

    for (const selector of contentSelectors) {
      const regex = new RegExp(`<${selector}[^>]*>([\\s\\S]*?)<\\/${selector}>`, 'i')
      const match = content.match(regex)
      if (match) {
        mainContent = match[1]
        break
      }
    }

    // 如果没有找到主要内容，使用整个body
    if (!mainContent) {
      const bodyMatch = content.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
      mainContent = bodyMatch ? bodyMatch[1] : content
    }

    // 清理HTML标签
    const textContent = mainContent
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    // 组合结果
    const parts = [title, description, textContent].filter(Boolean)
    return parts.join('\n\n')
  }

  /**
   * 提取元数据
   */
  private extractMetadata(html: string, platform: string): Record<string, any> {
    const metadata: Record<string, any> = {}

    // 提取Open Graph标签
    const ogTags = html.match(/<meta[^>]*property=["']og:([^"']+)["'][^>]*content=["']([^"']+)["']/gi)
    if (ogTags) {
      ogTags.forEach(tag => {
        const match = tag.match(/property=["']og:([^"']+)["'][^>]*content=["']([^"']+)["']/i)
        if (match) {
          metadata[`og_${match[1]}`] = match[2]
        }
      })
    }

    // 提取Twitter卡片标签
    const twitterTags = html.match(/<meta[^>]*name=["']twitter:([^"']+)["'][^>]*content=["']([^"']+)["']/gi)
    if (twitterTags) {
      twitterTags.forEach(tag => {
        const match = tag.match(/name=["']twitter:([^"']+)["'][^>]*content=["']([^"']+)["']/i)
        if (match) {
          metadata[`twitter_${match[1]}`] = match[2]
        }
      })
    }

    // 提取关键词
    const keywordsMatch = html.match(/<meta[^>]*name=["']keywords["'][^>]*content=["']([^"']+)["']/i)
    if (keywordsMatch) {
      metadata.keywords = keywordsMatch[1].split(',').map(k => k.trim())
    }

    return metadata
  }

  /**
   * 评估内容质量
   */
  private assessContentQuality(content: string): 'high' | 'medium' | 'low' {
    const textLength = content.length
    const wordCount = content.split(/\s+/).length
    
    if (textLength > 1000 && wordCount > 100) {
      return 'high'
    } else if (textLength > 200 && wordCount > 20) {
      return 'medium'
    } else {
      return 'low'
    }
  }

  // 平台特定的爬取方法
  private async scrapeTikTok(url: string): Promise<NormalizedInput> {
    // TikTok爬取逻辑
    return this.scrapeUrl(url, 'tiktok')
  }

  private async scrapeYouTube(url: string): Promise<NormalizedInput> {
    // YouTube爬取逻辑
    return this.scrapeUrl(url, 'youtube')
  }

  private async scrapeInstagram(url: string): Promise<NormalizedInput> {
    // Instagram爬取逻辑
    return this.scrapeUrl(url, 'instagram')
  }

  private async scrapeFacebook(url: string): Promise<NormalizedInput> {
    // Facebook爬取逻辑
    return this.scrapeUrl(url, 'facebook')
  }
}
