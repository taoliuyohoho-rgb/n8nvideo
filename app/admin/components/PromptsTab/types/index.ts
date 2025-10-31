// PromptsTab 组件相关类型定义

import type { CompatiblePrompt } from '@/types/compat'

// 主容器组件 Props
export interface PromptsTabProps {
  prompts: CompatiblePrompt[]
  onPromptsUpdate: (prompts: CompatiblePrompt[]) => void
}

// 搜索筛选组件 Props
export interface SearchAndFilterProps {
  searchTerm: string
  onSearchChange: (term: string) => void
  selectedModule: string
  onModuleChange: (module: string) => void
  businessModules: string[]
  onAIReverseClick: () => void
  onManualCreateClick: () => void
}

// 提示词列表组件 Props
export interface PromptListProps {
  prompts: CompatiblePrompt[]
  onEditPrompt: (prompt: CompatiblePrompt) => void
  onCopyPrompt: (prompt: CompatiblePrompt) => void
  onDeletePrompt: (promptId: string) => void
  onShowEmptyState: () => void
}

// 提示词卡片组件 Props
export interface PromptCardProps {
  prompt: CompatiblePrompt
  onEdit: (prompt: CompatiblePrompt) => void
  onCopy: (prompt: CompatiblePrompt) => void
  onDelete: (promptId: string) => void
}

// 编辑弹窗组件 Props
export interface PromptEditModalProps {
  prompt: CompatiblePrompt | null
  businessModules: string[]
  saving: boolean
  onSave: (prompt: Partial<CompatiblePrompt>) => Promise<void>
  onCancel: () => void
}

// AI反推弹窗组件 Props
export interface AIReverseModalProps {
  visible: boolean
  businessModules: string[]
  selectedBusinessModule: string
  onBusinessModuleChange: (module: string) => void
  onSuccess: (result: unknown) => Promise<void>
  onCancel: () => void
}

// 空状态组件 Props
export interface EmptyStateProps {
  onAIReverseClick: () => void
  onManualCreateClick: () => void
}

// 状态管理类型
export interface PromptsState {
  searchTerm: string
  selectedModule: string
  editingPrompt: CompatiblePrompt | null
  saving: boolean
  showAIReverseEngineer: boolean
  selectedBusinessModule: string
}

export type PromptsAction = 
  | { type: 'SET_SEARCH_TERM'; payload: string }
  | { type: 'SET_SELECTED_MODULE'; payload: string }
  | { type: 'SET_EDITING_PROMPT'; payload: CompatiblePrompt | null }
  | { type: 'SET_SAVING'; payload: boolean }
  | { type: 'SET_SHOW_AI_REVERSE'; payload: boolean }
  | { type: 'SET_SELECTED_BUSINESS_MODULE'; payload: string }
  | { type: 'RESET_EDITING' }
  | { type: 'RESET_AI_REVERSE' }

// Hook 返回类型
export interface UsePromptSearchReturn {
  searchTerm: string
  selectedModule: string
  filteredPrompts: CompatiblePrompt[]
  setSearchTerm: (term: string) => void
  setSelectedModule: (module: string) => void
}

export interface UsePromptActionsReturn {
  saving: boolean
  handleSavePrompt: (prompt: Partial<CompatiblePrompt>) => Promise<void>
  handleDeletePrompt: (promptId: string) => Promise<void>
  handleCopyPrompt: (prompt: CompatiblePrompt) => void
}

export interface UsePromptModalsReturn {
  editingPrompt: CompatiblePrompt | null
  showAIReverseEngineer: boolean
  selectedBusinessModule: string
  setEditingPrompt: (prompt: CompatiblePrompt | null) => void
  setShowAIReverseEngineer: (show: boolean) => void
  setSelectedBusinessModule: (module: string) => void
  handleAIReverseSuccess: (result: unknown) => Promise<void>
}

// 错误处理类型
export interface ErrorInfo {
  message: string
  code?: string
  details?: unknown
}

export interface ErrorHandler {
  handleError: (error: ErrorInfo) => void
  showError: (message: string) => void
  showSuccess: (message: string) => void
}
