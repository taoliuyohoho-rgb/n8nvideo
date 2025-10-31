import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { PermissionService, Resource, Action } from '@/src/services/permission/permission.service'

// 从组织中移除成员
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; userId: string } }
) {
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
      Action.UPDATE
    )
    
    if (!hasPermission) {
      return NextResponse.json({ error: '权限不足' }, { status: 403 })
    }

    // 检查用户是否属于该组织
    const targetUser = await prisma.user.findFirst({
      where: {
        id: params.userId,
        organizationId: params.id
      }
    })

    if (!targetUser) {
      return NextResponse.json(
        { error: '用户不属于该组织' },
        { status: 404 }
      )
    }

    // 从组织中移除用户
    await prisma.user.update({
      where: { id: params.userId },
      data: { organizationId: null }
    })

    return NextResponse.json({
      success: true,
      message: '成员移除成功'
    })
  } catch (error: any) {
    console.error('移除成员失败:', error)
    return NextResponse.json(
      { error: error.message || '移除成员失败' },
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
