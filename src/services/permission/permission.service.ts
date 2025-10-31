import type { User } from '@prisma/client'

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  OPERATOR = 'operator'
}

export enum Resource {
  ORGANIZATIONS = 'organizations',
  USERS = 'users',
  PRODUCTS = 'products',
  VIDEOS = 'videos',
  ANALYTICS = 'analytics'
}

export enum Action {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  MANAGE = 'manage'
}

// 权限矩阵定义
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
    [Resource.PRODUCTS]: [Action.READ, Action.UPDATE], // operator 可以查看和编辑商品（仅痛点、卖点、目标受众），不能添加和删除
    [Resource.VIDEOS]: [Action.CREATE, Action.READ],
    [Resource.ANALYTICS]: [Action.READ]
  }
}

export class PermissionService {
  /**
   * 检查用户是否有特定权限
   */
  static async checkPermission(
    user: User,
    resource: Resource,
    action: Action,
    targetOrganizationId?: string
  ): Promise<boolean> {
    const userRole = user.role as UserRole
    const userPermissions = PERMISSIONS[userRole]
    
    if (!userPermissions) {
      return false
    }
    
    // 检查是否有基础权限
    const hasBasicPermission = userPermissions[resource]?.includes(action)
    if (!hasBasicPermission) {
      return false
    }
    
    // 组织隔离检查
    // admin 和 operator 只能访问自己组织的资源
    if ((userRole === UserRole.ADMIN || userRole === UserRole.OPERATOR) && 
        targetOrganizationId && 
        targetOrganizationId !== user.organizationId) {
      return false
    }
    
    return true
  }

  /**
   * 获取数据过滤条件
   */
  static getDataFilter(user: User): Record<string, any> {
    const userRole = user.role as UserRole
    
    switch (userRole) {
      case UserRole.SUPER_ADMIN:
        return {} // 无限制
      case UserRole.ADMIN:
        // 管理员必须有组织，无组织则无权限
        if (!user.organizationId) {
          return { id: 'nonexistent' } // 无权限
        }
        return { organizationId: user.organizationId }
      case UserRole.OPERATOR:
        // operator 也只能看自己组织的数据
        if (!user.organizationId) {
          return { id: 'nonexistent' } // 无权限
        }
        return { organizationId: user.organizationId }
      default:
        return { id: 'nonexistent' } // 无权限
    }
  }

  /**
   * 获取视频数据过滤条件（特殊处理）
   */
  static getVideoDataFilter(user: User): Record<string, any> {
    const userRole = user.role as UserRole
    
    switch (userRole) {
      case UserRole.SUPER_ADMIN:
        return {} // 无限制
      case UserRole.ADMIN:
        // 管理员必须有组织，无组织则无权限
        if (!user.organizationId) {
          return { id: 'nonexistent' } // 无权限
        }
        // 管理员可以看到组织内所有用户的视频
        return { 
          user: {
            organizationId: user.organizationId
          }
        }
      case UserRole.OPERATOR:
        return { userId: user.id }
      default:
        return { id: 'nonexistent' } // 无权限
    }
  }

  /**
   * 检查用户是否可以访问特定资源
   */
  static async canAccessResource(
    user: User,
    resource: Resource,
    resourceId?: string,
    resourceOrganizationId?: string
  ): Promise<boolean> {
    const userRole = user.role as UserRole
    
    // 超级管理员可以访问所有资源
    if (userRole === UserRole.SUPER_ADMIN) {
      return true
    }
    
    // 管理员只能访问自己组织的资源
    if (userRole === UserRole.ADMIN) {
      return resourceOrganizationId === user.organizationId
    }
    
    // 运营只能访问自己的资源
    if (userRole === UserRole.OPERATOR) {
      // 对于视频，需要检查userId
      if (resource === Resource.VIDEOS && resourceId) {
        // 这里需要查询数据库获取视频的userId
        // 暂时返回true，实际使用时需要传入正确的userId
        return true
      }
      return false
    }
    
    return false
  }

  /**
   * 获取用户可访问的组织列表
   */
  static getAccessibleOrganizations(user: User): string[] | null {
    const userRole = user.role as UserRole
    
    switch (userRole) {
      case UserRole.SUPER_ADMIN:
        return null // 可以访问所有组织
      case UserRole.ADMIN:
        return user.organizationId ? [user.organizationId] : []
      case UserRole.OPERATOR:
        return user.organizationId ? [user.organizationId] : []
      default:
        return []
    }
  }

  /**
   * 检查无组织用户的权限范围
   */
  static getUnassignedUserPermissions(user: User): {
    canAccess: boolean
    reason: string
    allowedResources: Resource[]
  } {
    const userRole = user.role as UserRole
    
    switch (userRole) {
      case UserRole.SUPER_ADMIN:
        return {
          canAccess: true,
          reason: '超级管理员无组织限制',
          allowedResources: Object.keys(Resource) as Resource[]
        }
      case UserRole.ADMIN:
        return {
          canAccess: false,
          reason: '管理员必须分配到组织才能使用系统',
          allowedResources: []
        }
      case UserRole.OPERATOR:
        return {
          canAccess: true,
          reason: '运营可以独立使用视频生成功能',
          allowedResources: [Resource.VIDEOS, Resource.ANALYTICS]
        }
      default:
        return {
          canAccess: false,
          reason: '未知角色',
          allowedResources: []
        }
    }
  }

  /**
   * 检查用户是否为超级管理员
   */
  static isSuperAdmin(user: User): boolean {
    return user.role === UserRole.SUPER_ADMIN
  }

  /**
   * 检查用户是否为管理员
   */
  static isAdmin(user: User): boolean {
    return user.role === UserRole.ADMIN
  }

  /**
   * 检查用户是否为运营
   */
  static isOperator(user: User): boolean {
    return user.role === UserRole.OPERATOR
  }
}
