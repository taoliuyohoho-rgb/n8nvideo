'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ChevronDown, Check, Info } from 'lucide-react'

interface RecommendationItem {
  id: string
  type: string
  title?: string
  summary?: string
  content?: string // for prompts
  fineScore?: number
  reason?: any
}

interface RecommendationSelectorProps {
  scenario: 'product->style' | 'task->model' | 'task->prompt'
  task: any
  context?: any
  constraints?: any
  onSelect: (selectedId: string, decisionId: string, isUserOverride: boolean) => void
  defaultLabel?: string
  className?: string
  triggerRefresh?: number // 外部触发器，值变化时重新加载推荐
}

export function RecommendationSelector({
  scenario,
  task,
  context,
  constraints,
  onSelect,
  defaultLabel = '选择',
  className = '',
  triggerRefresh = 0
}: RecommendationSelectorProps) {
  const [loading, setLoading] = useState(false)
  const [recommendation, setRecommendation] = useState<any>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showAlternatives, setShowAlternatives] = useState(false)

  // 调用推荐系统
  useEffect(() => {
    console.log('[RecommendationSelector] 开始加载推荐...', { scenario, task, triggerRefresh })
    loadRecommendation()
  }, [scenario, JSON.stringify(task), JSON.stringify(context), JSON.stringify(constraints), triggerRefresh])

  const loadRecommendation = async () => {
    try {
      setLoading(true)
      console.log('[RecommendationSelector] 发送推荐请求...', { scenario, task, context, constraints })
      const res = await fetch('/api/recommend/rank', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario,
          task,
          context,
          constraints
        })
      })

      const data = await res.json()
      console.log('[RecommendationSelector] 推荐响应:', data)
      
      if (data.chosen) {
        setRecommendation(data)
        setSelectedId(data.chosen.id)
        try {
          const alt = data.alternatives || {}
          const exposeCandidates = [
            { id: data.chosen.id, bucket: 'top1', coarseScore: data.chosen.coarseScore, fineScore: data.chosen.fineScore },
            alt.fineTop2 ? { id: alt.fineTop2.id, bucket: 'fineTop2', coarseScore: alt.fineTop2.coarseScore, fineScore: alt.fineTop2.fineScore } : null,
            ...(Array.isArray(alt.coarseExtras) ? alt.coarseExtras.map((c: any) => ({ id: c.id, bucket: 'coarse', coarseScore: c.coarseScore, fineScore: c.fineScore })) : []),
            ...(Array.isArray(alt.outOfPool) ? alt.outOfPool.map((c: any) => ({ id: c.id, bucket: 'oop', coarseScore: c.coarseScore, fineScore: c.fineScore })) : [])
          ].filter(Boolean)

          // 曝光事件
          fetch('/api/recommend/feedback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              decisionId: data.decisionId,
              eventType: 'expose',
              payload: {
                scenario,
                candidates: exposeCandidates
              }
            })
          }).catch(() => {})

          // 系统默认采纳 top1（auto_select）
          fetch('/api/recommend/feedback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              decisionId: data.decisionId,
              eventType: 'auto_select',
              payload: { chosenId: data.chosen.id }
            })
          }).catch(() => {})
        } catch {}
        // 自动选择系统推荐，优先使用 name 字段（实际值），否则用 id
        const selectedValue = data.chosen.name || data.chosen.id
        console.log('[RecommendationSelector] 自动选择系统推荐:', {id: data.chosen.id, name: data.chosen.name, value: selectedValue})
        onSelect(selectedValue, data.decisionId, false)
      } else {
        console.warn('[RecommendationSelector] 推荐失败，无chosen:', data)
      }
    } catch (error) {
      console.error('[RecommendationSelector] 加载推荐失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectAlternative = (item: any) => {
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
    onSelect(selectedValue, recommendation.decisionId, true)
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-2 border rounded">
        <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />
        <span className="text-sm text-gray-600">AI推荐中...</span>
      </div>
    )
  }

  if (!recommendation) {
    return (
      <div className="text-sm text-gray-500">暂无推荐</div>
    )
  }

  const chosen = recommendation.chosen
  const alternatives = recommendation.alternatives || {}
  
  // 构建候选列表（来自推荐系统返回的多路候选）
  const allOptions: RecommendationItem[] = [
    chosen,
    alternatives.fineTop2,
    ...(alternatives.coarseExtras || []),
    ...(alternatives.outOfPool || [])
  ].filter(Boolean)

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
  const currentItem = selectedId === chosen.id ? chosen : allOptions.find(o => o.id === selectedId)

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* 当前选择 */}
      <div className={`flex items-center gap-2 px-3 py-2 border-2 ${displayConfig.borderColor} rounded ${displayConfig.bgColor}`}>
        <Badge variant="default" className="bg-green-600">
          {displayConfig.icon} 推荐
        </Badge>
        {displayConfig.showDetails ? (
          <Popover>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-1 text-sm font-medium hover:text-blue-600">
                {currentItem?.title || currentItem?.id}
                <Info className="h-3 w-3" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-96 max-h-96 overflow-y-auto">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{displayConfig.icon}</span>
                  <p className="font-semibold text-sm">{currentItem?.title || currentItem?.id}</p>
                </div>
                {currentItem?.summary && (
                  <p className="text-xs text-gray-600">{currentItem.summary}</p>
                )}
                {displayConfig.type === 'prompt' && currentItem?.content && (
                  <div className="mt-2">
                    <p className="text-xs font-medium text-gray-700 mb-1">Prompt内容预览：</p>
                    <pre className="text-xs bg-gray-50 p-2 rounded whitespace-pre-wrap max-h-64 overflow-y-auto border">
                      {currentItem.content}
                    </pre>
                  </div>
                )}
                {displayConfig.type === 'style' && currentItem?.reason && (
                  <div className="mt-2 space-y-1">
                    <p className="text-xs font-medium text-gray-700">风格特点：</p>
                    <div className="text-xs text-gray-600 space-y-1">
                      {currentItem.reason.structure && <p>• 结构：{currentItem.reason.structure}</p>}
                      {currentItem.reason.tone && <p>• 语调：{currentItem.reason.tone}</p>}
                      {currentItem.reason.targetAudience && <p>• 受众：{currentItem.reason.targetAudience}</p>}
                    </div>
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        ) : (
          <span className="text-sm font-medium">
            {currentItem?.title || currentItem?.id}
          </span>
        )}
        {/* 评分已去除 */}
      </div>

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
                className={`p-2 rounded cursor-pointer hover:bg-gray-100 ${
                  selectedId === option.id ? 'bg-blue-50 border border-blue-300' : ''
                }`}
                onClick={() => handleSelectAlternative(option)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="text-xs">系统推荐{index + 1}</Badge>
                      
                      {displayConfig.showDetails ? (
                        <Popover>
                          <PopoverTrigger asChild>
                            <button className="text-sm font-medium hover:text-blue-600 flex items-center gap-1">
                              {option.title || option.id}
                              <Info className="h-3 w-3" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-96 max-h-96 overflow-y-auto" side="left">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">{displayConfig.icon}</span>
                                <p className="font-semibold text-sm">{option.title || option.id}</p>
                              </div>
                              {option.summary && (
                                <p className="text-xs text-gray-600">{option.summary}</p>
                              )}
                              {displayConfig.type === 'prompt' && option.content && (
                                <div className="mt-2">
                                  <p className="text-xs font-medium text-gray-700 mb-1">Prompt内容预览：</p>
                                  <pre className="text-xs bg-gray-50 p-2 rounded whitespace-pre-wrap max-h-64 overflow-y-auto border">
                                    {option.content}
                                  </pre>
                                </div>
                              )}
                              {displayConfig.type === 'style' && option.reason && (
                                <div className="mt-2 space-y-1">
                                  <p className="text-xs font-medium text-gray-700">风格特点：</p>
                                  <div className="text-xs text-gray-600 space-y-1">
                                    {option.reason.structure && <p>• 结构：{option.reason.structure}</p>}
                                    {option.reason.tone && <p>• 语调：{option.reason.tone}</p>}
                                    {option.reason.targetAudience && <p>• 受众：{option.reason.targetAudience}</p>}
                                  </div>
                                </div>
                              )}
                            </div>
                          </PopoverContent>
                        </Popover>
                      ) : (
                        <span className="text-sm font-medium">{option.title || option.id}</span>
                      )}
                    </div>
                    {option.summary && !displayConfig.showDetails && (
                      <p className="text-xs text-gray-500 mt-1">{option.summary}</p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {selectedId === option.id && <Check className="h-4 w-4 text-green-600" />}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

