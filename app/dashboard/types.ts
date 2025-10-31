// Dashboard 相关类型定义

export interface User {
  id: string
  email: string
  name: string
  role: string
  createdAt: string
  lastLoginAt?: string
}

export interface DashboardStats {
  dashboard: {
    totalVideos: number
    totalProducts: number
    usageDays: number
    efficiency: number
    efficiencyNote?: string
  }
  videos: {
    monthlyVideos: number
    weeklyVideos: number
    dailyVideos: number
  }
  products: {
    totalProducts: number
    categories: string[]
  }
  users: {
    totalUsers: number
    activeUsers: number
  }
}

export interface Product {
  id: string
  name: string
  description: string
  category: string
  subcategory: string
  sellingPoints: Array<string | { point: string; source: string }>
  skuImages: string[]
  targetCountries: string[]
  targetAudience?: string[]
  painPoints?: Array<string | { text?: string; painPoint?: string; [key: string]: any }>
  painPointsLastUpdate?: string
  painPointsSource?: string
  createdAt: string
  updatedAt?: string
}

export interface HistoryItem {
  id: string
  type: 'video' | 'product' | 'user' | 'system'
  action: string
  description: string
  timestamp: string
  user: string
  status: 'success' | 'error' | 'pending'
}

export type ActiveTab = 'home' | 'video' | 'products' | 'history' | 'settings'

export interface UserUsageStats {
  id: string
  email: string
  name: string
  role: string
  organizationId: string | null
  organizationName: string
  videoCount: number
  personaCount: number
  scriptCount: number
  productCount: number
  totalActions: number
  lastActivity: string | null
  createdAt: string
}
