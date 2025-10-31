/**
 * 商品服务API
 * 封装商品相关的API调用
 */

import { apiClient } from '../ApiClient'
import { API_ENDPOINTS } from '../endpoints'

export interface Product {
  id: string
  name: string
  description?: string
  category: string
  subcategory?: string
  sellingPoints?: any
  skuImages?: string
  targetCountries?: string
  targetAudience?: any
  source: string
  sourceUserId?: string
  organizationId?: string
  isUserGenerated: boolean
  needsReview: boolean
  lastUserUpdate?: string
  createdAt: string
  updatedAt: string
  painPoints?: any
  painPointsLastUpdate?: string
  painPointsSource?: string
  images: string[]
  country: string[]
  sellingPointsTop5: string[]
  painPointsTop5: string[]
  targetMarkets: string[]
  targetAudiences: string[]
  evidenceLastUpdate?: string
  metadata?: any
}

export interface ProductQueryParams {
  search?: string
  category?: string
  limit?: number
  offset?: number
}

export interface ProductListResponse {
  products: Product[]
  total: number
  hasMore: boolean
}

export interface UnifiedAnalyzeRequest {
  productId: string
  input: {
    type: 'text' | 'multimodal'
    content: string
    images?: string[]
  }
  options?: {
    enableCaching?: boolean
    enableParallelProcessing?: boolean
    maxRetries?: number
  }
}

export class ProductService {
  /**
   * 获取商品列表
   */
  async getProducts(params: ProductQueryParams = {}) {
    const searchParams = new URLSearchParams()
    
    if (params.search) searchParams.set('search', params.search)
    if (params.category) searchParams.set('category', params.category)
    if (params.limit) searchParams.set('limit', params.limit.toString())
    if (params.offset) searchParams.set('offset', params.offset.toString())

    const queryString = searchParams.toString()
    const endpoint = queryString ? `${API_ENDPOINTS.PRODUCTS.LIST}?${queryString}` : API_ENDPOINTS.PRODUCTS.LIST

    return apiClient.get<ProductListResponse>(endpoint)
  }

  /**
   * 获取单个商品
   */
  async getProduct(id: string) {
    return apiClient.get<Product>(API_ENDPOINTS.PRODUCTS.UPDATE(id))
  }

  /**
   * 创建商品
   */
  async createProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) {
    return apiClient.post<Product>(API_ENDPOINTS.PRODUCTS.CREATE, product)
  }

  /**
   * 更新商品
   */
  async updateProduct(id: string, product: Partial<Product>) {
    return apiClient.put<Product>(API_ENDPOINTS.PRODUCTS.UPDATE(id), product)
  }

  /**
   * 删除商品
   */
  async deleteProduct(id: string) {
    return apiClient.delete(API_ENDPOINTS.PRODUCTS.DELETE(id))
  }

  /**
   * 统一分析商品
   */
  async unifiedAnalyze(request: UnifiedAnalyzeRequest) {
    return apiClient.post(API_ENDPOINTS.PRODUCTS.UNIFIED_ANALYZE, request)
  }
}

// 导出单例
export const productService = new ProductService()

