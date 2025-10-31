/**
 * 用户管理模块
 * 
 * 功能：
 * - 显示用户列表
 * - 添加/编辑/删除用户
 * - 组织管理
 */

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Edit, Trash2, Users, Building2 } from 'lucide-react'
import { useState } from 'react'
import type { User } from '../../shared/types/user'
import OrganizationManagement from './components/OrganizationManagement'

interface UserManagementProps {
  users: User[]
  onAdd: () => void
  onEdit: (user: User) => void
  onDelete: (userId: string) => void
  onRefresh?: () => Promise<void>
}

export function UserManagement({ users, onAdd, onEdit, onDelete, onRefresh }: UserManagementProps) {
  const [activeTab, setActiveTab] = useState('users')

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">用户管理</h2>
        {activeTab === 'users' && (
          <Button onClick={onAdd}>
            <Plus className="h-4 w-4 mr-2" />
            添加用户
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            用户管理
          </TabsTrigger>
          <TabsTrigger value="organizations" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            组织管理
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <div className="border rounded-lg">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">用户信息</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">角色</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">状态</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">组织</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">视频数</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">创建时间</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="text-xs">
                        {user.role === 'super_admin' ? '超级管理员' : 
                         user.role === 'admin' ? '管理员' : '运营'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={user.isActive ? "default" : "secondary"}>
                        {user.isActive ? '活跃' : '禁用'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {user.organization?.name || '无组织'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{user._count.videos}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => onEdit(user)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => onDelete(user.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="organizations">
          <OrganizationManagement />
        </TabsContent>
      </Tabs>
    </div>
  )
}

