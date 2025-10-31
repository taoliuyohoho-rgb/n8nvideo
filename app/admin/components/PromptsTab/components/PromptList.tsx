// 提示词列表组件

import React from 'react'
import { PromptCard } from './PromptCard'
import { EmptyState } from './EmptyState'
import type { PromptListProps } from '../types'

export const PromptList: React.FC<PromptListProps> = ({
  prompts,
  onEditPrompt,
  onCopyPrompt,
  onDeletePrompt,
  onShowEmptyState
}) => {
  if (prompts.length === 0) {
    return (
      <EmptyState
        onAIReverseClick={onShowEmptyState}
        onManualCreateClick={onShowEmptyState}
      />
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {prompts.map((prompt) => (
        <PromptCard
          key={prompt.id}
          prompt={prompt}
          onEdit={onEditPrompt}
          onCopy={onCopyPrompt}
          onDelete={onDeletePrompt}
        />
      ))}
    </div>
  )
}
