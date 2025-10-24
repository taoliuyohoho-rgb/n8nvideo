import { Plugin } from '../../core/types'

export interface TikTokConfig {
  accessToken: string
  clientKey: string
  clientSecret: string
  baseUrl?: string
}

export interface TikTokVideo {
  id: string
  title: string
  description: string
  videoUrl: string
  thumbnailUrl: string
  duration: number
  views: number
  likes: number
  shares: number
  comments: number
  hashtags: string[]
  createdAt: string
  updatedAt: string
}

export interface TikTokUser {
  id: string
  username: string
  displayName: string
  avatarUrl: string
  followers: number
  following: number
  videos: number
  likes: number
  verified: boolean
  createdAt: string
}

export class TikTokDataSource implements Plugin {
  public readonly name = 'tiktok-datasource'
  public readonly version = '1.0.0'
  public readonly description = 'TikTok data source plugin'
  public readonly dependencies = []

  private config: TikTokConfig

  constructor(config: TikTokConfig) {
    this.config = config
  }

  async install(): Promise<void> {
    console.log('Installing TikTok data source plugin...')
    // 验证配置
    if (!this.config.accessToken || !this.config.clientKey || !this.config.clientSecret) {
      throw new Error('TikTok access token, client key, and client secret are required')
    }
    console.log('TikTok data source plugin installed successfully')
  }

  async uninstall(): Promise<void> {
    console.log('Uninstalling TikTok data source plugin...')
    console.log('TikTok data source plugin uninstalled successfully')
  }

  getConfig() {
    return {
      enabled: true,
      settings: {
        clientKey: this.config.clientKey,
        baseUrl: this.config.baseUrl
      }
    }
  }

  async fetchVideos(limit: number = 20): Promise<TikTokVideo[]> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/v1/videos`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.config.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) {
        throw new Error(`TikTok API error: ${response.statusText}`)
      }

      const data = await response.json()
      return data.videos
    } catch (error) {
      console.error('Failed to fetch videos from TikTok:', error)
      throw error
    }
  }

  async fetchVideo(videoId: string): Promise<TikTokVideo> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/v1/videos/${videoId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.config.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) {
        throw new Error(`TikTok API error: ${response.statusText}`)
      }

      const data = await response.json()
      return data.video
    } catch (error) {
      console.error('Failed to fetch video from TikTok:', error)
      throw error
    }
  }

  async fetchUser(userId: string): Promise<TikTokUser> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/v1/users/${userId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.config.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) {
        throw new Error(`TikTok API error: ${response.statusText}`)
      }

      const data = await response.json()
      return data.user
    } catch (error) {
      console.error('Failed to fetch user from TikTok:', error)
      throw error
    }
  }

  async fetchTrendingVideos(limit: number = 20): Promise<TikTokVideo[]> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/v1/videos/trending`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.config.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) {
        throw new Error(`TikTok API error: ${response.statusText}`)
      }

      const data = await response.json()
      return data.videos
    } catch (error) {
      console.error('Failed to fetch trending videos from TikTok:', error)
      throw error
    }
  }

  async fetchHashtagVideos(hashtag: string, limit: number = 20): Promise<TikTokVideo[]> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/v1/hashtags/${hashtag}/videos`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.config.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) {
        throw new Error(`TikTok API error: ${response.statusText}`)
      }

      const data = await response.json()
      return data.videos
    } catch (error) {
      console.error('Failed to fetch hashtag videos from TikTok:', error)
      throw error
    }
  }

  async syncVideos(): Promise<void> {
    try {
      // 同步视频数据
      const videos = await this.fetchVideos()
      
      // 这里应该将数据同步到本地数据库
      console.log(`Synced ${videos.length} videos from TikTok`)
    } catch (error) {
      console.error('Failed to sync videos from TikTok:', error)
      throw error
    }
  }
}
