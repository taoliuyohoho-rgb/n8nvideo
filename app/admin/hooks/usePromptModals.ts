// 弹窗状态管理 Hook

import { useState } from 'react'
import type { CompatiblePrompt } from '@/types/compat'
import type { UsePromptModalsReturn } from '../components/PromptsTab/types'

interface UsePromptModalsProps {
  onPromptsUpdate: (prompts: CompatiblePrompt[]) => void
}

export function usePromptModals({ onPromptsUpdate }: UsePromptModalsProps): UsePromptModalsReturn {
  const [editingPrompt, setEditingPrompt] = useState<CompatiblePrompt | null>(null)
  const [showAIReverseEngineer, setShowAIReverseEngineer] = useState(false)
  const [selectedBusinessModule, setSelectedBusinessModule] = useState('product-analysis')

  const handleAIReverseSuccess = async (result: any) => {
    // 刷新提示词列表
    try {
      const response = await fetch('/api/admin/prompts')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          onPromptsUpdate(data.data)
        }
      }
    } catch (error) {
      console.error('刷新提示词列表失败:', error)
      // TODO: 添加错误提示
    }
    
    setShowAIReverseEngineer(false)
  }

  return {
    editingPrompt,
    showAIReverseEngineer,
    selectedBusinessModule,
    setEditingPrompt,
    setShowAIReverseEngineer,
    setSelectedBusinessModule,
    handleAIReverseSuccess
  }
}
