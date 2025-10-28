/**
 * 商品步骤组件（步骤1-3）
 * 
 * 步骤1: 输入商品名（搜索+选择）
 * 步骤2: 确认商品信息 + Top5
 * 步骤3: 商品分析（可选，复用ProductAnalysis组件）
 */

import React, { useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Loader2, Sparkles, Edit2 } from 'lucide-react'
import { ProductAnalysis } from '@/components/ProductAnalysis'
import type { Product, Top5 } from '../types'

interface ProductStepsProps {
  currentStep: number
  searchQuery: string
  setSearchQuery: (query: string) => void
  searchResults: Product[]
  selectedProduct: Product | null
  top5: Top5 | null
  loading: boolean
  error: string | null
  handleSearch: (query: string) => void
  handleSelectProduct: (product: Product) => void
  handleAnalysisSuccess: (result: any) => void
  handleSkipAnalysis: () => void
  onNext: () => void
  onPrev: () => void
}

export function ProductSteps({
  currentStep,
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
  onNext,
  onPrev,
}: ProductStepsProps) {
  // 自动触发搜索（防抖）
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        handleSearch(searchQuery)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // 步骤1: 输入商品名（搜索+选择）
  if (currentStep === 1) {
    return (
      <Card className="shadow-lg border-0">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-500" />
            输入商品名称
          </CardTitle>
          <CardDescription>搜索商品库中的商品，选择要生成视频的商品</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="productName" className="text-sm font-medium">商品名称</Label>
              <Input
                id="productName"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="输入商品名进行搜索..."
                className="mt-2 h-12 text-lg"
              />
            </div>

            {/* 搜索结果列表 */}
            {searchResults.length > 0 && (
              <div className="border rounded-lg max-h-64 overflow-y-auto">
                {searchResults.map((product) => (
                  <div
                    key={product.id}
                    className="p-4 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                    onClick={() => handleSelectProduct(product)}
                  >
                    <div className="font-medium text-gray-900">{product.name}</div>
                    <div className="text-sm text-gray-500 mt-1">{product.description}</div>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">{product.category}</Badge>
                      {product.targetCountries && product.targetCountries.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {product.targetCountries.join(', ')}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 加载状态 */}
            {loading && (
              <div className="text-center py-4 text-gray-500">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                <p className="text-sm">搜索中...</p>
              </div>
            )}

            {/* 无结果提示 */}
            {searchQuery && !loading && searchResults.length === 0 && (
              <div className="text-center py-4 text-gray-500">
                <p className="text-sm">未找到匹配的商品</p>
              </div>
            )}

            {/* 错误提示 */}
            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
                {error}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  // 步骤2: 商品信息确认 + Top5
  if (currentStep === 2 && selectedProduct && top5) {
    return (
      <Card className="shadow-lg border-0">
        <CardHeader className="bg-gradient-to-r from-green-50 to-teal-50">
          <CardTitle>商品信息确认</CardTitle>
          <CardDescription>系统已自动从商品库补全信息并提取Top5卖点/痛点</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* 商品基本信息 */}
          <div className="bg-white border rounded-lg p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Badge variant="outline">基本信息</Badge>
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">商品名称:</span>
                <p className="font-medium mt-1">{selectedProduct.name}</p>
              </div>
              <div>
                <span className="text-gray-500">类目:</span>
                <p className="font-medium mt-1">{selectedProduct.category}</p>
              </div>
              {selectedProduct.targetCountries && selectedProduct.targetCountries.length > 0 && (
                <div>
                  <span className="text-gray-500">目标国家:</span>
                  <p className="font-medium mt-1">{selectedProduct.targetCountries.join(', ')}</p>
                </div>
              )}
              {selectedProduct.targetAudience && selectedProduct.targetAudience.length > 0 && (
                <div>
                  <span className="text-gray-500">目标受众:</span>
                  <p className="font-medium mt-1">{selectedProduct.targetAudience.join(', ')}</p>
                </div>
              )}
            </div>
          </div>

          {/* Top5 卖点 */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2 text-green-700">
              <Badge variant="default" className="bg-green-600">Top5 卖点</Badge>
            </h3>
            <div className="flex flex-wrap gap-2">
              {top5.sellingPoints.map((point, index) => (
                <Badge key={index} variant="secondary" className="text-sm px-3 py-1">
                  {index + 1}. {point}
                </Badge>
              ))}
            </div>
          </div>

          {/* Top5 痛点 */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2 text-orange-700">
              <Badge variant="destructive" className="bg-orange-600">Top5 痛点</Badge>
            </h3>
            <div className="flex flex-wrap gap-2">
              {top5.painPoints.map((point, index) => (
                <Badge key={index} variant="outline" className="text-sm px-3 py-1 border-orange-300">
                  {index + 1}. {point}
                </Badge>
              ))}
            </div>
          </div>

          {/* 选择理由 */}
          {top5.reasons && top5.reasons.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold mb-2 text-blue-700 text-sm">选择理由</h3>
              <ul className="text-sm text-blue-600 space-y-1">
                {top5.reasons.map((reason, index) => (
                  <li key={index}>• {reason}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex gap-3">
            <Button onClick={onPrev} variant="outline" className="flex-1">
              返回修改
            </Button>
            <Button onClick={onNext} className="flex-1">
              确认信息
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // 步骤3: 商品分析（可选）
  if (currentStep === 3 && selectedProduct) {
    return (
      <div className="space-y-6">
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
            <CardTitle className="flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-purple-500" />
              商品分析（可选）
            </CardTitle>
            <CardDescription>您可以添加自己的商品分析，系统会将其加入备选池</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {/* 复用ProductAnalysis组件 */}
            <ProductAnalysis
              productId={selectedProduct.id}
              onSuccess={handleAnalysisSuccess}
            />

            <div className="flex gap-3 mt-6">
              <Button onClick={onPrev} variant="outline" className="flex-1">
                返回上一步
              </Button>
              <Button onClick={handleSkipAnalysis} className="flex-1">
                跳过，进入下一步
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
}

