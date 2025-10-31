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

import { useState } from 'react'
import type { BusinessProduct } from '@/types/business'
import { ProductActionBar } from './components/ProductActionBar'
import { ProductTable } from './components/ProductTable'
import { ProductFormModal } from './components/modals/ProductFormModal'
import { BulkUploadModal } from './components/modals/BulkUploadModal'
import { AnalysisModal } from './components/modals/AnalysisModal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { X, Plus } from 'lucide-react'

interface ProductManagementProps {
  products: BusinessProduct[]
  selectedProducts: string[]
  onSelectProduct: (productId: string, selected: boolean) => void
  onSelectAll: (selected: boolean) => void
  onRefresh: () => Promise<void>
  onBulkUpload: () => void
  onAdd: () => void
  onAnalyze: () => void
  onEdit: (product: BusinessProduct) => void
  onDelete: (productId: string) => void
  onProductSave?: (productData: Omit<BusinessProduct, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  onProductUpdate?: (productId: string, productData: Partial<Omit<BusinessProduct, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<void>
  onBulkUploadFile?: (file: File) => Promise<void>
  categories?: string[]
  onCategoriesChange?: (categories: string[]) => void
  onSubcategoriesChange?: (subcategories: string[]) => void
  onCountriesChange?: (countries: string[]) => void
  countries?: string[]
  subcategories?: string[]
  userRole?: string // 用户角色
  onSaveCategoriesConfig?: (categories: string[], subcategories: string[], countries: string[]) => Promise<{ success: boolean; message?: string; error?: string }>
  onRefreshCategoriesConfig?: () => Promise<{ success: boolean; error?: string }>
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
  onProductSave,
  onProductUpdate,
  onBulkUploadFile,
  categories = [],
  onCategoriesChange,
  onSubcategoriesChange,
  onCountriesChange,
  countries = [],
  subcategories = [],
  userRole,
  onSaveCategoriesConfig,
  onRefreshCategoriesConfig
}: ProductManagementProps) {
  // Modal状态
  const [showProductForm, setShowProductForm] = useState(false)
  const [showBulkUpload, setShowBulkUpload] = useState(false)
  const [showAnalysisModal, setShowAnalysisModal] = useState(false)
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<BusinessProduct | null>(null)
  
  // 配置管理状态
  const [newCategory, setNewCategory] = useState('')
  const [newSubcategory, setNewSubcategory] = useState('')
  const [newCountry, setNewCountry] = useState('')

  // 处理函数
  const handleAddClick = () => {
    setEditingProduct(null)
    setShowProductForm(true)
  }

  const handleEditClick = (product: BusinessProduct) => {
    setEditingProduct(product)
    setShowProductForm(true)
  }

  const handleBulkUploadClick = () => {
    setShowBulkUpload(true)
  }

  const handleAnalyzeClick = () => {
    console.log('[ProductManagement] handleAnalyzeClick called, selectedProducts:', selectedProducts)
    if (selectedProducts.length === 0) {
      alert('请先选择商品')
      return
    }
    console.log('[ProductManagement] Opening analysis modal')
    setShowAnalysisModal(true)
  }

  const handleProductSave = async (productData: Omit<BusinessProduct, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (onProductSave) {
      await onProductSave(productData)
    }
  }

  const handleProductUpdate = async (productId: string, productData: Partial<Omit<BusinessProduct, 'id' | 'createdAt' | 'updatedAt'>>) => {
    if (onProductUpdate) {
      await onProductUpdate(productId, productData)
    }
  }

  const handleBulkUpload = async (file: File) => {
    if (onBulkUploadFile) {
      await onBulkUploadFile(file)
    }
  }

  const handleAnalysisComplete = () => {
    // 分析完成后刷新数据
    onRefresh()
  }

  const handleConfigClick = () => {
    setShowConfigModal(true)
  }

  // 配置管理处理函数
  const addCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      onCategoriesChange?.([...categories, newCategory.trim()])
      setNewCategory('')
    }
  }

  const removeCategory = (category: string) => {
    onCategoriesChange?.(categories.filter(c => c !== category))
  }

  const addSubcategory = () => {
    if (newSubcategory.trim() && !subcategories.includes(newSubcategory.trim())) {
      onSubcategoriesChange?.([...subcategories, newSubcategory.trim()])
      setNewSubcategory('')
    }
  }

  const removeSubcategory = (subcategory: string) => {
    onSubcategoriesChange?.(subcategories.filter(s => s !== subcategory))
  }

  const addCountry = () => {
    if (newCountry.trim() && !countries.includes(newCountry.trim())) {
      onCountriesChange?.([...countries, newCountry.trim()])
      setNewCountry('')
    }
  }

  const removeCountry = (country: string) => {
    onCountriesChange?.(countries.filter(c => c !== country))
  }

  // 保存配置
  const handleSaveConfig = async () => {
    console.log('开始保存配置...', { categories, subcategories, countries })
    
    if (!onSaveCategoriesConfig) {
      console.error('保存配置函数未提供')
      alert('保存配置函数未提供')
      return
    }

    try {
      console.log('调用保存函数...')
      const result = await onSaveCategoriesConfig(categories, subcategories, countries)
      console.log('保存结果:', result)
      
      if (result.success) {
        // 保存成功后刷新类目配置
        if (onRefreshCategoriesConfig) {
          console.log('保存成功，开始刷新类目配置...')
          const refreshResult = await onRefreshCategoriesConfig()
          if (refreshResult.success) {
            console.log('类目配置刷新成功')
          } else {
            console.error('类目配置刷新失败:', refreshResult.error)
          }
        }
        
        alert(result.message || '配置保存成功')
        setShowConfigModal(false)
      } else {
        alert(result.error || '保存失败')
      }
    } catch (error: unknown) {
      console.error('保存配置失败:', error)
      alert('保存配置失败: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  return (
    <div className="space-y-4">
      {/* 顶部操作栏 */}
      <ProductActionBar
        selectedCount={selectedProducts.length}
        onRefresh={onRefresh}
        onAdd={handleAddClick}
        onBulkUpload={handleBulkUploadClick}
        onAnalyze={handleAnalyzeClick}
        onConfig={handleConfigClick}
        userRole={userRole}
      />

      {/* 商品列表 */}
      <ProductTable
        products={products}
        selectedProducts={selectedProducts}
        onSelectProduct={onSelectProduct}
        onSelectAll={onSelectAll}
        onEdit={handleEditClick}
        onDelete={onDelete}
        userRole={userRole}
      />

      {/* 商品添加/编辑Modal */}
      <ProductFormModal
        isOpen={showProductForm}
        onClose={() => setShowProductForm(false)}
        onSave={handleProductSave}
        onUpdate={handleProductUpdate}
        product={editingProduct}
        categories={categories}
        subcategories={subcategories}
        userRole={userRole}
      />

      {/* 批量上传Modal */}
      <BulkUploadModal
        isOpen={showBulkUpload}
        onClose={() => setShowBulkUpload(false)}
        onUpload={handleBulkUpload}
      />

      {/* 商品分析Modal */}
      <AnalysisModal
        isOpen={showAnalysisModal}
        onClose={() => setShowAnalysisModal(false)}
        selectedProducts={selectedProducts}
        products={products}
        onAnalysisComplete={handleAnalysisComplete}
      />

      {/* 配置管理Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">配置管理</h2>
              <div className="flex gap-2">
                <Button onClick={handleSaveConfig} className="bg-blue-600 hover:bg-blue-700">
                  保存配置
                </Button>
                <button
                  onClick={() => setShowConfigModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="space-y-6">
              {/* 类目管理 */}
              <Card>
                <CardHeader>
                  <CardTitle>类目管理</CardTitle>
                  <CardDescription>管理商品类目列表</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      placeholder="输入新类目"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addCategory()
                        }
                      }}
                    />
                    <Button onClick={addCategory} disabled={!newCategory.trim()}>
                      <Plus className="h-4 w-4 mr-2" />
                      添加
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((category) => (
                      <Badge key={category} variant="outline" className="text-sm">
                        {category}
                        <X
                          className="h-3 w-3 ml-2 cursor-pointer hover:text-red-500"
                          onClick={() => removeCategory(category)}
                        />
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* 二级类目管理 */}
              <Card>
                <CardHeader>
                  <CardTitle>二级类目管理</CardTitle>
                  <CardDescription>管理商品二级类目列表</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      value={newSubcategory}
                      onChange={(e) => setNewSubcategory(e.target.value)}
                      placeholder="输入新二级类目"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addSubcategory()
                        }
                      }}
                    />
                    <Button onClick={addSubcategory} disabled={!newSubcategory.trim()}>
                      <Plus className="h-4 w-4 mr-2" />
                      添加
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {subcategories.map((subcategory) => (
                      <Badge key={subcategory} variant="outline" className="text-sm">
                        {subcategory}
                        <X
                          className="h-3 w-3 ml-2 cursor-pointer hover:text-red-500"
                          onClick={() => removeSubcategory(subcategory)}
                        />
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* 国家管理 */}
              <Card>
                <CardHeader>
                  <CardTitle>国家管理</CardTitle>
                  <CardDescription>管理目标国家列表</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      value={newCountry}
                      onChange={(e) => setNewCountry(e.target.value)}
                      placeholder="输入国家代码 (如: US, UK)"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addCountry()
                        }
                      }}
                    />
                    <Button onClick={addCountry} disabled={!newCountry.trim()}>
                      <Plus className="h-4 w-4 mr-2" />
                      添加
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {countries.map((country) => (
                      <Badge key={country} variant="outline" className="text-sm">
                        {country}
                        <X
                          className="h-3 w-3 ml-2 cursor-pointer hover:text-red-500"
                          onClick={() => removeCountry(country)}
                        />
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}