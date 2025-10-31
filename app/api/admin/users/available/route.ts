import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { PermissionService, Resource, Action } from '@/src/services/permission/permission.service'

// 获取可用的用户列表（用于分配管理员）
export async function GET(request: NextRequest) {
  try {
    // TODO: 从认证中获取当前用户
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: '未认证用户' }, { status: 401 })
    }

    // 检查权限
    const hasPermission = await PermissionService.checkPermission(
      user,
      Resource.ORGANIZATIONS,
      Action.CREATE
    )
    
    if (!hasPermission) {
      return NextResponse.json({ error: '权限不足' }, { status: 403 })
    }

    // 获取没有组织的用户（可以分配为管理员）
    const availableUsers = await prisma.user.findMany({
      where: {
        organizationId: null,
        isActive: true
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      data: availableUsers
    })
  } catch (error) {
    console.error('获取可用用户列表失败:', error)
    return NextResponse.json(
      { error: '获取可用用户列表失败' },
      { status: 500 }
    )
  }
}

// 获取当前用户（临时实现，需要根据实际认证方式调整）
async function getCurrentUser(request: NextRequest) {
  // TODO: 实现实际的用户认证逻辑
  return {
    id: 'temp_user_id',
    email: 'admin@example.com',
    name: 'Admin User',
    password: null,
    role: 'super_admin',
    organizationId: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
}
