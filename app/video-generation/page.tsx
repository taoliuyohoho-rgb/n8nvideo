/**
 * 视频生成主流程页面（瀑布流版本）
 * 
 * 单页瀑布流体验：
 * - 所有步骤在一个页面垂直排列
 * - 完成一步后自动展开下一步
 * - 自动滚动到激活的卡片
 * - 用户可以随时查看整个流程
 */

'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Loader2, ChevronDown, ChevronRight, CheckCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

// Hooks
import { useProductFlow } from './hooks/useProductFlow'
import { usePersonaFlow } from './hooks/usePersonaFlow'
import { useScriptFlow } from './hooks/useScriptFlow'
import { useVideoGeneration } from './hooks/useVideoGeneration'

// Components
import { ProductSteps } from './components/ProductSteps'
import { PersonaSteps } from './components/PersonaSteps'
import { ScriptSteps } from './components/ScriptSteps'
import { VideoGenSteps } from './components/VideoGenSteps'

export default function VideoGenerationPage() {
  const [globalLoading, setGlobalLoading] = useState(false)
  
  // 卡片展开状态
  const [expandedSections, setExpandedSections] = useState({
    product: true,    // 商品搜索默认展开
    persona: false,   // 人设选择默认折叠
    script: false,    // 脚本生成默认折叠
    video: false,     // 视频生成默认折叠
  })

  // 引用各个卡片，用于自动滚动
  const productRef = useRef<HTMLDivElement>(null)
  const personaRef = useRef<HTMLDivElement>(null)
  const scriptRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLDivElement>(null)

  // Hook组装
  const productFlow = useProductFlow({
    onStepComplete: (step) => {
      // 商品选择完成后，自动展开人设模块
      if (step === 2) {
        setExpandedSections(prev => ({ ...prev, persona: true }))
        setTimeout(() => {
          personaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 100)
      }
    },
  })

  const personaFlow = usePersonaFlow({
    productId: productFlow.selectedProduct?.id || null,
    onStepComplete: (step) => {
      // 人设确认完成后，自动展开脚本模块
      if (step === 6) {
        setExpandedSections(prev => ({ ...prev, script: true }))
        setTimeout(() => {
          scriptRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 100)
      }
    },
  })

  const scriptFlow = useScriptFlow({
    productId: productFlow.selectedProduct?.id || null,
    personaId: personaFlow.personaId,
    onStepComplete: (step) => {
      // 脚本确认完成后，自动展开视频模块
      if (step === 8) {
        setExpandedSections(prev => ({ ...prev, video: true }))
        setTimeout(() => {
          videoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 100)
      }
    },
  })

  const videoFlow = useVideoGeneration({
    scriptId: scriptFlow.scriptId,
    onStepComplete: (step) => {
      // 视频生成开始，滚动到视频模块
      setTimeout(() => {
        videoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    },
  })

  // 全局Loading
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

  // 切换卡片展开/折叠
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  // 判断各模块是否可用
  const isPersonaEnabled = !!productFlow.selectedProduct
  const isScriptEnabled = !!personaFlow.personaId
  const isVideoEnabled = !!scriptFlow.scriptId

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
      <div className="border-b bg-white shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                UGC 视频生成
              </h1>
              <p className="text-sm text-gray-500 mt-1">AI驱动的电商短视频制作流程</p>
            </div>
            <div className="flex gap-2">
              {productFlow.selectedProduct && <Badge variant="outline">✓ 商品</Badge>}
              {personaFlow.personaId && <Badge variant="outline">✓ 人设</Badge>}
              {scriptFlow.scriptId && <Badge variant="outline">✓ 脚本</Badge>}
              {videoFlow.videoJob?.status === 'succeeded' && <Badge variant="outline">✓ 视频</Badge>}
            </div>
          </div>
        </div>
      </div>

      {/* 主要内容区 - 瀑布流布局 */}
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-5xl mx-auto space-y-6">
          
          {/* 1. 商品搜索与选择 */}
          <div ref={productRef}>
            <Card className={`shadow-lg transition-all ${expandedSections.product ? 'border-blue-300' : ''}`}>
              <CardHeader 
                className="cursor-pointer bg-gradient-to-r from-blue-50 to-purple-50"
                onClick={() => toggleSection('product')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {productFlow.selectedProduct && <CheckCircle className="w-5 h-5 text-green-500" />}
                    <div>
                      <CardTitle>1. 商品搜索</CardTitle>
                      <CardDescription>
                        {productFlow.selectedProduct 
                          ? `已选择: ${productFlow.selectedProduct.name}` 
                          : '搜索并选择要生成视频的商品'}
                      </CardDescription>
                    </div>
                  </div>
                  {expandedSections.product ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                </div>
              </CardHeader>
              
              {expandedSections.product && (
                <CardContent className="p-6">
                  <ProductSteps
                    currentStep={productFlow.selectedProduct ? 2 : 1}
                    {...productFlow}
                    onNext={() => {}}
                    onPrev={() => {}}
                  />
                </CardContent>
              )}
            </Card>
          </div>

          {/* 2. 人设选择 */}
          <div ref={personaRef}>
            <Card className={`shadow-lg transition-all ${
              !isPersonaEnabled ? 'opacity-50' : expandedSections.persona ? 'border-indigo-300' : ''
            }`}>
              <CardHeader 
                className={`cursor-pointer bg-gradient-to-r from-indigo-50 to-blue-50 ${!isPersonaEnabled ? 'cursor-not-allowed' : ''}`}
                onClick={() => isPersonaEnabled && toggleSection('persona')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {personaFlow.personaId && <CheckCircle className="w-5 h-5 text-green-500" />}
                    <div>
                      <CardTitle>2. 人设选择</CardTitle>
                      <CardDescription>
                        {!isPersonaEnabled 
                          ? '请先选择商品' 
                          : personaFlow.selectedPersona 
                          ? `已选择: ${personaFlow.selectedPersona.coreIdentity.name}` 
                          : 'AI自动推荐人设或生成新人设'}
                      </CardDescription>
                    </div>
                  </div>
                  {isPersonaEnabled && (
                    expandedSections.persona ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />
                  )}
                </div>
              </CardHeader>
              
              {expandedSections.persona && isPersonaEnabled && (
                <CardContent className="p-6">
                  <PersonaSteps
                    currentStep={personaFlow.selectedPersona ? 5 : 4}
                    {...personaFlow}
                    onPrev={() => {}}
                  />
                </CardContent>
              )}
            </Card>
          </div>

          {/* 3. 脚本生成 */}
          <div ref={scriptRef}>
            <Card className={`shadow-lg transition-all ${
              !isScriptEnabled ? 'opacity-50' : expandedSections.script ? 'border-purple-300' : ''
            }`}>
              <CardHeader 
                className={`cursor-pointer bg-gradient-to-r from-purple-50 to-pink-50 ${!isScriptEnabled ? 'cursor-not-allowed' : ''}`}
                onClick={() => isScriptEnabled && toggleSection('script')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {scriptFlow.scriptId && <CheckCircle className="w-5 h-5 text-green-500" />}
                    <div>
                      <CardTitle>3. 脚本生成</CardTitle>
                      <CardDescription>
                        {!isScriptEnabled 
                          ? '请先确认人设' 
                          : scriptFlow.script 
                          ? `已生成: ${scriptFlow.script.angle} (${scriptFlow.script.durationSec}秒)` 
                          : '使用推荐引擎生成专业短视频脚本'}
                      </CardDescription>
                    </div>
                  </div>
                  {isScriptEnabled && (
                    expandedSections.script ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />
                  )}
                </div>
              </CardHeader>
              
              {expandedSections.script && isScriptEnabled && (
                <CardContent className="p-6">
                  <ScriptSteps
                    currentStep={scriptFlow.script ? 7 : 6}
                    {...scriptFlow}
                    productId={productFlow.selectedProduct?.id || null}
                    personaId={personaFlow.personaId}
                    onPrev={() => {}}
                  />
                </CardContent>
              )}
            </Card>
          </div>

          {/* 4. 视频生成 */}
          <div ref={videoRef}>
            <Card className={`shadow-lg transition-all ${
              !isVideoEnabled ? 'opacity-50' : expandedSections.video ? 'border-green-300' : ''
            }`}>
              <CardHeader 
                className={`cursor-pointer bg-gradient-to-r from-green-50 to-teal-50 ${!isVideoEnabled ? 'cursor-not-allowed' : ''}`}
                onClick={() => isVideoEnabled && toggleSection('video')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {videoFlow.videoJob?.status === 'succeeded' && <CheckCircle className="w-5 h-5 text-green-500" />}
                    <div>
                      <CardTitle>4. 视频生成</CardTitle>
                      <CardDescription>
                        {!isVideoEnabled 
                          ? '请先确认脚本' 
                          : videoFlow.videoJob?.status === 'succeeded' 
                          ? '视频已生成完成' 
                          : '复制脚本或AI自动生成视频'}
                      </CardDescription>
                    </div>
                  </div>
                  {isVideoEnabled && (
                    expandedSections.video ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />
                  )}
                </div>
              </CardHeader>
              
              {expandedSections.video && isVideoEnabled && (
                <CardContent className="p-6">
                  <VideoGenSteps
                    currentStep={videoFlow.videoJob ? 9 : 8}
                    {...videoFlow}
                    scriptId={scriptFlow.scriptId}
                    onCopyScript={scriptFlow.handleCopy}
                    onGenerateVideo={(modelId) => videoFlow.handleGenerate(modelId)}
                    onEnd={() => {}}
                  />
                </CardContent>
              )}
            </Card>
          </div>

        </div>
      </div>
    </div>
  )
}

