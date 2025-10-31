/**
 * 脚本生成组件
 * AI推荐模型+prompt选择
 */

'use client'

import React, { useState, useEffect } from 'react'
import { FileText, Loader2, CheckCircle, AlertTriangle, Sparkles, Copy, Cpu, MessageSquare, ChevronDown, ChevronUp, User, Package, Edit2, Video, Settings, Save, X } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { RecommendationSelector } from '@/components/RecommendationSelector'
import { ProgressBar, SCRIPT_GENERATION_STEPS, type ProgressStep } from '@/components/ui/progress-bar'
import { useVideoGenerationApi } from './hooks/useVideoGenerationApi'
import { ScriptQualityIndicator } from './ScriptQualityIndicator'
import type { ScriptGeneratorProps, VideoScript } from './types/video-generation'

export function ScriptGenerator({ product, analysis, persona, onScriptGenerated, disabled, className, initialScript }: ScriptGeneratorProps) {
  const [script, setScript] = useState<VideoScript | null>(initialScript || null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [qualityEvaluation, setQualityEvaluation] = useState<any>(null)
  const [customPrompt, setCustomPrompt] = useState('')
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null)
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null)
  
  // 🔄 当从其他步骤返回时，恢复已生成的脚本
  React.useEffect(() => {
    if (initialScript && !script) {
      setScript(initialScript)
      console.log('📦 从Context恢复已生成的脚本')
    }
  }, [initialScript])
  
  // UI状态
  const [isAiConfigOpen, setIsAiConfigOpen] = useState(false) // AI推荐配置折叠状态（默认折叠）
  const [isCustomPromptOpen, setIsCustomPromptOpen] = useState(false) // 自定义Prompt展开状态
  
  // 拍摄参数编辑状态
  const [isEditingTechnical, setIsEditingTechnical] = useState(false)
  const [editedTechnical, setEditedTechnical] = useState<any>(null)
  
  // 推荐已有脚本
  const [recommendedScripts, setRecommendedScripts] = useState<any[]>([])
  const [isRecommending, setIsRecommending] = useState(false)
  const [selectedRecommendedScript, setSelectedRecommendedScript] = useState<any | null>(null)

  // 进度条状态
  const [progressSteps, setProgressSteps] = useState<ProgressStep[]>(SCRIPT_GENERATION_STEPS)
  const [currentProgressId, setCurrentProgressId] = useState<string | null>(null)
  const [showProgress, setShowProgress] = useState(false)

  const { generateScript } = useVideoGenerationApi()

  // 加载推荐脚本
  React.useEffect(() => {
    if (product?.id) {
      recommendScripts()
    }
  }, [product?.id])

  const recommendScripts = async () => {
    if (!product?.id) return
    
    setIsRecommending(true)
    try {
      const response = await fetch('/api/script/recommend', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          category: product.category,
          region: Array.isArray(product.targetCountries) ? product.targetCountries[0] : 'global',
          channel: 'tiktok'
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data?.scripts) {
          setRecommendedScripts(data.data.scripts || [])
          console.log('✅ 脚本推荐完成:', data.data.scripts?.length || 0, '个脚本')
        }
      } else {
        // 推荐失败不影响主流程，只记录日志
        console.warn('⚠️ 脚本推荐API失败，跳过推荐功能')
      }
    } catch (error) {
      // 推荐失败不影响主流程，只记录日志
      console.warn('⚠️ 脚本推荐异常，跳过推荐功能:', error)
    } finally {
      setIsRecommending(false)
    }
  }

  // 生成脚本
  const handleGenerateScript = async () => {
    setLoading(true)
    setError(null)
    setQualityEvaluation(null)
    setShowProgress(true)
    
    // 重置进度步骤
    setProgressSteps(SCRIPT_GENERATION_STEPS.map(step => ({ ...step, status: 'pending' })))
    
    try {
      if (!persona) throw new Error('请先选择人设')
      
      // 模拟进度更新（不使用轮询API）
      const progressId = `script_${Date.now()}`
      setCurrentProgressId(progressId)
      
      // 模拟进度步骤
      const simulateProgress = () => {
        const steps = ['recommend', 'template', 'generate', 'evaluate', 'complete']
        let currentStep = 0
        
        const progressInterval = setInterval(() => {
          if (currentStep < steps.length) {
            setProgressSteps(prev => prev.map(step => {
              if (step.id === steps[currentStep]) {
                return { ...step, status: 'active' as const, progress: 50 }
              }
              if (steps.indexOf(step.id) < currentStep) {
                return { ...step, status: 'completed' as const, progress: 100 }
              }
              return step
            }))
            currentStep++
          } else {
            clearInterval(progressInterval)
          }
        }, 1000)
        
        return progressInterval
      }
      
      const progressInterval = simulateProgress()
      
      const result = await generateScript(product, persona, {
        enableProgress: false
      })
      
      // 停止进度模拟
      clearInterval(progressInterval)
      
      // 处理返回结果，可能包含质量评估
      if (result.qualityEvaluation) {
        setQualityEvaluation(result.qualityEvaluation)
      }
      
      // 如果返回的是优化后的脚本，使用优化版本
      const finalScript = result.qualityEvaluation?.improvedScript || result
      setScript(finalScript)
      onScriptGenerated(finalScript)
      
      // 标记所有步骤为完成
      setProgressSteps(prev => prev.map(step => ({ ...step, status: 'completed' })))
      
    } catch (err) {
      setError(err instanceof Error ? err.message : '脚本生成失败')
      // 标记当前步骤为错误
      setProgressSteps(prev => prev.map(step => 
        step.status === 'active' ? { ...step, status: 'error' } : step
      ))
    } finally {
      setLoading(false)
      // 3秒后隐藏进度条
      setTimeout(() => setShowProgress(false), 3000)
    }
  }


  // 复制脚本内容
  const handleCopyScript = () => {
    if (script) {
      navigator.clipboard.writeText(script.content)
    }
  }

  // 开始编辑拍摄参数
  const handleEditTechnical = () => {
    if (script?.technical) {
      setEditedTechnical({ ...script.technical })
      setIsEditingTechnical(true)
    }
  }

  // 保存拍摄参数
  const handleSaveTechnical = () => {
    if (script && editedTechnical) {
      const updatedScript = {
        ...script,
        technical: editedTechnical
      }
      setScript(updatedScript)
      onScriptGenerated(updatedScript)
      setIsEditingTechnical(false)
    }
  }

  // 取消编辑
  const handleCancelEditTechnical = () => {
    setEditedTechnical(null)
    setIsEditingTechnical(false)
  }

  // 更新单个拍摄参数字段
  const handleTechnicalFieldChange = (field: string, value: string) => {
    setEditedTechnical((prev: any) => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* AI推荐配置区域 - 可折叠 */}
      <Collapsible open={isAiConfigOpen} onOpenChange={setIsAiConfigOpen}>
        <Card className="border-2 border-blue-300">
          <CardHeader className="pb-3">
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between cursor-pointer hover:opacity-80">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                  <CardTitle className="text-base">AI智能推荐配置</CardTitle>
                  <Badge variant="secondary" className="text-xs">
                    {isAiConfigOpen ? '已展开' : '已折叠'}
                  </Badge>
                </div>
                {isAiConfigOpen ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </div>
            </CollapsibleTrigger>
            <CardDescription className="text-xs mt-2">
              AI会根据商品和人设自动推荐最佳模型和Prompt模板
            </CardDescription>
          </CardHeader>

          <CollapsibleContent>
            <CardContent className="space-y-4">
              {/* 推荐已有脚本 */}
              {!isRecommending && recommendedScripts.length > 0 && (
                <div className="border-2 border-blue-200 bg-blue-50 rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <h3 className="text-sm font-medium text-blue-900">
                      推荐历史脚本（{recommendedScripts.length}个）- 点击直接使用
                    </h3>
                  </div>
                  {recommendedScripts.slice(0, 3).map((s: any) => (
                    <div
                      key={s.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-all ${
                        selectedRecommendedScript?.id === s.id
                          ? 'border-blue-500 bg-white ring-2 ring-blue-200'
                          : 'border-gray-200 bg-white hover:border-blue-300'
                      }`}
                      onClick={() => {
                        setSelectedRecommendedScript(s)
                        const convertedScript: VideoScript = {
                          id: s.id,
                          productId: s.productId,
                          personaId: s.personaId,
                          angle: s.angle,
                          content: `${s.lines?.open || ''}\n${s.lines?.main || ''}\n${s.lines?.close || ''}`.trim(),
                          structure: {
                            hook: s.lines?.open || '',
                            problem: '',
                            solution: s.lines?.main || '',
                            benefits: [],
                            callToAction: s.lines?.close || ''
                          },
                          style: { tone: 'professional', length: s.durationSec || 15, format: 'ugc' }
                        }
                        setScript(convertedScript)
                        onScriptGenerated(convertedScript)
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline">{s.angle}</Badge>
                            <span className="text-xs text-gray-500">{s.durationSec}秒</span>
                          </div>
                          <p className="text-sm text-gray-700 line-clamp-2">{s.lines?.open || '无预览'}</p>
                        </div>
                        {selectedRecommendedScript?.id === s.id && <CheckCircle className="w-5 h-5 text-blue-500 ml-2" />}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {isRecommending && (
                <div className="flex items-center gap-2 text-sm text-gray-500 p-4 border rounded-lg bg-gray-50">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  正在推荐历史脚本...
                </div>
              )}

              {/* 模型和Prompt推荐 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 左：模型推荐 */}
                <div className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center gap-2 mb-3">
                    <Cpu className="w-4 h-4 text-blue-600" />
                    <h3 className="text-sm font-semibold text-gray-900">AI模型推荐</h3>
                  </div>
                  <RecommendationSelector
                    scenario="task->model"
                    task={{
                      taskType: 'video-script',
                      contentType: 'text',
                      jsonRequirement: true,
                      language: 'zh',
                      category: product.category,
                    }}
                    context={{
                      region: product.targetCountries[0] || 'CN',
                      audience: product.targetAudience.join(','),
                    }}
                    onSelect={(selectedId) => setSelectedModelId(selectedId)}
                    defaultLabel="选择脚本生成模型"
                    className=""
                  />
                </div>

                {/* 右：Prompt推荐 */}
                <div className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center gap-2 mb-3">
                    <MessageSquare className="w-4 h-4 text-purple-600" />
                    <h3 className="text-sm font-semibold text-gray-900">Prompt模板推荐</h3>
                  </div>
                  <RecommendationSelector
                    scenario="task->prompt"
                    task={{
                      taskType: 'video-script',
                      contentType: 'text',
                      jsonRequirement: true,
                      language: 'zh',
                      category: product.category,
                    }}
                    context={{
                      region: product.targetCountries[0] || 'CN',
                      audience: product.targetAudience.join(','),
                    }}
                    onSelect={(selectedId) => setSelectedPromptId(selectedId)}
                    defaultLabel="选择脚本生成Prompt"
                    className=""
                  />
                  
                  {/* 自定义Prompt按钮 */}
                  <div className="mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsCustomPromptOpen(!isCustomPromptOpen)}
                      className="w-full text-xs"
                    >
                      <Edit2 className="w-3 h-3 mr-1" />
                      {isCustomPromptOpen ? '隐藏' : '使用'}自定义Prompt
                    </Button>
                    
                    {isCustomPromptOpen && (
                      <div className="mt-3 space-y-2">
                        <label className="text-xs font-medium text-gray-700">自定义Prompt内容：</label>
                        <Textarea
                          placeholder="输入自定义的脚本生成prompt..."
                          value={customPrompt}
                          onChange={(e) => setCustomPrompt(e.target.value)}
                          disabled={disabled || loading}
                          className="min-h-[120px] text-xs"
                        />
                        <p className="text-xs text-gray-500">
                          💡 自定义Prompt会覆盖AI推荐的模板
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* 产品和人设摘要信息 */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            生成依据
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* 产品信息 */}
          <div className="bg-white rounded-lg p-3 border border-purple-100">
            <div className="flex items-start gap-2">
              <Package className="w-4 h-4 text-purple-600 mt-0.5" />
              <div className="flex-1 space-y-1">
                <h4 className="text-sm font-semibold text-gray-900">{product.name}</h4>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="secondary" className="text-xs">{product.category}</Badge>
                  {product.targetCountries?.slice(0, 2).map((country: string) => (
                    <Badge key={country} variant="outline" className="text-xs">{country}</Badge>
                  ))}
                </div>
                {product.sellingPoints && product.sellingPoints.length > 0 && (
                  <p className="text-xs text-gray-600 line-clamp-2">
                    {product.sellingPoints.slice(0, 3).join(' · ')}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 人设信息 */}
          {persona && (
            <div className="bg-white rounded-lg p-3 border border-blue-100">
              <div className="flex items-start gap-2">
                <User className="w-4 h-4 text-blue-600 mt-0.5" />
                <div className="flex-1 space-y-1">
                  <h4 className="text-sm font-semibold text-gray-900">
                    {typeof persona.coreIdentity === 'object' && persona.coreIdentity?.name 
                      ? persona.coreIdentity.name 
                      : '人设'}
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {typeof persona.coreIdentity === 'object' && (
                      <>
                        {persona.coreIdentity.age && (
                          <Badge variant="secondary" className="text-xs">{persona.coreIdentity.age}岁</Badge>
                        )}
                        {persona.coreIdentity.occupation && (
                          <Badge variant="outline" className="text-xs">{persona.coreIdentity.occupation}</Badge>
                        )}
                      </>
                    )}
                  </div>
                  {typeof persona.vibe === 'object' && persona.vibe?.communicationStyle && (
                    <p className="text-xs text-gray-600">
                      沟通风格: {persona.vibe.communicationStyle}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {!persona && (
            <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
              <p className="text-xs text-yellow-700 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                请先选择人设
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 进度条显示 */}
      {showProgress && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <span className="text-sm font-medium text-gray-700">正在生成脚本...</span>
              </div>
              <span className="text-sm text-gray-500">
                {Math.round(progressSteps.reduce((acc, step) => acc + (step.progress || 0), 0) / progressSteps.length)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="h-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500 ease-out"
                style={{ 
                  width: `${Math.round(progressSteps.reduce((acc, step) => acc + (step.progress || 0), 0) / progressSteps.length)}%` 
                }}
              />
            </div>
            <div className="mt-2 text-xs text-gray-500">
              {progressSteps.find(step => step.status === 'active')?.description || '准备中...'}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 生成脚本按钮 */}
      <div className="flex justify-center pt-2">
        <Button
          onClick={handleGenerateScript}
          disabled={disabled || loading || !persona}
          size="lg"
          className="px-12 py-6 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              正在生成脚本...
            </>
          ) : (
            <>
              <FileText className="w-5 h-5 mr-2" />
              生成视频脚本
            </>
          )}
        </Button>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* 脚本质量评估 */}
      {qualityEvaluation && (
        <ScriptQualityIndicator evaluation={qualityEvaluation} className="mb-4" />
      )}

      {/* 生成的脚本 */}
      {script && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h3 className="font-medium text-green-800">脚本生成完成</h3>
                {qualityEvaluation && (
                  <Badge 
                    variant={qualityEvaluation.overallScore >= 80 ? "default" : qualityEvaluation.overallScore >= 60 ? "secondary" : "destructive"}
                    className="text-xs"
                  >
                    质量: {qualityEvaluation.overallScore}/100
                  </Badge>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyScript}
                className="text-xs"
              >
                <Copy className="w-3 h-3 mr-1" />
                复制
              </Button>
            </div>
            
            <div className="space-y-4">
              {/* 脚本角度 */}
              <div>
                <h4 className="text-sm font-medium text-green-700 mb-1">脚本角度</h4>
                <p className="text-sm text-green-600">{script.angle}</p>
              </div>
              
              {/* 脚本内容 */}
              <div>
                <h4 className="text-sm font-medium text-green-700 mb-2">脚本内容</h4>
                <div className="bg-white p-3 rounded border text-sm text-gray-700 whitespace-pre-wrap">
                  {script.content}
                </div>
              </div>
              
              {/* 台词分解 */}
              {script.lines && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-blue-800 mb-3 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    💬 台词分解
                  </h4>
                  <div className="space-y-2">
                    <div className="bg-white p-2 rounded border border-blue-100">
                      <span className="text-xs font-medium text-blue-700">开场钩子：</span>
                      <p className="text-xs text-gray-700 mt-1">{script.lines.open}</p>
                    </div>
                    <div className="bg-white p-2 rounded border border-blue-100">
                      <span className="text-xs font-medium text-blue-700">主体内容：</span>
                      <p className="text-xs text-gray-700 mt-1">{script.lines.main}</p>
                    </div>
                    <div className="bg-white p-2 rounded border border-blue-100">
                      <span className="text-xs font-medium text-blue-700">行动号召：</span>
                      <p className="text-xs text-gray-700 mt-1">{script.lines.close}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* 镜头分解 */}
              {script.shots && script.shots.length > 0 && (
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-purple-800 mb-3 flex items-center gap-2">
                    <Video className="w-4 h-4" />
                    🎬 镜头分解（{script.shots.length}个）
                  </h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {script.shots.map((shot: any, index: number) => (
                      <div key={index} className="bg-white p-3 rounded border border-purple-100 flex items-start gap-3">
                        <Badge variant="outline" className="flex-shrink-0">{shot.second}s</Badge>
                        <div className="flex-1">
                          <p className="text-xs font-medium text-gray-800">{shot.camera} | {shot.action}</p>
                          <p className="text-xs text-gray-500 mt-1">📹 {shot.visibility} · 🔊 {shot.audio}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Technical 参数 */}
              {script.technical && (
                <div className="bg-gradient-to-br from-gray-50 to-slate-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      🎥 拍摄参数
                    </h4>
                    {!isEditingTechnical ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleEditTechnical}
                        className="text-xs h-7"
                      >
                        <Edit2 className="w-3 h-3 mr-1" />
                        编辑
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleSaveTechnical}
                          className="text-xs h-7 bg-green-50 hover:bg-green-100 text-green-700 border-green-300"
                        >
                          <Save className="w-3 h-3 mr-1" />
                          保存
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCancelEditTechnical}
                          className="text-xs h-7"
                        >
                          <X className="w-3 h-3 mr-1" />
                          取消
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  {!isEditingTechnical ? (
                    // 显示模式
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      <div className="bg-white p-2 rounded border border-gray-100">
                        <span className="text-xs text-gray-500">方向：</span>
                        <p className="text-xs font-medium text-gray-700">{script.technical.orientation}</p>
                      </div>
                      <div className="bg-white p-2 rounded border border-gray-100">
                        <span className="text-xs text-gray-500">拍摄方式：</span>
                        <p className="text-xs font-medium text-gray-700">{script.technical.filmingMethod}</p>
                      </div>
                      <div className="bg-white p-2 rounded border border-gray-100">
                        <span className="text-xs text-gray-500">主导手：</span>
                        <p className="text-xs font-medium text-gray-700">{script.technical.dominantHand}</p>
                      </div>
                      <div className="bg-white p-2 rounded border border-gray-100">
                        <span className="text-xs text-gray-500">位置：</span>
                        <p className="text-xs font-medium text-gray-700">{script.technical.location}</p>
                      </div>
                      <div className="bg-white p-2 rounded border border-gray-100">
                        <span className="text-xs text-gray-500">音频环境：</span>
                        <p className="text-xs font-medium text-gray-700">{script.technical.audioEnv}</p>
                      </div>
                      {script.durationSec && (
                        <div className="bg-white p-2 rounded border border-gray-100">
                          <span className="text-xs text-gray-500">时长：</span>
                          <p className="text-xs font-medium text-gray-700">{script.durationSec}秒</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    // 编辑模式
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-700">方向</label>
                        <Input
                          value={editedTechnical?.orientation || ''}
                          onChange={(e) => handleTechnicalFieldChange('orientation', e.target.value)}
                          placeholder="如：竖屏、横屏"
                          className="text-xs h-8"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-700">拍摄方式</label>
                        <Input
                          value={editedTechnical?.filmingMethod || ''}
                          onChange={(e) => handleTechnicalFieldChange('filmingMethod', e.target.value)}
                          placeholder="如：手持、三脚架"
                          className="text-xs h-8"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-700">主导手</label>
                        <Input
                          value={editedTechnical?.dominantHand || ''}
                          onChange={(e) => handleTechnicalFieldChange('dominantHand', e.target.value)}
                          placeholder="如：右手、左手"
                          className="text-xs h-8"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-700">位置</label>
                        <Input
                          value={editedTechnical?.location || ''}
                          onChange={(e) => handleTechnicalFieldChange('location', e.target.value)}
                          placeholder="如：室内、室外"
                          className="text-xs h-8"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-700">音频环境</label>
                        <Input
                          value={editedTechnical?.audioEnv || ''}
                          onChange={(e) => handleTechnicalFieldChange('audioEnv', e.target.value)}
                          placeholder="如：安静、嘈杂"
                          className="text-xs h-8"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 脚本元信息 */}
              <div className="flex flex-wrap gap-2">
                {script.angle && (
                  <Badge variant="outline" className="text-xs">
                    角度: {script.angle}
                  </Badge>
                )}
                {script.energy && (
                  <Badge variant="outline" className="text-xs">
                    节奏: {script.energy}
                  </Badge>
                )}
                <Badge variant="outline" className="text-xs">
                  语气: {script.style.tone}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  时长: {script.style.length}秒
                </Badge>
                <Badge variant="outline" className="text-xs">
                  格式: {script.style.format}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 空状态 */}
      {!script && !loading && (
        <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
          <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p className="text-sm font-medium">暂无脚本</p>
          <p className="text-xs mt-1">点击上方"生成视频脚本"开始</p>
        </div>
      )}
    </div>
  )
}