/**
 * 视频生成工作流主组件
 * 基于单文件示例重构，侧边栏+主内容区布局
 */

'use client'

import React, { createContext, useContext, useEffect, useRef, useReducer, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Loader2, Play, RotateCcw, ChevronRight, ChevronLeft, CheckCircle2, Copy, Settings, FileText, User, Video, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

// 导入组件
import { ProductSelector } from './ProductSelector'
import { ProductAnalysis as ProductAnalysisComponent } from './ProductAnalysis'
import { PersonaSelector } from './PersonaSelector'
import { ScriptGenerator } from './ScriptGenerator'
import { VideoGenerator } from './VideoGenerator'

// 导入Hooks
import { useVideoGenerationFlow } from './hooks/useVideoGenerationFlow'
import { useVideoGenerationApi } from './hooks/useVideoGenerationApi'

// 导入类型和常量
import type { 
  VideoGenerationWorkflowProps, 
  VideoGenerationContextType, 
  VideoGenerationState, 
  VideoGenerationAction,
  VideoGenerationStep,
  Product,
  ProductAnalysis,
  Persona,
  VideoScript,
  VideoJob
} from './types/video-generation'
import { VIDEO_GENERATION_STEPS, STEP_CONFIG } from './constants/video-generation'

// LocalStorage Key
const STORAGE_KEY = 'video-generation-state'

// 从 localStorage 加载状态
function loadStateFromStorage(): VideoGenerationState | null {
  if (typeof window === 'undefined') return null
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return null
    
    const parsed = JSON.parse(stored)
    // 验证数据结构有效性
    if (parsed && typeof parsed === 'object' && 'currentStep' in parsed) {
      console.log('📦 从本地恢复视频生成状态:', parsed.currentStep)
      return parsed
    }
  } catch (error) {
    console.warn('⚠️ 加载本地状态失败:', error)
  }
  
  return null
}

// 保存状态到 localStorage
function saveStateToStorage(state: VideoGenerationState) {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    console.log('💾 已保存视频生成状态:', state.currentStep)
  } catch (error) {
    console.warn('⚠️ 保存本地状态失败:', error)
  }
}

// 清除 localStorage
function clearStateFromStorage() {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.removeItem(STORAGE_KEY)
    console.log('🗑️ 已清除本地状态')
  } catch (error) {
    console.warn('⚠️ 清除本地状态失败:', error)
  }
}

// 初始状态（优先从本地恢复）
const getInitialState = (): VideoGenerationState => {
  const savedState = loadStateFromStorage()
  if (savedState) {
    return savedState
  }
  
  return {
    currentStep: 'product',
    loading: false,
  }
}

// Reducer函数
function reducer(state: VideoGenerationState, action: VideoGenerationAction): VideoGenerationState {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, currentStep: action.payload }
    
    case 'SET_PRODUCT':
      return { ...state, product: action.payload }
    
    case 'SET_ANALYSIS':
      return { ...state, analysis: action.payload }
    
    case 'SET_PERSONA':
      return { ...state, persona: action.payload }
    
    case 'SET_SCRIPT':
      return { ...state, script: action.payload }
    
    case 'SET_VIDEO_JOB':
      return { ...state, videoJob: action.payload }
    
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    
    case 'SET_ERROR':
      return { ...state, error: action.payload }
    
    case 'RESET':
      return {
        currentStep: 'product',
        loading: false,
      }
    
    default:
      return state
  }
}

// 创建Context
const VideoGenerationContext = createContext<VideoGenerationContextType | null>(null)

// Provider组件
function VideoGenerationProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, getInitialState)

  // 💾 自动保存状态到 localStorage
  useEffect(() => {
    saveStateToStorage(state)
  }, [state])

  const goToStep = useCallback((step: VideoGenerationStep) => {
    dispatch({ type: 'SET_STEP', payload: step })
  }, [dispatch])

  const canGoToStep = useCallback((step: VideoGenerationStep) => {
    // 允许用户随意切换到任何步骤
    return true
  }, [])

  const goToNextStep = useCallback(() => {
    const steps: VideoGenerationStep[] = ['product', 'analysis', 'persona', 'script', 'video']
    const currentIndex = steps.indexOf(state.currentStep)
    const nextStep = steps[currentIndex + 1]
    if (nextStep && canGoToStep(nextStep)) {
      dispatch({ type: 'SET_STEP', payload: nextStep })
    }
  }, [state.currentStep, canGoToStep, dispatch])

  const goToPreviousStep = useCallback(() => {
    const steps: VideoGenerationStep[] = ['product', 'analysis', 'persona', 'script', 'video']
    const currentIndex = steps.indexOf(state.currentStep)
    const prevStep = steps[currentIndex - 1]
    if (prevStep) {
      dispatch({ type: 'SET_STEP', payload: prevStep })
    }
  }, [state.currentStep, dispatch])

  const resetWorkflow = useCallback(() => {
    clearStateFromStorage() // 🗑️ 清除本地存储
    dispatch({ type: 'RESET' })
  }, [dispatch])

  const contextValue: VideoGenerationContextType = {
    state,
    dispatch,
    goToStep,
    canGoToStep,
    goToNextStep,
    goToPreviousStep,
    resetWorkflow,
  }

  return (
    <VideoGenerationContext.Provider value={contextValue}>
      {children}
    </VideoGenerationContext.Provider>
  )
}

