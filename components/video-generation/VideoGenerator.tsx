/**
 * 视频生成组件
 * AI推荐配置 -> 生成Prompt -> 生成视频
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Video, Play, Copy, Loader2, CheckCircle, AlertTriangle, Sparkles, Download, Wand2, FileText, ChevronDown, ChevronUp, History, Eye, Clock } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { RecommendationSelector } from '@/components/RecommendationSelector'
import { useVideoGenerationApi } from './hooks/useVideoGenerationApi'
import type { VideoGeneratorProps, VideoJob } from './types/video-generation'

export function VideoGenerator({ product, script, persona, onVideoJobCreated, disabled, className }: VideoGeneratorProps) {
  const [videoJob, setVideoJob] = useState<VideoJob | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [videoPrompt, setVideoPrompt] = useState('')
  const [recommendedModel, setRecommendedModel] = useState<{ id: string; title: string; provider: string } | null>(null)
  const [recommendedPromptTemplate, setRecommendedPromptTemplate] = useState<{ id: string; title: string } | null>(null)
  const [promptGenerated, setPromptGenerated] = useState(false)
  const [isRecommending, setIsRecommending] = useState(false)
  const [isRecommendationExpanded, setIsRecommendationExpanded] = useState(false)
  const [historyList, setHistoryList] = useState<PromptHistory[]>([])
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false)
  const [selectedHistory, setSelectedHistory] = useState<PromptHistory | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [currentHistoryId, setCurrentHistoryId] = useState<string | null>(null)
  const [provider, setProvider] = useState<'sora' | 'doubao'>('sora')
  const [voiceoverLang, setVoiceoverLang] = useState<string>(Array.isArray(product.targetCountries) && product.targetCountries[0] === 'CN' ? 'zh-CN' : 'en-US')

  const { createVideoJob, pollVideoJobStatus } = useVideoGenerationApi()

  // 定义历史记录类型
  interface PromptHistory {
    id: string
    productName: string
    productCategory?: string
    generatedPrompt: string
    promptTemplate?: { id: string; title: string }
    modelUsed?: { id: string; title: string; provider: string }
    metadata?: { latencyMs?: number; promptTemplateUsed?: boolean; recommendationUsed?: boolean }
    status: string
    createdAt: string
  }

  // 加载历史记录
  useEffect(() => {
    if (product?.id || product?.name) {
      loadHistory()
    }
  }, [product?.id, product?.name])

  const loadHistory = async () => {
    try {
      const params = new URLSearchParams()
      if (product.id) params.set('productId', product.id)
      else if (product.name) params.set('productName', product.name)
      params.set('pageSize', '5')

      const response = await fetch(`/api/video/prompt-history?${params}`)
      const data = await response.json()
      
      if (data.success && data.data) {
        setHistoryList(data.data)
      }
    } catch (err) {
      console.error('加载历史记录失败:', err)
    }
  }

  // 自动推荐配置
  const handleAutoRecommend = async () => {
    setIsRecommending(true)
    setError(null)
    
    try {
      const response = await fetch('/api/ai/generate-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: product.name,
          sellingPoints: product.sellingPoints,
          targetCountry: product.targetCountries?.[0] || 'CN',
          targetAudience: Array.isArray(product.targetAudience) 
            ? product.targetAudience.join(',') 
            : product.targetAudience,
          category: product.category,
          provider,
          voiceoverLang,
          // 将已有脚本（若传入）转换为最小 scriptData
          scriptData: script ? {
            angle: script.angle || 'feature_demo',
            energy: 'natural',
            durationSec: script.style?.length || 15,
            lines: {
              open: script.structure?.hook || '',
              main: script.structure?.solution || script.content || '',
              close: script.structure?.callToAction || '',
            },
            shots: [],
            technical: {
              orientation: 'vertical',
              filmingMethod: 'handheld',
              dominantHand: 'right',
              location: 'indoor',
              audioEnv: 'quiet'
            }
          } : undefined,
        })
      })

      if (!response.ok) {
        throw new Error('推荐失败')
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || '推荐失败')
      }

      // 设置推荐结果
      setRecommendedModel(data.recommendations.model)
      setRecommendedPromptTemplate(data.recommendations.promptTemplate)
      
      // 设置生成的prompt
      setVideoPrompt(data.soraPrompt || data.prompt)
      setPromptGenerated(true)

      // 保存历史记录ID
      if (data.historyId) {
        setCurrentHistoryId(data.historyId)
        // 重新加载历史记录列表
        loadHistory()
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : '推荐失败')
    } finally {
      setIsRecommending(false)
    }
  }

  // 手动生成Prompt（使用已选择的模型和模板）
  const handleGeneratePrompt = async () => {
    if (!recommendedModel || !recommendedPromptTemplate) {
      setError('请先选择模型和Prompt模板')
      return
    }

    setIsRecommending(true)
    setError(null)
    
    try {
      const response = await fetch('/api/ai/generate-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: product.name,
          sellingPoints: product.sellingPoints,
          targetCountry: product.targetCountries?.[0] || 'CN',
          targetAudience: Array.isArray(product.targetAudience) 
            ? product.targetAudience.join(',') 
            : product.targetAudience,
          category: product.category,
          provider,
          voiceoverLang,
          scriptData: script ? {
            angle: script.angle || 'feature_demo',
            energy: 'natural',
            durationSec: script.style?.length || 15,
            lines: {
              open: script.structure?.hook || '',
              main: script.structure?.solution || script.content || '',
              close: script.structure?.callToAction || '',
            },
            shots: [],
            technical: {
              orientation: 'vertical',
              filmingMethod: 'handheld',
              dominantHand: 'right',
              location: 'indoor',
              audioEnv: 'quiet'
            }
          } : undefined,
        })
      })

      if (!response.ok) {
        throw new Error('Prompt生成失败')
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Prompt生成失败')
      }
      
      // 设置生成的prompt
      setVideoPrompt(data.soraPrompt || data.prompt)
      setPromptGenerated(true)

      // 保存历史记录ID
      if (data.historyId) {
        setCurrentHistoryId(data.historyId)
        // 重新加载历史记录列表
        loadHistory()
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Prompt生成失败')
    } finally {
      setIsRecommending(false)
    }
  }

  // 查看历史详情
  const handleViewHistory = async (historyId: string) => {
    try {
      const response = await fetch(`/api/video/prompt-history/${historyId}`)
      const data = await response.json()
      
      if (data.success && data.data) {
        setSelectedHistory(data.data)
        setIsDetailModalOpen(true)
      }
    } catch (err) {
      console.error('查看历史详情失败:', err)
      setError('加载历史详情失败')
    }
  }

  // 使用历史记录
  const handleUseHistory = (history: PromptHistory) => {
    setVideoPrompt(history.generatedPrompt)
    setPromptGenerated(true)
    if (history.modelUsed) {
      setRecommendedModel(history.modelUsed)
    }
    if (history.promptTemplate) {
      setRecommendedPromptTemplate(history.promptTemplate)
    }
    setCurrentHistoryId(history.id)
  }

  // 生成视频
  const handleGenerateVideo = async () => {
    if (!promptGenerated || !videoPrompt) {
      setError('请先生成Prompt')
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      const job = await createVideoJob(product, script, {
        duration: 30,
        resolution: '1080p',
        style: 'modern',
        voice: 'natural',
        backgroundMusic: true,
        subtitles: false,
      })
      
      setVideoJob(job)
      onVideoJobCreated(job.id)
      
      // 轮询任务状态
      const finalJob = await pollVideoJobStatus(job, (updatedJob) => {
        setVideoJob(updatedJob)
      })
      
      setVideoJob(finalJob)
    } catch (err) {
      setError(err instanceof Error ? err.message : '视频生成失败')
    } finally {
      setLoading(false)
    }
  }

  // 复制视频Prompt
  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(videoPrompt)
      // 可以添加一个成功提示
    } catch (err) {
      console.error('复制失败:', err)
    }
  }

  // 下载视频
  const handleDownloadVideo = () => {
    if (videoJob?.result?.url) {
      window.open(videoJob.result.url, '_blank')
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 步骤1: AI推荐配置 */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-600" />
              <CardTitle className="text-base text-yellow-800">AI推荐配置</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsRecommendationExpanded(!isRecommendationExpanded)}
              className="h-6 px-2 text-yellow-700 hover:text-yellow-800 hover:bg-yellow-100"
            >
              {isRecommendationExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
          </div>
          <CardDescription className="text-yellow-700">
            {recommendedModel && recommendedPromptTemplate
              ? '✓ 推荐配置完成，已生成Prompt' 
              : '自动推荐最佳模型和Prompt模板'}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="space-y-3">
            {/* 模型与语言快速选择（MVP） */}
            <div className="grid grid-cols-2 gap-2 p-3 bg-white rounded-lg border">
              <div className="space-y-1">
                <label className="text-xs text-gray-600 font-medium">视频模型</label>
                <div className="flex gap-2">
                  <Button variant={provider==='sora'?'default':'outline'} size="sm" onClick={()=>setProvider('sora')}>Sora</Button>
                  <Button variant={provider==='doubao'?'default':'outline'} size="sm" onClick={()=>setProvider('doubao')}>豆包</Button>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-600 font-medium">口播/字幕语言</label>
                <select
                  className="w-full border rounded px-2 py-1 text-sm bg-white"
                  value={voiceoverLang}
                  onChange={(e)=>setVoiceoverLang(e.target.value)}
                >
                  <option value="en-US">English (US)</option>
                  <option value="zh-CN">中文（简体）</option>
                  <option value="ja-JP">日本語</option>
                  <option value="id-ID">Bahasa Indonesia</option>
                  <option value="th-TH">ไทย</option>
                </select>
                <p className="text-[10px] text-gray-500">默认随国家（MY→en-US），可覆盖</p>
              </div>
            </div>
            {/* 推荐结果展示（始终显示） */}
            {recommendedModel && recommendedPromptTemplate && (
              <div className="space-y-2 p-3 bg-white rounded-lg border">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="font-medium">推荐模型：</span>
                  <Badge variant="outline">{recommendedModel.title}</Badge>
                  <span className="text-gray-500">({recommendedModel.provider})</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="font-medium">Prompt模板：</span>
                  <Badge variant="outline">{recommendedPromptTemplate.title}</Badge>
                </div>
              </div>
            )}

            {/* 推荐按钮 */}
            {!recommendedModel && !recommendedPromptTemplate && (
              <Button
                onClick={handleAutoRecommend}
                disabled={disabled || isRecommending}
                className="w-full"
                size="sm"
              >
                {isRecommending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    推荐中...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    自动推荐并生成Prompt
                  </>
                )}
              </Button>
            )}

            {/* 展开后的自定义配置区域 - 使用推荐引擎 */}
            {isRecommendationExpanded && (
              <div className="mt-3 p-3 bg-white rounded-lg border space-y-4">
                <div className="text-sm font-medium text-gray-700">自定义配置</div>
                
                {/* 模型选择 - 使用推荐引擎 */}
                <div className="space-y-2">
                  <label className="text-xs text-gray-600 font-medium">选择模型</label>
                  <RecommendationSelector
                    scenario="task->model"
                    task={{
                      taskType: 'video-generation',
                      contentType: 'video',
                      jsonRequirement: false,
                      language: 'zh',
                      category: product.category,
                    }}
                    context={{
                      region: product.targetCountries?.[0] || 'CN',
                      audience: Array.isArray(product.targetAudience) 
                        ? product.targetAudience.join(',') 
                        : '',
                    }}
                    onSelect={(selectedId, decisionId, isUserOverride) => {
                      console.log('模型选择:', { selectedId, decisionId, isUserOverride })
                      // 从selectedId提取模型信息
                      setRecommendedModel({
                        id: selectedId,
                        title: selectedId,
                        provider: 'gemini'
                      })
                    }}
                    defaultLabel="请选择模型"
                    className="w-full"
                  />
                </div>

                {/* Prompt模板选择 - 使用推荐引擎 */}
                <div className="space-y-2">
                  <label className="text-xs text-gray-600 font-medium">选择Prompt模板</label>
                  <RecommendationSelector
                    scenario="task->prompt"
                    task={{
                      taskType: 'video-generation',
                      contentType: 'video',
                      jsonRequirement: false,
                      language: 'zh',
                    }}
                    context={{
                      region: product.targetCountries?.[0] || 'CN',
                      businessModule: 'video-prompt',
                      category: product.category,
                      audience: Array.isArray(product.targetAudience) 
                        ? product.targetAudience.join(',') 
                        : '',
                    }}
                    onSelect={(selectedId, decisionId, isUserOverride) => {
                      console.log('Prompt模板选择:', { selectedId, decisionId, isUserOverride })
                      setRecommendedPromptTemplate({
                        id: selectedId,
                        title: selectedId
                      })
                    }}
                    defaultLabel="请选择Prompt模板"
                    className="w-full"
                  />
                </div>

                {/* 生成Prompt按钮 */}
                <Button
                  onClick={handleAutoRecommend}
                  disabled={disabled || isRecommending || !recommendedModel || !recommendedPromptTemplate}
                  className="w-full"
                  size="sm"
                  variant="outline"
                >
                  {isRecommending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      生成中...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4 mr-2" />
                      使用自定义配置生成Prompt
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 生成Prompt */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-blue-600" />
            <CardTitle className="text-base text-blue-800">生成Prompt</CardTitle>
          </div>
          <CardDescription className="text-blue-700">
            {promptGenerated 
              ? '✓ Prompt已生成，可以复制或编辑' 
              : '基于推荐配置生成视频Prompt'}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="space-y-3">
            {/* 生成按钮 */}
            {!promptGenerated && (
              <Button
                onClick={handleGeneratePrompt}
                disabled={disabled || isRecommending || !recommendedModel || !recommendedPromptTemplate}
                className="w-full"
                size="sm"
              >
                {isRecommending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 mr-2" />
                    生成Prompt
                  </>
                )}
              </Button>
            )}

            {/* Prompt输入框 - 始终显示 */}
            <div className="space-y-2">
              <Textarea
                placeholder={promptGenerated ? "视频生成Prompt..." : "请先完成AI推荐配置并生成Prompt"}
                value={videoPrompt}
                onChange={(e) => setVideoPrompt(e.target.value)}
                disabled={!promptGenerated || disabled}
                className={`min-h-[150px] text-sm font-mono ${
                  promptGenerated ? 'bg-white' : 'bg-gray-100 cursor-not-allowed'
                }`}
              />
              
              {/* 提示信息或复制按钮 */}
              {promptGenerated ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyPrompt}
                  className="w-full"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  复制Prompt
                </Button>
              ) : (
                <p className="text-xs text-blue-700 text-center py-2">
                  💡 请先在上方【AI推荐配置】中选择模型和Prompt模板，然后点击生成按钮
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 生成视频 */}
      <Card className={`border-green-200 ${promptGenerated ? 'bg-green-50' : 'bg-gray-50'}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Video className="w-5 h-5 text-green-600" />
            <CardTitle className="text-base text-green-800">生成视频</CardTitle>
            <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-300">
              开发中
            </Badge>
          </div>
          <CardDescription className={promptGenerated ? "text-green-700" : "text-gray-500"}>
            {promptGenerated 
              ? '使用生成的Prompt创建视频（功能开发中）'
              : '生成Prompt后可创建视频'}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="space-y-3">
            <Button
              onClick={handleGenerateVideo}
              disabled={!promptGenerated || true}
              className="w-full opacity-60 cursor-not-allowed"
              size="sm"
            >
              <Play className="w-4 h-4 mr-2" />
              开始生成视频（开发中）
            </Button>
            
            {!promptGenerated ? (
              <p className="text-xs text-gray-500 text-center">
                💡 请先完成Prompt生成
              </p>
            ) : (
              <p className="text-xs text-gray-600 text-center">
                视频生成功能正在开发中，敬请期待
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 错误提示 */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* 视频任务状态 */}
      {videoJob && (
        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Video className="w-5 h-5 text-purple-600" />
              <h3 className="font-medium text-purple-800">视频生成任务</h3>
              <Badge 
                variant="outline" 
                className={`text-xs ${
                  videoJob.status === 'completed' ? 'bg-green-100 text-green-700' :
                  videoJob.status === 'failed' ? 'bg-red-100 text-red-700' :
                  videoJob.status === 'processing' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-700'
                }`}
              >
                {videoJob.status === 'completed' ? '已完成' :
                 videoJob.status === 'failed' ? '失败' :
                 videoJob.status === 'processing' ? '处理中' : '等待中'}
              </Badge>
            </div>
            
            <div className="space-y-3">
              {/* 进度条 */}
              <div>
                <div className="flex justify-between text-xs text-purple-700 mb-1">
                  <span>进度</span>
                  <span>{videoJob.progress}%</span>
                </div>
                <div className="w-full bg-purple-200 rounded-full h-2">
                  <div 
                    className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${videoJob.progress}%` }}
                  />
                </div>
              </div>
              
              {/* 任务参数 */}
              <div className="grid grid-cols-2 gap-2 text-xs text-purple-700">
                <div>时长: {videoJob.parameters.duration}秒</div>
                <div>分辨率: {videoJob.parameters.resolution}</div>
                <div>风格: {videoJob.parameters.style}</div>
                <div>配音: {videoJob.parameters.voice}</div>
              </div>
              
              {/* 错误信息 */}
              {videoJob.error && (
                <div className="p-2 bg-red-100 border border-red-200 rounded text-xs text-red-700">
                  {videoJob.error}
                </div>
              )}
              
              {/* 完成后的操作 */}
              {videoJob.status === 'completed' && videoJob.result && (
                <div className="flex gap-2">
                  <Button
                    onClick={handleDownloadVideo}
                    size="sm"
                    className="text-xs"
                  >
                    <Download className="w-3 h-3 mr-1" />
                    下载视频
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(videoJob.result?.url, '_blank')}
                    className="text-xs"
                  >
                    <Video className="w-3 h-3 mr-1" />
                    预览视频
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 历史记录 */}
      {historyList.length > 0 && (
        <Card className="border-purple-200 bg-purple-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-purple-600" />
                <CardTitle className="text-base text-purple-800">历史记录</CardTitle>
                <Badge variant="outline" className="text-xs">{historyList.length}</Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
                className="h-6 px-2 text-purple-700 hover:text-purple-800 hover:bg-purple-100"
              >
                {isHistoryExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>
            </div>
            <CardDescription className="text-purple-700">
              查看之前生成的Prompt记录
            </CardDescription>
          </CardHeader>

          {isHistoryExpanded && (
            <CardContent className="pt-0">
              <div className="space-y-2">
                {historyList.map((history) => (
                  <div
                    key={history.id}
                    className={`p-3 bg-white rounded-lg border ${
                      currentHistoryId === history.id ? 'border-purple-400 bg-purple-50' : ''
                    } hover:border-purple-300 transition-colors`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-900 truncate">
                            {history.productName}
                          </span>
                          {history.productCategory && (
                            <Badge variant="outline" className="text-xs">
                              {history.productCategory}
                            </Badge>
                          )}
                          {currentHistoryId === history.id && (
                            <Badge className="text-xs bg-purple-600">当前</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(history.createdAt).toLocaleString('zh-CN')}</span>
                          {history.metadata?.latencyMs && (
                            <span>• 耗时 {history.metadata.latencyMs}ms</span>
                          )}
                        </div>
                        {history.modelUsed && (
                          <div className="mt-1 text-xs text-gray-600">
                            模型: {history.modelUsed.title}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewHistory(history.id)}
                          className="h-8 px-2"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUseHistory(history)}
                          className="h-8 px-3 text-xs"
                        >
                          使用
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* 空状态 */}
      {!videoJob && !loading && (
        <div className="text-center py-8 text-gray-500">
          <Video className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p>暂无视频任务</p>
          <p className="text-xs">点击开始生成视频</p>
        </div>
      )}

      {/* 历史详情弹窗 */}
      {isDetailModalOpen && selectedHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
            {/* 标题栏 */}
            <div className="px-6 py-4 border-b bg-purple-50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Prompt详情</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedHistory.productName} • {new Date(selectedHistory.createdAt).toLocaleString('zh-CN')}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsDetailModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </Button>
              </div>
            </div>

            {/* 内容区 */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* 基本信息 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-600">产品类别</label>
                  <p className="mt-1 text-sm">{selectedHistory.productCategory || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">状态</label>
                  <p className="mt-1">
                    <Badge className={selectedHistory.status === 'success' ? 'bg-green-600' : 'bg-red-600'}>
                      {selectedHistory.status}
                    </Badge>
                  </p>
                </div>
              </div>

              {/* 模型和模板信息 */}
              <div className="grid grid-cols-2 gap-4">
                {selectedHistory.modelUsed && (
                  <div>
                    <label className="text-xs font-medium text-gray-600">使用模型</label>
                    <p className="mt-1 text-sm">
                      {selectedHistory.modelUsed.title}
                      <span className="text-gray-500 ml-1">({selectedHistory.modelUsed.provider})</span>
                    </p>
                  </div>
                )}
                {selectedHistory.promptTemplate && (
                  <div>
                    <label className="text-xs font-medium text-gray-600">Prompt模板</label>
                    <p className="mt-1 text-sm">{selectedHistory.promptTemplate.title}</p>
                  </div>
                )}
              </div>

              {/* 元数据 */}
              {selectedHistory.metadata && (
                <div className="grid grid-cols-3 gap-4">
                  {selectedHistory.metadata.latencyMs && (
                    <div>
                      <label className="text-xs font-medium text-gray-600">生成耗时</label>
                      <p className="mt-1 text-sm">{selectedHistory.metadata.latencyMs}ms</p>
                    </div>
                  )}
                  <div>
                    <label className="text-xs font-medium text-gray-600">使用模板</label>
                    <p className="mt-1 text-sm">
                      {selectedHistory.metadata.promptTemplateUsed ? '是' : '否'}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600">使用推荐</label>
                    <p className="mt-1 text-sm">
                      {selectedHistory.metadata.recommendationUsed ? '是' : '否'}
                    </p>
                  </div>
                </div>
              )}

              {/* 生成的Prompt */}
              <div>
                <label className="text-xs font-medium text-gray-600">生成的Prompt内容</label>
                <div className="mt-2 p-4 bg-gray-50 rounded-lg border">
                  <pre className="text-sm whitespace-pre-wrap font-mono text-gray-800">
                    {selectedHistory.generatedPrompt}
                  </pre>
                </div>
              </div>
            </div>

            {/* 底部操作栏 */}
            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsDetailModalOpen(false)}
              >
                关闭
              </Button>
              <Button
                onClick={() => {
                  handleUseHistory(selectedHistory)
                  setIsDetailModalOpen(false)
                }}
              >
                使用此Prompt
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}