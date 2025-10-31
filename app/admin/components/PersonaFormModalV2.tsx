/**
 * 人设表单弹窗 V2
 * 
 * 新功能：
 * - AI 生成后显示预览
 * - 用户可以编辑预览内容
 * - 确认后再保存
 */

'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, Sparkles, Eye, Save, ArrowLeft, Check } from 'lucide-react'
import { RecommendationSelector } from '@/components/RecommendationSelector'
import { Checkbox } from '@/components/ui/checkbox'

interface PersonaFormModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  editingPersona?: Record<string, unknown>
  initialProductId?: string  // 初始商品ID
  initialCategory?: string   // 初始类目
}

interface CategoryInfo {
  id: string
  name: string
  description?: string
}

interface ProductInfo {
  id: string
  name: string
  category: string
  categoryId?: string
  description?: string
}

interface PersonaContent {
  basicInfo: {
    age: string
    gender: string
    occupation: string
    income: string
    location: string
  }
  behavior: {
    purchaseHabits: string
    usageScenarios: string
    decisionFactors: string
    brandPreference: string
  }
  preferences: {
    priceSensitivity: string
    featureNeeds: string[]
    qualityExpectations: string
    serviceExpectations: string
  }
  psychology: {
    values: string[]
    lifestyle: string
    painPoints: string[]
    motivations: string[]
  }
}

