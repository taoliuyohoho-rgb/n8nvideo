import { Plugin } from '../../core/types'

export interface FacebookConfig {
  accessToken: string
  appId: string
  appSecret: string
  baseUrl?: string
}

export interface FacebookPost {
  id: string
  message: string
  videoUrl?: string
  imageUrl?: string
  link?: string
  likes: number
  shares: number
  comments: number
  createdAt: string
  updatedAt: string
}

export interface FacebookPage {
  id: string
  name: string
  category: string
  followers: number
  likes: number
  posts: number
  verified: boolean
  createdAt: string
}

export class FacebookDataSource implements Plugin {
  public readonly name = 'facebook-datasource'
  public readonly version = '1.0.0'
  public readonly description = 'Facebook data source plugin'
  public readonly dependencies = []

  private config: FacebookConfig

  constructor(config: FacebookConfig) {
    this.config = config
  }

  async install(): Promise<void> {
    console.log('Installing Facebook data source plugin...')
    // 验证配置
    if (!this.config.accessToken || !this.config.appId || !this.config.appSecret) {
      throw new Error('Facebook access token, app ID, and app secret are required')
    }
    console.log('Facebook data source plugin installed successfully')
  }

  async uninstall(): Promise<void> {
    console.log('Uninstalling Facebook data source plugin...')
    console.log('Facebook data source plugin uninstalled successfully')
  }

  getConfig() {
    return {
      enabled: true,
      settings: {
        appId: this.config.appId,
        baseUrl: this.config.baseUrl
      }
    }
  }

  async fetchPosts(limit: number = 20): Promise<FacebookPost[]> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/v18.0/me/posts`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.config.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) {
        throw new Error(`Facebook API error: ${response.statusText}`)
      }

      const data = await response.json()
      return data.data
    } catch (error) {
      console.error('Failed to fetch posts from Facebook:', error)
      throw error
    }
  }

  async fetchPost(postId: string): Promise<FacebookPost> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/v18.0/${postId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.config.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) {
        throw new Error(`Facebook API error: ${response.statusText}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Failed to fetch post from Facebook:', error)
      throw error
    }
  }

  async fetchPage(pageId: string): Promise<FacebookPage> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/v18.0/${pageId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.config.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) {
        throw new Error(`Facebook API error: ${response.statusText}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Failed to fetch page from Facebook:', error)
      throw error
    }
  }

  async createPost(message: string, videoUrl?: string, imageUrl?: string): Promise<FacebookPost> {
    try {
      const postData: any = {
        message: message
      }

      if (videoUrl) {
        postData.video_url = videoUrl
      }

      if (imageUrl) {
        postData.image_url = imageUrl
      }

      const response = await fetch(
        `${this.config.baseUrl}/v18.0/me/feed`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(postData)
        }
      )

      if (!response.ok) {
        throw new Error(`Facebook API error: ${response.statusText}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Failed to create post on Facebook:', error)
      throw error
    }
  }

  async updatePost(postId: string, message: string): Promise<FacebookPost> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/v18.0/${postId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: message
          })
        }
      )

      if (!response.ok) {
        throw new Error(`Facebook API error: ${response.statusText}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Failed to update post on Facebook:', error)
      throw error
    }
  }

  async deletePost(postId: string): Promise<void> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/v18.0/${postId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${this.config.accessToken}`
          }
        }
      )

      if (!response.ok) {
        throw new Error(`Facebook API error: ${response.statusText}`)
      }
    } catch (error) {
      console.error('Failed to delete post from Facebook:', error)
      throw error
    }
  }

  async syncPosts(): Promise<void> {
    try {
      // 同步帖子数据
      const posts = await this.fetchPosts()
      
      // 这里应该将数据同步到本地数据库
      console.log(`Synced ${posts.length} posts from Facebook`)
    } catch (error) {
      console.error('Failed to sync posts from Facebook:', error)
      throw error
    }
  }
}
