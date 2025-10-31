/**
 * 商品管理 Hook
 * 
 * 功能：
 * - 商品选择/删除/保存/更新
 * - 批量上传
 * - 保持原有业务逻辑不变
 */

import { useState } from 'react'
import type { Product } from '../shared/types/product'
import type { ProductManagementActions, ProductManagementState } from '@/types/admin-management'
import { useCategoryConfig } from './useCategoryConfig'

interface UseProductManagementProps {
  products: Product[]
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>
  showSuccess: (message: string) => void
  showError: (message: string) => void
  deleteProduct: (productId: string) => Promise<{ success: boolean; message?: string; error?: string }>
}

export function useProductManagement({
  products,
  setProducts,
  showSuccess,
  showError,
  deleteProduct
}: UseProductManagementProps): ProductManagementActions & ProductManagementState {
  // 状态管理
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  
  // 使用统一的类目配置 Hook
  const {
    categories: managedCategories,
    subcategories: managedSubcategories,
    countries: managedCountries,
    loading: categoriesLoading,
    error: categoriesError,
    refreshConfig: refreshCategoriesConfig,
    updateCategories,
    updateSubcategories,
    updateCountries
  } = useCategoryConfig()

  // 处理商品删除
  const handleDeleteProduct = async (productId: string) => {
    const product = products.find(p => p.id === productId)
    if (!product) return

    const confirmed = window.confirm(`确定要删除商品"${product.name}"吗？此操作不可撤销。`)
    if (!confirmed) return

    const result = await deleteProduct(productId)
    
    if (result.success) {
      showSuccess(result.message || '删除成功')
      // 从选中列表中移除已删除的商品
      setSelectedProducts(prev => prev.filter(id => id !== productId))
    } else {
      showError(result.error || '删除失败')
    }
  }

  // 处理商品选择
  const handleSelectProduct = (productId: string, selected: boolean) => {
    if (selected) {
      setSelectedProducts(prev => [...prev, productId])
    } else {
      setSelectedProducts(prev => prev.filter(id => id !== productId))
    }
  }

  // 处理全选
  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedProducts(products.map(p => p.id))
    } else {
      setSelectedProducts([])
    }
  }

  // 刷新商品数据
  const handleRefresh = async () => {
    try {
      console.log('[useProductManagement] 开始刷新商品数据...')
      const response = await fetch('/api/products')
      const result = await response.json()
      if (result.success) {
        console.log('[useProductManagement] 商品数据刷新成功，更新数量:', result.data.products.length)
        setProducts(result.data.products)
        showSuccess('商品数据已刷新')
      } else {
        console.error('[useProductManagement] 商品数据刷新失败:', result.error)
        showError(result.error || '刷新失败')
      }
    } catch (error) {
      console.error('[useProductManagement] 刷新失败:', error)
      showError('刷新失败')
    }
  }

  // 处理商品保存
  const handleProductSave = async (productData: Omit<Product, 'id' | 'createdAt'>) => {
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      })
      const result = await response.json()
      
      if (result.success) {
        showSuccess('商品添加成功')
        // 刷新商品列表
        await handleRefresh()
      } else {
        showError(result.error || '添加失败')
      }
    } catch (error) {
      showError('添加失败，请重试')
    }
  }

  // 处理商品更新
  const handleProductUpdate = async (productId: string, productData: Partial<Omit<Product, 'id' | 'createdAt'>>) => {
    console.log('handleProductUpdate called:', { productId, productData })
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      })
      const result = await response.json()
      console.log('API response:', result)
      
      if (result.success) {
        showSuccess('商品更新成功')
        // 直接更新本地状态，避免依赖刷新
        setProducts((prevProducts: Product[]) => 
          prevProducts.map((product: Product) => 
            product.id === productId 
              ? { ...product, ...productData }
              : product
          )
        )
      } else {
        console.error('API error:', result.error)
        showError(result.error || '更新失败')
      }
    } catch (error) {
      console.error('Network error:', error)
      showError('更新失败，请重试')
    }
  }

  // 处理批量上传
  const handleBulkUploadFile = async (file: File) => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'products')

      const response = await fetch('/api/admin/bulk-upload', {
        method: 'POST',
        body: formData
      })
      const result = await response.json()
      
      if (result.success) {
        showSuccess(`批量上传成功，处理了 ${result.processed} 条记录`)
        // 刷新商品列表
        await handleRefresh()
      } else {
        showError(result.error || '批量上传失败')
      }
    } catch (error) {
      showError('批量上传失败，请重试')
    }
  }

  return {
    // 状态
    selectedProducts,
    managedCategories,
    managedSubcategories,
    managedCountries,
    // 状态更新函数
    setSelectedProducts,
    setManagedCategories: (categories: string[]) => updateCategories(categories),
    setManagedSubcategories: (subcategories: string[]) => updateSubcategories(subcategories),
    setManagedCountries: (countries: string[]) => updateCountries(countries),
    // 操作方法
    handleDeleteProduct,
    handleSelectProduct,
    handleSelectAll,
    handleRefresh,
    handleProductSave,
    handleProductUpdate,
    handleBulkUploadFile,
    // 新增：刷新类目配置方法
    refreshCategoriesConfig
  }
}
