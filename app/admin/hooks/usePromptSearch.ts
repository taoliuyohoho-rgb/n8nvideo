// 搜索和筛选逻辑 Hook

import { useState, useMemo } from 'react'
import type { CompatiblePrompt } from '@/types/compat'
import type { UsePromptSearchReturn } from '../components/PromptsTab/types'

export function usePromptSearch(prompts: CompatiblePrompt[]): UsePromptSearchReturn {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedModule, setSelectedModule] = useState('all')

  const filteredPrompts = useMemo(() => {
    return prompts.filter(prompt => {
      const matchesSearch = prompt.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           prompt.content.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesModule = selectedModule === 'all' || prompt.businessModule === selectedModule
      return matchesSearch && matchesModule
    })
  }, [prompts, searchTerm, selectedModule])

  return {
    searchTerm,
    selectedModule,
    filteredPrompts,
    setSearchTerm,
    setSelectedModule
  }
}
