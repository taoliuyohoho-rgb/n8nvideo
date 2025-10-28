/**
 * 脚本流程Hook（步骤6-7）
 * 
 * 功能：
 * - 生成脚本（使用推荐引擎推荐模型+Prompt）
 * - 确认脚本
 * - 复制脚本
 */

import { useState } from 'react'
import { toast } from 'sonner'
import type { Script } from '../types'

interface UseScriptFlowProps {
  productId: string | null
  personaId: string | null
  onStepComplete: (step: number) => void
}

export function useScriptFlow({ productId, personaId, onStepComplete }: UseScriptFlowProps) {
  const [script, setScript] = useState<Script | null>(null)
  const [scriptId, setScriptId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 生成脚本（接收推荐引擎选择的modelId和promptId）
  const handleGenerate = async (selectedModelId: string, selectedPromptId: string) => {
    if (!productId || !personaId) {
      toast.error('缺少商品或人设信息')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/script/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          personaId,
          modelId: selectedModelId,
          promptId: selectedPromptId,
          variants: 1,
        }),
      })

      if (!response.ok) {
        throw new Error('生成脚本失败')
      }

      const data = await response.json()
      setScript(data.scripts[0])
      toast.success('脚本生成成功')
      onStepComplete(7) // 跳转步骤7确认脚本
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '生成脚本失败'
      setError(errorMsg)
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  // 确认脚本（保存到数据库）
  const handleConfirm = async () => {
    if (!productId || !personaId || !script) {
      toast.error('缺少必要信息')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/script/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          personaId,
          scripts: [script],
        }),
      })

      if (!response.ok) {
        throw new Error('确认脚本失败')
      }

      const data = await response.json()
      setScriptId(data.scriptIds?.[0])
      toast.success('脚本已确认')
      onStepComplete(8) // 跳转步骤8选择生成方式
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '确认脚本失败'
      setError(errorMsg)
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  // 复制脚本到剪贴板
  const handleCopy = () => {
    if (!script) return

    const scriptText = `【${script.angle}】
能量: ${script.energy}
时长: ${script.durationSec}秒

=== 对话 ===
[开场] ${script.lines.open}
[主体] ${script.lines.main}
[结尾] ${script.lines.close}

=== 镜头分解 ===
${script.shots.map(shot => 
  `[${shot.second}s] ${shot.camera} | ${shot.action}`
).join('\n')}

=== 技术参数 ===
方向: ${script.technical.orientation}
拍摄: ${script.technical.filmingMethod}
位置: ${script.technical.location}
音频: ${script.technical.audioEnv}`

    navigator.clipboard.writeText(scriptText)
    toast.success('脚本已复制到剪贴板')
  }

  return {
    script,
    scriptId,
    loading,
    error,
    handleGenerate,
    handleConfirm,
    handleCopy,
  }
}

