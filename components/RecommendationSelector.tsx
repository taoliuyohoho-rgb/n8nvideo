'use client'

import { useState, useEffect, useRef } from 'react'
import React from 'react'
import isEqual from 'fast-deep-equal'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ChevronDown, Check, Info, Eye, Loader2 as LoaderIcon } from 'lucide-react'
import { recommendationService, type RecommendRankResponse } from '@/src/core/api'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

interface RecommendationItem {
  id: string
  type: string
  title?: string
  summary?: string
  content?: string // for prompts
  fineScore?: number
  reason?: string | Record<string, unknown>
}

interface PromptTemplateDetail {
  id: string
  name: string
  businessModule: string
  content: string
  variables?: string
  description?: string
  performance?: number
  usageCount?: number
  successRate?: number
  isActive: boolean
  isDefault: boolean
  inputRequirements?: string
  outputRequirements?: string
  outputRules?: string
  createdAt: string
  updatedAt: string
}

interface RecommendationSelectorProps {
  scenario: 'product->style' | 'task->model' | 'task->prompt'
  task: Record<string, unknown>
  context?: Record<string, unknown>
  constraints?: Record<string, unknown>
  onSelect: (selectedId: string, decisionId: string, isUserOverride: boolean) => void
  defaultLabel?: string
  className?: string
  triggerRefresh?: number // 外部触发器，值变化时重新加载推荐
  onLoadingChange?: (isLoading: boolean) => void // 通知父组件加载状态变化
  onRecommendationStatusChange?: (status: 'idle' | 'loading' | 'success' | 'error') => void // 推荐状态变化
  showStatusIndicator?: boolean // 是否显示推荐状态指示器（默认true）
  autoHideWhenSelected?: boolean // 选中后是否自动隐藏选择器（默认false）
  autoSelectTop1?: boolean // 是否自动采纳Top1（默认false，不强制）
}

