// PromptsTab 主容器组件

import React from 'react'
import { SearchAndFilter } from './components/SearchAndFilter'
import { PromptList } from './components/PromptList'
import { PromptEditModal } from './components/PromptEditModal'
import { AIReverseModal } from './components/AIReverseModal'
import { PromptRuleManager } from '../PromptRuleManager'
import { usePromptSearch } from '../../hooks/usePromptSearch'
import { usePromptActions } from '../../hooks/usePromptActions'
import { usePromptModals } from '../../hooks/usePromptModals'
import { usePromptRules } from '../../hooks/usePromptRules'
import type { PromptsTabProps } from './types'
import type { BusinessModule } from '@/types/prompt-rule'

export function PromptsTab({ prompts, onPromptsUpdate }: PromptsTabProps) {
  // 搜索和筛选逻辑
  const {
    searchTerm,
    selectedModule,
    filteredPrompts,
    setSearchTerm,
    setSelectedModule
  } = usePromptSearch(prompts)

  // 操作逻辑
  const {
    saving,
    handleSavePrompt,
    handleDeletePrompt,
    handleCopyPrompt
  } = usePromptActions({ prompts, onPromptsUpdate })

  // 弹窗状态管理
  const {
    editingPrompt,
    showAIReverseEngineer,
    selectedBusinessModule,
    setEditingPrompt,
    setShowAIReverseEngineer,
    setSelectedBusinessModule,
    handleAIReverseSuccess
  } = usePromptModals({ onPromptsUpdate })

  // 规则管理Hook
  const {
    currentModule,
    editing: ruleEditing,
    loading: ruleLoading,
    switchModule,
    setEditing: setRuleEditing,
    getCurrentRule,
    createRule,
    updateRule
  } = usePromptRules()

  // 获取业务模块列表（使用固定列表，确保与类型定义一致）
  const businessModules: string[] = [
    'product-analysis',
    'competitor-analysis',
    'persona.generate',
    'video-script',
    'video-generation',
    'ai-reverse-engineer'
  ]

  // 处理模块切换
  const handleModuleChange = (module: string) => {
    setSelectedModule(module)
    if (module !== 'all') {
      switchModule(module as BusinessModule)
    }
  }

  // 处理规则创建
  const handleRuleCreate = async (ruleData: unknown) => {
    try {
      const data = ruleData as {
        businessModule: string
        inputFormat: string
        outputFormat: string
        analysisMethod: string
      }
      await createRule(data)
    } catch (error) {
      // console.error('创建规则失败:', error)
    }
  }

  // 处理规则更新
  const handleRuleUpdate = async (rule: unknown) => {
    try {
      const ruleObj = rule as Record<string, unknown>
      await updateRule(ruleObj.id as string, {
        businessModule: ruleObj.businessModule as string,
        inputFormat: ruleObj.inputFormat as string,
        outputFormat: ruleObj.outputFormat as string,
        analysisMethod: ruleObj.analysisMethod as string
      })
    } catch (error) {
      // console.error('更新规则失败:', error)
    }
  }

  // 处理规则编辑
  const handleRuleEdit = (_rule: unknown) => {
    setRuleEditing(true)
  }

  // 处理规则取消
  const handleRuleCancel = () => {
    setRuleEditing(false)
  }

  // 处理新建提示词
  const handleManualCreate = () => {
    setEditingPrompt({
      id: '',
      name: '',
      businessModule: 'video-generation', // 默认选择最新的视频生成模块
      content: '',
      variables: [],
      usageCount: 0,
      isActive: true,
      isDefault: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
  }

  return (
    <div className="space-y-6">
      {/* 搜索和筛选 */}
      <SearchAndFilter
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedModule={selectedModule}
        onModuleChange={handleModuleChange}
        businessModules={businessModules}
        onAIReverseClick={() => setShowAIReverseEngineer(true)}
        onManualCreateClick={handleManualCreate}
      />

      {/* 规则管理 */}
      {selectedModule !== 'all' && (
        <PromptRuleManager
          currentModule={currentModule}
          rule={getCurrentRule()}
          onRuleUpdate={handleRuleUpdate}
          onRuleCreate={handleRuleCreate}
          onRuleEdit={handleRuleEdit}
          onRuleCancel={handleRuleCancel}
          editing={ruleEditing}
          loading={ruleLoading}
        />
      )}

      {/* 提示词列表 */}
      <PromptList
        prompts={filteredPrompts}
        onEditPrompt={setEditingPrompt}
        onCopyPrompt={handleCopyPrompt}
        onDeletePrompt={handleDeletePrompt}
        onShowEmptyState={() => setShowAIReverseEngineer(true)}
      />

      {/* 编辑弹窗 */}
      <PromptEditModal
        prompt={editingPrompt}
        businessModules={businessModules}
        saving={saving}
        onSave={handleSavePrompt}
        onCancel={() => setEditingPrompt(null)}
      />

      {/* AI反推弹窗 */}
      <AIReverseModal
        visible={showAIReverseEngineer}
        businessModules={businessModules}
        selectedBusinessModule={selectedBusinessModule}
        onBusinessModuleChange={setSelectedBusinessModule}
        onSuccess={handleAIReverseSuccess}
        onCancel={() => setShowAIReverseEngineer(false)}
      />
    </div>
  )
}
