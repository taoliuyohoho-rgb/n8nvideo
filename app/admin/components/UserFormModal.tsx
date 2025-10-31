/**
 * 用户表单模态框组件
 * 
 * 功能：
 * - 添加/编辑用户
 * - 替换原生DOM操作
 * - 使用React组件和UI库
 */

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import type { UserFormData, Organization } from '@/types/admin-management'
import type { CompatibleUser } from '@/types/compat'

interface UserFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (formData: UserFormData) => Promise<void>
  user?: CompatibleUser | null
  title?: string
}

export function UserFormModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  user = null, 
  title = '添加用户' 
}: UserFormModalProps) {
  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    email: '',
    password: '',
    role: 'operator',
    organizationId: null
  })
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(false)

  // 角色选项
  const roles = ['super_admin', 'admin', 'operator']
  const roleNames: { [key: string]: string } = { 
    'super_admin': '超级管理员', 
    'admin': '管理员', 
    'operator': '运营' 
  }

  // 加载组织数据
  useEffect(() => {
    if (isOpen) {
      loadOrganizations()
    }
  }, [isOpen])

  // 初始化表单数据
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        password: '',
        role: user.role as 'super_admin' | 'admin' | 'operator',
        organizationId: user.organizationId || null
      })
    } else {
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'operator',
        organizationId: null
      })
    }
  }, [user, isOpen])

  const loadOrganizations = async () => {
    try {
      const response = await fetch('/api/admin/organizations')
      const data = await response.json()
      if (data.success) {
        setOrganizations(data.data || [])
      }
    } catch (error) {
      console.error('加载组织数据失败:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      await onSubmit(formData)
      onClose()
    } catch (error) {
      console.error('提交失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof UserFormData, value: string | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="userName">用户姓名 *</Label>
            <Input
              id="userName"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              required
              placeholder="请输入用户姓名"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="userEmail">用户邮箱 *</Label>
            <Input
              id="userEmail"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              required
              placeholder="请输入用户邮箱"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="userPassword">用户密码</Label>
            <Input
              id="userPassword"
              type="password"
              value={formData.password || ''}
              onChange={(e) => handleInputChange('password', e.target.value)}
              placeholder="留空则用户需要重置密码"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="userRole">用户角色 *</Label>
            <Select
              value={formData.role}
              onValueChange={(value) => handleInputChange('role', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择用户角色" />
              </SelectTrigger>
              <SelectContent>
                {roles.map(role => (
                  <SelectItem key={role} value={role}>
                    {roleNames[role]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="userOrganization">所属组织</Label>
            <Select
              value={formData.organizationId || 'none'}
              onValueChange={(value) => handleInputChange('organizationId', value === 'none' ? null : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择所属组织" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">无组织</SelectItem>
                {organizations.map(org => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              取消
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? '处理中...' : (user ? '保存' : '创建')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
