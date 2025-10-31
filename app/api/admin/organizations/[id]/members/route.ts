import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { PermissionService, Resource, Action } from '@/src/services/permission/permission.service'

// 添加成员到组织
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: '用户ID为必填项' },
        { status: 400 }
      )
    }

    // 检查组织是否存在
    const organization = await prisma.organization.findUnique({
      where: { id: params.id }
    })

    if (!organization) {
      return NextResponse.json(
        { error: '组织不存在' },
        { status: 404 }
      )
    }

    // 检查用户是否存在且没有组织
    const targetUser = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!targetUser) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      )
    }

    if (targetUser.organizationId) {
      return NextResponse.json(
        { error: '用户已经属于其他组织' },
        { status: 400 }
      )
    }

    // 将用户添加到组织
    await prisma.user.update({
      where: { id: userId },
      data: { organizationId: params.id }
    })

    return NextResponse.json({
      success: true,
      message: '成员添加成功'
    })
  } catch (error: any) {
    console.error('添加成员失败:', error)
    return NextResponse.json(
      { error: error.message || '添加成员失败' },
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
