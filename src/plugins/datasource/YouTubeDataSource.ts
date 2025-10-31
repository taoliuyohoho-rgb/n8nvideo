import type { Plugin } from '../../core/types'

export interface YouTubeConfig {
  apiKey: string
  channelId: string
  baseUrl?: string
}

export interface YouTubeVideo {
  id: string
  title: string
  description: string
  thumbnailUrl: string
  videoUrl: string
  duration: string
  viewCount: number
  likeCount: number
  commentCount: number
  publishedAt: string
  channelTitle: string
  tags: string[]
}

export interface YouTubeChannel {
  id: string
  title: string
  description: string
  thumbnailUrl: string
  subscriberCount: number
  videoCount: number
  viewCount: number
  publishedAt: string
  country: string
  customUrl: string
}

export class YouTubeDataSource implements Plugin {
  public readonly name = 'youtube-datasource'
  public readonly version = '1.0.0'
  public readonly description = 'YouTube data source plugin'
  public readonly dependencies = []

  private config: YouTubeConfig

  constructor(config: YouTubeConfig) {
    this.config = config
  }

  async install(): Promise<void> {
    console.log('Installing YouTube data source plugin...')
    // 验证配置
    if (!this.config.apiKey || !this.config.channelId) {
      throw new Error('YouTube API key and channel ID are required')
    }
    console.log('YouTube data source plugin installed successfully')
  }

  async uninstall(): Promise<void> {
    console.log('Uninstalling YouTube data source plugin...')
    console.log('YouTube data source plugin uninstalled successfully')
  }

  getConfig() {
    return {
      enabled: true,
      settings: {
        channelId: this.config.channelId,
        baseUrl: this.config.baseUrl
      }
    }
  }

  async fetchVideos(limit: number = 20): Promise<YouTubeVideo[]> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/v3/search?part=snippet&channelId=${this.config.channelId}&type=video&maxResults=${limit}&key=${this.config.apiKey}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) {
        throw new Error(`YouTube API error: ${response.statusText}`)
      }

      const data = await response.json()
      return data.items.map((item: any) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnailUrl: item.snippet.thumbnails.high.url,
        videoUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        duration: '',
        viewCount: 0,
        likeCount: 0,
        commentCount: 0,
        publishedAt: item.snippet.publishedAt,
        channelTitle: item.snippet.channelTitle,
        tags: item.snippet.tags || []
      }))
    } catch (error) {
      console.error('Failed to fetch videos from YouTube:', error)
      throw error
    }
  }

  async fetchVideo(videoId: string): Promise<YouTubeVideo> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/v3/videos?part=snippet,statistics,contentDetails&id=${videoId}&key=${this.config.apiKey}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) {
        throw new Error(`YouTube API error: ${response.statusText}`)
      }

      const data = await response.json()
      const item = data.items[0]
      
      return {
        id: item.id,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnailUrl: item.snippet.thumbnails.high.url,
        videoUrl: `https://www.youtube.com/watch?v=${item.id}`,
        duration: item.contentDetails.duration,
        viewCount: parseInt(item.statistics.viewCount),
        likeCount: parseInt(item.statistics.likeCount),
        commentCount: parseInt(item.statistics.commentCount),
        publishedAt: item.snippet.publishedAt,
        channelTitle: item.snippet.channelTitle,
        tags: item.snippet.tags || []
      }
    } catch (error) {
      console.error('Failed to fetch video from YouTube:', error)
      throw error
    }
  }

  async fetchChannel(): Promise<YouTubeChannel> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/v3/channels?part=snippet,statistics&id=${this.config.channelId}&key=${this.config.apiKey}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) {
        throw new Error(`YouTube API error: ${response.statusText}`)
      }

      const data = await response.json()
      const item = data.items[0]
      
      return {
        id: item.id,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnailUrl: item.snippet.thumbnails.high.url,
        subscriberCount: parseInt(item.statistics.subscriberCount),
        videoCount: parseInt(item.statistics.videoCount),
        viewCount: parseInt(item.statistics.viewCount),
        publishedAt: item.snippet.publishedAt,
        country: item.snippet.country,
        customUrl: item.snippet.customUrl
      }
    } catch (error) {
      console.error('Failed to fetch channel from YouTube:', error)
      throw error
    }
  }

  async searchVideos(query: string, limit: number = 20): Promise<YouTubeVideo[]> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=${limit}&key=${this.config.apiKey}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) {
        throw new Error(`YouTube API error: ${response.statusText}`)
      }

      const data = await response.json()
      return data.items.map((item: any) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnailUrl: item.snippet.thumbnails.high.url,
        videoUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        duration: '',
        viewCount: 0,
        likeCount: 0,
        commentCount: 0,
        publishedAt: item.snippet.publishedAt,
        channelTitle: item.snippet.channelTitle,
        tags: item.snippet.tags || []
      }))
    } catch (error) {
      console.error('Failed to search videos on YouTube:', error)
      throw error
    }
  }

  async syncVideos(): Promise<void> {
    try {
      // 同步视频数据
      const videos = await this.fetchVideos()
      
      // 这里应该将数据同步到本地数据库
      console.log(`Synced ${videos.length} videos from YouTube`)
    } catch (error) {
      console.error('Failed to sync videos from YouTube:', error)
      throw error
    }
  }
}
