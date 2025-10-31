import type { Plugin } from '../../core/types'

export interface GeminiConfig {
  apiKey: string
  model: string
  baseUrl?: string
}

export class GeminiAIService implements Plugin {
  public readonly name = 'gemini-ai-service'
  public readonly version = '1.0.0'
  public readonly description = 'Google Gemini AI service plugin'
  public readonly dependencies = []

  private config: GeminiConfig

  constructor(config: GeminiConfig) {
    this.config = config
  }

  async install(): Promise<void> {
    console.log('Installing Gemini AI service plugin...')
    // 验证配置
    if (!this.config.apiKey) {
      throw new Error('Gemini API key is required')
    }
    console.log('Gemini AI service plugin installed successfully')
  }

  async uninstall(): Promise<void> {
    console.log('Uninstalling Gemini AI service plugin...')
    console.log('Gemini AI service plugin uninstalled successfully')
  }

  getConfig() {
    return {
      enabled: true,
      settings: {
        model: this.config.model,
        baseUrl: this.config.baseUrl
      }
    }
  }

  async analyzeVideo(videoUrl: string): Promise<any> {
    try {
      // 调用Gemini API分析视频
      const response = await fetch(`${this.config.baseUrl}/v1/models/${this.config.model}:analyzeContent`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Analyze this video: ${videoUrl}. Provide script structure, editing rhythm, visual style, tone, and target audience.`
            }]
          }]
        })
      })

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.statusText}`)
      }

      const result = await response.json()
      
      return {
        scriptStructure: result.scriptStructure || 'Unknown',
        editingRhythm: result.editingRhythm || 'Unknown',
        visualStyle: result.visualStyle || 'Unknown',
        tone: result.tone || 'Unknown',
        targetAudience: result.targetAudience || [],
        performanceScore: result.performanceScore || 0
      }
    } catch (error) {
      console.error('Failed to analyze video with Gemini:', error)
      throw error
    }
  }

  async generatePrompt(context: any): Promise<string> {
    try {
      // 调用Gemini API生成prompt
      const response = await fetch(`${this.config.baseUrl}/v1/models/${this.config.model}:generateContent`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Generate a video prompt based on this context: ${JSON.stringify(context)}`
            }]
          }]
        })
      })

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.statusText}`)
      }

      const result = await response.json()
      return result.candidates[0].content.parts[0].text
    } catch (error) {
      console.error('Failed to generate prompt with Gemini:', error)
      throw error
    }
  }

  async analyzeText(text: string): Promise<any> {
    try {
      // 调用Gemini API分析文本
      const response = await fetch(`${this.config.baseUrl}/v1/models/${this.config.model}:analyzeContent`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Analyze this text: ${text}`
            }]
          }]
        })
      })

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.statusText}`)
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('Failed to analyze text with Gemini:', error)
      throw error
    }
  }
}
