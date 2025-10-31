import type { Plugin } from '../../core/types'

export interface ShopifyConfig {
  shopDomain: string
  accessToken: string
  apiVersion: string
}

export interface ShopifyProduct {
  id: string
  title: string
  description: string
  vendor: string
  product_type: string
  tags: string[]
  variants: ShopifyVariant[]
  images: ShopifyImage[]
  created_at: string
  updated_at: string
}

export interface ShopifyVariant {
  id: string
  title: string
  price: string
  sku: string
  inventory_quantity: number
  weight: number
  weight_unit: string
}

export interface ShopifyImage {
  id: string
  src: string
  alt: string
  position: number
}

export class ShopifyDataSource implements Plugin {
  public readonly name = 'shopify-datasource'
  public readonly version = '1.0.0'
  public readonly description = 'Shopify data source plugin'
  public readonly dependencies = []

  private config: ShopifyConfig

  constructor(config: ShopifyConfig) {
    this.config = config
  }

  async install(): Promise<void> {
    console.log('Installing Shopify data source plugin...')
    // 验证配置
    if (!this.config.shopDomain || !this.config.accessToken) {
      throw new Error('Shopify shop domain and access token are required')
    }
    console.log('Shopify data source plugin installed successfully')
  }

  async uninstall(): Promise<void> {
    console.log('Uninstalling Shopify data source plugin...')
    console.log('Shopify data source plugin uninstalled successfully')
  }

  getConfig() {
    return {
      enabled: true,
      settings: {
        shopDomain: this.config.shopDomain,
        apiVersion: this.config.apiVersion
      }
    }
  }

  async fetchProducts(): Promise<ShopifyProduct[]> {
    try {
      const response = await fetch(
        `https://${this.config.shopDomain}/admin/api/${this.config.apiVersion}/products.json`,
        {
          method: 'GET',
          headers: {
            'X-Shopify-Access-Token': this.config.accessToken,
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) {
        throw new Error(`Shopify API error: ${response.statusText}`)
      }

      const data = await response.json()
      return data.products
    } catch (error) {
      console.error('Failed to fetch products from Shopify:', error)
      throw error
    }
  }

  async fetchProduct(productId: string): Promise<ShopifyProduct> {
    try {
      const response = await fetch(
        `https://${this.config.shopDomain}/admin/api/${this.config.apiVersion}/products/${productId}.json`,
        {
          method: 'GET',
          headers: {
            'X-Shopify-Access-Token': this.config.accessToken,
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) {
        throw new Error(`Shopify API error: ${response.statusText}`)
      }

      const data = await response.json()
      return data.product
    } catch (error) {
      console.error('Failed to fetch product from Shopify:', error)
      throw error
    }
  }

  async updateProduct(productId: string, updates: Partial<ShopifyProduct>): Promise<ShopifyProduct> {
    try {
      const response = await fetch(
        `https://${this.config.shopDomain}/admin/api/${this.config.apiVersion}/products/${productId}.json`,
        {
          method: 'PUT',
          headers: {
            'X-Shopify-Access-Token': this.config.accessToken,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            product: updates
          })
        }
      )

      if (!response.ok) {
        throw new Error(`Shopify API error: ${response.statusText}`)
      }

      const data = await response.json()
      return data.product
    } catch (error) {
      console.error('Failed to update product in Shopify:', error)
      throw error
    }
  }

  async createProduct(product: Omit<ShopifyProduct, 'id' | 'created_at' | 'updated_at'>): Promise<ShopifyProduct> {
    try {
      const response = await fetch(
        `https://${this.config.shopDomain}/admin/api/${this.config.apiVersion}/products.json`,
        {
          method: 'POST',
          headers: {
            'X-Shopify-Access-Token': this.config.accessToken,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            product: product
          })
        }
      )

      if (!response.ok) {
        throw new Error(`Shopify API error: ${response.statusText}`)
      }

      const data = await response.json()
      return data.product
    } catch (error) {
      console.error('Failed to create product in Shopify:', error)
      throw error
    }
  }

  async deleteProduct(productId: string): Promise<void> {
    try {
      const response = await fetch(
        `https://${this.config.shopDomain}/admin/api/${this.config.apiVersion}/products/${productId}.json`,
        {
          method: 'DELETE',
          headers: {
            'X-Shopify-Access-Token': this.config.accessToken
          }
        }
      )

      if (!response.ok) {
        throw new Error(`Shopify API error: ${response.statusText}`)
      }
    } catch (error) {
      console.error('Failed to delete product from Shopify:', error)
      throw error
    }
  }

  async syncProducts(): Promise<void> {
    try {
      // 同步产品数据
      const products = await this.fetchProducts()
      
      // 这里应该将数据同步到本地数据库
      console.log(`Synced ${products.length} products from Shopify`)
    } catch (error) {
      console.error('Failed to sync products from Shopify:', error)
      throw error
    }
  }
}
