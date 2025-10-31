// 人设生成相关类型定义

export interface PersonaGenerationRequest {
  // 多选字段（新）
  categoryIds?: string[]
  productIds?: string[]
  // 单选字段（向后兼容）
  categoryId?: string
  productId?: string
  textDescription?: string
  targetCountry?: string
}

export interface PersonaGenerationResponse {
  success: boolean
  data?: {
    persona: PersonaContent
  }
  error?: string
}

export interface PersonaContent {
  basicInfo: {
    age: string
    gender: string
    occupation: string
    income: string
    location: string
  }
  behavior: {
    purchaseHabits: string
    usageScenarios: string
    decisionFactors: string
    brandPreference: string
  }
  preferences: {
    priceSensitivity: string
    featureNeeds: string[]
    qualityExpectations: string
    serviceExpectations: string
  }
  psychology: {
    values: string[]
    lifestyle: string
    painPoints: string[]
    motivations: string[]
  }
}

export interface CategoryInfo {
  id: string
  name: string
  description?: string
  parentId?: string
  level: number
  targetMarket?: string
  isActive: boolean
  children?: CategoryInfo[]
}

export interface ProductInfo {
  id: string
  name: string
  description?: string
  category: string
  categoryId?: string
  subcategory?: string
  sellingPoints?: string[]
  targetAudience?: any
  targetCountries?: string[]
}

export interface AIRecommendation {
  recommendedModel: {
    id: string
    name: string
    provider: string
    reason: string
    decisionId?: string
    alternatives?: Array<{
      id: string
      name: string
      reason: any
    }>
  }
  recommendedPrompt: {
    id: string
    content: string
    variables: string[]
    decisionId?: string
    fallback?: boolean
    alternatives?: Array<{
      id: string
      name: string
      reason: any
    }>
  }
}

export interface PersonaSaveRequest {
  name: string
  description?: string
  // 多选字段（新）
  categoryIds?: string[]
  productIds?: string[]
  // 单选字段（向后兼容）
  categoryId?: string
  productId?: string
  textDescription?: string
  generatedContent: PersonaContent
  aiModel: string
  promptTemplate: string
  generationParams?: any
}

export interface PersonaSaveResponse {
  success: boolean
  data?: {
    personaId: string
    message: string
  }
  error?: string
}

export interface PersonaListItem {
  id: string
  name: string
  description?: string
  // 多选字段（新）
  categoryIds?: string[]
  productIds?: string[]
  categoryNames?: string[]
  productNames?: string[]
  // 单选字段（向后兼容）
  categoryName?: string
  productName?: string
  categoryId?: string
  productId?: string
  createdAt: string
  updatedAt: string
  isActive: boolean
}

export interface PersonaListResponse {
  success: boolean
  data?: {
    personas: PersonaListItem[]
    total: number
    page: number
    pageSize: number
  }
  error?: string
}
