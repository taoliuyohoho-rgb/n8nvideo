/**
 * 视频生成主流程页面
 * 
 * 9步向导流程：
 * 1. 输入商品名（搜索+选择）
 * 2. 确认商品信息 + Top5
 * 3. 商品分析（可选）
 * 4. 生成/选择人设（推荐引擎）
 * 5. 确认人设
 * 6. 生成脚本（推荐引擎：模型+Prompt）
 * 7. 确认脚本
 * 8. 选择生成方式（复制 OR AI生成）
 * 9. 视频生成进度
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Loader2 } from 'lucide-react'

// Hooks
import { useProductFlow } from './hooks/useProductFlow'
import { usePersonaFlow } from './hooks/usePersonaFlow'
import { useScriptFlow } from './hooks/useScriptFlow'
import { useVideoGeneration } from './hooks/useVideoGeneration'

// Components
import { ProgressBar } from './components/ProgressBar'
import { ProductSteps } from './components/ProductSteps'
import { PersonaSteps } from './components/PersonaSteps'
import { ScriptSteps } from './components/ScriptSteps'
import { VideoGenSteps } from './components/VideoGenSteps'

export default function VideoGenerationPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [globalLoading, setGlobalLoading] = useState(false)

  // Hook组装：4个流程Hook
  const productFlow = useProductFlow({
    onStepComplete: (step) => setCurrentStep(step),
  })

  const personaFlow = usePersonaFlow({
    productId: productFlow.selectedProduct?.id || null,
    onStepComplete: (step) => setCurrentStep(step),
  })

  const scriptFlow = useScriptFlow({
    productId: productFlow.selectedProduct?.id || null,
    personaId: personaFlow.personaId,
    onStepComplete: (step) => setCurrentStep(step),
  })

  const videoFlow = useVideoGeneration({
    scriptId: scriptFlow.scriptId,
    onStepComplete: (step) => setCurrentStep(step),
  })

  // 全局Loading状态（任意Hook loading时显示覆盖层）
  useEffect(() => {
    const anyLoading =
      productFlow.loading ||
      personaFlow.loading ||
      scriptFlow.loading ||
      videoFlow.loading
    setGlobalLoading(anyLoading)
  }, [
    productFlow.loading,
    personaFlow.loading,
    scriptFlow.loading,
    videoFlow.loading,
  ])

  // 步骤控制函数
  const handleNextStep = () => setCurrentStep((prev) => prev + 1)
  const handlePrevStep = () => setCurrentStep((prev) => prev - 1)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* 全局Loading覆盖层 */}
      {globalLoading && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 shadow-2xl flex flex-col items-center">
            <Loader2 className="w-12 h-12 animate-spin text-blue-500 mb-4" />
            <p className="text-gray-700 font-medium">处理中...</p>
          </div>
        </div>
      )}

      {/* 顶部导航 */}
      <div className="border-b bg-white shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                UGC 视频生成
              </h1>
              <p className="text-sm text-gray-500 mt-1">AI驱动的电商短视频制作流程</p>
            </div>
            <Badge variant="outline" className="text-sm px-3 py-1">
              步骤 {currentStep} / 9
            </Badge>
          </div>
        </div>
      </div>

      {/* 进度条 */}
      <ProgressBar currentStep={currentStep} />

      {/* 主要内容区 */}
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-5xl mx-auto">
          {/* 步骤1-3: 商品流程 */}
          {currentStep >= 1 && currentStep <= 3 && (
            <ProductSteps
              currentStep={currentStep}
              {...productFlow}
              onNext={handleNextStep}
              onPrev={handlePrevStep}
            />
          )}

          {/* 步骤4-5: 人设流程 */}
          {currentStep >= 4 && currentStep <= 5 && (
            <PersonaSteps
              currentStep={currentStep}
              {...personaFlow}
              onPrev={handlePrevStep}
            />
          )}

          {/* 步骤6-7: 脚本流程 */}
          {currentStep >= 6 && currentStep <= 7 && (
            <ScriptSteps
              currentStep={currentStep}
              {...scriptFlow}
              productId={productFlow.selectedProduct?.id || null}
              personaId={personaFlow.personaId}
              onPrev={handlePrevStep}
            />
          )}

          {/* 步骤8-9: 视频生成 */}
          {currentStep >= 8 && (
            <VideoGenSteps
              currentStep={currentStep}
              {...videoFlow}
              scriptId={scriptFlow.scriptId}
              onCopyScript={scriptFlow.handleCopy}
              onGenerateVideo={(modelId) => videoFlow.handleGenerate(modelId)}
              onEnd={() => setCurrentStep(8)} // 结束后回到步骤8
            />
          )}
        </div>
      </div>
    </div>
  )
}
