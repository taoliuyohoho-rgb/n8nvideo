/**
 * 人设流程Hook（步骤4-5）
 * 
 * 功能：
 * - 自动加载推荐人设（推荐引擎）
 * - 选择推荐人设或生成新人设
 * - 确认人设
 */

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import type { Persona } from '../types'

interface UsePersonaFlowProps {
  productId: string | null
  onStepComplete: (step: number) => void
}

interface PersonaWithId extends Persona {
  id: string
  version?: number
  productName?: string
}

export function usePersonaFlow({ productId, onStepComplete }: UsePersonaFlowProps) {
  const [recommendedPersonas, setRecommendedPersonas] = useState<PersonaWithId[]>([])
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null)
  const [personaId, setPersonaId] = useState<string | null>(null)
  const [personaMode, setPersonaMode] = useState<'select' | 'generate'>('select')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 自动加载推荐人设（当productId可用时）
  useEffect(() => {
    if (productId) {
      loadRecommendedPersonas()
    }
  }, [productId])

  // 加载推荐人设列表
  const loadRecommendedPersonas = async () => {
    if (!productId) return

    setLoading(true)
    setError(null)
    try {
      // 调用admin/personas API获取推荐人设
      const response = await fetch(`/api/admin/personas?productId=${productId}`)
      if (!response.ok) {
        throw new Error('加载人设推荐失败')
      }

      const data = await response.json()
      if (data.success && data.data) {
        setRecommendedPersonas(data.data)
        // 默认选中第一个推荐
        if (data.data.length > 0) {
          setSelectedPersona(data.data[0])
        }
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '加载人设推荐失败'
      setError(errorMsg)
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  // 从推荐列表选择人设
  const handleSelectPersona = (persona: PersonaWithId) => {
    setSelectedPersona(persona)
    setPersonaId(persona.id)
    toast.success('人设已选择')
    onStepComplete(5) // 跳转步骤5确认
  }

  // 生成新人设
  const handleGenerateNew = async () => {
    if (!productId) return

    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/persona/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      })

      if (!response.ok) {
        throw new Error('生成人设失败')
      }

      const data = await response.json()
      setSelectedPersona(data.persona)
      setPersonaId(null) // 新生成的人设暂无ID
      toast.success('人设生成成功')
      onStepComplete(5) // 跳转步骤5确认
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '生成人设失败'
      setError(errorMsg)
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  // 确认人设（保存到数据库）
  const handleConfirm = async () => {
    if (!productId || !selectedPersona) return

    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/persona/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          persona: selectedPersona,
        }),
      })

      if (!response.ok) {
        throw new Error('确认人设失败')
      }

      const data = await response.json()
      setPersonaId(data.personaId)
      toast.success('人设已确认')
      onStepComplete(6) // 跳转步骤6生成脚本
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '确认人设失败'
      setError(errorMsg)
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  return {
    recommendedPersonas,
    selectedPersona,
    personaId,
    personaMode,
    loading,
    error,
    setPersonaMode,
    handleSelectPersona,
    handleGenerateNew,
    handleConfirm,
    reloadRecommendations: loadRecommendedPersonas,
  }
}

