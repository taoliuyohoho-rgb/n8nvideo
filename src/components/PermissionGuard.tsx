import React from 'react'
import type { Resource, Action } from '../services/permission/permission.service'
import { usePermission } from '../hooks/usePermission'

interface PermissionGuardProps {
  resource: Resource
  action: Action
  children: React.ReactNode
  fallback?: React.ReactNode
  requireAll?: boolean // 是否需要所有权限
  permissions?: Array<{ resource: Resource; action: Action }> // 多个权限检查
}

/**
 * 权限守卫组件
 * 根据用户权限决定是否渲染子组件
 */
export function PermissionGuard({
  resource,
  action,
  children,
  fallback = null,
  requireAll = false,
  permissions
}: PermissionGuardProps) {
  const { hasPermission, loading } = usePermission()

  if (loading) {
    return <div>加载中...</div>
  }

  // 单个权限检查
  if (!permissions) {
    if (hasPermission(resource, action)) {
      return <>{children}</>
    }
    return <>{fallback}</>
  }

  // 多个权限检查
  const hasAllPermissions = permissions.every(({ resource: res, action: act }) =>
    hasPermission(res, act)
  )
  
  const hasAnyPermission = permissions.some(({ resource: res, action: act }) =>
    hasPermission(res, act)
  )

  const shouldRender = requireAll ? hasAllPermissions : hasAnyPermission

  if (shouldRender) {
    return <>{children}</>
  }

  return <>{fallback}</>
}

/**
 * 角色守卫组件
 */
interface RoleGuardProps {
  roles: string[]
  children: React.ReactNode
  fallback?: React.ReactNode
  requireAll?: boolean
}

export function RoleGuard({
  roles,
  children,
  fallback = null,
  requireAll = false
}: RoleGuardProps) {
  const { user, loading } = usePermission()

  if (loading) {
    return <div>加载中...</div>
  }

  if (!user) {
    return <>{fallback}</>
  }

  const hasRole = roles.includes(user.role)
  const hasAllRoles = roles.every(role => user.role === role)
  
  const shouldRender = requireAll ? hasAllRoles : hasRole

  if (shouldRender) {
    return <>{children}</>
  }

  return <>{fallback}</>
}

/**
 * 组织权限守卫组件
 */
interface OrganizationGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  allowSuperAdmin?: boolean // 是否允许超级管理员访问
}

export function OrganizationGuard({
  children,
  fallback = null,
  allowSuperAdmin = true
}: OrganizationGuardProps) {
  const { user, isSuperAdmin, loading } = usePermission()

  if (loading) {
    return <div>加载中...</div>
  }

  if (!user) {
    return <>{fallback}</>
  }

  // 超级管理员可以访问所有内容
  if (allowSuperAdmin && isSuperAdmin) {
    return <>{children}</>
  }

  // 其他用户必须有组织
  if (!user.organizationId) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
