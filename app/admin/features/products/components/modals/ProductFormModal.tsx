'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { X } from 'lucide-react'
import type { BusinessProduct } from '@/types/business'
import { isBusinessProduct } from '@/utils/typeGuards'

interface ProductFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (productData: Omit<BusinessProduct, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  onUpdate: (productId: string, productData: Partial<Omit<BusinessProduct, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<void>
  product?: BusinessProduct | null
  categories: string[]
  subcategories?: string[]
  userRole?: string // 用户角色
}

export function ProductFormModal({
  isOpen,
  onClose,
  onSave,
  onUpdate,
  product,
  categories,
  subcategories = [],
  userRole
}: ProductFormModalProps) {
  // operator 只能编辑痛点、卖点、目标受众
  const isOperator = userRole === 'operator'
  const isEditingRestrictedFields = isOperator && !!product?.id
  const [editingProduct, setEditingProduct] = useState<BusinessProduct | null>(product || null)
  const [newSellingPoint, setNewSellingPoint] = useState('')
  const [newPainPoint, setNewPainPoint] = useState('')
  const [newTargetAudience, setNewTargetAudience] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [newTargetCountry, setNewTargetCountry] = useState('')

  // 使用传入的categories，如果没有则使用空数组（等待API加载）
  const availableCategories = categories.length > 0 ? categories : []
  const availableSubcategories = subcategories.length > 0 ? subcategories : []
  
  // 默认目标国家列表（暂时硬编码，后续可以也做成可配置的）
  const targetCountries = [
    'CN',
    'MY', 
    'TH'
  ]

  // 当product变化时更新editingProduct
  useEffect(() => {
    setEditingProduct(product || null)
  }, [product])

  const handleSave = async () => {
    if (!editingProduct?.name) {
      alert('商品名称是必填项')
      return
    }

    setIsSaving(true)
    try {
      if (editingProduct.id && editingProduct.id !== '') {
        // 更新商品
        let updateData: Partial<Omit<BusinessProduct, 'id' | 'createdAt' | 'updatedAt'>>
        // 如果选择了国家但未点击"添加"，也一并纳入
        const pendingCountries = newTargetCountry && newTargetCountry.trim()
          ? (() => {
              const current = Array.isArray(editingProduct?.targetCountries) ? editingProduct!.targetCountries : []
              return current.includes(newTargetCountry) ? current : [...current, newTargetCountry]
            })()
          : undefined
        
        if (isOperator) {
          // operator 只能更新痛点、卖点、目标受众
          updateData = {
            sellingPoints: editingProduct.sellingPoints,
            painPoints: editingProduct.painPoints,
            targetAudience: editingProduct.targetAudience
          }
        } else {
          // 其他角色可以更新所有字段
          const { id, createdAt, updatedAt, ...allData } = editingProduct
          updateData = {
            ...allData,
            ...(pendingCountries ? { targetCountries: pendingCountries } : {})
          }
        }
        
        await onUpdate(editingProduct.id, updateData)
      } else {
        // 添加商品（operator 不应该到这里）
        const { id, createdAt, updatedAt, ...productData } = editingProduct
        await onSave(productData)
      }
      onClose()
    } catch (error) {
      console.error('保存商品失败:', error)
      alert('保存失败，请重试')
    } finally {
      setIsSaving(false)
    }
  }

  const addSellingPoint = () => {
    if (newSellingPoint.trim()) {
      const currentPoints = Array.isArray(editingProduct?.sellingPoints) ? editingProduct.sellingPoints : []
      setEditingProduct((prev: BusinessProduct | null) => ({
        ...prev,
        sellingPoints: [...currentPoints, newSellingPoint.trim()]
      } as BusinessProduct))
      setNewSellingPoint('')
    }
  }

  const removeSellingPoint = (index: number) => {
    const newPoints = (editingProduct?.sellingPoints || []).filter((_: any, i: number) => i !== index)
    setEditingProduct((prev: BusinessProduct | null) => ({ ...prev, sellingPoints: newPoints } as BusinessProduct))
  }

  const addPainPoint = () => {
    if (newPainPoint.trim()) {
      const currentPoints = Array.isArray(editingProduct?.painPoints) ? editingProduct.painPoints : []
      setEditingProduct((prev: BusinessProduct | null) => ({
        ...prev,
        painPoints: [...currentPoints, newPainPoint.trim()]
      } as BusinessProduct))
      setNewPainPoint('')
    }
  }

  const removePainPoint = (index: number) => {
    const newPoints = (editingProduct?.painPoints || []).filter((_: any, i: number) => i !== index)
    setEditingProduct((prev: BusinessProduct | null) => ({ ...prev, painPoints: newPoints } as BusinessProduct))
  }

  const addTargetAudience = () => {
    if (newTargetAudience.trim()) {
      const currentAudience = Array.isArray(editingProduct?.targetAudience) ? editingProduct.targetAudience : []
      setEditingProduct((prev: BusinessProduct | null) => ({
        ...prev,
        targetAudience: [...currentAudience, newTargetAudience.trim()]
      } as BusinessProduct))
      setNewTargetAudience('')
    }
  }

  const removeTargetAudience = (index: number) => {
    const newAudience = (editingProduct?.targetAudience || []).filter((_: any, i: number) => i !== index)
    setEditingProduct((prev: BusinessProduct | null) => ({ ...prev, targetAudience: newAudience } as BusinessProduct))
  }

  const addTargetCountry = () => {
    if (newTargetCountry.trim()) {
      const currentCountries = Array.isArray(editingProduct?.targetCountries) ? editingProduct.targetCountries : []
      setEditingProduct((prev: BusinessProduct | null) => ({
        ...prev,
        targetCountries: [...currentCountries, newTargetCountry.trim()]
      } as BusinessProduct))
      setNewTargetCountry('')
    }
  }

  const removeTargetCountry = (index: number) => {
    const newCountries = (editingProduct?.targetCountries || []).filter((_: any, i: number) => i !== index)
    setEditingProduct((prev: BusinessProduct | null) => ({ ...prev, targetCountries: newCountries } as BusinessProduct))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingProduct?.id ? (isOperator ? '编辑商品（受限）' : '编辑商品') : '添加商品'}
          </DialogTitle>
          <DialogDescription>
            {isOperator && editingProduct?.id 
              ? '您只能修改商品的卖点、痛点和目标受众' 
              : editingProduct?.id ? '修改商品信息' : '填写商品基本信息'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {!isEditingRestrictedFields && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">商品名称 *</Label>
                  <Input
                    id="name"
                    value={editingProduct?.name || ''}
                    onChange={(e) => setEditingProduct((prev: BusinessProduct | null) => ({ ...prev, name: e.target.value } as BusinessProduct))}
                    placeholder="请输入商品名称"
                  />
                </div>
                <div>
                  <Label htmlFor="category">类目</Label>
                  <Select
                    value={editingProduct?.category || ''}
                    onValueChange={(value) => setEditingProduct((prev: BusinessProduct | null) => ({ ...prev, category: value } as BusinessProduct))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择类目" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCategories.map(category => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="subcategory">二级类目（可自定义）</Label>
                <Input
                  id="subcategory"
                  list="subcategory-suggestions"
                  value={editingProduct?.subcategory || ''}
                  onChange={(e) => setEditingProduct((prev: BusinessProduct | null) => ({ ...prev, subcategory: e.target.value } as BusinessProduct))}
                  placeholder="输入或选择二级类目"
                />
                {availableSubcategories.length > 0 && (
                  <datalist id="subcategory-suggestions">
                    {availableSubcategories.map(subcategory => (
                      <option key={subcategory} value={subcategory} />
                    ))}
                  </datalist>
                )}
              </div>
              
              <div>
                <Label htmlFor="description">商品描述</Label>
                <Textarea
                  id="description"
                  value={editingProduct?.description || ''}
                  onChange={(e) => setEditingProduct((prev: BusinessProduct | null) => ({ ...prev, description: e.target.value } as BusinessProduct))}
                  placeholder="请输入商品描述"
                  rows={3}
                />
              </div>
            </>
          )}
          
          {isEditingRestrictedFields && (
            <div className="bg-blue-50 p-3 rounded-md text-sm text-blue-700 mb-2">
              <strong>提示：</strong> 您正在以受限模式编辑商品。只能修改卖点、痛点和目标受众。
            </div>
          )}

          <div>
            <Label>卖点</Label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  value={newSellingPoint}
                  onChange={(e) => setNewSellingPoint(e.target.value)}
                  placeholder="手动添加卖点"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addSellingPoint()
                    }
                  }}
                />
                <Button type="button" size="sm" onClick={addSellingPoint}>
                  添加
                </Button>
              </div>
              <div className="flex flex-wrap gap-1">
                {Array.isArray(editingProduct?.sellingPoints) && editingProduct.sellingPoints.map((point: any, index: number) => {
                  // 处理对象格式 {point, source} 或字符串格式
                  const pointText = typeof point === 'string' ? point : (point.point || point);
                  return (
                    <Badge key={index} variant="outline" className="text-xs">
                      {pointText}
                      <X
                        className="h-3 w-3 ml-1 cursor-pointer"
                        onClick={() => removeSellingPoint(index)}
                      />
                    </Badge>
                  );
                })}
              </div>
            </div>
          </div>

          <div>
            <Label>痛点</Label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  value={newPainPoint}
                  onChange={(e) => setNewPainPoint(e.target.value)}
                  placeholder="手动添加痛点"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addPainPoint()
                    }
                  }}
                />
                <Button type="button" size="sm" onClick={addPainPoint}>
                  添加
                </Button>
              </div>
              <div className="flex flex-wrap gap-1">
                {Array.isArray(editingProduct?.painPoints) && editingProduct.painPoints.map((point: any, index: number) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {typeof point === 'string' ? point : (point.text || point.painPoint || JSON.stringify(point))}
                    <X
                      className="h-3 w-3 ml-1 cursor-pointer"
                      onClick={() => removePainPoint(index)}
                    />
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div>
            <Label>目标受众</Label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  value={newTargetAudience}
                  onChange={(e) => setNewTargetAudience(e.target.value)}
                  placeholder="手动添加目标受众"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addTargetAudience()
                    }
                  }}
                />
                <Button type="button" size="sm" onClick={addTargetAudience}>
                  添加
                </Button>
              </div>
              <div className="flex flex-wrap gap-1">
                {Array.isArray(editingProduct?.targetAudience) && editingProduct.targetAudience.map((audience: string, index: number) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {audience}
                    <X
                      className="h-3 w-3 ml-1 cursor-pointer"
                      onClick={() => removeTargetAudience(index)}
                    />
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {!isEditingRestrictedFields && (
            <div>
              <Label>目标国家</Label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Select
                    value={newTargetCountry}
                    onValueChange={(value) => {
                      setEditingProduct((prev: BusinessProduct | null) => {
                        const current = Array.isArray(prev?.targetCountries) ? (prev as BusinessProduct).targetCountries : []
                        if (!value || current.includes(value)) return prev as BusinessProduct
                        return ({
                          ...(prev as any),
                          targetCountries: [...current, value]
                        } as BusinessProduct)
                      })
                      setNewTargetCountry('')
                    }}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="选择目标国家" />
                    </SelectTrigger>
                    <SelectContent>
                      {targetCountries.map(country => (
                        <SelectItem key={country} value={country}>{country}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" size="sm" onClick={addTargetCountry} disabled={!newTargetCountry}>
                    添加
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {Array.isArray(editingProduct?.targetCountries) && editingProduct.targetCountries.map((country: string, index: number) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {country}
                      <X
                        className="h-3 w-3 ml-1 cursor-pointer"
                        onClick={() => removeTargetCountry(index)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={isSaving}>
              取消
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? '保存中...' : (editingProduct?.id ? '更新' : '保存')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
