/**
 * 视频生成Hook（步骤8-9）
 * 
 * 功能：
 * - 创建视频生成任务（使用推荐引擎推荐模型）
 * - 轮询任务状态
 * - 清理定时器
 */

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import type { VideoJob } from '../types'

interface UseVideoGenerationProps {
  scriptId: string | null
  onStepComplete: (step: number) => void
}

export function useVideoGeneration({ scriptId, onStepComplete }: UseVideoGenerationProps) {
  const [videoJob, setVideoJob] = useState<VideoJob | null>(null)
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 创建视频生成任务（接收推荐引擎选择的modelId）
  const handleGenerate = async (selectedModelId: string) => {
    if (!scriptId) {
      toast.error('缺少脚本信息')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/video/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scriptId,
          modelId: selectedModelId,
          providerPref: ['OpenAI', 'Pika'],
          seconds: 15,
          size: '720x1280',
        }),
      })

      if (!response.ok) {
        throw new Error('创建视频任务失败')
      }

      const data = await response.json()
      setVideoJob({ id: data.jobId, status: 'queued', progress: 0 })
      toast.success('视频生成任务已创建')
      onStepComplete(9) // 跳转步骤9显示进度
      
      // 开始轮询任务状态
      startPolling(data.jobId)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '创建视频任务失败'
      setError(errorMsg)
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  // 开始轮询任务状态
  const startPolling = (jobId: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/video/jobs/${jobId}`)
        if (response.ok) {
          const data = await response.json()
          const job = data.job

          setVideoJob({
            id: job.id,
            status: job.status,
            progress: job.progress,
            errorMessage: job.errorMessage,
            result: job.result,
          })

          // 任务完成（成功/失败/取消）时停止轮询
          if (job.status === 'succeeded' || job.status === 'failed' || job.status === 'cancelled') {
            clearInterval(interval)
            setPollingInterval(null)

            if (job.status === 'succeeded') {
              toast.success('视频生成完成！')
            } else if (job.status === 'failed') {
              toast.error('视频生成失败')
              setError(job.errorMessage || '视频生成失败')
            } else if (job.status === 'cancelled') {
              toast.error('视频生成已取消')
            }
          }
        }
      } catch (err) {
        console.error('轮询任务状态失败:', err)
      }
    }, 2000) // 每2秒轮询一次

    setPollingInterval(interval)
  }

  // 停止轮询
  const stopPolling = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval)
      setPollingInterval(null)
    }
  }

  // 组件卸载时清理定时器
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval)
      }
    }
  }, [pollingInterval])

  return {
    videoJob,
    loading,
    error,
    handleGenerate,
    stopPolling,
  }
}