export function PersonaFormModal({ open, onClose, onSuccess, editingPersona, initialProductId, initialCategory }: PersonaFormModalProps) {
  const [step, setStep] = useState<'form' | 'preview'>('form')
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [autoMatching, setAutoMatching] = useState(false)

  // 数据状态
  const [categories, setCategories] = useState<CategoryInfo[]>([])
  const [products, setProducts] = useState<ProductInfo[]>([])

  // 表单状态
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  // 多选状态
  const [categoryIds, setCategoryIds] = useState<string[]>([])
  const [productIds, setProductIds] = useState<string[]>([])
  // 保留单选状态（向后兼容）
  const [categoryId, setCategoryId] = useState('')
  const [productId, setProductId] = useState('')
  const [targetCountry, setTargetCountry] = useState('马来西亚')
  const [textDescription, setTextDescription] = useState('')

  // 生成的人设内容（可编辑）
  const [personaContent, setPersonaContent] = useState<PersonaContent | null>(null)

  // 推荐的模型和 Prompt（使用 RecommendationSelector）
  const [selectedModel, setSelectedModel] = useState<string>('')
  const [selectedPrompt, setSelectedPrompt] = useState<string>('')
  const [modelDecisionId, setModelDecisionId] = useState<string>('')
  const [promptDecisionId, setPromptDecisionId] = useState<string>('')
  const [recommendationTrigger, setRecommendationTrigger] = useState(0)
  
  // 推荐状态
  const [modelRecommendationStatus, setModelRecommendationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [promptRecommendationStatus, setPromptRecommendationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  // 默认人设内容结构
  const getDefaultPersonaContent = (): PersonaContent => ({
    basicInfo: {
      age: '',
      gender: '',
      occupation: '',
      income: '',
      location: ''
    },
    behavior: {
      purchaseHabits: '',
      usageScenarios: '',
      decisionFactors: '',
      brandPreference: ''
    },
    preferences: {
      priceSensitivity: '',
      featureNeeds: [],
      qualityExpectations: '',
      serviceExpectations: ''
    },
    psychology: {
      values: [],
      lifestyle: '',
      painPoints: [],
      motivations: []
    }
  })

  // 合并人设内容，确保所有字段都存在
  const mergePersonaContent = (content: Record<string, unknown>): PersonaContent => {
    const defaultContent = getDefaultPersonaContent()
    
    if (!content) return defaultContent
    
    return {
      basicInfo: {
        ...defaultContent.basicInfo,
        ...(content.basicInfo || {})
      },
      behavior: {
        ...defaultContent.behavior,
        ...(content.behavior || {})
      },
      preferences: {
        ...defaultContent.preferences,
        ...(content.preferences || {}),
        featureNeeds: Array.isArray((content.preferences as Record<string, unknown>)?.featureNeeds) 
          ? (content.preferences as Record<string, unknown>).featureNeeds as string[]
          : []
      },
      psychology: {
        ...defaultContent.psychology,
        ...(content.psychology || {}),
        values: Array.isArray((content.psychology as Record<string, unknown>)?.values) 
          ? (content.psychology as Record<string, unknown>).values as string[]
          : [],
        painPoints: Array.isArray((content.psychology as Record<string, unknown>)?.painPoints) 
          ? (content.psychology as Record<string, unknown>).painPoints as string[]
          : [],
        motivations: Array.isArray((content.psychology as Record<string, unknown>)?.motivations) 
          ? (content.psychology as Record<string, unknown>).motivations as string[]
          : []
      }
    }
  }

  // 加载数据并初始化表单
  useEffect(() => {
    if (open) {
      loadCategories()
      loadAllProducts()
      
      if (editingPersona) {
        // 编辑模式 - 加载现有数据（可修改）
        console.log('📝 编辑模式 - 加载人设数据:', editingPersona)
        setName((editingPersona.name as string) || '')
        setDescription((editingPersona.description as string) || '')
        
        // 加载多选类目和商品（支持新的多对多关系格式和旧的数组格式）
        const categoryIds = editingPersona.categoryIds as string[] | undefined
        const categoryId = editingPersona.categoryId as string | undefined
        const productIds = editingPersona.productIds as string[] | undefined
        const productId = editingPersona.productId as string | undefined
        
        // 从多对多关系表中提取ID（新格式）
        const personaCategories = editingPersona.personaCategories as Array<{ categoryId: string }> | undefined
        const personaProducts = editingPersona.personaProducts as Array<{ productId: string }> | undefined
        
        const loadedCategoryIds = personaCategories && personaCategories.length > 0
          ? personaCategories.map(pc => pc.categoryId)
          : (categoryIds && categoryIds.length > 0
            ? categoryIds
            : (categoryId ? [categoryId] : []))
        
        const loadedProductIds = personaProducts && personaProducts.length > 0
          ? personaProducts.map(pp => pp.productId)
          : (productIds && productIds.length > 0
            ? productIds
            : (productId ? [productId] : []))
        
        setCategoryIds(loadedCategoryIds)
        setProductIds(loadedProductIds)
        
        // 兼容：同时设置单选状态
        setCategoryId(loadedCategoryIds[0] || '')
        setProductId(loadedProductIds[0] || '')
        
        console.log('📦 加载的类目和商品:', { 
          categoryIds: loadedCategoryIds, 
          productIds: loadedProductIds 
        })
        
        const generatedContent = editingPersona.generatedContent as Record<string, unknown> | undefined
        const basicInfo = generatedContent?.basicInfo || editingPersona.coreIdentity
        if (basicInfo) {
          // ✅ 使用 mergePersonaContent 确保所有字段都存在
          const mergedContent = mergePersonaContent(generatedContent || {})
          console.log('🔄 合并后的人设内容:', mergedContent)
          setPersonaContent(mergedContent)
          // ✅ 编辑模式直接显示详细内容，不显示AI配置界面
          setStep('preview')
        } else {
          // 如果没有内容，停留在表单页
          setStep('form')
        }
      } else {
        // 新建模式 - 使用初始值（如果提供）
        if (initialProductId) {
          console.log('🆕 新建模式 - 使用初始商品ID:', initialProductId)
          setProductId(initialProductId)
        }
        if (initialCategory) {
          console.log('🆕 新建模式 - 使用初始类目:', initialCategory)
          setCategoryId(initialCategory)
        }
      }
    }
  }, [open, editingPersona, initialProductId, initialCategory])

  const loadCategories = async () => {
    try {
      // 先获取商品库中有商品的类目
      const productsResponse = await fetch('/api/persona/products?pageSize=1000')
      const productsData = await productsResponse.json()
      
      if (productsData.success) {
        const products = productsData.data?.products || []
        
        console.log('📦 加载的商品数量:', products.length)
        
        // 提取商品库中实际使用的唯一类目（严格按名称去重）
        const categoryMap = new Map<string, CategoryInfo>()
        const categoryNameToId = new Map<string, string>()
        
        products.forEach((product: ProductInfo) => {
          const categoryName = product.category?.trim() // 去除空格
          if (!categoryName) return
          
          // 按类目名称去重（不同名称算不同类目）
          if (!categoryMap.has(categoryName)) {
            // 优先使用 categoryId，如果没有就用类目名称作为ID
            const categoryKey = product.categoryId || categoryName
            
            categoryMap.set(categoryName, {
              id: categoryKey,
              name: categoryName
            })
            categoryNameToId.set(categoryName, categoryKey)
          }
        })
        
        console.log('📋 提取到的类目名称:', Array.from(categoryMap.keys()))
        console.log('📋 提取到的类目详情:', Array.from(categoryMap.values()).map(c => `${c.name} (ID: ${c.id})`))
        
        // 尝试从 Category 表获取完整信息（补充描述等）
        if (categoryMap.size > 0) {
          try {
            const categoriesResponse = await fetch('/api/persona/categories')
            const categoriesData = await categoriesResponse.json()
            
            if (categoriesData.success) {
              const allCategories = categoriesData.data || []
              
              // 补充 Category 表中的详细信息
              allCategories.forEach((cat: CategoryInfo) => {
                // 通过类目名称或ID匹配
                const matchingKey = categoryNameToId.get(cat.name) || cat.id
                if (categoryMap.has(matchingKey)) {
                  categoryMap.set(matchingKey, {
                    id: matchingKey,
                    name: cat.name,
                    description: cat.description
                  })
                }
              })
            }
          } catch (err) {
            console.warn('获取类目详细信息失败，使用基本信息:', err)
          }
        }
        
        // 转换为数组并排序
        const uniqueCategories = Array.from(categoryMap.values()).sort((a, b) => 
          a.name.localeCompare(b.name, 'zh-CN')
        )
        
        console.log('✅ 最终类目列表:', uniqueCategories.map((c: CategoryInfo) => `${c.name} (${c.id})`))
        setCategories(uniqueCategories)
      }
    } catch (err) {
      console.error('❌ 加载类目失败:', err)
    }
  }

  const loadAllProducts = async () => {
    try {
      const response = await fetch('/api/persona/products?pageSize=1000')
      const data = await response.json()
      if (data.success) {
        const loadedProducts = data.data?.products || []
        console.log('🛍️ 加载的商品数量:', loadedProducts.length)
        console.log('📊 商品类目分布:', 
          Object.entries(
            loadedProducts.reduce((acc: Record<string, number>, p: ProductInfo) => {
              const cat = p.category || '未分类'
              acc[cat] = (acc[cat] || 0) + 1
              return acc
            }, {})
          ).map(([cat, count]) => `${cat}:${count}个`)
        )
        setProducts(loadedProducts)
      }
    } catch (err) {
      console.error('加载商品失败:', err)
    }
  }

  // 当类目、商品或目标市场改变时，触发推荐刷新
  useEffect(() => {
    if (categoryId && targetCountry && open) {
      setRecommendationTrigger(prev => prev + 1)
    }
  }, [categoryId, productId, targetCountry, open])

  // 处理模型推荐选择
  const handleModelSelect = (modelId: string, decisionId: string, isUserOverride: boolean) => {
    console.log('🤖 模型已选择:', { modelId, decisionId, isUserOverride })
    setSelectedModel(modelId)
    setModelDecisionId(decisionId)
  }

  // 处理Prompt推荐选择
  const handlePromptSelect = (promptId: string, decisionId: string, isUserOverride: boolean) => {
    console.log('📝 Prompt已选择:', { promptId, decisionId, isUserOverride })
    setSelectedPrompt(promptId)
    setPromptDecisionId(decisionId)
  }

  const handleGeneratePreview = async () => {
    if (!name || categoryIds.length === 0) {
      setError('请填写人设名称和选择至少一个类目')
      return
    }

    if (!selectedModel || !selectedPrompt) {
      setError('请等待AI推荐完成或手动选择模型')
      return
    }

    setGenerating(true)
    setError(null)

    try {
      // 直接生成人设（使用用户选定的模型和Prompt）
      const generateResponse = await fetch('/api/persona/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryIds: categoryIds,  // 多选类目
          productIds: productIds,    // 多选商品
          // 兼容旧字段
          categoryId: categoryIds[0] || '',
          productId: productIds[0] || undefined,
          textDescription: `${textDescription || ''}\n目标市场: ${targetCountry}`,
          aiModel: selectedModel,
          promptTemplate: selectedPrompt
        })
      })

      const generateData = await generateResponse.json()
      if (!generateData.success) {
        throw new Error(generateData.error || '人设生成失败')
      }

      // 设置生成的内容并切换到预览
      setPersonaContent(generateData.data.persona)
      setStep('preview')
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成失败')
      console.error('❌ 生成失败:', err)
    } finally {
      setGenerating(false)
    }
  }

  const handleSave = async () => {
    if (!personaContent) {
      setError('请先生成人设预览')
      return
    }

    if (categoryIds.length === 0) {
      setError('请至少选择一个类目')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const endpoint = editingPersona 
        ? `/api/admin/personas/${editingPersona.id}` 
        : '/api/persona/save'
      
      const method = editingPersona ? 'PUT' : 'POST'

      console.log('💾 开始保存人设:', { name, categoryIds, productIds })

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description: `${description}\n目标市场: ${targetCountry}`,
          // 新字段：多选
          categoryIds: categoryIds,
          productIds: productIds,
          // 兼容旧字段：单选
          categoryId: categoryIds[0] || 'default-category',
          productId: productIds[0] || undefined,
          textDescription,
          generatedContent: personaContent,
          aiModel: selectedModel || 'manual',
          promptTemplate: selectedPrompt || 'manual'
        })
      })

      const data = await response.json()
      if (!data.success) {
        throw new Error(data.error || '保存失败')
      }

      console.log('✅ 人设保存成功:', data)
      
      // 先关闭弹窗，再调用成功回调
      handleClose()
      
      // 延迟调用，确保弹窗已关闭
      setTimeout(() => {
        onSuccess()
      }, 100)
    } catch (err) {
      console.error('❌ 人设保存失败:', err)
      setError(err instanceof Error ? err.message : '保存失败')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setStep('form')
    setName('')
    setDescription('')
    // 清理多选状态
    setCategoryIds([])
    setProductIds([])
    // 清理单选状态（兼容）
    setCategoryId('')
    setProductId('')
    setTargetCountry('马来西亚')
    setTextDescription('')
    setPersonaContent(null)
    setSelectedModel('')
    setSelectedPrompt('')
    setError(null)
    onClose()
  }

  const updatePersonaContent = (path: string[], value: unknown) => {
    if (!personaContent) return
    
    const updated = { ...personaContent }
    let current: Record<string, unknown> = updated
    
    // 防御性检查：确保路径上的每个对象都存在
    for (let i = 0; i < path.length - 1; i++) {
      if (!current[path[i]]) {
        console.warn(`路径 ${path.slice(0, i + 1).join('.')} 不存在，正在创建`)
        current[path[i]] = {}
      }
      current = current[path[i]] as Record<string, unknown>
    }
    
    current[path[path.length - 1]] = value
    setPersonaContent(updated)
  }

  // AI自动匹配类目和商品
  const handleAutoMatch = async () => {
    if (!name) {
      setError('请先填写人设名称')
      return
    }

    setAutoMatching(true)
    setError(null)

    try {
      console.log('🤖 调用AI进行智能匹配...', { name, targetCountry })

      const response = await fetch('/api/persona/auto-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personaName: name,
          description: description || textDescription,
          personaContent: personaContent,
          targetCountry: targetCountry
        })
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'AI匹配失败')
      }

      const { 
        categories: matchedCategories, 
        products: matchedProducts, 
        message,
        aiModel,
        aiPrompt,
        recommendation 
      } = result.data

      console.log('✅ AI匹配结果:', { 
        model: aiModel,
        modelScore: recommendation?.modelScore,
        prompt: aiPrompt,
        promptScore: recommendation?.promptScore,
        categories: matchedCategories.length, 
        products: matchedProducts.length 
      })

      // 更新类目（合并现有选择）
      const newCategoryIds = [
        ...new Set([
          ...categoryIds, 
          ...matchedCategories.map((c: Record<string, unknown>) => c.categoryId)
        ])
      ]
      setCategoryIds(newCategoryIds)

      // 更新商品（合并现有选择）
      const newProductIds = [
        ...new Set([
          ...productIds,
          ...matchedProducts.map((p: Record<string, unknown>) => p.productId)
        ])
      ]
      setProductIds(newProductIds)

      // 显示匹配详情
      const details = [
        message,
        `🤖 AI模型: ${aiModel} (评分: ${recommendation?.modelScore?.toFixed(2) || 'N/A'})`,
        `📝 Prompt: ${aiPrompt} (评分: ${recommendation?.promptScore?.toFixed(2) || 'N/A'})`,
        '',
        '📋 推荐类目:',
        ...matchedCategories.slice(0, 3).map((c: Record<string, unknown>) => 
          `  • ${c.categoryName} (匹配度: ${c.matchScore}%) - ${c.reason}`
        ),
        '',
        '🛍️ 推荐商品:',
        ...matchedProducts.slice(0, 3).map((p: Record<string, unknown>) => 
          `  • ${p.productName} (匹配度: ${p.matchScore}%) - ${p.reason}`
        )
      ].join('\n')

      console.log('📊 AI匹配详情:\n' + details)
      setError(`✅ ${message}\n🤖 使用模型: ${aiModel}\n\n${matchedCategories.slice(0, 2).map((c: Record<string, unknown>) => 
        `${c.categoryName}（${c.reason}）`
      ).join('、')}`)

    } catch (err) {
      console.error('❌ AI匹配失败:', err)
      setError(err instanceof Error ? err.message : '智能匹配失败，请手动选择')
    } finally {
      setAutoMatching(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingPersona ? '编辑人设' : '创建人设'}
            {step === 'preview' && ' - 预览与编辑'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}


          {step === 'form' ? (
            /* 表单页面 */
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>人设名称 *</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="例如：马来科技达人"
                  />
                </div>
                <div>
                  <Label>目标市场 *（可自定义）</Label>
                  <Input
                    list="target-country-suggestions"
                    value={targetCountry}
                    onChange={(e) => setTargetCountry(e.target.value)}
                    placeholder="输入或选择目标市场"
                  />
                  <datalist id="target-country-suggestions">
                    <option value="马来西亚" />
                    <option value="泰国" />
                    <option value="越南" />
                    <option value="印度尼西亚" />
                    <option value="菲律宾" />
                    <option value="新加坡" />
                    <option value="美国" />
                    <option value="英国" />
                    <option value="日本" />
                    <option value="韩国" />
                    <option value="中国台湾" />
                    <option value="中国香港" />
                  </datalist>
                </div>
              </div>

              <div>
                <Label>人设描述</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="简单描述这个人设..."
                  rows={2}
                />
              </div>

              <div className="space-y-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                <div className="text-sm font-semibold text-blue-900">
                  📦 类目与商品信息（可多选）
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  {/* 类目复选框列表 */}
                  <div>
                    <Label className="font-medium mb-2 block">类目 * （至少选择一个）</Label>
                    <div className="bg-white border rounded-md p-3 max-h-[200px] overflow-y-auto space-y-2">
                      {categories.length === 0 ? (
                        <div className="text-sm text-gray-500 text-center py-4">
                          暂无类目
                        </div>
                      ) : (
                        categories.map((cat) => (
                          <div key={cat.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`category-${cat.id}`}
                              checked={categoryIds.includes(cat.id)}
                              onCheckedChange={(checked: boolean) => {
                                if (checked) {
                                  setCategoryIds([...categoryIds, cat.id])
                                } else {
                                  setCategoryIds(categoryIds.filter(id => id !== cat.id))
                                  // 取消类目时，移除该类目下的商品
                                  const catProducts = products
                                    .filter(p => p.categoryId === cat.id || p.category === cat.name)
                                    .map(p => p.id)
                                  setProductIds(productIds.filter(id => !catProducts.includes(id)))
                                }
                              }}
                            />
                            <label
                              htmlFor={`category-${cat.id}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                              {cat.name}
                            </label>
                          </div>
                        ))
                      )}
                    </div>
                    {categoryIds.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {categoryIds.map(id => {
                          const cat = categories.find(c => c.id === id)
                          return cat ? (
                            <span key={id} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                              {cat.name}
                              <button
                                onClick={() => setCategoryIds(categoryIds.filter(cid => cid !== id))}
                                className="hover:text-blue-900"
                              >
                                ×
                              </button>
                            </span>
                          ) : null
                        })}
                      </div>
                    )}
                    <p className="text-xs text-gray-600 mt-1">
                      💡 若需添加新类目，请前往商品管理
                    </p>
                  </div>

                  {/* 商品复选框列表（根据选中的类目筛选） */}
                  <div>
                    <Label className="font-medium mb-2 block">关联商品（可选）</Label>
                    <div className="bg-white border rounded-md p-3 max-h-[200px] overflow-y-auto space-y-2">
                      {categoryIds.length === 0 ? (
                        <div className="text-sm text-gray-500 text-center py-4">
                          请先选择类目
                        </div>
                      ) : (() => {
                        // 根据选中的类目筛选商品
                        const filteredProducts = products.filter(p => {
                          if (!p.category || !p.categoryId) return false
                          return categoryIds.some(catId => {
                            const cat = categories.find(c => c.id === catId)
                            if (!cat) return false
                            return p.categoryId === catId || 
                                   p.category === cat.name ||
                                   cat.name.includes(p.category) ||
                                   p.category.includes(cat.name)
                          })
                        })
                        
                        if (filteredProducts.length === 0) {
                          return (
                            <div className="text-sm text-gray-500 text-center py-4">
                              选中类目下暂无商品
                              <br />
                              <span className="text-xs text-blue-600">💡 请在商品管理中添加</span>
                            </div>
                          )
                        }
                        
                        return filteredProducts.map((product) => (
                          <div key={product.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`product-${product.id}`}
                              checked={productIds.includes(product.id)}
                              onCheckedChange={(checked: boolean) => {
                                if (checked) {
                                  setProductIds([...productIds, product.id])
                                } else {
                                  setProductIds(productIds.filter(id => id !== product.id))
                                }
                              }}
                            />
                            <label
                              htmlFor={`product-${product.id}`}
                              className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                            >
                              <span>{product.name}</span>
                              <span className="text-xs text-gray-400 ml-1">[{product.category}]</span>
                            </label>
                          </div>
                        ))
                      })()}
                    </div>
                    {productIds.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {productIds.map(id => {
                          const prod = products.find(p => p.id === id)
                          return prod ? (
                            <span key={id} className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                              {prod.name}
                              <button
                                onClick={() => setProductIds(productIds.filter(pid => pid !== id))}
                                className="hover:text-green-900"
                              >
                                ×
                              </button>
                            </span>
                          ) : null
                        })}
                      </div>
                    )}
                    <p className="text-xs text-gray-600 mt-1">
                      已选择 {productIds.length} 个商品
                    </p>
                  </div>
                </div>
              </div>

              {/* AI推荐选择器 - 放在类目下面，人设描述上面 */}
              {categoryIds.length > 0 && targetCountry && (
                <div className="space-y-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200">
                  <div className="text-sm font-semibold text-blue-900 flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    ✨ AI 智能推荐
                  </div>
                  
                  {/* 模型和Prompt并排 */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* 左边：模型推荐 */}
                    <div>
                      <Label className="text-xs text-gray-700 font-medium mb-2 block">🤖 AI 模型</Label>
                      <RecommendationSelector
                        scenario="task->model"
                        task={{
                          taskType: 'persona.generate',
                          contentType: 'text',
                          jsonRequirement: true,
                          language: 'zh',
                          category: categories.filter(c => categoryIds.includes(c.id)).map(c => c.name).join(','),
                          region: targetCountry
                        }}
                        context={{
                          region: targetCountry,
                          channel: 'admin'
                        }}
                        constraints={{
                          maxCostUSD: 0.1,
                          requireJsonMode: true
                        }}
                        onSelect={handleModelSelect}
                        onRecommendationStatusChange={setModelRecommendationStatus}
                        triggerRefresh={recommendationTrigger}
                        showStatusIndicator={true}
                      />
                    </div>

                    {/* 右边：Prompt推荐 */}
                    <div>
                      <Label className="text-xs text-gray-700 font-medium mb-2 block">📝 Prompt 模板</Label>
                      <RecommendationSelector
                        scenario="task->prompt"
                        task={{
                          taskType: 'persona.generate',
                          contentType: 'text',
                          jsonRequirement: true,
                          category: categories.filter(c => categoryIds.includes(c.id)).map(c => c.name).join(','),
                          region: targetCountry
                        }}
                        context={{
                          region: targetCountry,
                          channel: 'admin'
                        }}
                        onSelect={handlePromptSelect}
                        onRecommendationStatusChange={setPromptRecommendationStatus}
                        triggerRefresh={recommendationTrigger}
                        showStatusIndicator={true}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <Label>人设描述（帮助AI生成）</Label>
                <Textarea
                  value={textDescription}
                  onChange={(e) => setTextDescription(e.target.value)}
                  placeholder="描述目标用户特征、行为习惯、偏好等...&#10;例如：25-35岁的年轻专业人士，追求最新科技产品，注重性价比..."
                  rows={4}
                />
              </div>
              
              {/* 编辑模式提示 */}
              {editingPersona && personaContent && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-green-800">
                    <Check className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      已有完整人设内容
                    </span>
                  </div>
                  <p className="text-xs text-green-700 mt-1">
                    修改类目和商品后，点击"保存修改"即可。如需编辑详细内容，点击下方"查看/编辑详细内容"按钮。
                  </p>
                </div>
              )}
            </>
          ) : (
            /* 预览编辑页面 */
            personaContent && (
              <>
                {/* 编辑模式：顶部显示基本信息和类目商品（多选） */}
                {editingPersona && (
                  <div className="space-y-4 mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    {/* 标题和自动匹配按钮 */}
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-semibold text-gray-700">基本信息与关联</h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleAutoMatch}
                        disabled={autoMatching || !name || categories.length === 0 || products.length === 0}
                        className="text-xs"
                      >
                        {autoMatching ? (
                          <>
                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                            匹配中...
                          </>
                        ) : (
                          <>
                            <Sparkles className="mr-1 h-3 w-3" />
                            智能匹配类目商品
                          </>
                        )}
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">人设名称 *</Label>
                        <Input
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">目标市场（可自定义）</Label>
                        <Input
                          list="target-country-suggestions-preview"
                          value={targetCountry}
                          onChange={(e) => setTargetCountry(e.target.value)}
                          className="mt-1"
                          placeholder="输入或选择目标市场"
                        />
                        <datalist id="target-country-suggestions-preview">
                          <option value="马来西亚" />
                          <option value="泰国" />
                          <option value="越南" />
                          <option value="印度尼西亚" />
                          <option value="菲律宾" />
                          <option value="新加坡" />
                          <option value="美国" />
                          <option value="英国" />
                          <option value="日本" />
                          <option value="韩国" />
                          <option value="中国台湾" />
                          <option value="中国香港" />
                        </datalist>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      {/* 类目多选显示 */}
                      <div>
                        <Label className="text-sm font-medium mb-2 block">类目 *</Label>
                        <div className="bg-white border rounded-md p-2 max-h-[150px] overflow-y-auto space-y-1">
                          {categories.length === 0 ? (
                            <div className="text-xs text-gray-500 text-center py-2">加载中...</div>
                          ) : (
                            categories.map((cat) => (
                              <div key={cat.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`preview-cat-${cat.id}`}
                                  checked={categoryIds.includes(cat.id)}
                                  onCheckedChange={(checked: boolean) => {
                                    if (checked) {
                                      setCategoryIds([...categoryIds, cat.id])
                                    } else {
                                      setCategoryIds(categoryIds.filter(id => id !== cat.id))
                                    }
                                  }}
                                />
                                <label htmlFor={`preview-cat-${cat.id}`} className="text-sm cursor-pointer">
                                  {cat.name}
                                </label>
                              </div>
                            ))
                          )}
                        </div>
                        {categoryIds.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {categoryIds.map(id => {
                              const cat = categories.find(c => c.id === id)
                              return cat ? (
                                <span key={id} className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                                  {cat.name}
                                </span>
                              ) : null
                            })}
                          </div>
                        )}
                      </div>
                      
                      {/* 商品多选显示 */}
                      <div>
                        <Label className="text-sm font-medium mb-2 block">关联商品</Label>
                        <div className="bg-white border rounded-md p-2 max-h-[150px] overflow-y-auto space-y-1">
                          {categoryIds.length === 0 ? (
                            <div className="text-xs text-gray-500 text-center py-2">请先选择类目</div>
                          ) : (() => {
                            const filteredProducts = products.filter(p => 
                              categoryIds.some(catId => {
                                const cat = categories.find(c => c.id === catId)
                                return cat && (p.categoryId === catId || p.category === cat.name)
                              })
                            )
                            if (filteredProducts.length === 0) {
                              return (
                                <div className="text-xs text-gray-500 text-center py-2">
                                  该类目下暂无商品
                                </div>
                              )
                            }
                            return filteredProducts.map((product) => (
                              <div key={product.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`preview-prod-${product.id}`}
                                  checked={productIds.includes(product.id)}
                                  onCheckedChange={(checked: boolean) => {
                                    if (checked) {
                                      setProductIds([...productIds, product.id])
                                    } else {
                                      setProductIds(productIds.filter(id => id !== product.id))
                                    }
                                  }}
                                />
                                <label htmlFor={`preview-prod-${product.id}`} className="text-sm cursor-pointer">
                                  {product.name}
                                </label>
                              </div>
                            ))
                          })()}
                        </div>
                        {productIds.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {productIds.map(id => {
                              const prod = products.find(p => p.id === id)
                              return prod ? (
                                <span key={id} className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">
                                  {prod.name}
                                </span>
                              ) : null
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                <Tabs defaultValue="basic" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="basic">基础信息</TabsTrigger>
                    <TabsTrigger value="behavior">行为特征</TabsTrigger>
                    <TabsTrigger value="preferences">偏好特征</TabsTrigger>
                    <TabsTrigger value="psychology">心理特征</TabsTrigger>
                  </TabsList>

                <TabsContent value="basic" className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm">年龄段</Label>
                      <Input
                        value={personaContent.basicInfo.age}
                        onChange={(e) => updatePersonaContent(['basicInfo', 'age'], e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">性别</Label>
                      <Input
                        value={personaContent.basicInfo.gender}
                        onChange={(e) => updatePersonaContent(['basicInfo', 'gender'], e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">职业</Label>
                      <Input
                        value={personaContent.basicInfo.occupation}
                        onChange={(e) => updatePersonaContent(['basicInfo', 'occupation'], e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">收入水平</Label>
                      <Input
                        value={personaContent.basicInfo.income}
                        onChange={(e) => updatePersonaContent(['basicInfo', 'income'], e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-sm">地区</Label>
                      <Input
                        value={personaContent.basicInfo.location}
                        onChange={(e) => updatePersonaContent(['basicInfo', 'location'], e.target.value)}
                        className="h-9"
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="behavior" className="space-y-3">
                  <div>
                    <Label className="text-sm">购买习惯</Label>
                    <Textarea
                      value={personaContent.behavior.purchaseHabits}
                      onChange={(e) => updatePersonaContent(['behavior', 'purchaseHabits'], e.target.value)}
                      rows={2}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">使用场景</Label>
                    <Textarea
                      value={personaContent.behavior.usageScenarios}
                      onChange={(e) => updatePersonaContent(['behavior', 'usageScenarios'], e.target.value)}
                      rows={2}
                      className="text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm">决策因素</Label>
                      <Input
                        value={personaContent.behavior.decisionFactors}
                        onChange={(e) => updatePersonaContent(['behavior', 'decisionFactors'], e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">品牌偏好</Label>
                      <Input
                        value={personaContent.behavior.brandPreference}
                        onChange={(e) => updatePersonaContent(['behavior', 'brandPreference'], e.target.value)}
                        className="h-9"
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="preferences" className="space-y-3">
                  <div>
                    <Label className="text-sm">价格敏感度</Label>
                    <Input
                      value={personaContent.preferences.priceSensitivity}
                      onChange={(e) => updatePersonaContent(['preferences', 'priceSensitivity'], e.target.value)}
                      className="h-9"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">功能需求（逗号分隔）</Label>
                    <Input
                      value={personaContent.preferences.featureNeeds.join(', ')}
                      onChange={(e) => updatePersonaContent(['preferences', 'featureNeeds'], e.target.value.split(',').map(s => s.trim()))}
                      className="h-9"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">品质期望</Label>
                    <Textarea
                      value={personaContent.preferences.qualityExpectations}
                      onChange={(e) => updatePersonaContent(['preferences', 'qualityExpectations'], e.target.value)}
                      rows={2}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">服务期望</Label>
                    <Textarea
                      value={personaContent.preferences.serviceExpectations}
                      onChange={(e) => updatePersonaContent(['preferences', 'serviceExpectations'], e.target.value)}
                      rows={2}
                      className="text-sm"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="psychology" className="space-y-3">
                  <div>
                    <Label className="text-sm">价值观（逗号分隔）</Label>
                    <Input
                      value={personaContent.psychology.values.join(', ')}
                      onChange={(e) => updatePersonaContent(['psychology', 'values'], e.target.value.split(',').map(s => s.trim()))}
                      className="h-9"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">生活方式</Label>
                    <Textarea
                      value={personaContent.psychology.lifestyle}
                      onChange={(e) => updatePersonaContent(['psychology', 'lifestyle'], e.target.value)}
                      rows={2}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">痛点（逗号分隔）</Label>
                    <Input
                      value={personaContent.psychology.painPoints.join(', ')}
                      onChange={(e) => updatePersonaContent(['psychology', 'painPoints'], e.target.value.split(',').map(s => s.trim()))}
                      className="h-9"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">动机（逗号分隔）</Label>
                    <Input
                      value={personaContent.psychology.motivations.join(', ')}
                      onChange={(e) => updatePersonaContent(['psychology', 'motivations'], e.target.value.split(',').map(s => s.trim()))}
                      className="h-9"
                    />
                  </div>
                </TabsContent>
              </Tabs>
              </>
            )
          )}
        </div>

        <DialogFooter>
          {step === 'form' ? (
            <>
              <Button variant="outline" onClick={handleClose} disabled={generating}>
                取消
              </Button>
              
              {/* 如果是编辑模式且已有内容，显示"查看/编辑详细内容"按钮 */}
              {editingPersona && personaContent ? (
                <>
                  <Button variant="outline" onClick={() => setStep('preview')}>
                    <Eye className="mr-2 h-4 w-4" />
                    查看/编辑详细内容
                  </Button>
                  <Button onClick={handleSave} disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        保存中...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        保存修改
                      </>
                    )}
                  </Button>
                </>
              ) : (
                /* 新增模式或没有内容，显示"生成预览"按钮 */
                <Button onClick={handleGeneratePreview} disabled={generating || !name || categoryIds.length === 0}>
                  {generating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      AI生成中...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      AI生成预览
                    </>
                  )}
                </Button>
              )}
            </>
          ) : (
            <>
              {/* 编辑模式不需要返回按钮，可以直接在顶部修改类目和商品 */}
              {!editingPersona && (
                <Button variant="outline" onClick={() => setStep('form')} disabled={loading}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  返回修改
                </Button>
              )}
              <Button onClick={handleSave} disabled={loading} className={editingPersona ? 'ml-auto' : ''}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    保存中...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {editingPersona ? '保存修改' : '保存到库'}
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

