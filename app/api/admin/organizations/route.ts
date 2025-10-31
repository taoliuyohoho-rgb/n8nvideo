import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { OrganizationService } from '@/src/services/organization/organization.service'
import { PermissionService, Resource, Action } from '@/src/services/permission/permission.service'

// 获取组织列表
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
      Action.READ
    )
    
    if (!hasPermission) {
      return NextResponse.json({ error: '权限不足' }, { status: 403 })
    }

    const organizations = await OrganizationService.getOrganizations(user)
    
    return NextResponse.json({
      success: true,
      data: organizations
    })
  } catch (error) {
    console.error('获取组织列表失败:', error)
    return NextResponse.json(
      { error: '获取组织列表失败' },
      { status: 500 }
    )
  }
}

// 创建组织
export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { name, description, adminUserId } = body

    // 验证必填字段
    if (!name || !adminUserId) {
      return NextResponse.json(
        { error: '组织名称和管理员用户为必填项' },
        { status: 400 }
      )
    }

    const result = await OrganizationService.createOrganization(
      {
        name,
        description,
        adminUserId
      },
      user.id
    )

    return NextResponse.json({
      success: true,
      data: result,
      message: '组织创建成功'
    })
  } catch (error: any) {
    console.error('创建组织失败:', error)
    return NextResponse.json(
      { error: error.message || '创建组织失败' },
      { status: 500 }
    )
  }
}

// 获取当前用户（临时实现，需要根据实际认证方式调整）
async function getCurrentUser(request: NextRequest) {
  // TODO: 实现实际的用户认证逻辑
  // 这里需要根据你的认证方式（JWT、Session等）来获取当前用户
  // 暂时返回一个模拟用户，实际使用时需要实现
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
