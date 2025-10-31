import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import type { Resource, Action } from '../services/permission/permission.service';
import { PermissionService } from '../services/permission/permission.service'
import type { User } from '@prisma/client'

/**
 * 权限检查中间件
 */
export function requirePermission(resource: Resource, action: Action) {
  return async (req: NextRequest, context: any) => {
    try {
      // 从请求中获取用户信息（需要根据实际的认证方式调整）
      const user = await getCurrentUser(req)
      
      if (!user) {
        return NextResponse.json(
          { error: '未认证用户' },
          { status: 401 }
        )
      }

      // 检查权限
      const hasPermission = await PermissionService.checkPermission(user, resource, action)
      
      if (!hasPermission) {
        return NextResponse.json(
          { error: '权限不足' },
          { status: 403 }
        )
      }

      // 将用户信息添加到请求上下文中
      ;(req as any).user = user
      
      return null // 继续处理请求
    } catch (error) {
      console.error('权限检查失败:', error)
      return NextResponse.json(
        { error: '权限检查失败' },
        { status: 500 }
      )
    }
  }
}

/**
 * 组织权限检查中间件
 */
export function requireOrganizationAccess() {
  return async (req: NextRequest, context: any) => {
    try {
      const user = await getCurrentUser(req)
      
      if (!user) {
        return NextResponse.json(
          { error: '未认证用户' },
          { status: 401 }
        )
      }

      // 超级管理员可以访问所有组织
      if (PermissionService.isSuperAdmin(user)) {
        ;(req as any).user = user
        return null
      }

      // 其他角色必须有组织
      if (!user.organizationId) {
        return NextResponse.json(
          { error: '用户未分配到任何组织' },
          { status: 403 }
        )
      }

      ;(req as any).user = user
      return null
    } catch (error) {
      console.error('组织权限检查失败:', error)
      return NextResponse.json(
        { error: '组织权限检查失败' },
        { status: 500 }
      )
    }
  }
}

/**
 * 获取当前用户（需要根据实际的认证方式实现）
 */
async function getCurrentUser(req: NextRequest): Promise<User | null> {
  // TODO: 实现实际的用户认证逻辑
  // 这里需要根据你的认证方式（JWT、Session等）来获取当前用户
  // 暂时返回null，实际使用时需要实现
  return null
}

/**
 * 数据过滤装饰器
 */
export function withDataFilter<T extends Record<string, any>>(
  filterFn: (user: User) => T
) {
  return (req: NextRequest, context: any) => {
    const user = (req as any).user as User
    if (user) {
      const filter = filterFn(user)
      ;(req as any).dataFilter = filter
    }
    return null
  }
}
