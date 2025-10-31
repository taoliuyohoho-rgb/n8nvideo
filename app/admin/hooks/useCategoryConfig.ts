/**
 * 类目配置管理 Hook
 * 
 * 功能：
 * - 统一管理类目配置的加载和刷新
 * - 提供加载状态和错误处理
 * - 避免重复代码
 */

import { useState, useEffect } from 'react'

interface CategoryConfig {
  categories: string[]
  subcategories: string[]
  countries: string[]
}

interface UseCategoryConfigReturn {
  categories: string[]
  subcategories: string[]
  countries: string[]
  loading: boolean
  error: string | null
  refreshConfig: () => Promise<{ success: boolean; error?: string }>
  updateCategories: (next: string[]) => void
  updateSubcategories: (next: string[]) => void
  updateCountries: (next: string[]) => void
}

const FALLBACK_CATEGORIES = ['美妆', '个护', '3C', '大健康', '其他']
const FALLBACK_SUBCATEGORIES = ['护肤品', '彩妆', '电子产品', '保健品', '服装', '鞋包']
const FALLBACK_COUNTRIES = ['CN', 'MY', 'TH']

export function useCategoryConfig(): UseCategoryConfigReturn {
  const [categories, setCategories] = useState<string[]>([])
  const [subcategories, setSubcategories] = useState<string[]>([])
  const [countries, setCountries] = useState<string[]>(FALLBACK_COUNTRIES)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 加载类目配置
  const loadConfig = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('[useCategoryConfig] 开始加载类目配置...')
      const response = await fetch('/api/admin/categories')
      const result = await response.json()
      
      if (result.success) {
        const flatCategories = result.data.flatCategories || []
        
        // 加载一级类目
        const categoryNames = flatCategories
          .filter((cat: Record<string, unknown>) => cat.level === 1)
          .map((cat: Record<string, unknown>) => cat.name as string)
        setCategories(categoryNames)
        
        // 加载二级类目
        const subcategoryNames = flatCategories
          .filter((cat: Record<string, unknown>) => cat.level === 2)
          .map((cat: Record<string, unknown>) => cat.name as string)
        setSubcategories(subcategoryNames)
        
        console.log('[useCategoryConfig] 类目配置加载成功:', { 
          categories: categoryNames, 
          subcategories: subcategoryNames 
        })
      } else {
        console.error('[useCategoryConfig] 类目配置加载失败:', result.error)
        setError(result.error || '加载失败')
        // 使用硬编码作为fallback
        setCategories(FALLBACK_CATEGORIES)
        setSubcategories(FALLBACK_SUBCATEGORIES)
      }
    } catch (error) {
      console.error('[useCategoryConfig] 加载类目配置失败:', error)
      setError('网络错误')
      // 使用硬编码作为fallback
      setCategories(FALLBACK_CATEGORIES)
      setSubcategories(FALLBACK_SUBCATEGORIES)
    } finally {
      setLoading(false)
    }
  }

  // 刷新类目配置
  const refreshConfig = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('[useCategoryConfig] 开始刷新类目配置...')
      const response = await fetch('/api/admin/categories')
      const result = await response.json()
      
      if (result.success) {
        const flatCategories = result.data.flatCategories || []
        
        // 加载一级类目
        const categoryNames = flatCategories
          .filter((cat: Record<string, unknown>) => cat.level === 1)
          .map((cat: Record<string, unknown>) => cat.name as string)
        setCategories(categoryNames)
        
        // 加载二级类目
        const subcategoryNames = flatCategories
          .filter((cat: Record<string, unknown>) => cat.level === 2)
          .map((cat: Record<string, unknown>) => cat.name as string)
        setSubcategories(subcategoryNames)
        
        console.log('[useCategoryConfig] 类目配置刷新成功:', { 
          categories: categoryNames, 
          subcategories: subcategoryNames 
        })
        
        return { success: true }
      } else {
        console.error('[useCategoryConfig] 类目配置刷新失败:', result.error)
        return { success: false, error: result.error || '刷新失败' }
      }
    } catch (error) {
      console.error('[useCategoryConfig] 刷新类目配置失败:', error)
      return { success: false, error: '网络错误' }
    }
  }

  // 初始化加载
  useEffect(() => {
    loadConfig()
  }, [])

  return {
    categories,
    subcategories,
    countries,
    loading,
    error,
    refreshConfig,
    updateCategories: (next: string[]) => setCategories(next),
    updateSubcategories: (next: string[]) => setSubcategories(next),
    updateCountries: (next: string[]) => setCountries(next)
  }
}
