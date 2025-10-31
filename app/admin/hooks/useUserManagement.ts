/**
 * 用户管理 Hook
 * 
 * 功能：
 * - 用户添加/编辑/删除
 * - 保持原有业务逻辑不变
 */

import { useState } from 'react'
import type { CompatibleUser } from '@/types/compat'
import type { UserFormData, UserManagementActions } from '@/types/admin-management'

interface UseUserManagementProps {
  users: CompatibleUser[]
  setUsers: (users: CompatibleUser[]) => void
  showSuccess: (message: string) => void
  showError: (message: string) => void
  handleRefresh: () => Promise<void>
}

export function useUserManagement({
  users,
  setUsers,
  showSuccess,
  showError,
  handleRefresh
}: UseUserManagementProps): UserManagementActions {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<CompatibleUser | null>(null)

  const handleAddUser = async () => {
    setIsAddModalOpen(true)
  }

  const handleEditUser = async (user: CompatibleUser) => {
    setEditingUser(user)
    setIsEditModalOpen(true)
  }

  const handleDeleteUser = async (userId: string) => {
    const user = users.find(u => u.id === userId)
    if (!user) return

    const confirmed = window.confirm(`确定要删除用户"${user.name}"吗？此操作不可撤销。`)
    if (!confirmed) return

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()
      
      if (result.success) {
        showSuccess(result.message || '删除成功')
        // 更新本地状态
        setUsers(users.filter(u => u.id !== userId))
      } else {
        showError(result.error || '删除失败')
      }
    } catch (error) {
      console.error('删除用户失败:', error)
      showError('删除用户失败')
    }
  }

  const handleAddUserSubmit = async (formData: UserFormData) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()
      
      if (result.success) {
        showSuccess('用户创建成功')
        await handleRefresh()
        setIsAddModalOpen(false)
      } else {
        showError(result.error || '创建用户失败')
      }
    } catch (error) {
      console.error('创建用户失败:', error)
      showError('创建用户失败')
    }
  }

  const handleEditUserSubmit = async (formData: UserFormData) => {
    if (!editingUser) return

    try {
      const response = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()
      
      if (result.success) {
        showSuccess('用户更新成功')
        await handleRefresh()
        setIsEditModalOpen(false)
        setEditingUser(null)
      } else {
        showError(result.error || '更新用户失败')
      }
    } catch (error) {
      console.error('更新用户失败:', error)
      showError('更新用户失败')
    }
  }

  return {
    handleAddUser,
    handleEditUser,
    handleDeleteUser,
    // 模态框状态
    isAddModalOpen,
    setIsAddModalOpen,
    isEditModalOpen,
    setIsEditModalOpen,
    editingUser,
    setEditingUser,
    // 表单提交处理
    handleAddUserSubmit,
    handleEditUserSubmit
  }
}
