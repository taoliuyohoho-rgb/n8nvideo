/**
 * 用户相关类型定义
 */

export interface User {
  id: string
  email: string
  name: string
  role: string
  isActive: boolean
  createdAt: string
  password?: string
  organizationId?: string | null
  organization?: {
    id: string
    name: string
  }
  _count: {
    videos: number
  }
}

