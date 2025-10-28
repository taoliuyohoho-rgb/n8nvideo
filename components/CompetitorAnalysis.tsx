'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { RecommendationSelector } from '@/components/RecommendationSelector'

interface CompetitorAnalysisProps {
  productId: string
  onSuccess: (result: any) => void
}

export function CompetitorAnalysis({ productId, onSuccess }: CompetitorAnalysisProps) {
  const [competitorText, setCompetitorText] = useState('')
  const [competitorImages, setCompetitorImages] = useState<string[]>([])
  const [customPrompt, setCustomPrompt] = useState('')
  const [selectedModel, setSelectedModel] = useState('')
  const [selectedModelDecisionId, setSelectedModelDecisionId] = useState('')
  const [selectedPromptDecisionId, setSelectedPromptDecisionId] = useState('')
  const [allowFallback, setAllowFallback] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [showPromptEditor, setShowPromptEditor] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isFetchingUrl, setIsFetchingUrl] = useState(false)
  const [urlError, setUrlError] = useState('')
  const [recommendationTrigger, setRecommendationTrigger] = useState(0) // 用于触发推荐刷新

  // 持久化键（按商品隔离）
  const storageKey = `competitorAnalysis:${productId || 'default'}`

  // 恢复本地草稿
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const data = JSON.parse(saved)
        if (data && typeof data === 'object') {
          if (typeof data.competitorText === 'string') setCompetitorText(data.competitorText)
          if (Array.isArray(data.competitorImages)) setCompetitorImages(data.competitorImages)
          if (typeof data.customPrompt === 'string') setCustomPrompt(data.customPrompt)
          if (typeof data.selectedModel === 'string') setSelectedModel(data.selectedModel)
          if (typeof data.selectedModelDecisionId === 'string') setSelectedModelDecisionId(data.selectedModelDecisionId)
          if (typeof data.selectedPromptDecisionId === 'string') setSelectedPromptDecisionId(data.selectedPromptDecisionId)
          if (typeof data.allowFallback === 'boolean') setAllowFallback(data.allowFallback)
        }
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId])

  // 保存草稿（避免过大：图片最多保存前5张）
  useEffect(() => {
    try {
      const payload = {
        competitorText,
        competitorImages: (competitorImages || []).slice(0, 5),
        customPrompt,
        selectedModel,
        selectedModelDecisionId,
        selectedPromptDecisionId,
        allowFallback,
      }
      localStorage.setItem(storageKey, JSON.stringify(payload))
    } catch {}
  }, [competitorText, competitorImages, customPrompt, selectedModel, selectedModelDecisionId, selectedPromptDecisionId, allowFallback, storageKey])

  // 处理图片粘贴
  const handlePasteImages = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items
    if (!items) return

    const imageUrls: string[] = []
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (item.type.indexOf('image') !== -1) {
        const blob = item.getAsFile()
        if (blob) {
          const reader = new FileReader()
          reader.onload = (event) => {
            const dataUrl = event.target?.result as string
            setCompetitorImages(prev => [...prev, dataUrl])
          }
          reader.readAsDataURL(blob)
        }
      }
    }
  }

  // 处理图片拖拽
  const handleDropImages = (e: React.DragEvent) => {
    e.preventDefault()
    const files = e.dataTransfer?.files
    if (!files) return

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (file.type.indexOf('image') !== -1) {
        const reader = new FileReader()
        reader.onload = (event) => {
          const dataUrl = event.target?.result as string
          setCompetitorImages(prev => [...prev, dataUrl])
        }
        reader.readAsDataURL(file)
      }
    }
  }

  // 检测URL并自动抓取
  const handleTextBlur = async () => {
    setUrlError('')
    const text = competitorText.trim()
    if (!text) return

    // 检测是否为URL
    const urlPattern = /^https?:\/\/.+/i
    if (urlPattern.test(text)) {
      setIsFetchingUrl(true)
      try {
        // 调用抓取API
        const response = await fetch('/api/competitor/fetch-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: text })
        })
        
        const result = await response.json()
        
        if (result.success && result.data) {
          // 自动填充抓取的内容
          const fetchedContent = `URL: ${text}\n\n标题: ${result.data.title || '未获取'}\n\n描述: ${result.data.description || '未获取'}\n\n关键信息:\n${result.data.keyInfo || '未获取'}`
          setCompetitorText(fetchedContent)
          
          // 如果有图片，也添加进来
          if (result.data.images && result.data.images.length > 0) {
            setCompetitorImages(prev => [...prev, ...result.data.images.slice(0, 5)])
          }
          
          // 触发推荐刷新
          setRecommendationTrigger(prev => prev + 1)
        } else {
          setUrlError(`URL抓取失败: ${result.error || '无法访问该链接'}`)
        }
      } catch (error: any) {
        setUrlError(`URL抓取失败: ${error.message || '网络错误'}`)
      } finally {
        setIsFetchingUrl(false)
      }
    } else {
      // 如果不是URL，也触发推荐刷新（用户直接输入了文本）
      setRecommendationTrigger(prev => prev + 1)
    }
  }

  const handleAnalyze = async (e?: React.MouseEvent) => {
    // 防止潜在表单提交引发整页刷新
    e?.preventDefault?.()
    e?.stopPropagation?.()
    if (!competitorText.trim() && competitorImages.length === 0) {
      alert('请至少输入竞品链接/文本或上传图片')
      return
    }

    setIsAnalyzing(true)
    try {
      const response = await fetch('/api/competitor/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          competitorText,
          competitorImages,
          customPrompt: customPrompt || undefined,
          aiModel: selectedModel || 'auto',
          modelDecisionId: selectedModelDecisionId,
          promptDecisionId: selectedPromptDecisionId,
          allowFallback
        })
      })

      const result = await response.json()
      
      if (result.success) {
        onSuccess(result.data)
        setIsSuccess(true)
      } else {
        const details = typeof result.details === 'string' ? result.details : (result.details ? JSON.stringify(result.details) : '')
        const msg = [result.error || '未知错误', details].filter(Boolean).join('\n')
        alert(`分析失败: ${msg}`)
      }
    } catch (error: any) {
      console.error('竞品分析失败:', error)
      alert(`分析失败: ${error.message}`)
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* 竞品输入区 */}
      <div className="space-y-2">
        <Label>竞品信息输入（URL/文本/图片）</Label>
        <div 
          onPaste={handlePasteImages} 
          onDrop={handleDropImages} 
          onDragOver={(e) => e.preventDefault()}
        >
          <div className="relative">
            <Textarea
              value={competitorText}
              onChange={(e) => setCompetitorText(e.target.value)}
              onBlur={handleTextBlur}
              placeholder="粘贴竞品链接（URL）自动抓取内容，或直接输入文本；也可以直接粘贴图片到此处"
              rows={5}
              className="mb-2"
              disabled={isFetchingUrl}
            />
            {isFetchingUrl && (
              <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center rounded">
                <div className="flex items-center gap-2 text-sm text-blue-600">
                  <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full" />
                  正在抓取URL内容...
                </div>
              </div>
            )}
          </div>
          {urlError && (
            <div className="text-xs text-red-500 mb-2">
              ⚠️ {urlError}
            </div>
          )}
          {competitorImages.length > 0 && (
            <div className="mt-2">
              <Label className="text-xs text-gray-600 mb-1 block">已添加的图片：</Label>
              <div className="flex flex-wrap gap-2">
                {competitorImages.map((img, idx) => (
                  <div key={idx} className="relative group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={img} 
                      alt={`竞品图片${idx + 1}`} 
                      className="h-20 w-20 object-cover rounded border"
                    />
                    <button
                      onClick={() => setCompetitorImages(prev => prev.filter((_, i) => i !== idx))}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <p className="text-xs text-gray-500">
          💡 提示：输入URL点空白处自动抓取；支持Ctrl+V粘贴图片或拖拽图片到输入框
        </p>
      </div>

      {/* AI 模型选择 */}
      <div className="border-t pt-4">
        <Label className="mb-2 block">🤖 AI模型</Label>
        {(!competitorText.trim() && competitorImages.length === 0) && (
          <div className="text-xs text-gray-500 mb-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
            💡 提示：输入竞品信息后，系统将自动推荐最适合的AI模型
          </div>
        )}
        <RecommendationSelector
          scenario="task->model"
          task={{
            taskType: 'competitor-analysis',
            contentType: competitorImages.length > 0 ? 'vision' : 'text',
            jsonRequirement: true
          }}
          context={{
            channel: 'web',
            hasCompetitorData: competitorText.trim().length > 0 || competitorImages.length > 0
          }}
          constraints={{
            requireJsonMode: true,
            maxLatencyMs: 10000
          }}
          triggerRefresh={recommendationTrigger}
          onSelect={(modelId, decisionId, isOverride) => {
            setSelectedModel(modelId)
            setSelectedModelDecisionId(decisionId)
          }}
        />
        <div className="flex items-center gap-2 mt-2">
          <input 
            id={`allowFallback-${productId}`}
            type="checkbox" 
            className="rounded border-gray-300" 
            checked={allowFallback} 
            onChange={(e) => setAllowFallback(e.target.checked)} 
          />
          <Label htmlFor={`allowFallback-${productId}`} className="text-sm cursor-pointer">
            链接无法解析时允许AI检索兜底
          </Label>
        </div>
      </div>

      {/* Prompt 模板选择 */}
      <div className="border-t pt-4">
        <div className="flex items-center justify-between mb-2">
          <Label>📝 Prompt模板</Label>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setShowPromptEditor(!showPromptEditor)}
            className="h-8"
          >
            {showPromptEditor ? '收起编辑器' : '展开编辑器'}
          </Button>
        </div>
        <RecommendationSelector
          scenario="task->prompt"
          task={{
            taskType: 'product-competitor',
            contentType: competitorImages.length > 0 ? 'vision' : 'text'
          }}
          context={{
            channel: 'web',
            hasCompetitorData: competitorText.trim().length > 0 || competitorImages.length > 0
          }}
          constraints={{
            maxLatencyMs: 5000
          }}
          triggerRefresh={recommendationTrigger}
          onSelect={async (promptId, decisionId, isOverride) => {
            setSelectedPromptDecisionId(decisionId)
            try {
              const res = await fetch(`/api/admin/prompts?id=${promptId}`)
              const data = await res.json()
              if (data.template?.content) {
                setCustomPrompt(data.template.content)
              }
            } catch (e) {
              console.error('加载Prompt失败', e)
            }
          }}
        />
        {showPromptEditor && (
          <div className="mt-2">
            <Textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              rows={6}
              placeholder="Prompt内容将自动填充，也可手动修改"
              className="font-mono text-xs"
            />
          </div>
        )}
        <p className="text-xs text-gray-500 mt-2">
          系统已推荐最优Prompt。如需自定义，请点击"展开编辑器"
        </p>
      </div>

      {/* 开始分析按钮 */}
      <div className="flex justify-end pt-4">
        <Button 
          type="button"
          onClick={handleAnalyze}
          disabled={isAnalyzing || (!competitorText.trim() && competitorImages.length === 0)}
          className="w-full sm:w-auto"
        >
          {isAnalyzing ? '分析中...' : (isSuccess ? '分析成功' : '开始分析')}
        </Button>
      </div>
    </div>
  )
}
