'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { RecommendationSelector } from '@/components/RecommendationSelector'
import type { MediaFile } from '@/components/MultiMediaInput';
import { MultiMediaInput } from '@/components/MultiMediaInput'

interface CompetitorAnalysisProps {
  productId: string
  onSuccess: (result: Record<string, unknown>) => void
}

export function CompetitorAnalysis({ productId, onSuccess }: CompetitorAnalysisProps) {
  const [competitorText, setCompetitorText] = useState('')
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([])
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
  const [analysisMode, setAnalysisMode] = useState<'manual' | 'ai-search' | 'auto-fetch'>('manual') // 分析模式
  const [isAiSearching, setIsAiSearching] = useState(false) // AI搜索状态
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false) // 高级选项显示状态
  
  // 推荐状态（从RecommendationSelector组件接收）
  const [modelRecommendationStatus, setModelRecommendationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [promptRecommendationStatus, setPromptRecommendationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  // AI搜索结果长度限制（可按需调整/外部传参）
  const AI_SEARCH_MAX_ITEMS = 4
  const AI_SEARCH_MAX_CHARS_PER_ITEM = 160
  const AI_SEARCH_MAX_TOTAL_CHARS = 2000
  
  // 防抖定时器引用
  const recommendationDebounceRef = useRef<NodeJS.Timeout | null>(null)
  
  // 综合推荐状态：两个都成功才算成功
  const overallRecommendationStatus = 
    modelRecommendationStatus === 'success' && promptRecommendationStatus === 'success' 
      ? 'success' 
      : (modelRecommendationStatus === 'loading' || promptRecommendationStatus === 'loading')
      ? 'loading'
      : (modelRecommendationStatus === 'error' || promptRecommendationStatus === 'error')
      ? 'error'
      : 'idle'

  // 防抖触发推荐刷新
  const triggerRecommendationDebounced = useCallback(() => {
    if (recommendationDebounceRef.current) {
      clearTimeout(recommendationDebounceRef.current)
    }
    recommendationDebounceRef.current = setTimeout(() => {
      setRecommendationTrigger(prev => prev + 1)
    }, 1000) // 1秒防抖
  }, [])

  // 清理定时器
  useEffect(() => {
    return () => {
      if (recommendationDebounceRef.current) {
        clearTimeout(recommendationDebounceRef.current)
      }
    }
  }, [])

  // 当推荐失败后10秒，自动使用默认配置
  useEffect(() => {
    if (overallRecommendationStatus === 'error') {
      const timer = setTimeout(() => {
        if (!selectedModel) {
          // 使用默认模型
          setSelectedModel('gemini/gemini-2.0-flash-exp')
          console.log('[CompetitorAnalysis] 推荐超时，使用默认模型')
        }
        if (!selectedPromptDecisionId) {
          // 使用默认Prompt决策ID（表示使用系统默认）
          setSelectedPromptDecisionId('default-prompt')
          console.log('[CompetitorAnalysis] 推荐超时，使用默认Prompt')
        }
      }, 10000) // 10秒后自动使用默认配置
      return () => clearTimeout(timer)
    }
  }, [overallRecommendationStatus, selectedModel, selectedPromptDecisionId])

  // 使用useMemo优化task对象，避免每次渲染都重新创建
  const modelTask = useMemo(() => ({
    taskType: 'competitor-analysis' as const,
    contentType: mediaFiles.some(file => file.type === 'image' || file.type === 'video') ? 'vision' as const : 'text' as const,
    jsonRequirement: true
  }), [mediaFiles])

  const promptTask = useMemo(() => ({
    taskType: 'competitor-analysis' as const,
    contentType: mediaFiles.some(file => file.type === 'image' || file.type === 'video') ? 'vision' as const : 'text' as const
  }), [mediaFiles])

  // 使用useMemo优化context对象
  const modelContext = useMemo(() => ({
    channel: 'web' as const,
    hasCompetitorData: competitorText.trim().length > 0 || mediaFiles.length > 0
  }), [competitorText, mediaFiles])

  const promptContext = useMemo(() => ({
    channel: 'web' as const,
    hasCompetitorData: competitorText.trim().length > 0 || mediaFiles.length > 0
  }), [competitorText, mediaFiles])

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
          if (Array.isArray(data.mediaFiles)) setMediaFiles(data.mediaFiles)
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

  // 若本地没有草稿，则尝试加载服务器端AI搜索缓存，默认填充到手动输入
  useEffect(() => {
    const loadCachedSearch = async () => {
      if (!productId) return
      if (competitorText && competitorText.trim().length > 0) return
      try {
        const res = await fetch(`/api/competitor/search-cache?productId=${productId}`)
        const data = await res.json()
        if (data?.success && data?.data?.text) {
          setCompetitorText(String(data.data.text))
          // 可选：恢复部分图片（作为URL/占位，不强制转为dataURL）
          if (Array.isArray(data.data.images) && data.data.images.length > 0) {
            const newMediaFiles: MediaFile[] = data.data.images.slice(0, 5).map((img: string, index: number) => ({
              id: `cached-image-${Date.now()}-${index}`,
              name: `缓存图片${index + 1}`,
              type: 'image' as const,
              content: String(img),
              size: 0
            }))
            setMediaFiles(prev => prev.length > 0 ? prev : newMediaFiles)
          }
        }
      } catch {}
    }
    loadCachedSearch()
    // 仅在产品或草稿为空时尝试
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId])

  // 保存草稿（避免过大：文件最多保存前5个）
  useEffect(() => {
    try {
      const payload = {
        competitorText,
        mediaFiles: (mediaFiles || []).slice(0, 5),
        customPrompt,
        selectedModel,
        selectedModelDecisionId,
        selectedPromptDecisionId,
        allowFallback,
      }
      localStorage.setItem(storageKey, JSON.stringify(payload))
    } catch {}
  }, [competitorText, mediaFiles, customPrompt, selectedModel, selectedModelDecisionId, selectedPromptDecisionId, allowFallback, storageKey])

  // 处理媒体文件变化
  const handleMediaChange = (files: MediaFile[]) => {
    setMediaFiles(files);
  };

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
            const newMediaFiles: MediaFile[] = result.data.images.slice(0, 5).map((img: string, index: number) => ({
              id: `url-image-${Date.now()}-${index}`,
              name: `URL图片${index + 1}`,
              type: 'image' as const,
              content: img,
              size: 0
            }));
            setMediaFiles(prev => [...prev, ...newMediaFiles]);
          }
          
          // 触发推荐刷新（防抖）
          triggerRecommendationDebounced()
        } else {
          setUrlError(`URL抓取失败: ${result.error || '无法访问该链接'}`)
        }
      } catch (error: unknown) {
        setUrlError(`URL抓取失败: ${error instanceof Error ? error.message : '网络错误'}`)
      } finally {
        setIsFetchingUrl(false)
      }
    } else {
      // 如果不是URL，也触发推荐刷新（用户直接输入了文本）
      triggerRecommendationDebounced()
    }
  }

  // 使用useRef来存储定时器，避免重复设置
  const textChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // 处理文本变化时也触发推荐刷新
  const handleTextChange = (value: string) => {
    setCompetitorText(value)
    
    // 清除之前的定时器
    if (textChangeTimeoutRef.current) {
      clearTimeout(textChangeTimeoutRef.current)
    }
    
    // 延迟触发推荐刷新，避免频繁调用
    textChangeTimeoutRef.current = setTimeout(() => {
      if (value.trim().length > 10) { // 只有输入足够内容才触发
        triggerRecommendationDebounced()
      }
    }, 2000) // 增加到2秒，减少抖动
  }

  // AI搜索竞品功能 - 自动触发
  const handleAiSearch = async (productIdParam: string) => {
    setIsAiSearching(true)
    try {
      const response = await fetch('/api/competitor/ai-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: productIdParam,
          query: 'auto', // 自动搜索模式
          searchType: 'competitor',
          maxItems: AI_SEARCH_MAX_ITEMS,
          maxCharsPerItem: AI_SEARCH_MAX_CHARS_PER_ITEM,
          maxTotalChars: AI_SEARCH_MAX_TOTAL_CHARS
        })
      })

      const result = await response.json()
      
      if (result.success && result.data) {
        // 将搜索结果格式化为竞品信息
        const searchResults = (result.data.results || []).slice(0, AI_SEARCH_MAX_ITEMS)
        
        // 格式化竞品信息，包含标题、描述、卖点
        const formattedResults = searchResults.map((item: Record<string, unknown>, index: number) => {
          const parts: string[] = []
          const title = String(item.title || '')
          parts.push(`【竞品${index + 1}】${title.length > 80 ? title.slice(0, 79) + '…' : title}`)
          if (item.url) parts.push(`链接: ${item.url}`)
          const metrics: string[] = []
          if (item.price) metrics.push(`价格: ${item.price}`)
          if (item.rating) metrics.push(`评分: ${item.rating}⭐`)
          if (item.reviews) metrics.push(`评论: ${item.reviews}条`)
          if (metrics.length > 0) parts.push(metrics.join(' | '))
          if (item.description) {
            const desc = String(item.description)
            const clipped = desc.length > AI_SEARCH_MAX_CHARS_PER_ITEM ? (desc.slice(0, AI_SEARCH_MAX_CHARS_PER_ITEM - 1) + '…') : desc
            parts.push(`描述: ${clipped}`)
          }
          if (Array.isArray(item.sellingPoints) && item.sellingPoints.length > 0) {
            parts.push(`卖点: ${item.sellingPoints.join('、')}`)
          }
          return parts.join('\n')
        }).join('\n\n' + '-'.repeat(50) + '\n\n')

        // 全局长度再限制一次，防止异常返回过长
        const finalText = formattedResults.length > AI_SEARCH_MAX_TOTAL_CHARS
          ? (formattedResults.slice(0, AI_SEARCH_MAX_TOTAL_CHARS - 1) + '…')
          : formattedResults

        setCompetitorText(finalText)
        
        // 如果有图片，也添加进来
        if (result.data.images && result.data.images.length > 0) {
          const newMediaFiles: MediaFile[] = result.data.images.slice(0, 5).map((img: string, index: number) => ({
            id: `ai-search-image-${Date.now()}-${index}`,
            name: `AI搜索图片${index + 1}`,
            type: 'image' as const,
            content: img,
            size: 0
          }));
          setMediaFiles(prev => [...prev, ...newMediaFiles]);
        }
        
        // 将AI搜索结果缓存到服务器，便于下次默认填充
        try {
          await fetch('/api/competitor/search-cache', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              productId,
              text: finalText,
              images: result.data.images || []
            })
          })
        } catch {}

        // 触发推荐刷新（防抖）
        triggerRecommendationDebounced()
      } else {
        alert(`AI搜索失败: ${result.error || '无法搜索到相关竞品'}`)
      }
    } catch (error: unknown) {
      console.error('AI搜索失败:', error)
      alert(`AI搜索失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setIsAiSearching(false)
    }
  }

  // 监听AI搜索模式切换，自动触发搜索
  useEffect(() => {
    if (analysisMode === 'ai-search' && productId && !isAiSearching && !competitorText) {
      handleAiSearch(productId)
    }
  }, [analysisMode, productId])

  // RecommendationSelector 会自动在挂载时触发推荐，这里不需要手动触发

  const handleAnalyze = async (e?: React.MouseEvent) => {
    // 防止潜在表单提交引发整页刷新
    e?.preventDefault?.()
    e?.stopPropagation?.()
    if (!competitorText.trim() && mediaFiles.length === 0) {
      alert('请至少输入竞品链接/文本或上传文件')
      return
    }

    setIsAnalyzing(true)
    try {
      // 将mediaFiles转换为API期望的格式
      // 仅传输 DataURL(base64) 图片，忽略普通 URL（来自 AI 搜索/抓取的图片链接）
      const competitorImages = mediaFiles
        .filter(file => file.type === 'image' && typeof file.content === 'string' && file.content.startsWith('data:image'))
        .map(file => file.content)
        .slice(0, 5);

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
      
      console.log('[CompetitorAnalysis] API返回结果:', {
        success: result.success,
        addedSellingPoints: result.data?.addedSellingPoints,
        addedPainPoints: result.data?.addedPainPoints,
        sellingPointsCount: result.data?.sellingPoints?.length,
        painPointsCount: result.data?.painPoints?.length,
        sellingPoints: result.data?.sellingPoints?.slice(0, 3),
        painPoints: result.data?.painPoints?.slice(0, 3)
      })
      
      if (result.success) {
        console.log('[CompetitorAnalysis] 调用onSuccess回调，传递数据:', result.data)
        onSuccess(result.data)
        setIsSuccess(true)
      } else {
        // 详细的错误信息
        console.error('[CompetitorAnalysis] 分析失败:', result)
        const details = typeof result.details === 'string' ? result.details : (result.details ? JSON.stringify(result.details) : '')
        const msg = [result.error || '未知错误', details].filter(Boolean).join('\n')
        
        // 不使用alert，改用更友好的错误提示
        const errorDiv = document.createElement('div')
        errorDiv.className = 'fixed top-4 right-4 bg-red-50 border border-red-200 rounded-lg p-4 max-w-md z-50'
        errorDiv.innerHTML = `
          <div class="flex items-start gap-2">
            <span class="text-red-600 text-xl">⚠️</span>
            <div class="flex-1">
              <div class="font-medium text-red-800">竞品分析失败</div>
              <div class="text-sm text-red-600 mt-1">${msg.replace(/\n/g, '<br>')}</div>
            </div>
            <button onclick="this.parentElement.parentElement.remove()" class="text-red-400 hover:text-red-600">✕</button>
          </div>
        `
        document.body.appendChild(errorDiv)
        setTimeout(() => errorDiv.remove(), 5000)
      }
    } catch (error: unknown) {
      console.error('[CompetitorAnalysis] 竞品分析失败:', error)
      
      // 不使用alert，改用更友好的错误提示
      const errorDiv = document.createElement('div')
      errorDiv.className = 'fixed top-4 right-4 bg-red-50 border border-red-200 rounded-lg p-4 max-w-md z-50'
      errorDiv.innerHTML = `
        <div class="flex items-start gap-2">
          <span class="text-red-600 text-xl">⚠️</span>
          <div class="flex-1">
            <div class="font-medium text-red-800">竞品分析失败</div>
            <div class="text-sm text-red-600 mt-1">${error instanceof Error ? error.message : '网络错误或服务器异常'}</div>
          </div>
          <button onclick="this.parentElement.parentElement.remove()" class="text-red-400 hover:text-red-600">✕</button>
        </div>
      `
      document.body.appendChild(errorDiv)
      setTimeout(() => errorDiv.remove(), 5000)
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-2">
      {/* 分析模式选择 */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">🔍 分析模式</Label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setAnalysisMode('manual')}
            className={`flex-1 p-2 text-sm rounded-lg border transition-colors ${
              analysisMode === 'manual'
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
            }`}
          >
            <div className="font-medium">📝 手动输入</div>
            <div className="text-xs mt-1">直接输入竞品信息</div>
          </button>
          <button
            type="button"
            onClick={() => setAnalysisMode('ai-search')}
            className={`flex-1 p-2 text-sm rounded-lg border transition-colors ${
              analysisMode === 'ai-search'
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
            }`}
          >
            <div className="font-medium">🤖 AI搜索</div>
            <div className="text-xs mt-1">AI自动搜索竞品</div>
          </button>
          <button
            type="button"
            onClick={() => setAnalysisMode('auto-fetch')}
            className={`flex-1 p-2 text-sm rounded-lg border transition-colors ${
              analysisMode === 'auto-fetch'
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
            }`}
          >
            <div className="font-medium">🔗 自动抓取</div>
            <div className="text-xs mt-1">输入URL自动抓取</div>
          </button>
        </div>
      </div>

      {/* 竞品输入区 */}
      <div className="space-y-2">
        {analysisMode === 'ai-search' ? (
          // AI搜索模式：显示搜索状态和结果
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-sm font-medium">🤖 AI自动搜索竞品信息</Label>
              <p className="text-xs text-gray-500">
                💡 AI会基于您的商品信息（名称、类目、卖点）自动搜索相关竞品，提取竞品的描述、卖点等信息，作为分析的输入
              </p>
            </div>
            {isAiSearching ? (
              <div className="flex items-center justify-center gap-3 p-8 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="animate-spin h-8 w-8 border-4 border-purple-600 border-t-transparent rounded-full" />
                <div className="text-purple-700">
                  <div className="font-medium">AI正在搜索相关竞品...</div>
                  <div className="text-sm text-purple-600 mt-1">正在查找市场上的热销竞品及其卖点信息</div>
                </div>
              </div>
            ) : competitorText ? (
              <div className="space-y-2">
                <div className="text-xs text-green-600 bg-green-50 border border-green-200 rounded p-2 flex items-start gap-2">
                  <span>✓</span>
                  <div>
                    <div className="font-medium">AI搜索完成</div>
                    <div className="mt-1">找到{competitorText.split('【竞品').length - 1}个竞品信息，包含标题、描述、价格、评分、卖点等。您可以编辑或直接点击"开始分析"提取卖点。</div>
                  </div>
                </div>
                <Textarea
                  value={competitorText}
                  onChange={(e) => setCompetitorText(e.target.value)}
                  rows={12}
                  className="resize-none font-mono text-xs"
                  placeholder="AI搜索到的竞品信息..."
                />
              </div>
            ) : (
              <div className="text-center p-6 bg-gray-50 border border-gray-200 rounded-lg text-gray-500">
                等待AI搜索...
              </div>
            )}
          </div>
        ) : analysisMode === 'auto-fetch' ? (
          // 自动抓取模式：使用单独的输入框支持onBlur
          <div className="space-y-2">
            <Label className="text-sm font-medium">竞品信息输入（URL/文本/图片/视频/文档）</Label>
            <Textarea
              value={competitorText}
              onChange={(e) => handleTextChange(e.target.value)}
              onBlur={handleTextBlur}
              placeholder="粘贴竞品链接（URL）自动抓取内容，或直接输入文本；也可以直接粘贴/拖拽文件到此处"
              rows={4}
              className="resize-none"
            />
            <MultiMediaInput
              value=""
              onChange={() => {}}
              onMediaChange={handleMediaChange}
              placeholder="拖拽或粘贴文件到此处"
              label=""
              maxFiles={5}
              acceptedTypes={['image/*', 'video/*', 'text/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']}
            />
          </div>
        ) : (
          // 手动输入模式：使用MultiMediaInput
          <MultiMediaInput
            value={competitorText}
            onChange={handleTextChange}
            onMediaChange={handleMediaChange}
            placeholder='直接输入竞品信息、描述、卖点等；也可以直接粘贴/拖拽文件到此处'
            label='竞品信息输入（文本/图片/视频/文档）'
            maxFiles={5}
            acceptedTypes={['image/*', 'video/*', 'text/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']}
          />
        )}
        
        {/* URL抓取状态 */}
        {isFetchingUrl && (
          <div className="flex items-center gap-2 text-sm text-blue-600 p-2 bg-blue-50 rounded">
            <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full" />
            正在抓取URL内容...
          </div>
        )}
        
        {urlError && (
          <div className="text-xs text-red-500 p-2 bg-red-50 rounded">
            ⚠️ {urlError}
          </div>
        )}
        
        <p className="text-xs text-gray-500">
          💡 提示：输入URL点空白处自动抓取；支持Ctrl+V粘贴文件或拖拽文件到输入框
        </p>
      </div>

      {/* 推荐选择器 - 带状态指示 */}
      <div className="space-y-4">
        {/* 模型推荐 */}
        <div>
          <RecommendationSelector
            scenario="task->model"
            task={modelTask}
            context={modelContext}
            constraints={{
              requireJsonMode: true,
              maxLatencyMs: 10000
            }}
            triggerRefresh={recommendationTrigger}
            onSelect={(modelId, decisionId, isOverride) => {
              setSelectedModel(modelId)
              setSelectedModelDecisionId(decisionId)
              console.log('[CompetitorAnalysis] AI模型已选择:', modelId)
            }}
            onRecommendationStatusChange={(status) => {
              setModelRecommendationStatus(status)
            }}
            showStatusIndicator={true}
          />
        </div>

        {/* Prompt推荐 */}
        <div>
          <RecommendationSelector
            scenario="task->prompt"
            task={promptTask}
            context={promptContext}
            constraints={{
              maxLatencyMs: 5000
            }}
            triggerRefresh={recommendationTrigger}
            onSelect={async (promptId, decisionId, isOverride) => {
              setSelectedPromptDecisionId(decisionId)
              console.log('[CompetitorAnalysis] Prompt已选择:', promptId)
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
            onRecommendationStatusChange={(status) => {
              setPromptRecommendationStatus(status)
            }}
            showStatusIndicator={true}
          />
        </div>

        {/* 综合推荐状态显示 */}
        <div className={`rounded-lg p-3 border transition-all ${
          overallRecommendationStatus === 'success' 
            ? 'bg-green-50 border-green-200' 
            : overallRecommendationStatus === 'loading'
            ? 'bg-yellow-50 border-yellow-200'
            : overallRecommendationStatus === 'error'
            ? 'bg-red-50 border-red-200'
            : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex items-start gap-2 text-sm">
            <span className="text-lg">
              {overallRecommendationStatus === 'success' ? '✓' : overallRecommendationStatus === 'loading' ? '⏳' : overallRecommendationStatus === 'error' ? '✗' : '○'}
            </span>
            <div className="flex-1">
              {overallRecommendationStatus === 'success' ? (
                <>
                  <div className="font-medium text-green-700">✨ AI已自动推荐分析策略</div>
                  <div className="text-xs text-green-600 mt-1 space-y-1">
                    {selectedModel && (
                      <div>🤖 模型: <span className="font-mono">{selectedModel.replace(/^[^/]+\//, '')}</span></div>
                    )}
                    {selectedPromptDecisionId && (
                      <div>📝 Prompt: 已自动配置</div>
                    )}
                  </div>
                </>
              ) : overallRecommendationStatus === 'loading' ? (
                <>
                  <div className="font-medium text-yellow-700">⏳ AI推荐中...</div>
                  <div className="text-xs text-yellow-600 mt-1">
                    正在分析任务特征并匹配最佳配置
                    <div className="text-xs text-gray-500 mt-1">
                      模型: {modelRecommendationStatus === 'success' ? '✓' : '⏳'} | 
                      Prompt: {promptRecommendationStatus === 'success' ? '✓' : '⏳'}
                    </div>
                  </div>
                </>
              ) : overallRecommendationStatus === 'error' ? (
                <>
                  <div className="font-medium text-orange-700">⚠️ 推荐系统超时</div>
                  <div className="text-xs text-orange-600 mt-1">
                    推荐请求超时，您可以：
                    <div className="mt-1 space-y-1">
                      <div>1️⃣ 使用默认配置继续（系统会自动选择）</div>
                      <div>2️⃣ 展开「高级选项」手动选择模型和Prompt</div>
                    </div>
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
      </div>

      {/* 高级选项折叠区域 */}
      <div className="border-t pt-3">
        <div className="flex items-center justify-between mb-2">
          <Label className="text-sm font-medium">⚙️ 高级选项</Label>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
            className="h-8"
          >
            {showAdvancedOptions ? '收起' : '展开'}
          </Button>
        </div>
        
        {showAdvancedOptions && (
          <div className="space-y-4">
            {/* AI 模型选择 */}
            <div>
              <Label className="mb-2 block text-sm">🤖 AI模型</Label>
              <div className="text-xs text-gray-500 mb-2 p-2 bg-blue-50 border border-blue-200 rounded">
                当前已选择: <span className="font-mono">{selectedModel || '未选择'}</span>
              </div>
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
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm">📝 Prompt模板</Label>
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
              <div className="text-xs text-gray-500 mb-2 p-2 bg-blue-50 border border-blue-200 rounded">
                系统已自动选择最优Prompt
              </div>
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
            </div>
          </div>
        )}
      </div>

      {/* 开始分析按钮 */}
      <div className="flex flex-col items-end gap-2 pt-4">
        <Button 
          type="button"
          onClick={handleAnalyze}
          disabled={
            isAnalyzing || 
            (!competitorText.trim() && mediaFiles.length === 0) ||
            (overallRecommendationStatus === 'loading') // 只在加载中禁用，失败了也可以继续
          }
          className={`w-full sm:w-auto`}
        >
          {isAnalyzing ? '分析中...' : (isSuccess ? '分析成功' : '开始分析')}
        </Button>
        {overallRecommendationStatus === 'loading' && !isAnalyzing && (
          <div className="text-xs text-gray-500">
            ⏳ 推荐系统加载中...
          </div>
        )}
        {overallRecommendationStatus === 'error' && !isAnalyzing && (
          <div className="text-xs text-orange-600">
            ⚠️ 推荐失败，但仍可手动选择后继续
          </div>
        )}
      </div>
    </div>
  )
}
