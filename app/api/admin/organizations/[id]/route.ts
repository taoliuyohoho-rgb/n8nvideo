import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { OrganizationService } from '@/src/services/organization/organization.service'
import { PermissionService, Resource, Action } from '@/src/services/permission/permission.service'

// 获取组织详情
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
      Resource.ORGANIZATIONS,
      Action.READ
    )
    
    if (!hasPermission) {
      return NextResponse.json({ error: '权限不足' }, { status: 403 })
    }

    const organization = await OrganizationService.getOrganizationById(params.id, user)
    
    if (!organization) {
      return NextResponse.json({ error: '组织不存在' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: organization
    })
  } catch (error) {
    console.error('获取组织详情失败:', error)
    return NextResponse.json(
      { error: '获取组织详情失败' },
      { status: 500 }
    )
  }
}

// 更新组织信息
export async function PUT(
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
    const { name, description, isActive } = body

    const organization = await OrganizationService.updateOrganization(
      params.id,
      { name, description, isActive },
      user
    )

    return NextResponse.json({
      success: true,
      data: organization,
      message: '组织更新成功'
    })
  } catch (error: any) {
    console.error('更新组织失败:', error)
    return NextResponse.json(
      { error: error.message || '更新组织失败' },
      { status: 500 }
    )
  }
}

// 删除组织
export async function DELETE(
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
      Action.DELETE
    )
    
    if (!hasPermission) {
      return NextResponse.json({ error: '权限不足' }, { status: 403 })
    }

    await OrganizationService.deleteOrganization(params.id, user)

    return NextResponse.json({
      success: true,
      message: '组织删除成功'
    })
  } catch (error: any) {
    console.error('删除组织失败:', error)
    return NextResponse.json(
      { error: error.message || '删除组织失败' },
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
