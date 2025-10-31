import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { OrganizationService } from '@/src/services/organization/organization.service'
import { PermissionService, Resource, Action } from '@/src/services/permission/permission.service'

// 分配管理员
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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

    const body = await request.json()
    const { adminEmail, adminName } = body

    // 验证必填字段
    if (!adminEmail) {
      return NextResponse.json(
        { error: '管理员邮箱为必填项' },
        { status: 400 }
      )
    }

    const admin = await OrganizationService.assignAdmin(
      params.id,
      adminEmail,
      adminName,
      user.id
    )

    return NextResponse.json({
      success: true,
      data: admin,
      message: '管理员分配成功'
    })
  } catch (error: any) {
    console.error('分配管理员失败:', error)
    return NextResponse.json(
      { error: error.message || '分配管理员失败' },
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
