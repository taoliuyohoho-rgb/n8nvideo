/**
 * 商品选择组件
 * 集成商品库搜索和权限控制
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Search, Package, CheckCircle, Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useVideoGenerationApi } from './hooks/useVideoGenerationApi'
import type { ProductSelectorProps, Product } from './types/video-generation'

export function ProductSelector({ onProductSelected, disabled, className }: ProductSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { searchProducts } = useVideoGenerationApi()

  // 自动搜索商品（防抖）
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      setError(null)

      try {
        const results = await searchProducts(searchQuery)
        setSearchResults(results)
        
        // 如果只有一个结果，自动选择并填入
        if (results.length === 1) {
          handleSelectProduct(results[0])
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '搜索失败')
      } finally {
        setLoading(false)
      }
    }, 500) // 500ms 防抖

    return () => clearTimeout(timer)
  }, [searchQuery])

  // 选择商品
  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product)
    onProductSelected(product)
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 搜索框 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="输入商品名称进行搜索..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          disabled={disabled}
          className="pl-10 pr-10"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin text-blue-500" />
        )}
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* 搜索结果 */}
      {searchResults.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-700">搜索结果</h3>
          <div className="grid gap-2 max-h-64 overflow-y-auto">
            {searchResults.map((product) => (
              <Card 
                key={product.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedProduct?.id === product.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                }`}
                onClick={() => handleSelectProduct(product)}
              >
                <CardContent className="p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Package className="w-4 h-4 text-gray-500" />
                        <h4 className="font-medium text-sm">{product.name}</h4>
                        {selectedProduct?.id === product.id && (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mb-2 line-clamp-2">
                        {product.description || '暂无描述'}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="outline" className="text-xs">
                          {product.category}
                        </Badge>
                        {product.targetCountries.slice(0, 2).map((country) => (
                          <Badge key={country} variant="secondary" className="text-xs">
                            {country}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* 已选择商品 */}
      {selectedProduct && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <h3 className="font-medium text-green-800">已选择商品</h3>
            </div>
            <div className="space-y-1">
              <p className="font-medium text-green-900">{selectedProduct.name}</p>
              <p className="text-sm text-green-700">{selectedProduct.description}</p>
              <div className="flex gap-2">
                <Badge variant="outline" className="text-xs">
                  {selectedProduct.category}
                </Badge>
                {selectedProduct.targetCountries.slice(0, 3).map((country) => (
                  <Badge key={country} variant="secondary" className="text-xs">
                    {country}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 空状态提示 */}
      {!selectedProduct && searchResults.length === 0 && !loading && !searchQuery && (
        <div className="text-center py-12 text-gray-400">
          <Package className="w-16 h-16 mx-auto mb-3 text-gray-300" />
          <p className="text-base mb-1">请输入商品名称开始搜索</p>
          <p className="text-sm">系统将自动为您匹配相关商品</p>
        </div>
      )}

      {/* 未找到结果 */}
      {searchResults.length === 0 && !loading && searchQuery && (
        <div className="text-center py-8 text-gray-500">
          <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p>未找到相关商品</p>
          <p className="text-xs">请尝试其他关键词</p>
        </div>
      )}
    </div>
  )
}
