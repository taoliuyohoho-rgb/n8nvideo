import { Plugin } from '../../core/types'

export interface InstagramConfig {
  accessToken: string
  appId: string
  appSecret: string
  baseUrl?: string
}

export interface InstagramPost {
  id: string
  caption: string
  mediaUrl: string
  mediaType: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM'
  likes: number
  comments: number
  timestamp: string
  permalink: string
}

export interface InstagramUser {
  id: string
  username: string
  accountType: 'PERSONAL' | 'BUSINESS' | 'CREATOR'
  mediaCount: number
  followersCount: number
  followsCount: number
  name: string
  biography: string
  website: string
  profilePictureUrl: string
  verified: boolean
}

export class InstagramDataSource implements Plugin {
  public readonly name = 'instagram-datasource'
  public readonly version = '1.0.0'
  public readonly description = 'Instagram data source plugin'
  public readonly dependencies = []

  private config: InstagramConfig

  constructor(config: InstagramConfig) {
    this.config = config
  }

  async install(): Promise<void> {
    console.log('Installing Instagram data source plugin...')
    // 验证配置
    if (!this.config.accessToken || !this.config.appId || !this.config.appSecret) {
      throw new Error('Instagram access token, app ID, and app secret are required')
    }
    console.log('Instagram data source plugin installed successfully')
  }

  async uninstall(): Promise<void> {
    console.log('Uninstalling Instagram data source plugin...')
    console.log('Instagram data source plugin uninstalled successfully')
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

  async fetchPosts(limit: number = 20): Promise<InstagramPost[]> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/v18.0/me/media`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.config.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) {
        throw new Error(`Instagram API error: ${response.statusText}`)
      }

      const data = await response.json()
      return data.data
    } catch (error) {
      console.error('Failed to fetch posts from Instagram:', error)
      throw error
    }
  }

  async fetchPost(postId: string): Promise<InstagramPost> {
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
        throw new Error(`Instagram API error: ${response.statusText}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Failed to fetch post from Instagram:', error)
      throw error
    }
  }

  async fetchUser(userId: string): Promise<InstagramUser> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/v18.0/${userId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.config.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) {
        throw new Error(`Instagram API error: ${response.statusText}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Failed to fetch user from Instagram:', error)
      throw error
    }
  }

  async createPost(caption: string, mediaUrl: string, mediaType: 'IMAGE' | 'VIDEO'): Promise<InstagramPost> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/v18.0/me/media`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            caption: caption,
            media_url: mediaUrl,
            media_type: mediaType
          })
        }
      )

      if (!response.ok) {
        throw new Error(`Instagram API error: ${response.statusText}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Failed to create post on Instagram:', error)
      throw error
    }
  }

  async updatePost(postId: string, caption: string): Promise<InstagramPost> {
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
            caption: caption
          })
        }
      )

      if (!response.ok) {
        throw new Error(`Instagram API error: ${response.statusText}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Failed to update post on Instagram:', error)
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
        throw new Error(`Instagram API error: ${response.statusText}`)
      }
    } catch (error) {
      console.error('Failed to delete post from Instagram:', error)
      throw error
    }
  }

  async syncPosts(): Promise<void> {
    try {
      // 同步帖子数据
      const posts = await this.fetchPosts()
      
      // 这里应该将数据同步到本地数据库
      console.log(`Synced ${posts.length} posts from Instagram`)
    } catch (error) {
      console.error('Failed to sync posts from Instagram:', error)
      throw error
    }
  }
}
