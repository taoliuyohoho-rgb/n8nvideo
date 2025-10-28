/**
 * 脚本步骤组件（步骤6-7）
 * 
 * 步骤6: 生成脚本（使用推荐引擎推荐模型+Prompt）
 * 步骤7: 确认脚本
 */

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, Sparkles, RefreshCw, Copy } from 'lucide-react'
import { RecommendationSelector } from '@/components/RecommendationSelector'
import type { Script } from '../types'

interface ScriptStepsProps {
  currentStep: number
  script: Script | null
  scriptId: string | null
  loading: boolean
  error: string | null
  productId: string | null
  personaId: string | null
  handleGenerate: (modelId: string, promptId: string) => void
  handleConfirm: () => void
  handleCopy: () => void
  onPrev: () => void
}

export function ScriptSteps({
  currentStep,
  script,
  scriptId,
  loading,
  error,
  productId,
  personaId,
  handleGenerate,
  handleConfirm,
  handleCopy,
  onPrev,
}: ScriptStepsProps) {
  const [selectedModelId, setSelectedModelId] = useState<string>('')
  const [selectedPromptId, setSelectedPromptId] = useState<string>('')
  const [modelDecisionId, setModelDecisionId] = useState<string>('')
  const [promptDecisionId, setPromptDecisionId] = useState<string>('')

  // 步骤6: 生成脚本
  if (currentStep === 6) {
    return (
      <Card className="shadow-lg border-0">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            生成脚本
          </CardTitle>
          <CardDescription>AI将根据商品和人设为您生成专业的短视频脚本</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* 推荐模型 */}
          <div>
            <label className="block text-sm font-medium mb-2">选择生成模型</label>
            <RecommendationSelector
              scenario="task->model"
              task={{
                businessModule: 'video-script',
                productId,
                personaId,
              }}
              context={{}}
              constraints={{}}
              onSelect={(selectedId, decisionId, isUserOverride) => {
                setSelectedModelId(selectedId)
                setModelDecisionId(decisionId)
                console.log('选择模型:', { selectedId, decisionId, isUserOverride })
              }}
              defaultLabel="选择模型"
              className="w-full"
            />
          </div>

          {/* 推荐Prompt */}
          <div>
            <label className="block text-sm font-medium mb-2">选择Prompt模板</label>
            <RecommendationSelector
              scenario="task->prompt"
              task={{
                businessModule: 'video-script',
                productId,
                personaId,
              }}
              context={{}}
              constraints={{}}
              onSelect={(selectedId, decisionId, isUserOverride) => {
                setSelectedPromptId(selectedId)
                setPromptDecisionId(decisionId)
                console.log('选择Prompt:', { selectedId, decisionId, isUserOverride })
              }}
              defaultLabel="选择Prompt"
              className="w-full"
            />
          </div>

          {/* 生成按钮 */}
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-purple-500" />
            </div>
            <p className="text-gray-600 mb-6">点击按钮生成脚本</p>
            <Button
              onClick={() => handleGenerate(selectedModelId, selectedPromptId)}
              disabled={loading || !selectedModelId || !selectedPromptId}
              size="lg"
              className="px-8"
            >
              {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
              生成脚本
            </Button>
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

  // 步骤7: 确认脚本
  if (currentStep === 7 && script) {
    return (
      <Card className="shadow-lg border-0">
        <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
          <CardTitle className="flex items-center justify-between">
            <span>确认脚本</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCopy}>
                <Copy className="w-4 h-4 mr-1" />
                复制
              </Button>
              <Button variant="outline" size="sm" onClick={onPrev} disabled={loading}>
                <RefreshCw className="w-4 h-4 mr-1" />
                重新生成
              </Button>
            </div>
          </CardTitle>
          <CardDescription>请查看生成的脚本，确认后将保存到数据库</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {/* 脚本元信息 */}
          <div className="flex gap-4 text-sm">
            <Badge variant="outline">角度: {script.angle}</Badge>
            <Badge variant="outline">能量: {script.energy}</Badge>
            <Badge variant="outline">时长: {script.durationSec}秒</Badge>
          </div>

          {/* 对话内容 */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold mb-3 text-blue-700">📝 对话内容</h3>
            <div className="space-y-3 text-sm">
              <div className="bg-white p-3 rounded">
                <Badge variant="secondary" className="mb-2">开场 [0-3s]</Badge>
                <p className="text-gray-700">"{script.lines.open}"</p>
              </div>
              <div className="bg-white p-3 rounded">
                <Badge variant="secondary" className="mb-2">主体 [3-12s]</Badge>
                <p className="text-gray-700">"{script.lines.main}"</p>
              </div>
              <div className="bg-white p-3 rounded">
                <Badge variant="secondary" className="mb-2">结尾 [12-15s]</Badge>
                <p className="text-gray-700">"{script.lines.close}"</p>
              </div>
            </div>
          </div>

          {/* 镜头分解 */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
            <h3 className="font-semibold mb-3 text-purple-700">🎬 镜头分解</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {script.shots.map((shot, index) => (
                <div key={index} className="bg-white p-3 rounded text-xs flex items-start gap-3">
                  <Badge variant="outline" className="flex-shrink-0">{shot.second}s</Badge>
                  <div className="flex-1">
                    <p className="font-medium text-gray-700">{shot.camera} | {shot.action}</p>
                    <p className="text-gray-500 mt-1">📹 {shot.visibility} · 🔊 {shot.audio}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 技术参数 */}
          <div className="bg-gray-50 border rounded-lg p-4">
            <h3 className="font-semibold mb-3 text-gray-700 text-sm">⚙️ 技术参数</h3>
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
              <div>方向: {script.technical.orientation}</div>
              <div>拍摄: {script.technical.filmingMethod}</div>
              <div>位置: {script.technical.location}</div>
              <div>音频: {script.technical.audioEnv}</div>
              <div>惯用手: {script.technical.dominantHand}</div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button onClick={onPrev} variant="outline" className="flex-1">
              返回重新生成
            </Button>
            <Button onClick={handleConfirm} disabled={loading} className="flex-1">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              确认脚本
            </Button>
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

