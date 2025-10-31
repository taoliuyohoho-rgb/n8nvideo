// Admin 相关类型定义

export interface Product {
  id: string
  name: string
  description: string
  category: string
  subcategory: string
  sellingPoints: string[]
  skuImages: string[]
  targetCountries: string[]
  createdAt: string
  painPoints?: Array<string | { text?: string; painPoint?: string; [key: string]: any }>
  targetAudience?: string[]
}

export interface Style {
  id: string
  name: string
  description: string
  category: string
  subcategory: string
  tone: string
  scriptStructure: any
  visualStyle: any
  targetAudience: any
  productId: string | null
  productName?: string
  templatePerformance?: number
  hookPool?: string
  targetCountries?: string
  isActive: boolean
  createdAt: string
  product?: {
    id: string
    name: string
  }
}

export interface User {
  id: string
  email: string
  name: string
  role: string
  isActive: boolean
  createdAt: string
  password?: string
  lastLoginAt?: string
  _count: {
    videos: number
  }
}

export interface PainPoint {
  id: string
  productId: string
  productName: string
  category: string
  subcategory: string
  painPoint: string
  source: string
  confidence: number
  createdAt: string
  updatedAt: string
}

export interface Persona {
  id: string
  productId: string
  version: number
  coreIdentity: {
    name: string
    age: number
    gender: string
    location: string
    occupation: string
  }
  look: {
    generalAppearance: string
    hair: string
    clothingAesthetic: string
    signatureDetails: string
  }
  vibe: {
    traits: string[]
    demeanor: string
    communicationStyle: string
  }
  context: {
    hobbies: string
    values: string
    frustrations: string
    homeEnvironment: string
  }
  why: string
  createdBy: string | null
  createdAt: string
  updatedAt: string
  modelUsed?: any
  product?: {
    id: string
    name: string
    category: string
  }
}

export interface AIConfig {
  providers: {
    [key: string]: {
      apiKey: string
      baseUrl?: string
      enabled: boolean
    }
  }
  defaultModel: string
  fallbackModel: string
  maxTokens: number
  temperature: number
  timeout: number
}

export interface Prompt {
  id: string
  name: string
  businessModule: string
  content: string
  variables: string[]
  description?: string
  performance?: number
  usageCount: number
  successRate?: number
  isActive: boolean
  isDefault: boolean
  createdBy?: string
  createdAt: string
  updatedAt: string
  inputRequirements?: string
  outputRequirements?: string
  outputRules?: string
}

export interface Task {
  id: string
  type: string
  status: string
  productId?: string
  productName?: string
  personaId?: string
  personaName?: string
  styleId?: string
  styleName?: string
  scriptId?: string
  scriptContent?: string
  videoId?: string
  videoUrl?: string
  progress: number
  errorMessage?: string
  createdAt: string
  updatedAt: string
  completedAt?: string
}

export type ActiveTab = 'products' | 'tasks' | 'personas' | 'users' | 'ai-config' | 'prompts'
