/**
 * 商品库管理模块
 * 
 * 功能：
 * - 商品列表展示
 * - 批量选择商品
 * - 添加/编辑/删除商品
 * - 批量上传商品
 * - 商品分析
 */

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Upload, RefreshCw, MessageSquare, Edit, Trash2 } from 'lucide-react'
import type { Product } from '../../shared/types/product'

interface ProductManagementProps {
  products: Product[]
  selectedProducts: string[]
  onSelectProduct: (productId: string, selected: boolean) => void
  onSelectAll: (selected: boolean) => void
  onRefresh: () => Promise<void>
  onBulkUpload: () => void
  onAdd: () => void
  onAnalyze: () => void
  onEdit: (product: Product) => void
  onDelete: (productId: string) => void
}

export function ProductManagement({
  products,
  selectedProducts,
  onSelectProduct,
  onSelectAll,
  onRefresh,
  onBulkUpload,
  onAdd,
  onAnalyze,
  onEdit,
  onDelete,
}: ProductManagementProps) {
  return (
    <div className="space-y-4">
      {/* 顶部操作栏 */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">商品库管理</h2>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={onRefresh}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            刷新
          </Button>
          <Button variant="outline" onClick={onBulkUpload}>
            <Upload className="h-4 w-4 mr-2" />
            批量上传
          </Button>
          <Button onClick={onAdd}>
            <Plus className="h-4 w-4 mr-2" />
            添加商品
          </Button>
          <Button 
            variant="outline" 
            onClick={onAnalyze}
            disabled={selectedProducts.length === 0}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            商品分析 {selectedProducts.length > 0 && `(${selectedProducts.length})`}
          </Button>
        </div>
      </div>

      {/* 商品列表 */}
      <div className="border rounded-lg">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedProducts.length === products.length && products.length > 0}
                  onChange={(e) => onSelectAll(e.target.checked)}
                  className="rounded border-gray-300"
                />
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">商品名称</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">类目</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">卖点</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">痛点</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">目标国家</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">目标受众</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedProducts.includes(product.id)}
                    onChange={(e) => onSelectProduct(product.id, e.target.checked)}
                    className="rounded border-gray-300"
                  />
                </td>
                <td className="px-4 py-3">
                  <div>
                    <div className="font-medium text-gray-900">{product.name}</div>
                    <div className="text-sm text-gray-500">{product.description}</div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <Badge variant="outline" className="text-xs">{product.category}</Badge>
                    {product.subcategory && (
                      <Badge variant="secondary" className="text-xs">{product.subcategory}</Badge>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm text-gray-600">
                    {Array.isArray(product.sellingPoints) && product.sellingPoints.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {product.sellingPoints.slice(0, 3).map((sp: string, index: number) => (
                          <Badge key={index} variant="outline" className="text-xs" title={sp}>
                            {sp.length > 10 ? sp.substring(0, 10) + '...' : sp}
                          </Badge>
                        ))}
                        {product.sellingPoints.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{product.sellingPoints.length - 3}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      '未设置'
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm text-gray-600">
                    {Array.isArray(product.painPoints) && product.painPoints.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {product.painPoints.slice(0, 3).map((point: any, index: number) => {
                          const pointText = typeof point === 'string' ? point : (point.text || point.painPoint || JSON.stringify(point))
                          return (
                            <Badge key={index} variant="outline" className="text-xs" title={pointText}>
                              {pointText.length > 10 ? pointText.substring(0, 10) + '...' : pointText}
                            </Badge>
                          )
                        })}
                        {product.painPoints.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{product.painPoints.length - 3}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      '未设置'
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {product.targetCountries.map((country) => (
                      <Badge key={country} variant="outline" className="text-xs">{country}</Badge>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm text-gray-600">
                    {Array.isArray(product.targetAudience) && product.targetAudience.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {product.targetAudience.slice(0, 3).map((audience: string, index: number) => (
                          <Badge key={index} variant="outline" className="text-xs" title={audience}>
                            {audience.length > 10 ? audience.substring(0, 10) + '...' : audience}
                          </Badge>
                        ))}
                        {product.targetAudience.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{product.targetAudience.length - 3}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      '未设置'
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => onEdit(product)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => onDelete(product.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

