/**
 * 人设选择组件
 * 推荐引擎集成和去重存储
 */

'use client'

import React, { useState, useEffect } from 'react'
import { User, Plus, Loader2, CheckCircle, AlertTriangle, Sparkles } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RecommendationSelector } from '@/components/RecommendationSelector'
import { PersonaFormModal as PersonaFormModalV2 } from '@/app/admin/components/PersonaFormModalV2'
import { useVideoGenerationApi } from './hooks/useVideoGenerationApi'
import type { PersonaSelectorProps, Persona } from './types/video-generation'

interface PersonaCardProps {
  persona: Persona
  isSelected: boolean
  onSelect: () => void
  isRecommended?: boolean
}

function PersonaCard({ persona, isSelected, onSelect, isRecommended = false }: PersonaCardProps) {
  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md ${
        isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
      } ${isRecommended ? 'border-yellow-300 bg-yellow-50' : ''}`}
      onClick={onSelect}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-gray-500" />
            <h3 className="font-medium">{persona.coreIdentity.name}</h3>
            {isRecommended && (
              <Badge variant="outline" className="text-xs bg-yellow-100 text-yellow-700">
                <Sparkles className="w-3 h-3 mr-1" />
                推荐
              </Badge>
            )}
            {isSelected && (
              <CheckCircle className="w-4 h-4 text-green-500" />
            )}
          </div>
        </div>
        
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <span className="font-medium">年龄:</span>
            <span>{persona.coreIdentity.age}岁</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">职业:</span>
            <span>{persona.coreIdentity.occupation}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">地区:</span>
            <span>{persona.coreIdentity.location}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">风格:</span>
            <span>{persona.vibe.communicationStyle}</span>
          </div>
        </div>
        
        <div className="mt-3 pt-3 border-t">
          <p className="text-xs text-gray-500 line-clamp-2">
            {persona.context.hobbies} | {persona.context.values}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export function PersonaSelector({ product, analysis, onPersonaSelected, disabled, className }: PersonaSelectorProps) {
  const [personas, setPersonas] = useState<Persona[]>([])
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showRecommendation, setShowRecommendation] = useState(false)

  const { recommendPersona } = useVideoGenerationApi()

  // 加载推荐人设
  useEffect(() => {
    loadRecommendedPersonas()
  }, [product, analysis])

  const loadRecommendedPersonas = async () => {
    if (!product?.id) {
      console.log('⚠️ 人设推荐：缺少商品信息')
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      console.log('🔍 开始推荐人设，商品:', {
        id: product.id,
        name: product.name,
        category: product.category,
        subcategory: product.subcategory,
        targetCountries: product.targetCountries
      })
      
      // 即使没有 analysis 也要尝试推荐（后端会根据 productId 查询已有人设）
      const dummyAnalysis = analysis || {
        description: product.description || '',
        category: product.category || '',
        targetCountries: product.targetCountries || [],
        sellingPoints: [],
        painPoints: [],
        targetAudience: ''
      }
      
      const recommendedPersonas = await recommendPersona(product, dummyAnalysis)
      console.log('✅ 人设推荐结果:', {
        count: recommendedPersonas.length,
        personas: recommendedPersonas
      })
      
      // 过滤掉数据不完整的人设
      const validPersonas = recommendedPersonas.filter(p => {
        if (!p.coreIdentity) {
          console.warn('⚠️ 人设数据不完整，跳过:', p.id, p.name)
          return false
        }
        return true
      })
      
      setPersonas(validPersonas)
      
      // 如果有推荐人设，自动选择第一个
      if (validPersonas.length > 0) {
        setSelectedPersona(validPersonas[0])
        onPersonaSelected(validPersonas[0])
        console.log('✅ 自动选择第一个推荐人设:', validPersonas[0].coreIdentity.name)
      } else {
        console.log('⚠️ 暂无推荐人设，显示"生成新人设"按钮')
      }
    } catch (err) {
      // 出错不阻塞流程，显示空态并允许用户直接生成人设
      console.error('❌ 人设推荐失败:', err)
      setPersonas([])
      setError(null)
    } finally {
      setLoading(false)
    }
  }

  // 生成器弹窗（使用 PersonaFormModalV2）
  const [showPersonaModal, setShowPersonaModal] = useState(false)

  // 选择人设
  const handleSelectPersona = (persona: Persona) => {
    setSelectedPersona(persona)
    onPersonaSelected(persona)
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 推荐引擎选择器 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-700">AI推荐人设</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowRecommendation(!showRecommendation)}
          >
            {showRecommendation ? '隐藏推荐' : '显示推荐'}
          </Button>
        </div>
        
        {showRecommendation && (
          <RecommendationSelector
            scenario="task->model"
            task={{
              taskType: 'persona.generate',
              contentType: 'text',
              jsonRequirement: true,
              language: 'zh',
              category: product.category,
            }}
            context={{
              region: product.targetCountries[0] || 'CN',
              audience: product.targetAudience.join(','),
            }}
            onSelect={(selectedId, decisionId, isUserOverride) => {
              console.log('推荐选择:', { selectedId, decisionId, isUserOverride })
            }}
            defaultLabel="选择推荐模型"
            className="p-3 border rounded-lg"
          />
        )}
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* 人设列表 */}
      {personas.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">推荐人设</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {personas.map((persona, index) => (
              <PersonaCard
                key={persona.id}
                persona={persona}
                isSelected={selectedPersona?.id === persona.id}
                isRecommended={index === 0}
                onSelect={() => handleSelectPersona(persona)}
              />
            ))}
          </div>
        </div>
      )}

      {/* 生成新人设（弹窗） */}
      <div className="flex justify-center pt-2">
        <Button
          onClick={() => setShowPersonaModal(true)}
          disabled={disabled}
          className="px-8 py-2"
        >
          生成新人设
        </Button>
      </div>

      {/* Persona 生成弹窗 */}
      {showPersonaModal && (
        <PersonaFormModalV2
          open={showPersonaModal}
          onClose={() => setShowPersonaModal(false)}
          onSuccess={() => {
            // 保存成功后刷新推荐列表并自动选中第一项
            setShowPersonaModal(false)
            loadRecommendedPersonas()
          }}
          initialProductId={product.id}
          initialCategory={product.category}
        />
      )}

      {/* 已选择人设 */}
      {selectedPersona && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <h3 className="font-medium text-green-800">已选择人设</h3>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-green-900">{selectedPersona.coreIdentity.name}</h4>
              <div className="grid grid-cols-2 gap-2 text-sm text-green-700">
                <div>年龄: {selectedPersona.coreIdentity.age}岁</div>
                <div>职业: {selectedPersona.coreIdentity.occupation}</div>
                <div>地区: {selectedPersona.coreIdentity.location}</div>
                <div>风格: {selectedPersona.vibe.communicationStyle}</div>
              </div>
              <p className="text-xs text-green-600 mt-2">
                {selectedPersona.context.hobbies} | {selectedPersona.context.values}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 空状态 */}
      {personas.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500">
          <User className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p>暂无推荐人设</p>
          <p className="text-xs">点击生成新人设开始</p>
        </div>
      )}
    </div>
  )
}