// Context Hook
export function useVideoGenerationContext() {
  const context = useContext(VideoGenerationContext)
  if (!context) {
    throw new Error('useVideoGenerationContext must be used within VideoGenerationWorkflow')
  }
  return context
}

// 步骤侧边栏组件
function StepsSidebar() {
  const { state, goToStep, canGoToStep } = useVideoGenerationContext()
  const flow = useVideoGenerationFlow(state)

  return (
    <div className="p-4 border rounded-2xl space-y-3">
      <div className="text-sm text-gray-500">整体进度</div>
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-2 bg-gray-800" style={{ width: `${flow.overallProgress}%` }} />
      </div>
      <div className="space-y-2">
        {VIDEO_GENERATION_STEPS.map((step) => {
          const getStepIcon = (stepKey: VideoGenerationStep) => {
            switch (stepKey) {
              case 'product': return <FileText className="w-4 h-4" />
              case 'analysis': return <Settings className="w-4 h-4" />
              case 'persona': return <User className="w-4 h-4" />
              case 'script': return <FileText className="w-4 h-4" />
              case 'video': return <Video className="w-4 h-4" />
              default: return <FileText className="w-4 h-4" />
            }
          }
          
          const getStepTitle = (stepKey: VideoGenerationStep) => {
            switch (stepKey) {
              case 'product': return '1. 选择商品'
              case 'analysis': return '2. 商品信息'
              case 'persona': return '3. 人设画像'
              case 'script': return '4. 脚本生成'
              case 'video': return '5. 视频生成'
              default: return stepKey
            }
          }
          
          return (
            <button
              key={step}
              onClick={() => canGoToStep(step) && goToStep(step)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border transition-all ${
                state.currentStep === step ? 'bg-gray-50 border-blue-300' : ''
              } ${canGoToStep(step) ? 'hover:bg-gray-50' : 'opacity-50 cursor-not-allowed'}`}
            >
              <span className="flex items-center gap-2">
                {getStepIcon(step)}
                <span className="text-sm">{getStepTitle(step)}</span>
              </span>
              <span className="text-xs text-gray-500">
                {flow.getStepProgress(step)}%
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// 步骤内容区域组件
function StepContent() {
  const { state, dispatch } = useVideoGenerationContext()
  const flow = useVideoGenerationFlow(state)
  const api = useVideoGenerationApi()

  // 处理商品选择：不自动跳转步骤
  const handleProductSelected = (product: any) => {
    dispatch({ type: 'SET_PRODUCT', payload: product })
  }

  // 处理分析完成：不自动跳转步骤
  const handleAnalysisComplete = (analysis: any) => {
    dispatch({ type: 'SET_ANALYSIS', payload: analysis })
  }

  // 处理人设选择：不自动跳转步骤
  const handlePersonaSelected = (persona: any) => {
    dispatch({ type: 'SET_PERSONA', payload: persona })
  }

  // 处理脚本生成：不自动跳转步骤
  const handleScriptGenerated = (script: any) => {
    dispatch({ type: 'SET_SCRIPT', payload: script })
  }

  // 处理视频任务创建
  const handleVideoJobCreated = (jobId: string) => {
    dispatch({ 
      type: 'SET_VIDEO_JOB', 
      payload: { 
        id: jobId, 
        status: 'pending',
        progress: 0,
        productId: state.product?.id || '',
        scriptId: state.script?.id || '',
        parameters: {
          duration: 30,
          resolution: '1080p',
          style: 'modern',
          voice: 'natural',
          backgroundMusic: true,
          subtitles: false,
        }
      } as any 
    })
  }

  // 渲染步骤内容
  const renderStepContent = () => {
    switch (state.currentStep) {
      case 'product':
        return (
          <ProductSelector
            onProductSelected={handleProductSelected}
            disabled={state.loading}
          />
        )

      case 'analysis':
        if (!state.product) {
          return (
            <div className="text-center py-12 text-gray-500">
              <p className="mb-2">请先选择商品</p>
              <p className="text-sm">点击左侧"1. 选择商品"步骤</p>
            </div>
          )
        }
        return (
          <ProductAnalysisComponent
            product={state.product}
            onAnalysisComplete={handleAnalysisComplete}
            disabled={state.loading}
          />
        )

      case 'persona':
        if (!state.product) {
          return (
            <div className="text-center py-12 text-gray-500">
              <p className="mb-2">请先选择商品</p>
              <p className="text-sm">点击左侧"1. 选择商品"步骤</p>
            </div>
          )
        }
        return (
          <PersonaSelector
            product={state.product}
            analysis={state.analysis}
            onPersonaSelected={handlePersonaSelected}
            disabled={state.loading}
          />
        )

      case 'script':
        if (!state.product) {
          return (
            <div className="text-center py-12 text-gray-500">
              <p className="mb-2">请先选择商品</p>
              <p className="text-sm">点击左侧"1. 选择商品"步骤</p>
            </div>
          )
        }
        return (
          <ScriptGenerator
            product={state.product}
            analysis={state.analysis}
            persona={state.persona}
            onScriptGenerated={handleScriptGenerated}
            disabled={state.loading}
            initialScript={state.script}  // 🔄 传入已保存的脚本
          />
        )

      case 'video':
        if (!state.product) {
          return (
            <div className="text-center py-12 text-gray-500">
              <p className="mb-2">请先选择商品</p>
              <p className="text-sm">点击左侧"1. 选择商品"步骤</p>
            </div>
          )
        }
        if (!state.script) {
          return (
            <div className="text-center py-12 text-gray-500">
              <p className="mb-2">请先生成脚本</p>
              <p className="text-sm">点击左侧"4. 脚本生成"步骤</p>
            </div>
          )
        }
        return (
          <VideoGenerator
            product={state.product}
            script={state.script}
            persona={state.persona}
            onVideoJobCreated={handleVideoJobCreated}
            disabled={state.loading}
          />
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-4">
      {renderStepContent()}
    </div>
  )
}

// 主工作流组件
export function VideoGenerationWorkflow({
  initialProductId,
  onComplete,
  onError,
  className = '',
}: VideoGenerationWorkflowProps) {
  return (
    <VideoGenerationProvider>
      <VideoGenerationContent
        initialProductId={initialProductId}
        onComplete={onComplete}
        onError={onError}
        className={className}
      />
    </VideoGenerationProvider>
  )
}

function VideoGenerationContent({
  initialProductId,
  onComplete,
  onError,
  className = '',
}: VideoGenerationWorkflowProps) {
  const {
    state,
    dispatch,
    goToStep,
    canGoToStep,
    goToNextStep,
    goToPreviousStep,
    resetWorkflow,
  } = useVideoGenerationContext()

  const flow = useVideoGenerationFlow(state)
  const api = useVideoGenerationApi()

  // 初始化：如果提供了productId，自动加载
  useEffect(() => {
    if (initialProductId) {
      api.loadProduct(initialProductId)
        .then(product => {
          dispatch({ type: 'SET_PRODUCT', payload: product })
          dispatch({ type: 'SET_STEP', payload: 'analysis' })
        })
        .catch(error => {
          onError?.(error.message || '商品加载失败')
        })
    }
  }, [initialProductId, api, dispatch, onError])

  // 处理流程完成
  useEffect(() => {
    if (state.videoJob?.status === 'completed') {
      onComplete?.({ job: state.videoJob })
    }
  }, [state.videoJob, onComplete])

  // Context值
  const contextValue: VideoGenerationContextType = {
    state,
    dispatch,
    goToStep,
    canGoToStep,
    goToNextStep,
    goToPreviousStep,
    resetWorkflow,
  }

  return (
    <VideoGenerationContext.Provider value={contextValue}>
      <div className={`max-w-6xl mx-auto space-y-4 ${className}`}>
        {/* 页面标题 */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AI 视频生成工作流</h1>
          <p className="text-gray-600">模块化 · 类型安全 · 可维护</p>
        </div>

        {/* 主要内容区 - 侧边栏+主内容区布局 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* 侧边栏 */}
          <div className="md:col-span-1">
            <StepsSidebar />
          </div>

          {/* 主内容区 */}
          <div className="md:col-span-3">
            <motion.div
              key={state.currentStep}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="p-6 border rounded-2xl bg-white shadow-sm"
            >
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {state.currentStep === 'product' && '1. 选择商品'}
                  {state.currentStep === 'analysis' && '2. 商品信息'}
                  {state.currentStep === 'persona' && '3. 人设画像'}
                  {state.currentStep === 'script' && '4. 脚本生成'}
                  {state.currentStep === 'video' && '5. 视频生成'}
                </h2>
                <p className="text-sm text-gray-600">
                  {state.currentStep === 'product' && '输入商品名称自动搜索匹配'}
                  {state.currentStep === 'analysis' && '展示商品基本信息和AI分析结果'}
                  {state.currentStep === 'persona' && '推荐或生成匹配的人设画像'}
                  {state.currentStep === 'script' && '基于商品和人设生成视频脚本'}
                  {state.currentStep === 'video' && '生成最终视频或获取生成参数'}
                </p>
              </div>

              <StepContent />
            </motion.div>
          </div>
        </div>

        {/* 底部状态栏（移除导航按钮，用户通过侧边栏自由切换步骤）*/}
        <div className="flex items-center justify-between pt-4 px-4 border-t">
          <div className="text-sm text-gray-500">
            <span className="font-medium">当前:</span> {
              state.currentStep === 'product' ? '选择商品' :
              state.currentStep === 'analysis' ? '商品信息' :
              state.currentStep === 'persona' ? '人设画像' :
              state.currentStep === 'script' ? '脚本生成' : '视频生成'
            }
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              进度: {flow.overallProgress}%
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={resetWorkflow}
              disabled={state.loading}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              重置
            </Button>
          </div>
        </div>
      </div>
    </VideoGenerationContext.Provider>
  )
}