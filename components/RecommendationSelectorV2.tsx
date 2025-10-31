/**
 * 推荐选择器 V2 - 基于 React Query 的数据层版本
 * 提供更好的缓存、去重和状态管理
 */

'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ChevronDown, Check, Info, Loader2, Eye } from 'lucide-react'
import { useRecommendations, type RecommendationParams } from '@/src/hooks/useRecommendations'

interface RecommendationItem {
  id: string
  type: string
  title?: string
  name?: string
  summary?: string
  content?: string
  fineScore?: number
  coarseScore?: number
  reason?: any
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

interface RecommendationSelectorV2Props {
  scenario: 'product->style' | 'task->model' | 'task->prompt'
  task: any
  context?: any
  constraints?: any
  onSelect: (selectedId: string, decisionId: string, isUserOverride: boolean) => void
  defaultLabel?: string
  className?: string
  triggerRefresh?: number
  onLoadingChange?: (isLoading: boolean) => void
  onRecommendationStatusChange?: (status: 'idle' | 'loading' | 'success' | 'error') => void
  showStatusIndicator?: boolean
  autoHideWhenSelected?: boolean
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
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
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

export function RecommendationSelectorV2({
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
  autoHideWhenSelected = false
}: RecommendationSelectorV2Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showAlternatives, setShowAlternatives] = useState(false)

  // 使用 React Query 管理推荐数据
  const params: RecommendationParams = {
    scenario,
    task,
    context: context || {},
    constraints: constraints || {}
  }

  const {
    data: recommendation,
    isLoading,
    isError,
    error,
    isFetching
  } = useRecommendations(params, {
    // 当 triggerRefresh 变化时重新请求
    enabled: true,
    refetchOnMount: triggerRefresh > 0
  })

  // 通知父组件加载状态变化
  React.useEffect(() => {
    onLoadingChange?.(isLoading || isFetching)
  }, [isLoading, isFetching, onLoadingChange])

  // 通知父组件推荐状态变化
  React.useEffect(() => {
    const status = isLoading || isFetching ? 'loading' : isError ? 'error' : recommendation ? 'success' : 'idle'
    onRecommendationStatusChange?.(status)
  }, [isLoading, isFetching, isError, recommendation, onRecommendationStatusChange])

  // 处理选择
  const handleSelect = (item: RecommendationItem) => {
    setSelectedId(item.id)
    onSelect(item.id, item.id, false) // 简化：使用 item.id 作为 decisionId
    
    if (autoHideWhenSelected) {
      setShowAlternatives(false)
    }
  }

  // 获取显示标签
  const getDisplayLabel = () => {
    if (selectedId && recommendation?.topK) {
      const selected = recommendation.topK.find(c => c.id === selectedId)
      return selected?.title || selected?.name || defaultLabel
    }
    return defaultLabel
  }

  // 获取状态指示器
  const getStatusIndicator = () => {
    if (!showStatusIndicator) return null
    
    if (isLoading || isFetching) {
      return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
    }
    
    if (isError) {
      return <div className="w-2 h-2 bg-red-500 rounded-full" />
    }
    
    if (recommendation) {
      return <div className="w-2 h-2 bg-green-500 rounded-full" />
    }
    
    return <div className="w-2 h-2 bg-gray-300 rounded-full" />
  }

  return (
    <div className={`w-full ${className}`}>
      <Popover open={showAlternatives} onOpenChange={setShowAlternatives}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between"
            disabled={isLoading || isFetching}
          >
            <div className="flex items-center gap-2">
              {getStatusIndicator()}
              <span>{getDisplayLabel()}</span>
            </div>
            <ChevronDown className="w-4 h-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-80 p-0" align="start">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium">推荐选项</h4>
              {getStatusIndicator()}
            </div>
            
            {isLoading || isFetching ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                <span className="ml-2 text-sm text-gray-500">加载推荐中...</span>
              </div>
            ) : isError ? (
              <div className="text-center py-8">
                <div className="text-red-500 mb-2">加载失败</div>
                <div className="text-sm text-gray-500">
                  {error?.message || '请稍后重试'}
                </div>
              </div>
            ) : recommendation?.topK && recommendation.topK.length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {recommendation.topK.map((item, index) => (
                  <div
                    key={item.id}
                    className={`p-3 rounded-lg border transition-colors ${
                      selectedId === item.id
                        ? 'bg-blue-50 border-blue-200'
                        : 'hover:bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div 
                        className="flex-1 cursor-pointer"
                        onClick={() => handleSelect(item)}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">
                            {item.title || item.name || `选项 ${index + 1}`}
                          </span>
                          {selectedId === item.id && (
                            <Check className="w-4 h-4 text-blue-500" />
                          )}
                          {index === 0 && (
                            <Badge variant="default" className="text-xs bg-green-600">推荐</Badge>
                          )}
                        </div>
                        {item.type && (
                          <p className="text-xs text-gray-600 mb-1">类型: {item.type}</p>
                        )}
                        {(item.fineScore !== undefined || item.coarseScore !== undefined) && (
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Info className="w-3 h-3" />
                            <span>评分: {item.fineScore?.toFixed(3) || item.coarseScore?.toFixed(3)}</span>
                          </div>
                        )}
                      </div>
                      {scenario === 'task->prompt' && (
                        <div className="ml-2" onClick={(e) => e.stopPropagation()}>
                          <PromptDetailDialog 
                            promptId={item.id} 
                            promptName={item.title || item.name}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-500 mb-2">暂无推荐</div>
                <div className="text-sm text-gray-400">请检查输入参数</div>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
