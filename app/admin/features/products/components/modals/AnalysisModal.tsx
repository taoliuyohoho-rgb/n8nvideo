'use client'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { CompetitorAnalysis } from '@/components/CompetitorAnalysis'
import type { Product } from '../../../../shared/types/product'

interface AnalysisModalProps {
  isOpen: boolean
  onClose: () => void
  selectedProducts: string[]
  products: Product[]
  onAnalysisComplete: () => void | Promise<void>
}

export function AnalysisModal({
  isOpen,
  onClose,
  selectedProducts,
  products,
  onAnalysisComplete
}: AnalysisModalProps) {
  const handleAnalysisSuccess = async (productId: string, result: any) => {
    console.log(`商品 ${productId} 分析完成，结果:`, result)
    console.log('分析结果详情:', {
      addedSellingPoints: result.addedSellingPoints,
      addedPainPoints: result.addedPainPoints,
      sellingPoints: result.sellingPoints?.slice(0, 3),
      painPoints: result.painPoints?.slice(0, 3),
      targetAudience: result.targetAudience
    })
    // 立即触发数据刷新
    await onAnalysisComplete()
  }

  const handleAllAnalysisComplete = async () => {
    // 等待数据刷新完成后再关闭弹窗
    await onAnalysisComplete()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[90vw] max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>商品分析</DialogTitle>
          <DialogDescription>
            对选中的商品进行竞品分析，提取卖点、痛点和目标受众
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pr-2">
          {selectedProducts.length > 0 && (
            <div>
              <Label>选中的商品</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedProducts.map(productId => {
                  const product = products.find(p => p.id === productId)
                  return product ? (
                    <Badge key={productId} variant="outline">
                      {product.name}
                    </Badge>
                  ) : null
                })}
              </div>
            </div>
          )}
          
          {selectedProducts.length === 1 && (
            <div>
              <Label>竞品分析</Label>
              <div className="mt-2">
                <CompetitorAnalysis
                  productId={selectedProducts[0]}
                  onSuccess={async (result) => {
                    console.log('分析结果:', result)
                    await handleAnalysisSuccess(selectedProducts[0], result)
                    await handleAllAnalysisComplete()
                  }}
                />
              </div>
            </div>
          )}
          
          {selectedProducts.length > 1 && (
            <div>
              <Label>批量竞品分析</Label>
              <div className="mt-2 space-y-4">
                {selectedProducts.map(productId => {
                  const product = products.find(p => p.id === productId)
                  return product ? (
                    <Card key={productId}>
                      <CardHeader>
                        <CardTitle className="text-sm">{product.name}</CardTitle>
                        <CardDescription className="text-xs">{product.category}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <CompetitorAnalysis
                          productId={productId}
                          onSuccess={async (result) => {
                            console.log(`${product.name} 分析结果:`, result)
                            await handleAnalysisSuccess(productId, result)
                          }}
                        />
                      </CardContent>
                    </Card>
                  ) : null
                })}
              </div>
            </div>
          )}

          {selectedProducts.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              请先选择要分析的商品
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
