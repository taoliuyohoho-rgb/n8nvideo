/**
 * 人设步骤组件（步骤4-5）
 * 
 * 步骤4: 自动推荐人设 + 可选择备选 + 可生成新人设
 * 步骤5: 确认人设
 */

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, Sparkles, RefreshCw, ChevronRight, ChevronDown } from 'lucide-react'
import type { Persona } from '../types'

interface PersonaWithId extends Persona {
  id: string
  version?: number
  productName?: string
}

interface PersonaStepsProps {
  currentStep: number
  recommendedPersonas: PersonaWithId[]
  selectedPersona: Persona | null
  personaId: string | null
  personaMode: 'select' | 'generate'
  loading: boolean
  error: string | null
  setPersonaMode: (mode: 'select' | 'generate') => void
  handleSelectPersona: (persona: PersonaWithId) => void
  handleGenerateNew: () => void
  handleConfirm: () => void
  reloadRecommendations: () => void
  onPrev: () => void
}

export function PersonaSteps({
  currentStep,
  recommendedPersonas,
  selectedPersona,
  personaId,
  personaMode,
  loading,
  error,
  setPersonaMode,
  handleSelectPersona,
  handleGenerateNew,
  handleConfirm,
  reloadRecommendations,
  onPrev,
}: PersonaStepsProps) {
  const [expandedPersonaId, setExpandedPersonaId] = useState<string | null>(null)

  // 步骤4: 生成/选择人设
  if (currentStep === 4) {
    return (
      <Card className="shadow-lg border-0">
        <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-500" />
            生成人设
          </CardTitle>
          <CardDescription>AI已为您推荐适合的人设，您也可以生成新的人设</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {/* 模式切换 */}
          <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
            <button
              onClick={() => setPersonaMode('select')}
              className={`flex-1 px-4 py-2 rounded text-sm font-medium transition-all ${
                personaMode === 'select'
                  ? 'bg-white shadow-sm text-indigo-600 font-medium'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              选择推荐人设
            </button>
            <button
              onClick={() => setPersonaMode('generate')}
              className={`flex-1 px-4 py-2 rounded text-sm font-medium transition-all ${
                personaMode === 'generate'
                  ? 'bg-white shadow-sm text-indigo-600 font-medium'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              生成新人设
            </button>
          </div>

          {/* 选择模式：显示推荐人设列表 */}
          {personaMode === 'select' && (
            <div className="space-y-4">
              {recommendedPersonas.length > 0 ? (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">为该商品推荐以下人设：</p>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={reloadRecommendations}
                      disabled={loading}
                    >
                      <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                      刷新推荐
                    </Button>
                  </div>
                  <div className="grid gap-4">
                    {recommendedPersonas.map((p) => {
                      const isExpanded = expandedPersonaId === p.id
                      return (
                        <div
                          key={p.id}
                          className="border rounded-lg p-4 hover:border-indigo-300 hover:shadow-md transition-all bg-white"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="font-semibold text-lg text-gray-900">{p.coreIdentity.name}</h4>
                              <p className="text-sm text-gray-500">
                                {p.coreIdentity.age}岁 · {p.coreIdentity.gender} · {p.coreIdentity.location}
                              </p>
                            </div>
                            <Badge variant="secondary">v{p.version || 1}</Badge>
                          </div>
                          
                          {/* 基本信息 */}
                          <div className="space-y-2">
                            <div className="flex items-start gap-2">
                              <span className="text-xs font-medium text-gray-500 min-w-[60px]">职业：</span>
                              <span className="text-sm text-gray-700">{p.coreIdentity.occupation}</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="text-xs font-medium text-gray-500 min-w-[60px]">性格：</span>
                              <div className="flex flex-wrap gap-1">
                                {p.vibe.traits.slice(0, 4).map((trait, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {trait}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="text-xs font-medium text-gray-500 min-w-[60px]">可信度：</span>
                              <span className="text-sm text-gray-700 line-clamp-2">{p.why}</span>
                            </div>
                          </div>

                          {/* 展开显示全部内容 */}
                          {isExpanded && (
                            <div className="mt-4 pt-4 border-t space-y-3">
                              <div>
                                <h5 className="font-semibold text-sm mb-2">👗 外观风格</h5>
                                <div className="space-y-1 text-sm text-gray-600">
                                  <p>• 整体: {p.look.generalAppearance}</p>
                                  <p>• 发型: {p.look.hair}</p>
                                  <p>• 服装: {p.look.clothingAesthetic}</p>
                                  <p>• 细节: {p.look.signatureDetails}</p>
                                </div>
                              </div>
                              <div>
                                <h5 className="font-semibold text-sm mb-2">✨ 性格与沟通</h5>
                                <div className="space-y-1 text-sm text-gray-600">
                                  <p>• 风格: {p.vibe.demeanor}</p>
                                  <p>• 沟通: {p.vibe.communicationStyle}</p>
                                </div>
                              </div>
                              <div>
                                <h5 className="font-semibold text-sm mb-2">🏠 生活背景</h5>
                                <div className="space-y-1 text-sm text-gray-600">
                                  <p>• 爱好: {p.context.hobbies}</p>
                                  <p>• 价值观: {p.context.values}</p>
                                  <p>• 痛点: {p.context.frustrations}</p>
                                  <p>• 环境: {p.context.homeEnvironment}</p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* 操作按钮 */}
                          <div className="flex gap-2 mt-3">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setExpandedPersonaId(isExpanded ? null : p.id)}
                              className="flex-1"
                            >
                              {isExpanded ? (
                                <>
                                  <ChevronDown className="w-4 h-4 mr-1" />
                                  收起详情
                                </>
                              ) : (
                                <>
                                  <ChevronRight className="w-4 h-4 mr-1" />
                                  查看详情
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              className="flex-1"
                              onClick={() => handleSelectPersona(p)}
                            >
                              选择此人设
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  {loading ? (
                    <>
                      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                      <p className="text-sm">加载推荐人设中...</p>
                    </>
                  ) : (
                    <>
                      <p>暂无可用人设</p>
                      <p className="text-sm mt-2">请切换到"生成新人设"模式</p>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 生成模式：生成新人设 */}
          {personaMode === 'generate' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-indigo-500" />
              </div>
              <p className="text-gray-600 mb-6">点击下方按钮，AI将为您生成专业的UGC创作者人设</p>
              <Button
                onClick={handleGenerateNew}
                disabled={loading}
                size="lg"
                className="px-8"
              >
                {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                生成人设
              </Button>
            </div>
          )}

          {/* 错误提示 */}
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
              {error}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  // 步骤5: 确认人设
  if (currentStep === 5 && selectedPersona) {
    return (
      <Card className="shadow-lg border-0">
        <CardHeader className="bg-gradient-to-r from-pink-50 to-rose-50">
          <CardTitle className="flex items-center justify-between">
            <span>确认人设</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleGenerateNew} disabled={loading}>
                <RefreshCw className="w-4 h-4 mr-1" />
                重新生成
              </Button>
            </div>
          </CardTitle>
          <CardDescription>请查看生成的人设信息，确认后将保存到数据库</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {/* 核心身份 */}
          <div className="bg-white border rounded-lg p-4">
            <h3 className="font-semibold mb-3 text-pink-700">👤 核心身份</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-500">姓名:</span> <strong>{selectedPersona.coreIdentity.name}</strong></div>
              <div><span className="text-gray-500">年龄:</span> <strong>{selectedPersona.coreIdentity.age}岁</strong></div>
              <div><span className="text-gray-500">性别:</span> <strong>{selectedPersona.coreIdentity.gender}</strong></div>
              <div><span className="text-gray-500">职业:</span> <strong>{selectedPersona.coreIdentity.occupation}</strong></div>
              <div className="col-span-2"><span className="text-gray-500">位置:</span> <strong>{selectedPersona.coreIdentity.location}</strong></div>
            </div>
          </div>

          {/* 外观风格 */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h3 className="font-semibold mb-3 text-purple-700">👗 外观风格</h3>
            <div className="space-y-2 text-sm">
              <p><span className="text-gray-600">整体:</span> {selectedPersona.look.generalAppearance}</p>
              <p><span className="text-gray-600">发型:</span> {selectedPersona.look.hair}</p>
              <p><span className="text-gray-600">服装:</span> {selectedPersona.look.clothingAesthetic}</p>
              <p><span className="text-gray-600">细节:</span> {selectedPersona.look.signatureDetails}</p>
            </div>
          </div>

          {/* 性格特质 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold mb-3 text-blue-700">✨ 性格与沟通</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-600">特质:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedPersona.vibe.traits.map((trait, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">{trait}</Badge>
                  ))}
                </div>
              </div>
              <p><span className="text-gray-600">风格:</span> {selectedPersona.vibe.demeanor}</p>
              <p><span className="text-gray-600">沟通:</span> {selectedPersona.vibe.communicationStyle}</p>
            </div>
          </div>

          {/* 生活背景 */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold mb-3 text-green-700">🏠 生活背景</h3>
            <div className="space-y-2 text-sm">
              <p><span className="text-gray-600">爱好:</span> {selectedPersona.context.hobbies}</p>
              <p><span className="text-gray-600">价值观:</span> {selectedPersona.context.values}</p>
              <p><span className="text-gray-600">痛点:</span> {selectedPersona.context.frustrations}</p>
              <p><span className="text-gray-600">环境:</span> {selectedPersona.context.homeEnvironment}</p>
            </div>
          </div>

          {/* 可信度理由 */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h3 className="font-semibold mb-2 text-amber-700">💡 可信度理由</h3>
            <p className="text-sm text-gray-700">{selectedPersona.why}</p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button onClick={onPrev} variant="outline" className="flex-1">
              返回重新选择
            </Button>
            <Button onClick={handleConfirm} disabled={loading} className="flex-1">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              确认人设
            </Button>
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
              {error}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return null
}

