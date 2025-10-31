/**
 * 人设管理 Hook
 * 
 * 功能：
 * - 人设删除/刷新
 * - 添加和编辑已移至弹窗组件中
 */

import type { CompatiblePersona } from '@/types/compat'
import type { PersonaManagementActions } from '@/types/admin-management'

interface UsePersonaManagementProps {
  personas: CompatiblePersona[]
  showSuccess: (message: string) => void
  showError: (message: string) => void
  deletePersona: (personaId: string) => Promise<{ success: boolean; message?: string; error?: string }>
  refreshPersonas: () => Promise<{ success: boolean; message?: string; error?: string }>
}

export function usePersonaManagement({
  personas,
  showSuccess,
  showError,
  deletePersona,
  refreshPersonas
}: UsePersonaManagementProps): PersonaManagementActions {
  
  // 人设管理处理函数（添加和编辑已移至 PersonaFormModal）

  const handleDeletePersona = async (personaId: string) => {
    console.log('🗑️ 开始删除人设:', personaId)
    
    const persona = personas.find(p => p.id === personaId)
    if (!persona) {
      console.error('❌ 人设不存在:', personaId)
      showError('人设不存在')
      return
    }

    const personaName = persona.name || persona.coreIdentity?.name || persona.generatedContent?.basicInfo?.name || '此人设'
    const confirmed = window.confirm(`确定要删除人设"${personaName}"吗？此操作不可撤销。`)
    if (!confirmed) {
      console.log('❌ 用户取消删除')
      return
    }

    try {
      console.log('🔄 调用删除API...')
      const result = await deletePersona(personaId)
      console.log('📋 删除结果:', result)
      
      if (result.success) {
        console.log('✅ 删除成功，显示成功消息')
        showSuccess(result.message || '删除成功')
        // 延迟一下再刷新，确保用户看到成功消息
        setTimeout(() => {
          console.log('🔄 刷新人设列表')
          refreshPersonas()
        }, 1000)
      } else {
        console.log('❌ 删除失败:', result.error)
        showError(result.error || '删除失败')
      }
    } catch (error) {
      console.error('❌ 删除过程中出错:', error)
      showError('删除过程中出错: ' + (error instanceof Error ? error.message : '未知错误'))
    }
  }

  const handleRefreshPersonas = async () => {
    const result = await refreshPersonas()
    
    if (result.success) {
      showSuccess(result.message || '刷新成功')
    } else {
      showError(result.error || '刷新失败')
    }
  }

  return {
    handleDeletePersona,
    handleRefreshPersonas
  }
}
