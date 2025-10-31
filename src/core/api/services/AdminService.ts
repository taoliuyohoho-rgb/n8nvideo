/**
 * 管理员服务API
 * 封装管理员相关的API调用
 */

import { apiClient } from '../ApiClient'
import { API_ENDPOINTS } from '../endpoints'

export interface PromptTemplate {
  id?: string
  name: string
  businessModule: string
  content: string
  variables?: string
  description?: string
  performance?: number
  usageCount?: number
  successRate?: number
  isActive?: boolean
  isDefault?: boolean
  createdBy?: string
  inputRequirements?: string
  outputRequirements?: string
  outputRules?: string
}

export interface PromptRule {
  id?: string
  businessModule: string
  inputFormat: string
  outputFormat: string
  analysisMethod: string
}

export interface Persona {
  id?: string
  name: string
  description: string
  characteristics: string[]
  painPoints: string[]
  preferences: string[]
  demographics: {
    age?: string
    gender?: string
    location?: string
    income?: string
  }
  isActive?: boolean
}

export class AdminService {
  // Prompt Templates
  async getPrompts() {
    return apiClient.get<PromptTemplate[]>(API_ENDPOINTS.ADMIN.PROMPTS.LIST)
  }

  async createPrompt(prompt: Omit<PromptTemplate, 'id'>) {
    return apiClient.post<PromptTemplate>(API_ENDPOINTS.ADMIN.PROMPTS.CREATE, prompt)
  }

  async updatePrompt(id: string, prompt: Partial<PromptTemplate>) {
    return apiClient.put<PromptTemplate>(API_ENDPOINTS.ADMIN.PROMPTS.UPDATE(id), prompt)
  }

  async deletePrompt(id: string) {
    return apiClient.delete(API_ENDPOINTS.ADMIN.PROMPTS.DELETE(id))
  }

  async rewritePrompt(prompt: { id: string; content: string }) {
    return apiClient.post(API_ENDPOINTS.ADMIN.PROMPTS.REWRITE, prompt)
  }

  async generatePrompt(request: { businessModule: string; requirements: string }) {
    return apiClient.post(API_ENDPOINTS.ADMIN.PROMPTS.GENERATE, request)
  }

  async cleanupUnusedModules() {
    return apiClient.post(API_ENDPOINTS.ADMIN.PROMPTS.CLEANUP)
  }

  async initDefaultPrompts() {
    return apiClient.post(API_ENDPOINTS.ADMIN.PROMPTS.INIT_DEFAULTS)
  }

  // Prompt Rules
  async getPromptRules() {
    return apiClient.get<PromptRule[]>(API_ENDPOINTS.ADMIN.PROMPT_RULES.LIST)
  }

  async createPromptRule(rule: Omit<PromptRule, 'id'>) {
    return apiClient.post<PromptRule>(API_ENDPOINTS.ADMIN.PROMPT_RULES.CREATE, rule)
  }

  async updatePromptRule(id: string, rule: Partial<PromptRule>) {
    return apiClient.put<PromptRule>(API_ENDPOINTS.ADMIN.PROMPT_RULES.UPDATE(id), rule)
  }

  async deletePromptRule(id: string) {
    return apiClient.delete(API_ENDPOINTS.ADMIN.PROMPT_RULES.DELETE(id))
  }

  async validatePromptRule(rule: PromptRule) {
    return apiClient.post(API_ENDPOINTS.ADMIN.PROMPT_RULES.VALIDATE, rule)
  }

  async initDefaultPromptRules() {
    return apiClient.post(API_ENDPOINTS.ADMIN.PROMPT_RULES.INIT_DEFAULTS)
  }

  // Personas
  async getPersonas() {
    return apiClient.get<Persona[]>(API_ENDPOINTS.ADMIN.PERSONAS.LIST)
  }

  async createPersona(persona: Omit<Persona, 'id'>) {
    return apiClient.post<Persona>(API_ENDPOINTS.ADMIN.PERSONAS.CREATE, persona)
  }

  async updatePersona(id: string, persona: Partial<Persona>) {
    return apiClient.put<Persona>(API_ENDPOINTS.ADMIN.PERSONAS.UPDATE(id), persona)
  }

  async deletePersona(id: string) {
    return apiClient.delete(API_ENDPOINTS.ADMIN.PERSONAS.DELETE(id))
  }

  // AI Config
  async testAIConfig(config: any) {
    return apiClient.post(API_ENDPOINTS.ADMIN.AI_CONFIG.TEST, config)
  }

  async syncAIConfig() {
    return apiClient.post(API_ENDPOINTS.ADMIN.AI_CONFIG.SYNC)
  }

  // Providers
  async verifyProviders() {
    return apiClient.post(API_ENDPOINTS.ADMIN.PROVIDERS.VERIFY)
  }

  // Recommendation
  async getRecommendationSettings() {
    return apiClient.get(API_ENDPOINTS.ADMIN.RECOMMENDATION.SETTINGS)
  }

  async updateRecommendationSettings(settings: any) {
    return apiClient.put(API_ENDPOINTS.ADMIN.RECOMMENDATION.SETTINGS, settings)
  }

  async getRecommendationStats() {
    return apiClient.get(API_ENDPOINTS.ADMIN.RECOMMENDATION.STATS)
  }

  // Estimation
  async getSegmentMetrics() {
    return apiClient.get(API_ENDPOINTS.ADMIN.ESTIMATION.SEGMENT_METRICS)
  }

  async getDecisionStats() {
    return apiClient.get(API_ENDPOINTS.ADMIN.ESTIMATION.DECISION_STATS)
  }
}

// 导出单例
export const adminService = new AdminService()

