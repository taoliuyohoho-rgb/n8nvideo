/**
 * 视频生成流程控制Hook
 * 基于单文件示例重构，提供流程控制逻辑
 */

import { useCallback, useMemo } from 'react'
import type { VideoGenerationState, VideoGenerationStep } from '../types/video-generation'
import { VIDEO_GENERATION_STEPS } from '../constants/video-generation'

export function useVideoGenerationFlow(state: VideoGenerationState) {
  const stepIndex = useMemo(() => 
    VIDEO_GENERATION_STEPS.findIndex(s => s === state.currentStep), 
    [state.currentStep]
  )

  // 检查步骤是否完成
  const isStepCompleted = useCallback((step: VideoGenerationStep) => {
    switch (step) {
      case 'product':
        return !!state.product
      case 'analysis':
        // 商品信息步骤：选择商品后数据自动填充，立即标记为完成
        return !!state.product
      case 'persona':
        return !!state.persona // 人设选择后才算完成
      case 'script':
        return !!state.script
      case 'video':
        return state.videoJob?.status === 'completed'
      default:
        return false
    }
  }, [state])

  // 检查是否可以进入指定步骤
  const canProceedToStep = useCallback((step: VideoGenerationStep) => {
    switch (step) {
      case 'product':
        return true
      case 'analysis':
        return !!state.product
      case 'persona':
        return !!state.product // 有商品就可以推荐人设
      case 'script':
        return !!state.product // 有商品就可以生成脚本
      case 'video':
        return !!state.script
      default:
        return false
    }
  }, [state])

  // 获取已完成的步骤
  const getCompletedSteps = useCallback(() => 
    VIDEO_GENERATION_STEPS.filter(s => isStepCompleted(s)), 
    [isStepCompleted]
  )

  // 获取剩余步骤
  const getRemainingSteps = useCallback(() => 
    VIDEO_GENERATION_STEPS.filter(s => !isStepCompleted(s)), 
    [isStepCompleted]
  )

  // 获取步骤进度
  const getStepProgress = useCallback((step: VideoGenerationStep) => {
    if (isStepCompleted(step)) return 100
    if (step === state.currentStep) return 50
    return 0
  }, [isStepCompleted, state.currentStep])

  // 整体进度
  const overallProgress = useMemo(() => 
    Math.round((getCompletedSteps().length / VIDEO_GENERATION_STEPS.length) * 100), 
    [getCompletedSteps]
  )

  // 当前步骤
  const currentStepInfo = useMemo(() => 
    VIDEO_GENERATION_STEPS[stepIndex] || 'product', 
    [stepIndex]
  )

  // 检查是否为第一步
  const isFirst = useMemo(() => stepIndex === 0, [stepIndex])

  // 检查是否为最后一步
  const isLast = useMemo(() => stepIndex === VIDEO_GENERATION_STEPS.length - 1, [stepIndex])

  // 检查是否可以前进
  const canGoForward = useMemo(() => {
    const nextStep = VIDEO_GENERATION_STEPS[stepIndex + 1]
    return nextStep ? canProceedToStep(nextStep) : false
  }, [stepIndex, canProceedToStep])

  // 检查是否可以后退
  const canGoBackward = useMemo(() => stepIndex > 0, [stepIndex])

  return {
    currentStep: state.currentStep,
    isStepCompleted,
    canProceedToStep,
    getStepProgress,
    getCompletedSteps,
    getRemainingSteps,
    overallProgress,
    currentStepInfo,
    isFirst,
    isLast,
    canGoForward,
    canGoBackward,
  }
}