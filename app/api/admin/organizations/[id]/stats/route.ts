import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { OrganizationService } from '@/src/services/organization/organization.service'
import { PermissionService, Resource, Action } from '@/src/services/permission/permission.service'

// 获取组织统计信息
export async function GET(
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
      Resource.ANALYTICS,
      Action.READ
    )
    
    if (!hasPermission) {
      return NextResponse.json({ error: '权限不足' }, { status: 403 })
    }

    const stats = await OrganizationService.getOrganizationStats(params.id, user)

    return NextResponse.json({
      success: true,
      data: stats
    })
  } catch (error: any) {
    console.error('获取组织统计失败:', error)
    return NextResponse.json(
      { error: error.message || '获取组织统计失败' },
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
