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
  createdAt: Date
  updatedAt: Date
  painPoints: string[]
  targetAudience: string[]
}

