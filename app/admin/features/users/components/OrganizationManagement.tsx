'use client'

import React, { useState, useEffect } from 'react'
import { PermissionGuard, RoleGuard } from '@/src/components/PermissionGuard'
import { Resource, Action } from '@/src/services/permission/permission.service'
import { usePermission } from '@/src/hooks/usePermission'

interface Organization {
  id: string
  name: string
  description?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  users: Array<{
    id: string
    email: string
    name: string
  }>
  _count: {
    users: number
    products: number
  }
}

export default function OrganizationManagement() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [availableUsers, setAvailableUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null)
  const { isSuperAdmin } = usePermission()

  useEffect(() => {
    fetchOrganizations()
    fetchAvailableUsers()
  }, [])

  const fetchOrganizations = async () => {
    try {
      const response = await fetch('/api/admin/organizations')
      const data = await response.json()
      
      if (data.success) {
        setOrganizations(data.data)
      }
    } catch (error) {
      console.error('获取组织列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableUsers = async () => {
    try {
      const response = await fetch('/api/admin/users/available')
      const data = await response.json()
      
      if (data.success) {
        setAvailableUsers(data.data)
      }
    } catch (error) {
      console.error('获取可用用户列表失败:', error)
    }
  }

  const handleCreateOrganization = async (formData: any) => {
    try {
      const response = await fetch('/api/admin/organizations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()
      
      if (data.success) {
        setShowCreateModal(false)
        fetchOrganizations()
        fetchAvailableUsers() // 刷新可用用户列表
      } else {
        alert(data.error || '创建组织失败')
      }
    } catch (error) {
      console.error('创建组织失败:', error)
      alert('创建组织失败')
    }
  }

  const handleViewOrganization = async (organization: Organization) => {
    try {
      const response = await fetch(`/api/admin/organizations/${organization.id}`)
      const data = await response.json()
      
      if (data.success) {
        setSelectedOrganization(data.data)
        setShowEditModal(true)
      } else {
        alert(data.error || '获取组织详情失败')
      }
    } catch (error) {
      console.error('获取组织详情失败:', error)
      alert('获取组织详情失败')
    }
  }

  const handleEditOrganization = async (formData: any) => {
    if (!selectedOrganization) return

    try {
      const response = await fetch(`/api/admin/organizations/${selectedOrganization.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()
      
      if (data.success) {
        setShowEditModal(false)
        setSelectedOrganization(null)
        fetchOrganizations()
      } else {
        alert(data.error || '更新组织失败')
      }
    } catch (error) {
      console.error('更新组织失败:', error)
      alert('更新组织失败')
    }
  }

  const handleAddMember = async (userId: string) => {
    if (!selectedOrganization) return

    try {
      const response = await fetch(`/api/admin/organizations/${selectedOrganization.id}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      })

      const data = await response.json()
      
      if (data.success) {
        // 刷新组织详情
        handleViewOrganization(selectedOrganization)
        fetchAvailableUsers()
      } else {
        alert(data.error || '添加成员失败')
      }
    } catch (error) {
      console.error('添加成员失败:', error)
      alert('添加成员失败')
    }
  }

  const handleRemoveMember = async (userId: string) => {
    if (!selectedOrganization) return

    if (!confirm('确定要移除此成员吗？')) return

    try {
      const response = await fetch(`/api/admin/organizations/${selectedOrganization.id}/members/${userId}`, {
        method: 'DELETE',
      })

      const data = await response.json()
      
      if (data.success) {
        // 刷新组织详情
        handleViewOrganization(selectedOrganization)
        fetchAvailableUsers()
      } else {
        alert(data.error || '移除成员失败')
      }
    } catch (error) {
      console.error('移除成员失败:', error)
      alert('移除成员失败')
    }
  }

  if (loading) {
    return <div className="p-6">加载中...</div>
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">组织管理</h1>
        <PermissionGuard
          resource={Resource.ORGANIZATIONS}
          action={Action.CREATE}
        >
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            创建组织
          </button>
        </PermissionGuard>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  组织名称
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  描述
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  管理员
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  用户数
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  商品数
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {organizations.map((org) => (
                <tr key={org.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {org.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {org.description || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {org.users.map(user => user.email).join(', ') || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {org._count.users}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {org._count.products}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      org.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {org.isActive ? '活跃' : '禁用'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <PermissionGuard
                        resource={Resource.ORGANIZATIONS}
                        action={Action.READ}
                      >
                        <button 
                          onClick={() => handleViewOrganization(org)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          查看
                        </button>
                      </PermissionGuard>
                      <PermissionGuard
                        resource={Resource.ORGANIZATIONS}
                        action={Action.UPDATE}
                      >
                        <button 
                          onClick={() => handleViewOrganization(org)}
                          className="text-green-600 hover:text-green-900"
                        >
                          编辑
                        </button>
                      </PermissionGuard>
                      <PermissionGuard
                        resource={Resource.ORGANIZATIONS}
                        action={Action.DELETE}
                      >
                        <button className="text-red-600 hover:text-red-900">
                          删除
                        </button>
                      </PermissionGuard>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showCreateModal && (
        <CreateOrganizationModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateOrganization}
          availableUsers={availableUsers}
        />
      )}

      {showEditModal && selectedOrganization && (
        <EditOrganizationModal
          organization={selectedOrganization}
          availableUsers={availableUsers}
          onClose={() => {
            setShowEditModal(false)
            setSelectedOrganization(null)
          }}
          onSubmit={handleEditOrganization}
          onAddMember={handleAddMember}
          onRemoveMember={handleRemoveMember}
        />
      )}
    </div>
  )
}

// 编辑组织模态框组件
interface EditOrganizationModalProps {
  organization: Organization
  availableUsers: any[]
  onClose: () => void
  onSubmit: (data: any) => void
  onAddMember: (userId: string) => void
  onRemoveMember: (userId: string) => void
}

function EditOrganizationModal({ 
  organization, 
  availableUsers, 
  onClose, 
  onSubmit, 
  onAddMember, 
  onRemoveMember 
}: EditOrganizationModalProps) {
  const [formData, setFormData] = useState({
    name: organization.name,
    description: organization.description || '',
    isActive: organization.isActive
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">编辑组织 - {organization.name}</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                组织名称 *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                状态
              </label>
              <select
                value={formData.isActive ? 'true' : 'false'}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="true">活跃</option>
                <option value="false">禁用</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              描述
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>

          {/* 成员管理 */}
          <div className="border-t pt-4">
            <h4 className="text-md font-medium text-gray-900 mb-3">成员管理</h4>
            
            {/* 当前成员 */}
            <div className="mb-4">
              <h5 className="text-sm font-medium text-gray-700 mb-2">当前成员</h5>
              <div className="space-y-2">
                {organization.users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <span className="text-sm">{user.name} ({user.email})</span>
                    <button
                      type="button"
                      onClick={() => onRemoveMember(user.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      移除
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* 添加成员 */}
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-2">添加成员</h5>
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    onAddMember(e.target.value)
                    e.target.value = ''
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">选择用户添加到组织</option>
                {availableUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// 创建组织模态框组件
interface CreateOrganizationModalProps {
  onClose: () => void
  onSubmit: (data: any) => void
  availableUsers: any[]
}

function CreateOrganizationModal({ onClose, onSubmit, availableUsers }: CreateOrganizationModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    adminUserId: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">创建组织</h3>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                组织名称 *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                描述
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                选择管理员 *
              </label>
              <select
                required
                value={formData.adminUserId}
                onChange={(e) => setFormData({ ...formData, adminUserId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">请选择管理员</option>
                {availableUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                取消
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600"
              >
                创建
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
