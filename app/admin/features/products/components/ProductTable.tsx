'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Edit, Trash2 } from 'lucide-react'
import type { Product } from '../../../shared/types/product'

interface ProductTableProps {
  products: Product[]
  selectedProducts: string[]
  onSelectProduct: (productId: string, selected: boolean) => void
  onSelectAll: (selected: boolean) => void
  onEdit: (product: Product) => void
  onDelete: (productId: string) => void
  userRole?: string // 用户角色
}

export function ProductTable({
  products,
  selectedProducts,
  onSelectProduct,
  onSelectAll,
  onEdit,
  onDelete,
  userRole
}: ProductTableProps) {
  const canDelete = userRole !== 'operator' // operator 不能删除商品
  return (
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
                      {product.sellingPoints.slice(0, 3).map((sp: any, index: number) => {
                        // 处理对象格式 {point, source} 或字符串格式
                        const pointText = typeof sp === 'string' ? sp : (sp.point || sp);
                        return (
                          <Badge key={index} variant="outline" className="text-xs" title={pointText}>
                            {pointText.length > 10 ? pointText.substring(0, 10) + '...' : pointText}
                          </Badge>
                        );
                      })}
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
                  {product.targetCountries.map((country: string) => (
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
                  {canDelete && (
                    <Button size="sm" variant="destructive" onClick={() => onDelete(product.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
