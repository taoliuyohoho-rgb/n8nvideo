import { Plugin } from '../../core/types'

export interface VideoGeneratorConfig {
  apiKey: string
  model: string
  baseUrl?: string
}

export class SoraVideoGenerator implements Plugin {
  public readonly name = 'sora-video-generator'
  public readonly version = '1.0.0'
  public readonly description = 'OpenAI Sora video generator plugin'
  public readonly dependencies = ['ai-service']

  private config: VideoGeneratorConfig

  constructor(config: VideoGeneratorConfig) {
    this.config = config
  }

  async install(): Promise<void> {
    console.log('Installing Sora video generator plugin...')
    // 验证配置
    if (!this.config.apiKey) {
      throw new Error('Sora API key is required')
    }
    console.log('Sora video generator plugin installed successfully')
  }

  async uninstall(): Promise<void> {
    console.log('Uninstalling Sora video generator plugin...')
    console.log('Sora video generator plugin uninstalled successfully')
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

  async generate(prompt: string, config: any): Promise<any> {
    try {
      // 调用Sora API生成视频
      const response = await fetch(`${this.config.baseUrl}/v1/videos/generations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.config.model,
          prompt: prompt,
          ...config
        })
      })

      if (!response.ok) {
        throw new Error(`Sora API error: ${response.statusText}`)
      }

      const result = await response.json()
      
      return {
        id: result.id,
        url: result.video_url,
        status: 'generating',
        metadata: {
          model: this.config.model,
          prompt: prompt,
          config: config
        },
        createdAt: new Date()
      }
    } catch (error) {
      console.error('Failed to generate video with Sora:', error)
      throw error
    }
  }

  async getStatus(videoId: string): Promise<any> {
    try {
      const response = await fetch(`${this.config.baseUrl}/v1/videos/${videoId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`
        }
      })

      if (!response.ok) {
        throw new Error(`Sora API error: ${response.statusText}`)
      }

      const result = await response.json()
      
      return {
        id: result.id,
        url: result.video_url,
        status: result.status,
        metadata: result.metadata,
        createdAt: new Date(result.created_at)
      }
    } catch (error) {
      console.error('Failed to get video status from Sora:', error)
      throw error
    }
  }

  async cancel(videoId: string): Promise<void> {
    try {
      const response = await fetch(`${this.config.baseUrl}/v1/videos/${videoId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`
        }
      })

      if (!response.ok) {
        throw new Error(`Sora API error: ${response.statusText}`)
      }
    } catch (error) {
      console.error('Failed to cancel video generation:', error)
      throw error
    }
  }
}
