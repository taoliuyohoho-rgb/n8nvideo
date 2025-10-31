// 提示词操作逻辑 Hook

import { useState } from 'react'
import type { CompatiblePrompt } from '@/types/compat'
import type { UsePromptActionsReturn } from '../components/PromptsTab/types'

interface UsePromptActionsProps {
  prompts: CompatiblePrompt[]
  onPromptsUpdate: (prompts: CompatiblePrompt[]) => void
}

export function usePromptActions({ prompts, onPromptsUpdate }: UsePromptActionsProps): UsePromptActionsReturn {
  const [saving, setSaving] = useState(false)

  const handleSavePrompt = async (prompt: Partial<CompatiblePrompt>) => {
    setSaving(true)
    try {
      const response = await fetch('/api/admin/prompts', {
        method: prompt.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prompt)
      })
      
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          // 类型安全的响应处理
          const savedPrompt = result.data as CompatiblePrompt
          if (prompt.id) {
            // 更新现有提示词
            onPromptsUpdate(prompts.map(p => p.id === prompt.id ? savedPrompt : p))
          } else {
            // 添加新提示词
            onPromptsUpdate([...prompts, savedPrompt])
          }
        } else {
          console.error('保存提示词失败:', result.error || '未知错误')
        }
      } else {
        console.error('保存提示词失败: HTTP', response.status)
      }
    } catch (error) {
      console.error('保存提示词失败:', error)
      // TODO: 添加错误提示
    } finally {
      setSaving(false)
    }
  }

  const handleDeletePrompt = async (promptId: string) => {
    try {
      const response = await fetch(`/api/admin/prompts/${promptId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        onPromptsUpdate(prompts.filter(p => p.id !== promptId))
      }
    } catch (error) {
      console.error('删除提示词失败:', error)
      // TODO: 添加错误提示
    }
  }

  const handleCopyPrompt = (prompt: CompatiblePrompt) => {
    // 创建副本，清空ID，修改名称
    const copiedPrompt: Partial<CompatiblePrompt> = {
      ...prompt,
      id: '',
      name: `${prompt.name} (副本)`,
      isDefault: false
    }
    
    // 直接调用保存逻辑
    handleSavePrompt(copiedPrompt)
  }

  return {
    saving,
    handleSavePrompt,
    handleDeletePrompt,
    handleCopyPrompt
  }
}
