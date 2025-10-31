/**
 * API服务统一导出
 * 提供所有API服务的统一入口
 */

// 核心API客户端
export { ApiClient, apiClient, createApiClient } from './ApiClient'
export type { ApiResponse, ApiRequestOptions } from './ApiClient'

// API端点常量
export { API_ENDPOINTS } from './endpoints'
export type { ApiEndpoints, EndpointPath } from './endpoints'

// 具体服务
export { RecommendationService, recommendationService } from './services/RecommendationService'
export type { RecommendRankRequest, RecommendRankResponse, RecommendFeedbackRequest } from './services/RecommendationService'

export { AdminService, adminService } from './services/AdminService'
export type { PromptTemplate, PromptRule, Persona } from './services/AdminService'

export { ProductService, productService } from './services/ProductService'
export type { Product, ProductQueryParams, ProductListResponse, UnifiedAnalyzeRequest } from './services/ProductService'

// 便捷方法：创建带错误处理的API调用
export const createApiCall = <T = any>(
  apiCall: () => Promise<{ success: boolean; data?: T; error?: any }>
) => {
  return async (): Promise<T> => {
    const response = await apiCall()
    
    if (!response.success) {
      throw new Error(response.error?.message || 'API call failed')
    }
    
    return response.data as T
  }
}

