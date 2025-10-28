/**
 * 视频生成步骤组件（步骤8-9）
 * 
 * 步骤8: 选择生成方式（复制脚本 OR AI生成视频）
 * 步骤9: 视频生成进度（轮询状态）
 */

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Copy, Play, CheckCircle, XCircle, Clock, Download } from 'lucide-react'
import { RecommendationSelector } from '@/components/RecommendationSelector'
import type { VideoJob } from '../types'

interface VideoGenStepsProps {
  currentStep: number
  videoJob: VideoJob | null
  loading: boolean
  error: string | null
  scriptId: string | null
  onCopyScript: () => void
  onGenerateVideo: (modelId: string) => void
  onEnd: () => void
}

export function VideoGenSteps({
  currentStep,
  videoJob,
  loading,
  error,
  scriptId,
  onCopyScript,
  onGenerateVideo,
  onEnd,
}: VideoGenStepsProps) {
  const [selectedModelId, setSelectedModelId] = useState<string>('')
  const [modelDecisionId, setModelDecisionId] = useState<string>('')
  const [showVideoSelector, setShowVideoSelector] = useState(false)

  // 步骤8: 选择生成方式
  if (currentStep === 8) {
    return (
      <div className="space-y-6">
        {!showVideoSelector ? (
          // 显示两个选项卡片
          <div className="grid grid-cols-2 gap-6">
            <Card className="shadow-lg border-2 border-transparent hover:border-blue-300 transition-all cursor-pointer">
              <CardHeader className="bg-gradient-to-br from-blue-50 to-cyan-50">
                <CardTitle className="text-lg">📋 复制脚本</CardTitle>
                <CardDescription>手动制作视频</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-sm text-gray-600 mb-4">
                  复制脚本到剪贴板，使用您喜欢的工具手动制作视频
                </p>
                <Button
                  onClick={() => {
                    onCopyScript()
                    onEnd() // 复制完成，流程结束，返回步骤8
                  }}
                  variant="outline"
                  className="w-full"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  复制脚本
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-2 border-transparent hover:border-purple-300 transition-all cursor-pointer">
              <CardHeader className="bg-gradient-to-br from-purple-50 to-pink-50">
                <CardTitle className="text-lg">🎬 AI生成视频</CardTitle>
                <CardDescription>自动生成视频</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-sm text-gray-600 mb-4">
                  使用AI自动生成视频（需要2-3分钟）
                </p>
                <Button
                  onClick={() => setShowVideoSelector(true)}
                  className="w-full"
                >
                  <Play className="w-4 h-4 mr-2" />
                  继续
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          // 显示模型选择器
          <Card className="shadow-lg border-0">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
              <CardTitle>选择视频生成模型</CardTitle>
              <CardDescription>AI将根据您的脚本自动生成视频</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* 推荐视频生成模型 */}
              <div>
                <label className="block text-sm font-medium mb-2">选择视频生成模型</label>
                <RecommendationSelector
                  scenario="task->model"
                  task={{
                    businessModule: 'video-generation',
                    scriptId,
                  }}
                  context={{}}
                  constraints={{
                    verified: true, // 只召回verified models
                  }}
                  onSelect={(selectedId, decisionId, isUserOverride) => {
                    setSelectedModelId(selectedId)
                    setModelDecisionId(decisionId)
                    console.log('选择视频模型:', { selectedId, decisionId, isUserOverride })
                  }}
                  defaultLabel="选择模型"
                  className="w-full"
                />
              </div>

              {/* 生成按钮 */}
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Play className="w-8 h-8 text-purple-500" />
                </div>
                <p className="text-gray-600 mb-6">点击按钮开始生成视频</p>
                <div className="flex gap-3">
                  <Button
                    onClick={() => setShowVideoSelector(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    返回
                  </Button>
                  <Button
                    onClick={() => onGenerateVideo(selectedModelId)}
                    disabled={loading || !selectedModelId}
                    className="flex-1"
                  >
                    {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                    开始生成
                  </Button>
                </div>
              </div>

              {/* 错误提示 */}
              {error && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
                  {error}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  // 步骤9: 视频生成进度
  if (currentStep === 9 && videoJob) {
    return (
      <Card className="shadow-lg border-0">
        <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
          <CardTitle>视频生成进度</CardTitle>
          <CardDescription>请耐心等待，AI正在为您生成视频</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* 状态显示 */}
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              {videoJob.status === 'queued' && (
                <>
                  <Clock className="w-16 h-16 text-yellow-500 mx-auto mb-4 animate-pulse" />
                  <p className="text-lg font-medium">排队中...</p>
                  <p className="text-sm text-gray-500 mt-2">您的任务正在等待处理</p>
                </>
              )}
              {videoJob.status === 'running' && (
                <>
                  <Loader2 className="w-16 h-16 text-blue-500 mx-auto mb-4 animate-spin" />
                  <p className="text-lg font-medium">生成中 {videoJob.progress}%</p>
                  <div className="w-64 h-2 bg-gray-200 rounded-full mt-4 overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${videoJob.progress}%` }}
                    />
                  </div>
                </>
              )}
              {videoJob.status === 'succeeded' && videoJob.result && (
                <>
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <p className="text-lg font-medium text-green-600 mb-6">生成完成！</p>
                  <div className="bg-black rounded-lg overflow-hidden mb-4">
                    <video
                      src={videoJob.result.fileUrl}
                      controls
                      className="w-full"
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => window.open(videoJob.result?.fileUrl, '_blank')}
                      variant="outline"
                      className="flex-1"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      下载视频
                    </Button>
                    <Button
                      onClick={onEnd}
                      className="flex-1"
                    >
                      完成
                    </Button>
                  </div>
                </>
              )}
              {videoJob.status === 'failed' && (
                <>
                  <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                  <p className="text-lg font-medium text-red-600 mb-2">生成失败</p>
                  {videoJob.errorMessage && (
                    <p className="text-sm text-gray-600 mb-6">{videoJob.errorMessage}</p>
                  )}
                  <Button onClick={onEnd} variant="outline">
                    返回重试
                  </Button>
                </>
              )}
              {videoJob.status === 'cancelled' && (
                <>
                  <XCircle className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-600 mb-2">任务已取消</p>
                  <Button onClick={onEnd} variant="outline">
                    返回
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
              {error}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return null
}

