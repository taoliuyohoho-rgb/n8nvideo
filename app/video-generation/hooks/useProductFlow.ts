/**
 * 商品流程Hook（步骤1-3）
 * 
 * 功能：
 * - 搜索商品（模糊匹配）
 * - 选择商品并加载Top5
 * - 商品分析（可选）
 */

import { useState } from 'react'
import { toast } from 'sonner'
import type { Product, Top5 } from '../types'

interface UseProductFlowProps {
  onStepComplete: (step: number) => void
}

export function useProductFlow({ onStepComplete }: UseProductFlowProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [top5, setTop5] = useState<Top5 | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 搜索商品（模糊匹配商品库）
  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/products?search=${encodeURIComponent(query.trim())}`)
      if (!response.ok) {
        throw new Error('搜索失败')
      }

      const data = await response.json()
      setSearchResults(data.products || [])
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '搜索商品失败'
      setError(errorMsg)
      toast.error(errorMsg)
      setSearchResults([])
    } finally {
      setLoading(false)
    }
  }

  // 选择商品并加载Top5卖点/痛点
  const handleSelectProduct = async (product: Product) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/video-gen/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id }),
      })

      if (!response.ok) {
        throw new Error('加载商品信息失败')
      }

      const data = await response.json()
      setSelectedProduct(product)
      setTop5(data.top5)
      setSearchResults([]) // 清空搜索结果
      toast.success('商品信息加载成功')
      onStepComplete(2) // 自动跳转步骤2
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '加载商品信息失败'
      setError(errorMsg)
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  // 商品分析完成回调（由ProductAnalysis组件调用）
  const handleAnalysisSuccess = (result: any) => {
    toast.success('商品分析已提交到备选池')
    console.log('商品分析结果:', result)
  }

  // 跳过分析，直接进入下一步
  const handleSkipAnalysis = () => {
    onStepComplete(4)
  }

  // 重置状态（返回步骤1）
  const reset = () => {
    setSearchQuery('')
    setSearchResults([])
    setSelectedProduct(null)
    setTop5(null)
    setError(null)
  }

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    selectedProduct,
    top5,
    loading,
    error,
    handleSearch,
    handleSelectProduct,
    handleAnalysisSuccess,
    handleSkipAnalysis,
    reset,
  }
}

