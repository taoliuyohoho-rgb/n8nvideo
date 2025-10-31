'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Loader2, Users, Sparkles, Save, RefreshCw } from 'lucide-react'
import type { 
  CategoryInfo, 
  ProductInfo, 
  AIRecommendation, 
  PersonaContent,
  PersonaGenerationRequest 
} from '@/types/persona'

interface PersonaGeneratorProps {
  onPersonaGenerated?: (persona: PersonaContent) => void
  onPersonaSaved?: (personaId: string) => void
}

export function PersonaGenerator({ onPersonaGenerated, onPersonaSaved }: PersonaGeneratorProps) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 数据状态
  const [categories, setCategories] = useState<CategoryInfo[]>([])
  const [products, setProducts] = useState<ProductInfo[]>([])
  const [recommendation, setRecommendation] = useState<AIRecommendation | null>(null)
  const [generatedPersona, setGeneratedPersona] = useState<PersonaContent | null>(null)

  // 表单状态
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('')
  const [selectedProductId, setSelectedProductId] = useState<string>('')
  const [textDescription, setTextDescription] = useState<string>('')
  const [personaName, setPersonaName] = useState<string>('')
  const [personaDescription, setPersonaDescription] = useState<string>('')

  // 加载类目列表
  useEffect(() => {
    loadCategories()
  }, [])

  // 加载商品列表（当选择类目时）
  useEffect(() => {
    if (selectedCategoryId) {
      loadProducts(selectedCategoryId)
    }
  }, [selectedCategoryId])

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/persona/categories')
      const data = await response.json()
      if (data.success) {
        setCategories(data.data)
      } else {
        setError(data.error || '加载类目失败')
      }
    } catch (err) {
      setError('加载类目失败')
    }
  }

  const loadProducts = async (categoryId: string) => {
    try {
      const response = await fetch(`/api/persona/products?categoryId=${categoryId}`)
      const data = await response.json()
      if (data.success) {
        setProducts(data.data.products)
      } else {
        setError(data.error || '加载商品失败')
      }
    } catch (err) {
      setError('加载商品失败')
    }
  }

  const handleRecommend = async () => {
    if (!selectedCategoryId) {
      setError('请先选择类目')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const request: PersonaGenerationRequest = {
        categoryId: selectedCategoryId,
        productId: selectedProductId || undefined,
        textDescription: textDescription || undefined
      }

      const response = await fetch('/api/persona/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      })

      const data = await response.json()
      if (data.success) {
        setRecommendation(data.data)
        setStep(3)
      } else {
        setError(data.error || 'AI推荐失败')
      }
    } catch (err) {
      setError('AI推荐失败')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerate = async () => {
    if (!recommendation) {
      setError('请先获取AI推荐')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const request = {
        categoryId: selectedCategoryId,
        productId: selectedProductId || undefined,
        textDescription: textDescription || undefined,
        aiModel: recommendation.recommendedModel.id,
        promptTemplate: recommendation.recommendedPrompt.id
      }

      const response = await fetch('/api/persona/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      })

      const data = await response.json()
      if (data.success) {
        setGeneratedPersona(data.data.persona)
        setStep(4)
        onPersonaGenerated?.(data.data.persona)
      } else {
        setError(data.error || '人设生成失败')
      }
    } catch (err) {
      setError('人设生成失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!generatedPersona || !personaName) {
      setError('请填写人设名称')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const request = {
        name: personaName,
        description: personaDescription || undefined,
        categoryId: selectedCategoryId,
        productId: selectedProductId || undefined,
        textDescription: textDescription || undefined,
        generatedContent: generatedPersona,
        aiModel: recommendation?.recommendedModel.id || '',
        promptTemplate: recommendation?.recommendedPrompt.id || ''
      }

      const response = await fetch('/api/persona/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      })

      const data = await response.json()
      if (data.success) {
        onPersonaSaved?.(data.data.personaId)
        setStep(5)
      } else {
        setError(data.error || '保存人设失败')
      }
    } catch (err) {
      setError('保存人设失败')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setStep(1)
    setSelectedCategoryId('')
    setSelectedProductId('')
    setTextDescription('')
    setPersonaName('')
    setPersonaDescription('')
    setRecommendation(null)
    setGeneratedPersona(null)
    setError(null)
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          <Users className="h-8 w-8" />
          人设生成器
        </h1>
        <p className="text-muted-foreground mt-2">
          基于类目和商品信息，AI智能生成目标用户人设
        </p>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* 步骤1: 选择类目 */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="bg-blue-100 text-blue-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-medium">1</span>
              选择类目（必选）
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="category">类目</Label>
              <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="请选择类目" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                      {category.description && (
                        <span className="text-muted-foreground ml-2">
                          - {category.description}
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end">
              <Button 
                onClick={() => setStep(2)} 
                disabled={!selectedCategoryId}
              >
                下一步
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 步骤2: 选择商品或输入描述 */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="bg-blue-100 text-blue-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-medium">2</span>
              选择商品或输入描述（可选）
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="product">商品选择</Label>
              <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                <SelectTrigger>
                  <SelectValue placeholder="选择商品（可选）" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">不选择商品</SelectItem>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                      {product.description && (
                        <span className="text-muted-foreground ml-2">
                          - {product.description}
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="description">文字描述</Label>
              <Textarea
                id="description"
                placeholder="描述目标用户特征、行为习惯、偏好等..."
                value={textDescription}
                onChange={(e) => setTextDescription(e.target.value)}
                rows={4}
              />
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                上一步
              </Button>
              <Button onClick={handleRecommend} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    AI推荐中...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    AI推荐
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 步骤3: AI推荐 */}
      {step === 3 && recommendation && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="bg-blue-100 text-blue-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-medium">3</span>
              AI推荐
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>推荐模型</Label>
              <div className="p-4 border rounded-lg bg-muted/50">
                <div className="font-medium">{recommendation.recommendedModel.name}</div>
                <div className="text-sm text-muted-foreground">
                  {recommendation.recommendedModel.reason}
                </div>
                <Badge variant="secondary" className="mt-2">
                  {recommendation.recommendedModel.provider}
                </Badge>
              </div>
            </div>

            <div>
              <Label>推荐Prompt模板</Label>
              <div className="p-4 border rounded-lg bg-muted/50">
                <div className="font-medium">模板ID: {recommendation.recommendedPrompt.id}</div>
                <div className="text-sm text-muted-foreground mt-2">
                  变量: {recommendation.recommendedPrompt.variables.join(', ')}
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>
                上一步
              </Button>
              <Button onClick={handleGenerate} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    生成人设
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 步骤4: 生成结果 */}
      {step === 4 && generatedPersona && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="bg-blue-100 text-blue-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-medium">4</span>
              生成结果
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <PersonaPreview persona={generatedPersona} />

            <div className="space-y-4">
              <div>
                <Label htmlFor="personaName">人设名称</Label>
                <Input
                  id="personaName"
                  value={personaName}
                  onChange={(e) => setPersonaName(e.target.value)}
                  placeholder="为人设起个名字"
                />
              </div>
              <div>
                <Label htmlFor="personaDescription">人设描述</Label>
                <Textarea
                  id="personaDescription"
                  value={personaDescription}
                  onChange={(e) => setPersonaDescription(e.target.value)}
                  placeholder="描述这个人设的用途..."
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(3)}>
                上一步
              </Button>
              <Button onClick={handleSave} disabled={loading || !personaName}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    保存中...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    保存到库
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 步骤5: 完成 */}
      {step === 5 && (
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-green-600 text-6xl mb-4">✓</div>
            <h3 className="text-xl font-semibold mb-2">人设生成完成！</h3>
            <p className="text-muted-foreground mb-6">
              人设已成功保存到库中，可以在人设管理中查看和使用。
            </p>
            <div className="flex justify-center gap-4">
              <Button onClick={resetForm}>
                <RefreshCw className="mr-2 h-4 w-4" />
                生成新人设
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// 人设预览组件
function PersonaPreview({ persona }: { persona: PersonaContent }) {
  return (
    <div className="space-y-6">
      {/* 基础信息 */}
      <div>
        <h4 className="font-semibold mb-3">基础信息</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <Label className="text-sm text-muted-foreground">年龄</Label>
            <p className="font-medium">{persona.basicInfo.age}</p>
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">性别</Label>
            <p className="font-medium">{persona.basicInfo.gender}</p>
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">职业</Label>
            <p className="font-medium">{persona.basicInfo.occupation}</p>
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">收入</Label>
            <p className="font-medium">{persona.basicInfo.income}</p>
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">地区</Label>
            <p className="font-medium">{persona.basicInfo.location}</p>
          </div>
        </div>
      </div>

      {/* 行为特征 */}
      <div>
        <h4 className="font-semibold mb-3">行为特征</h4>
        <div className="space-y-3">
          <div>
            <Label className="text-sm text-muted-foreground">购买习惯</Label>
            <p className="text-sm">{persona.behavior.purchaseHabits}</p>
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">使用场景</Label>
            <p className="text-sm">{persona.behavior.usageScenarios}</p>
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">决策因素</Label>
            <p className="text-sm">{persona.behavior.decisionFactors}</p>
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">品牌偏好</Label>
            <p className="text-sm">{persona.behavior.brandPreference}</p>
          </div>
        </div>
      </div>

      {/* 偏好特征 */}
      <div>
        <h4 className="font-semibold mb-3">偏好特征</h4>
        <div className="space-y-3">
          <div>
            <Label className="text-sm text-muted-foreground">价格敏感度</Label>
            <p className="text-sm">{persona.preferences.priceSensitivity}</p>
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">功能需求</Label>
            <div className="flex flex-wrap gap-2">
              {persona.preferences.featureNeeds.map((need, index) => (
                <Badge key={index} variant="secondary">{need}</Badge>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">品质期望</Label>
            <p className="text-sm">{persona.preferences.qualityExpectations}</p>
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">服务期望</Label>
            <p className="text-sm">{persona.preferences.serviceExpectations}</p>
          </div>
        </div>
      </div>

      {/* 心理特征 */}
      <div>
        <h4 className="font-semibold mb-3">心理特征</h4>
        <div className="space-y-3">
          <div>
            <Label className="text-sm text-muted-foreground">价值观</Label>
            <div className="flex flex-wrap gap-2">
              {persona.psychology.values.map((value, index) => (
                <Badge key={index} variant="outline">{value}</Badge>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">生活方式</Label>
            <p className="text-sm">{persona.psychology.lifestyle}</p>
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">痛点</Label>
            <div className="flex flex-wrap gap-2">
              {persona.psychology.painPoints.map((pain, index) => (
                <Badge key={index} variant="destructive">{pain}</Badge>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">动机</Label>
            <div className="flex flex-wrap gap-2">
              {persona.psychology.motivations.map((motivation, index) => (
                <Badge key={index} variant="default">{motivation}</Badge>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
