// 提示词规则类型定义

export interface PromptRule {
  id: string
  businessModule: string
  inputFormat: string
  outputFormat: string
  analysisMethod: string
  createdAt: Date
  updatedAt: Date
}

export interface PromptRuleFormData {
  businessModule: string
  inputFormat: string
  outputFormat: string
  analysisMethod: string
}

export interface PromptRuleValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export interface BusinessModuleRuleSummary {
  businessModule: string
  inputFormat: string
  outputFormat: string
  analysisMethod: string
  hasRule: boolean
}

// 业务模块类型
export type BusinessModule = 
  | 'product-analysis' 
  | 'competitor-analysis'
  | 'persona-analysis' 
  | 'persona.generate'
  | 'video-script' 
  | 'video-generation'
  | 'ai-reverse-engineer'

// API响应类型
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// 规则管理状态
export interface PromptRulesState {
  rules: Record<string, PromptRule>
  currentModule: BusinessModule
  loading: boolean
  editing: boolean
}