// Prompt 详情弹窗组件
function PromptDetailDialog({ promptId, promptName }: { promptId: string; promptName?: string }) {
  const [loading, setLoading] = useState(false)
  const [detail, setDetail] = useState<PromptTemplateDetail | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadDetail = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/prompt-template/${promptId}`)
      const data = await response.json()
      if (data.success) {
        setDetail(data.data)
      } else {
        setError(data.error || '加载失败')
      }
    } catch (err) {
      setError('网络错误')
      console.error('加载Prompt详情失败:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs"
          onClick={loadDetail}
        >
          <Eye className="w-3 h-3 mr-1" />
          查看详情
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>📝</span>
            <span>Prompt模板详情</span>
          </DialogTitle>
          <DialogDescription>
            {promptName || promptId}
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <LoaderIcon className="w-6 h-6 animate-spin text-blue-500" />
            <span className="ml-2 text-sm text-gray-500">加载中...</span>
          </div>
        )}

        {error && (
          <div className="text-center py-8">
            <div className="text-red-500 mb-2">加载失败</div>
            <div className="text-sm text-gray-500">{error}</div>
          </div>
        )}

        {detail && (
          <div className="space-y-4">
            {/* 基本信息 */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <div className="text-xs text-gray-500 mb-1">模板名称</div>
                <div className="text-sm font-medium">{detail.name}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">业务模块</div>
                <div className="text-sm font-medium">{detail.businessModule}</div>
              </div>
              {detail.performance !== undefined && (
                <div>
                  <div className="text-xs text-gray-500 mb-1">性能评分</div>
                  <div className="text-sm font-medium">{(detail.performance * 100).toFixed(1)}%</div>
                </div>
              )}
              {detail.successRate !== undefined && (
                <div>
                  <div className="text-xs text-gray-500 mb-1">成功率</div>
                  <div className="text-sm font-medium">{(detail.successRate * 100).toFixed(1)}%</div>
                </div>
              )}
              <div>
                <div className="text-xs text-gray-500 mb-1">使用次数</div>
                <div className="text-sm font-medium">{detail.usageCount || 0}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">状态</div>
                <div className="text-sm">
                  <Badge variant={detail.isActive ? "default" : "secondary"}>
                    {detail.isActive ? '启用' : '禁用'}
                  </Badge>
                  {detail.isDefault && (
                    <Badge variant="outline" className="ml-1">默认</Badge>
                  )}
                </div>
              </div>
            </div>

            {/* 描述 */}
            {detail.description && (
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">描述</div>
                <div className="text-sm text-gray-600 p-3 bg-blue-50 rounded border border-blue-100">
                  {detail.description}
                </div>
              </div>
            )}

            {/* Prompt内容 */}
            <div>
              <div className="text-sm font-medium text-gray-700 mb-2">Prompt内容</div>
              <pre className="text-xs bg-gray-50 p-4 rounded border whitespace-pre-wrap max-h-96 overflow-y-auto">
                {detail.content}
              </pre>
            </div>

            {/* 变量 */}
            {detail.variables && (
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">变量说明</div>
                <pre className="text-xs bg-purple-50 p-3 rounded border border-purple-100 whitespace-pre-wrap">
                  {detail.variables}
                </pre>
              </div>
            )}

            {/* 输入要求 */}
            {detail.inputRequirements && (
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">输入要求</div>
                <div className="text-xs text-gray-600 p-3 bg-green-50 rounded border border-green-100 whitespace-pre-wrap">
                  {detail.inputRequirements}
                </div>
              </div>
            )}

            {/* 输出要求 */}
            {detail.outputRequirements && (
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">输出要求</div>
                <div className="text-xs text-gray-600 p-3 bg-yellow-50 rounded border border-yellow-100 whitespace-pre-wrap">
                  {detail.outputRequirements}
                </div>
              </div>
            )}

            {/* 输出规则 */}
            {detail.outputRules && (
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">输出规则</div>
                <div className="text-xs text-gray-600 p-3 bg-orange-50 rounded border border-orange-100 whitespace-pre-wrap">
                  {detail.outputRules}
                </div>
              </div>
            )}

            {/* 时间信息 */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t text-xs text-gray-500">
              <div>创建时间: {new Date(detail.createdAt).toLocaleString('zh-CN')}</div>
              <div>更新时间: {new Date(detail.updatedAt).toLocaleString('zh-CN')}</div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function RecommendationSelectorComponent({
  scenario,
  task,
  context,
  constraints,
  onSelect,
  defaultLabel = '选择',
  className = '',
  triggerRefresh = 0,
  onLoadingChange,
  onRecommendationStatusChange,
  showStatusIndicator = true,
  autoHideWhenSelected = false,
  autoSelectTop1 = false
}: RecommendationSelectorProps) {
  const [loading, setLoading] = useState(false)
  const [recommendation, setRecommendation] = useState<RecommendRankResponse | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showAlternatives, setShowAlternatives] = useState(false)
  const [recommendationStatus, setRecommendationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [hasUserConfirmed, setHasUserConfirmed] = useState(false)
  
  // 请求去重：避免重复请求
  const requestInProgressRef = useRef(false)
  const lastParamsRef = useRef<{
    scenario: string
    task: Record<string, unknown>
    context: Record<string, unknown>
    constraints: Record<string, unknown>
    triggerRefresh: number
  } | null>(null)

  // 调用推荐系统 - 添加智能变更判定和防抖机制
  useEffect(() => {
    const currentParams = { scenario, task, context, constraints, triggerRefresh }
    
    // 显式变更判定：只有真正变化时才重新请求
    if (lastParamsRef.current && isEqual(lastParamsRef.current, currentParams)) {
      console.log('[RecommendationSelector] 参数无实质变化，跳过请求', currentParams)
      return
    }
    
    console.log('[RecommendationSelector] 参数发生变化，准备加载推荐...', currentParams)
    
    // 如果请求正在进行中，跳过
    if (requestInProgressRef.current) {
      console.log('[RecommendationSelector] 请求已在进行中，跳过')
      return
    }
    
    // 防抖：避免频繁调用
    const timeoutId = setTimeout(() => {
      lastParamsRef.current = currentParams
      loadRecommendation()
    }, 300) // 减少到300ms防抖，提升响应速度
    
    return () => clearTimeout(timeoutId)
  }, [scenario, task, context, constraints, triggerRefresh])

  const loadRecommendation = async () => {
    // 检查是否已有请求在进行中
    if (requestInProgressRef.current) {
      console.log('[RecommendationSelector] 请求已在进行中，跳过')
      return
    }
    
    try {
      requestInProgressRef.current = true
      setLoading(true)
      setRecommendationStatus('loading')
      onLoadingChange?.(true) // 通知父组件开始加载
      onRecommendationStatusChange?.('loading')
      console.log('[RecommendationSelector] 发送推荐请求...', { scenario, task, context, constraints })
      
      // 添加10秒超时
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('推荐请求超时（10秒）')), 10000)
      )
      
      const response = await Promise.race([
        recommendationService.getRank({
          scenario,
          task,
          context,
          constraints
        }),
        timeoutPromise
      ]) as { success: boolean; data?: RecommendRankResponse; error?: string }

      console.log('[RecommendationSelector] 推荐响应完整:', response)
      
      if (!response.success) {
        console.error('[RecommendationSelector] 推荐失败:', response.error)
        throw new Error(response.error?.message || '推荐请求失败')
      }

      if (!response.data) {
        console.error('[RecommendationSelector] 推荐数据为空，完整响应:', JSON.stringify(response, null, 2))
        throw new Error('推荐返回数据为空')
      }

      const data = response.data
      console.log('[RecommendationSelector] 推荐数据:', {
        hasChosen: !!data.chosen,
        chosenId: data.chosen?.id,
        decisionId: data.decisionId
      })
      
      if (data.chosen) {
        setRecommendation(data)
        setSelectedId(data.chosen.id)
        try {
          const alt = data.alternatives || {}
          const exposeCandidates = [
            { id: data.chosen.id, bucket: 'top1', coarseScore: data.chosen.coarseScore, fineScore: data.chosen.fineScore },
            alt.fineTop2 ? { id: alt.fineTop2.id, bucket: 'fineTop2', coarseScore: alt.fineTop2.coarseScore, fineScore: alt.fineTop2.fineScore } : null,
            ...(Array.isArray(alt.coarseExtras) ? alt.coarseExtras.map((c: Record<string, unknown>) => ({ id: c.id, bucket: 'coarse', coarseScore: c.coarseScore, fineScore: c.fineScore })) : []),
            ...(Array.isArray(alt.outOfPool) ? alt.outOfPool.map((c: Record<string, unknown>) => ({ id: c.id, bucket: 'oop', coarseScore: c.coarseScore, fineScore: c.fineScore })) : [])
          ].filter(Boolean)

          // 曝光事件
          recommendationService.submitFeedback({
            decisionId: data.decisionId,
            eventType: 'expose',
            payload: {
              scenario,
              candidates: exposeCandidates
            }
          }).catch(() => {})
        } catch {}
        if (autoSelectTop1) {
          // 自动采纳Top1（按需开启）
          try {
            recommendationService.submitFeedback({
              decisionId: data.decisionId,
              eventType: 'select',
              payload: { scenario, chosenCandidateId: data.chosen.id, reason: 'auto_select' }
            }).catch(() => {})
          } catch {}
          const selectedValue = data.chosen.name || data.chosen.id
          console.log('[RecommendationSelector] 自动选择系统推荐:', {id: data.chosen.id, name: data.chosen.name, value: selectedValue})
          onSelect(selectedValue, data.decisionId, false)
          setHasUserConfirmed(true)
        } else {
          console.log('[RecommendationSelector] 已提供推荐但未自动采纳（等待用户确认）')
        }
        setRecommendationStatus('success')
        onRecommendationStatusChange?.('success')
      } else {
        console.warn('[RecommendationSelector] 推荐失败，无chosen:', data)
        setRecommendationStatus('error')
        onRecommendationStatusChange?.('error')
      }
    } catch (error) {
      console.error('[RecommendationSelector] 加载推荐失败:', error)
      setRecommendationStatus('error')
      onRecommendationStatusChange?.('error')
    } finally {
      requestInProgressRef.current = false // 重置请求状态
      setLoading(false)
      onLoadingChange?.(false) // 通知父组件加载结束
    }
  }

  const handleSelectAlternative = (item: RecommendationItem) => {
    setSelectedId(item.id)
    setShowAlternatives(false)
    // 优先使用 name 字段（实际值），否则用 id
    const selectedValue = item.name || item.id
    try {
      const decisionId = recommendation?.decisionId
      const prevId = recommendation?.chosen?.id
      if (decisionId && prevId) {
        fetch('/api/recommend/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            decisionId,
            eventType: 'select',
            payload: { chosenId: item.id, prevId }
          })
        }).catch(() => {})
        const type = scenario === 'task->model' ? 'model' : (scenario === 'task->prompt' ? 'prompt' : 'style')
        fetch('/api/recommend/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ decisionId, userChoice: item.id, type, reason: 'user_override' })
        }).catch(() => {})
      }
    } catch {}
    onSelect(selectedValue, recommendation?.decisionId || '', true)
    setHasUserConfirmed(true)
  }

  const handleAcceptRecommended = () => {
    const data = recommendation
    if (!data?.chosen) return
    const selectedValue = data.chosen.name || data.chosen.id
    try {
      recommendationService.submitFeedback({
        decisionId: data.decisionId,
        eventType: 'select',
        payload: { scenario, chosenCandidateId: data.chosen.id, reason: 'user_accept' }
      }).catch(() => {})
    } catch {}
    onSelect(selectedValue, data.decisionId, false)
    setHasUserConfirmed(true)
  }

  // 状态指示器组件
  const StatusIndicator = () => {
    if (!showStatusIndicator) return null
    
    return (
      <div className={`rounded-lg p-3 border transition-all mb-3 ${
        recommendationStatus === 'success' 
          ? 'bg-green-50 border-green-200' 
          : recommendationStatus === 'loading'
          ? 'bg-yellow-50 border-yellow-200'
          : recommendationStatus === 'error'
          ? 'bg-red-50 border-red-200'
          : 'bg-gray-50 border-gray-200'
      }`}>
        <div className="flex items-start gap-2 text-sm">
          <span className="text-lg">
            {recommendationStatus === 'success' ? '✓' : recommendationStatus === 'loading' ? '⏳' : recommendationStatus === 'error' ? '✗' : '○'}
          </span>
          <div className="flex-1">
            {recommendationStatus === 'success' ? (
              <>
                <div className="font-medium text-green-700">✨ AI已自动推荐配置</div>
                <div className="text-xs text-green-600 mt-1">
                  已为您选择最佳{scenario === 'task->model' ? '模型' : scenario === 'task->prompt' ? 'Prompt' : '风格'}
                </div>
              </>
            ) : recommendationStatus === 'loading' ? (
              <>
                <div className="font-medium text-yellow-700">⏳ AI推荐中...</div>
                <div className="text-xs text-yellow-600 mt-1">
                  正在分析任务特征并匹配最佳配置
                </div>
              </>
            ) : recommendationStatus === 'error' ? (
              <>
                <div className="font-medium text-red-700">✗ 推荐失败</div>
                <div className="text-xs text-red-600 mt-1">
                  推荐系统暂时不可用，请手动选择
                </div>
              </>
            ) : (
              <>
                <div className="font-medium text-gray-500">等待推荐</div>
                <div className="text-xs text-gray-400 mt-1">
                  初始化推荐系统...
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }
  
  if (loading && !recommendation) {
    return (
      <>
        <StatusIndicator />
        {!showStatusIndicator && (
          <div className="flex items-center gap-2 p-2 border rounded">
            <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />
            <span className="text-sm text-gray-600">AI推荐中...</span>
          </div>
        )}
      </>
    )
  }

  if (!recommendation) {
    return (
      <>
        <StatusIndicator />
        {!showStatusIndicator && <div className="text-sm text-gray-500">暂无推荐</div>}
      </>
    )
  }

  const chosen = recommendation.chosen
  const alternatives = recommendation.alternatives || {}
  
  // 构建候选列表（来自推荐系统返回的多路候选）
  const allOptions: RecommendationItem[] = [
    {
      id: chosen.id,
      type: 'chosen',
      title: chosen.name || chosen.id,
      summary: `推荐度: ${chosen.fineScore?.toFixed(2) || 'N/A'}`,
      fineScore: chosen.fineScore
    },
    alternatives.fineTop2 ? {
      id: alternatives.fineTop2.id,
      type: 'alternative',
      title: alternatives.fineTop2.name || alternatives.fineTop2.id,
      summary: `推荐度: ${alternatives.fineTop2.fineScore?.toFixed(2) || 'N/A'}`,
      fineScore: alternatives.fineTop2.fineScore
    } : null,
    ...(alternatives.coarseExtras || []).map(item => ({
      id: item.id,
      type: 'coarse' as const,
      title: item.name || item.id,
      summary: `推荐度: ${item.fineScore?.toFixed(2) || 'N/A'}`,
      fineScore: item.fineScore
    })),
    ...(alternatives.outOfPool || []).map(item => ({
      id: item.id,
      type: 'outOfPool' as const,
      title: item.name || item.id,
      summary: `推荐度: ${item.fineScore?.toFixed(2) || 'N/A'}`,
      fineScore: item.fineScore
    }))
  ].filter(Boolean) as RecommendationItem[]

  // 展示所有系统推荐项（去重，不限制数量）
  const displayOptions: RecommendationItem[] = []
  for (const option of allOptions) {
    if (!displayOptions.find(o => o.id === option.id)) {
      displayOptions.push(option)
    }
  }

  // 根据场景类型确定展示策略
  const getDisplayConfig = () => {
    switch (scenario) {
      case 'task->model':
        return { type: 'model', icon: '🤖', bgColor: 'bg-blue-50', borderColor: 'border-blue-500', showDetails: false }
      case 'product->style':
        return { type: 'style', icon: '🎨', bgColor: 'bg-purple-50', borderColor: 'border-purple-500', showDetails: true }
      case 'task->prompt':
        return { type: 'prompt', icon: '📝', bgColor: 'bg-amber-50', borderColor: 'border-amber-500', showDetails: true }
      default:
        return { type: 'default', icon: '✨', bgColor: 'bg-green-50', borderColor: 'border-green-500', showDetails: false }
    }
  }

  const displayConfig = getDisplayConfig()
  const currentItem: RecommendationItem | undefined = selectedId === chosen.id 
    ? {
        id: chosen.id,
        type: 'chosen',
        title: chosen.name || chosen.id,
        summary: `推荐度: ${chosen.fineScore?.toFixed(2) || 'N/A'}`,
        fineScore: chosen.fineScore
      }
    : allOptions.find(o => o.id === selectedId)

  return (
    <div className={className}>
      <StatusIndicator />
      <div className="flex items-center gap-2">
        {/* 当前选择 */}
        <div className={`flex items-center gap-2 px-3 py-2 border-2 ${displayConfig.borderColor} rounded ${displayConfig.bgColor}`}>
        <Badge variant="default" className="bg-green-600">
          {displayConfig.icon} 推荐
        </Badge>
        <span className="text-sm font-medium">
          {currentItem?.title || currentItem?.id}
        </span>
        {displayConfig.type === 'prompt' && currentItem && (
          <PromptDetailDialog 
            promptId={currentItem.id} 
            promptName={currentItem.title}
          />
        )}
      </div>

      {/* 采纳推荐（仅在非自动采纳且未确认时显示） */}
      {!autoSelectTop1 && !hasUserConfirmed && (
        <Button variant="default" size="sm" onClick={handleAcceptRecommended}>
          采纳推荐
        </Button>
      )}

      {/* 自行选择按钮 */}
      <Popover open={showAlternatives} onOpenChange={setShowAlternatives}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm">
            自行选择 <ChevronDown className="h-4 w-4 ml-1" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-96 p-2" align="start">
          <div className="space-y-1">
            <p className="text-xs text-gray-500 px-2 py-1">共 {displayOptions.length} 个候选项</p>
            {displayOptions.map((option, index) => (
              <div
                key={option.id}
                className={`p-2 rounded hover:bg-gray-100 ${
                  selectedId === option.id ? 'bg-blue-50 border border-blue-300' : ''
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div 
                    className="flex-1 cursor-pointer"
                    onClick={() => handleSelectAlternative(option)}
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="text-xs">系统推荐{index + 1}</Badge>
                      <span className="text-sm font-medium">{option.title || option.id}</span>
                    </div>
                    {option.summary && (
                      <p className="text-xs text-gray-500 mt-1">{option.summary}</p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {displayConfig.type === 'prompt' && (
                      <div onClick={(e) => e.stopPropagation()}>
                        <PromptDetailDialog 
                          promptId={option.id} 
                          promptName={option.title || option.id}
                        />
                      </div>
                    )}
                    {selectedId === option.id && <Check className="h-4 w-4 text-green-600" />}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>
      </div>
    </div>
  )
}

// 精准比较函数 - 只比较影响推荐的关键字段
const equalRecommendationProps = (prevProps: RecommendationSelectorProps, nextProps: RecommendationSelectorProps) => {
  return (
    prevProps.scenario === nextProps.scenario &&
    isEqual(prevProps.task, nextProps.task) &&
    isEqual(prevProps.context, nextProps.context) &&
    isEqual(prevProps.constraints, nextProps.constraints) &&
    prevProps.triggerRefresh === nextProps.triggerRefresh &&
    prevProps.onSelect === nextProps.onSelect &&
    prevProps.defaultLabel === nextProps.defaultLabel &&
    prevProps.className === nextProps.className &&
    prevProps.onLoadingChange === nextProps.onLoadingChange &&
    prevProps.onRecommendationStatusChange === nextProps.onRecommendationStatusChange &&
    prevProps.showStatusIndicator === nextProps.showStatusIndicator &&
    prevProps.autoHideWhenSelected === nextProps.autoHideWhenSelected
  )
}

// 使用 React.memo 优化渲染性能
export const RecommendationSelector = React.memo(RecommendationSelectorComponent, equalRecommendationProps)

