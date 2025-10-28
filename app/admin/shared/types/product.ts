/**
 * 商品类型定义
 */

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

