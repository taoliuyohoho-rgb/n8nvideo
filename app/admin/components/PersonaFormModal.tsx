/**
 * 人设表单弹窗
 * 
 * 功能：
 * - 单页表单，填写所有信息后直接生成
 * - 支持创建和编辑
 * - 包含国家/目标市场字段
 */

'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Sparkles } from 'lucide-react'

interface PersonaFormModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  editingPersona?: any // 编辑模式下的人设数据
}

interface CategoryInfo {
  id: string
  name: string
  description?: string
  targetMarket?: string
}

interface ProductInfo {
  id: string
  name: string
  description?: string
  category?: string
  categoryId?: string
}

export function PersonaFormModal({ open, onClose, onSuccess, editingPersona }: PersonaFormModalProps) {
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 数据状态
  const [categories, setCategories] = useState<CategoryInfo[]>([])
  const [products, setProducts] = useState<ProductInfo[]>([])

  // 表单状态
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [productId, setProductId] = useState('')
  const [targetCountry, setTargetCountry] = useState('马来西亚')
  const [textDescription, setTextDescription] = useState('')
  const [useAI, setUseAI] = useState(true)

  // 手动输入的人设内容（不使用AI生成时）
  const [manualContent, setManualContent] = useState({
    age: '',
    gender: '',
    occupation: '',
    income: '',
    location: '',
    purchaseHabits: '',
    usageScenarios: '',
    decisionFactors: '',
    brandPreference: '',
    priceSensitivity: '',
    featureNeeds: '',
    qualityExpectations: '',
    serviceExpectations: '',
    values: '',
    lifestyle: '',
    painPoints: '',
    motivations: ''
  })

  // 加载类目列表
  useEffect(() => {
    if (open) {
      loadCategories()
      loadAllProducts() // 加载所有商品
      
      // 如果是编辑模式，填充数据
      if (editingPersona) {
        setName(editingPersona.name || '')
        setDescription(editingPersona.description || '')
        setCategoryId(editingPersona.categoryId || '')
        setProductId(editingPersona.productId || '')
        setTextDescription(editingPersona.textDescription || '')
        
        // 从 generatedContent 或 coreIdentity 提取数据
        const basicInfo = editingPersona.generatedContent?.basicInfo || editingPersona.coreIdentity
        const behavior = editingPersona.generatedContent?.behavior
        const preferences = editingPersona.generatedContent?.preferences
        const psychology = editingPersona.generatedContent?.psychology || editingPersona.vibe
        
        if (basicInfo) {
          setManualContent({
            age: basicInfo.age || '',
            gender: basicInfo.gender || '',
            occupation: basicInfo.occupation || '',
            income: basicInfo.income || '',
            location: basicInfo.location || '',
            purchaseHabits: behavior?.purchaseHabits || '',
            usageScenarios: behavior?.usageScenarios || '',
            decisionFactors: behavior?.decisionFactors || '',
            brandPreference: behavior?.brandPreference || '',
            priceSensitivity: preferences?.priceSensitivity || '',
            featureNeeds: Array.isArray(preferences?.featureNeeds) ? preferences.featureNeeds.join(', ') : '',
            qualityExpectations: preferences?.qualityExpectations || '',
            serviceExpectations: preferences?.serviceExpectations || '',
            values: Array.isArray(psychology?.values) ? psychology.values.join(', ') : 
                    Array.isArray(psychology?.traits) ? psychology.traits.join(', ') : '',
            lifestyle: psychology?.lifestyle || '',
            painPoints: Array.isArray(psychology?.painPoints) ? psychology.painPoints.join(', ') : '',
            motivations: Array.isArray(psychology?.motivations) ? psychology.motivations.join(', ') : ''
          })
        }
      }
    }
  }, [open, editingPersona])

  // 当选择类目时，筛选商品列表
  useEffect(() => {
    if (categoryId && products.length > 0) {
      // 客户端筛选，提升用户体验
      const category = categories.find(c => c.id === categoryId)
      if (category) {
        const filtered = products.filter(p => 
          p.category === category.name || p.categoryId === categoryId
        )
        // 如果有筛选结果，可以更新显示（可选）
      }
    }
  }, [categoryId, products, categories])

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/persona/categories')
      const data = await response.json()
      if (data.success) {
        setCategories(data.data || [])
      }
    } catch (err) {
      console.error('加载类目失败:', err)
    }
  }

  const loadAllProducts = async () => {
    try {
      // 加载所有商品，不限制类目
      const response = await fetch('/api/persona/products?pageSize=100')
      const data = await response.json()
      if (data.success) {
        setProducts(data.data?.products || [])
      }
    } catch (err) {
      console.error('加载商品失败:', err)
    }
  }

  const handleGenerate = async () => {
    if (!name || !categoryId) {
      setError('请填写人设名称和选择类目')
      return
    }

    setGenerating(true)
    setError(null)

    try {
      if (useAI) {
        // AI 生成模式
        // 1. 获取 AI 推荐
        const recommendResponse = await fetch('/api/persona/recommend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            categoryId,
            productId: productId || undefined,
            textDescription: textDescription || undefined,
            targetCountry
          })
        })

        const recommendData = await recommendResponse.json()
        if (!recommendData.success) {
          throw new Error(recommendData.error || 'AI推荐失败')
        }

        // 2. 生成人设
        const generateResponse = await fetch('/api/persona/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            categoryId,
            productId: productId || undefined,
            textDescription: `${textDescription || ''}\n目标市场: ${targetCountry}`,
            aiModel: recommendData.data.recommendedModel.id,
            promptTemplate: recommendData.data.recommendedPrompt.id
          })
        })

        const generateData = await generateResponse.json()
        if (!generateData.success) {
          throw new Error(generateData.error || '人设生成失败')
        }

        // 3. 保存人设
        const saveResponse = await fetch(editingPersona ? `/api/admin/personas/${editingPersona.id}` : '/api/persona/save', {
          method: editingPersona ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            description,
            categoryId,
            productId: productId || undefined,
            textDescription: `${textDescription || ''}\n目标市场: ${targetCountry}`,
            generatedContent: generateData.data.persona,
            aiModel: recommendData.data.recommendedModel.id,
            promptTemplate: recommendData.data.recommendedPrompt.id
          })
        })

        const saveData = await saveResponse.json()
        if (!saveData.success) {
          throw new Error(saveData.error || '保存失败')
        }
      } else {
        // 手动输入模式
        const generatedContent = {
          basicInfo: {
            age: manualContent.age,
            gender: manualContent.gender,
            occupation: manualContent.occupation,
            income: manualContent.income,
            location: manualContent.location
          },
          behavior: {
            purchaseHabits: manualContent.purchaseHabits,
            usageScenarios: manualContent.usageScenarios,
            decisionFactors: manualContent.decisionFactors,
            brandPreference: manualContent.brandPreference
          },
          preferences: {
            priceSensitivity: manualContent.priceSensitivity,
            featureNeeds: manualContent.featureNeeds.split(',').map(s => s.trim()).filter(Boolean),
            qualityExpectations: manualContent.qualityExpectations,
            serviceExpectations: manualContent.serviceExpectations
          },
          psychology: {
            values: manualContent.values.split(',').map(s => s.trim()).filter(Boolean),
            lifestyle: manualContent.lifestyle,
            painPoints: manualContent.painPoints.split(',').map(s => s.trim()).filter(Boolean),
            motivations: manualContent.motivations.split(',').map(s => s.trim()).filter(Boolean)
          }
        }

        const saveResponse = await fetch(editingPersona ? `/api/admin/personas/${editingPersona.id}` : '/api/persona/save', {
          method: editingPersona ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            description: `${description}\n目标市场: ${targetCountry}`,
            categoryId,
            productId: productId || undefined,
            textDescription,
            generatedContent,
            aiModel: 'manual',
            promptTemplate: 'manual'
          })
        })

        const saveData = await saveResponse.json()
        if (!saveData.success) {
          throw new Error(saveData.error || '保存失败')
        }
      }

      onSuccess()
      handleClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败')
    } finally {
      setGenerating(false)
    }
  }

  const handleClose = () => {
    setName('')
    setDescription('')
    setCategoryId('')
    setProductId('')
    setTargetCountry('马来西亚')
    setTextDescription('')
    setUseAI(true)
    setManualContent({
      age: '', gender: '', occupation: '', income: '', location: '',
      purchaseHabits: '', usageScenarios: '', decisionFactors: '', brandPreference: '',
      priceSensitivity: '', featureNeeds: '', qualityExpectations: '', serviceExpectations: '',
      values: '', lifestyle: '', painPoints: '', motivations: ''
    })
    setError(null)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingPersona ? '编辑人设' : '创建人设'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* 基本信息 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">人设名称 *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例如：马来科技达人"
              />
            </div>

            <div>
              <Label htmlFor="targetCountry">目标市场 *</Label>
              <Select value={targetCountry} onValueChange={setTargetCountry}>
                <SelectTrigger>
                  <SelectValue placeholder="选择目标市场" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="马来西亚">马来西亚</SelectItem>
                  <SelectItem value="泰国">泰国</SelectItem>
                  <SelectItem value="越南">越南</SelectItem>
                  <SelectItem value="印度尼西亚">印度尼西亚</SelectItem>
                  <SelectItem value="菲律宾">菲律宾</SelectItem>
                  <SelectItem value="新加坡">新加坡</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="description">人设描述</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="简单描述这个人设..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">类目 *</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="选择类目" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                      {category.description && ` - ${category.description}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="product">关联商品（可选）</Label>
              <Select value={productId || 'none'} onValueChange={(val) => setProductId(val === 'none' ? '' : val)}>
                <SelectTrigger>
                  <SelectValue placeholder="选择商品" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  <SelectItem value="none">不关联商品</SelectItem>
                  {(() => {
                    // 根据选择的类目筛选商品
                    const category = categories.find(c => c.id === categoryId)
                    const filteredProducts = categoryId && category
                      ? products.filter(p => 
                          p.category === category.name || 
                          p.categoryId === categoryId
                        )
                      : products
                    
                    if (filteredProducts.length === 0) {
                      return (
                        <div className="px-2 py-6 text-sm text-center text-gray-500">
                          {categoryId ? '该类目下暂无商品' : '商品库为空'}
                        </div>
                      )
                    }
                    
                    return filteredProducts.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium">{product.name}</span>
                          {product.category && (
                            <span className="text-xs text-gray-500">
                              [{product.category}]
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))
                  })()}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                {products.length > 0 
                  ? `共 ${products.length} 个商品${categoryId ? '（已按类目筛选）' : ''}`
                  : '暂无商品数据，请先在商品管理中添加商品'}
              </p>
            </div>
          </div>

          {/* 生成方式选择 */}
          <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
            <Label>生成方式:</Label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={useAI}
                onChange={() => setUseAI(true)}
              />
              <span>AI智能生成</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={!useAI}
                onChange={() => setUseAI(false)}
              />
              <span>手动输入</span>
            </label>
          </div>

          {useAI ? (
            /* AI 生成模式 - 只需要描述 */
            <div>
              <Label htmlFor="textDescription">人设描述（帮助AI更好地生成）</Label>
              <Textarea
                id="textDescription"
                value={textDescription}
                onChange={(e) => setTextDescription(e.target.value)}
                placeholder="描述目标用户特征、行为习惯、偏好等...&#10;例如：年轻专业人士，追求最新科技产品，注重性价比..."
                rows={4}
              />
            </div>
          ) : (
            /* 手动输入模式 - 完整表单 */
            <div className="space-y-4">
              <div className="font-medium text-sm border-b pb-2">基础信息</div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">年龄段</Label>
                  <Input
                    value={manualContent.age}
                    onChange={(e) => setManualContent({...manualContent, age: e.target.value})}
                    placeholder="例如：25-35"
                    className="h-8"
                  />
                </div>
                <div>
                  <Label className="text-xs">性别</Label>
                  <Input
                    value={manualContent.gender}
                    onChange={(e) => setManualContent({...manualContent, gender: e.target.value})}
                    placeholder="例如：男性为主"
                    className="h-8"
                  />
                </div>
                <div>
                  <Label className="text-xs">职业</Label>
                  <Input
                    value={manualContent.occupation}
                    onChange={(e) => setManualContent({...manualContent, occupation: e.target.value})}
                    placeholder="例如：IT专业人士"
                    className="h-8"
                  />
                </div>
                <div>
                  <Label className="text-xs">收入水平</Label>
                  <Input
                    value={manualContent.income}
                    onChange={(e) => setManualContent({...manualContent, income: e.target.value})}
                    placeholder="例如：中高收入"
                    className="h-8"
                  />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs">地区</Label>
                  <Input
                    value={manualContent.location}
                    onChange={(e) => setManualContent({...manualContent, location: e.target.value})}
                    placeholder="例如：吉隆坡、槟城等大城市"
                    className="h-8"
                  />
                </div>
              </div>

              <div className="font-medium text-sm border-b pb-2">行为特征</div>
              <div className="space-y-2">
                <div>
                  <Label className="text-xs">购买习惯</Label>
                  <Input
                    value={manualContent.purchaseHabits}
                    onChange={(e) => setManualContent({...manualContent, purchaseHabits: e.target.value})}
                    placeholder="例如：喜欢在线购物，关注产品评测"
                    className="h-8"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">使用场景</Label>
                    <Input
                      value={manualContent.usageScenarios}
                      onChange={(e) => setManualContent({...manualContent, usageScenarios: e.target.value})}
                      placeholder="例如：工作、娱乐"
                      className="h-8"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">决策因素</Label>
                    <Input
                      value={manualContent.decisionFactors}
                      onChange={(e) => setManualContent({...manualContent, decisionFactors: e.target.value})}
                      placeholder="例如：性能、价格"
                      className="h-8"
                    />
                  </div>
                </div>
              </div>

              <div className="font-medium text-sm border-b pb-2">心理特征</div>
              <div className="space-y-2">
                <div>
                  <Label className="text-xs">价值观（逗号分隔）</Label>
                  <Input
                    value={manualContent.values}
                    onChange={(e) => setManualContent({...manualContent, values: e.target.value})}
                    placeholder="例如：创新, 效率, 品质"
                    className="h-8"
                  />
                </div>
                <div>
                  <Label className="text-xs">痛点（逗号分隔）</Label>
                  <Input
                    value={manualContent.painPoints}
                    onChange={(e) => setManualContent({...manualContent, painPoints: e.target.value})}
                    placeholder="例如：产品选择困难, 担心买到假货"
                    className="h-8"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={generating}>
            取消
          </Button>
          <Button onClick={handleGenerate} disabled={generating || !name || !categoryId}>
            {generating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {useAI ? 'AI生成中...' : '保存中...'}
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                {editingPersona ? '更新人设' : (useAI ? 'AI生成并保存' : '保存人设')}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

