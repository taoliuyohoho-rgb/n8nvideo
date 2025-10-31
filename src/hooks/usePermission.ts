import { useState, useEffect } from 'react'
import { UserRole, Resource, Action } from '../services/permission/permission.service'

// 权限矩阵定义（与后端保持一致）
const PERMISSIONS: Record<UserRole, Record<Resource, Action[]>> = {
  [UserRole.SUPER_ADMIN]: {
    [Resource.ORGANIZATIONS]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE, Action.MANAGE],
    [Resource.USERS]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE, Action.MANAGE],
    [Resource.PRODUCTS]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE, Action.MANAGE],
    [Resource.VIDEOS]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE, Action.MANAGE],
    [Resource.ANALYTICS]: [Action.READ]
  },
  [UserRole.ADMIN]: {
    [Resource.ORGANIZATIONS]: [],
    [Resource.USERS]: [Action.READ],
    [Resource.PRODUCTS]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE],
    [Resource.VIDEOS]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE],
    [Resource.ANALYTICS]: [Action.READ]
  },
  [UserRole.OPERATOR]: {
    [Resource.ORGANIZATIONS]: [],
    [Resource.USERS]: [],
    [Resource.PRODUCTS]: [],
    [Resource.VIDEOS]: [Action.CREATE, Action.READ],
    [Resource.ANALYTICS]: [Action.READ]
  }
}

interface User {
  id: string
  email: string
  role: UserRole
  organizationId?: string | null
}

interface UsePermissionReturn {
  hasPermission: (resource: Resource, action: Action) => boolean
  canAccess: (resource: Resource) => boolean
  isSuperAdmin: boolean
  isAdmin: boolean
  isOperator: boolean
  user: User | null
  loading: boolean
}

export function usePermission(): UsePermissionReturn {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // TODO: 从实际的认证系统获取用户信息
    // 这里暂时使用模拟数据
    const mockUser: User = {
      id: 'temp_user_id',
      email: 'admin@example.com',
      role: UserRole.SUPER_ADMIN,
      organizationId: null
    }
    
    setUser(mockUser)
    setLoading(false)
  }, [])

  const hasPermission = (resource: Resource, action: Action): boolean => {
    if (!user) return false
    
    const userPermissions = PERMISSIONS[user.role]
    if (!userPermissions) return false
    
    return userPermissions[resource]?.includes(action) || false
  }

  const canAccess = (resource: Resource): boolean => {
    if (!user) return false
    
    const userPermissions = PERMISSIONS[user.role]
    if (!userPermissions) return false
    
    return userPermissions[resource]?.length > 0 || false
  }

  const isSuperAdmin = user?.role === UserRole.SUPER_ADMIN
  const isAdmin = user?.role === UserRole.ADMIN
  const isOperator = user?.role === UserRole.OPERATOR

  return {
    hasPermission,
    canAccess,
    isSuperAdmin,
    isAdmin,
    isOperator,
    user,
    loading
  }
}

// 权限检查Hook（用于特定权限检查）
export function useHasPermission(resource: Resource, action: Action): boolean {
  const { hasPermission } = usePermission()
  return hasPermission(resource, action)
}

// 角色检查Hook
export function useRoleCheck() {
  const { isSuperAdmin, isAdmin, isOperator, user } = usePermission()
  
  return {
    isSuperAdmin,
    isAdmin,
    isOperator,
    userRole: user?.role,
    organizationId: user?.organizationId
  }
}
