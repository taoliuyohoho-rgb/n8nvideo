import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'


// 获取所有用户
export async function GET(request: NextRequest) {
  try {
    // TODO: 从认证中获取当前用户
    const currentUser = await getCurrentUser(request)
    if (!currentUser) {
      return NextResponse.json({ error: '未认证用户' }, { status: 401 })
    }

    // 根据用户角色过滤数据
    const whereClause: any = {}
    
    if (currentUser.role === 'admin' && currentUser.organizationId) {
      // 管理员只能看到自己组织的用户
      whereClause.organizationId = currentUser.organizationId
    } else if (currentUser.role === 'operator') {
      // 运营只能看到自己
      whereClause.id = currentUser.id
    }
    // 超级管理员可以看到所有用户（whereClause为空）

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        organizationId: true,
        organization: {
          select: {
            id: true,
            name: true
          }
        },
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            videos: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      data: users
    })
  } catch (error) {
    console.error('获取用户列表失败:', error)
    return NextResponse.json(
      { success: false, error: '获取用户列表失败' },
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

// 创建新用户
export async function POST(request: NextRequest) {
  try {
    const { email, name, password, role = 'operator' } = await request.json()

    // 验证必填字段
    if (!email || !name) {
      return NextResponse.json(
        { success: false, error: '邮箱和姓名是必填项' },
        { status: 400 }
      )
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: '邮箱格式不正确' },
        { status: 400 }
      )
    }

    // 检查邮箱是否已存在
    const existingUserByEmail = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUserByEmail) {
      return NextResponse.json(
        { success: false, error: '该邮箱已被使用' },
        { status: 400 }
      )
    }

    // 检查用户名是否已存在
    const existingUserByName = await prisma.user.findFirst({
      where: { name }
    })

    if (existingUserByName) {
      return NextResponse.json(
        { success: false, error: '该用户名已被使用' },
        { status: 400 }
      )
    }

    // 验证角色
    const validRoles = ['admin', 'operator']
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { success: false, error: '无效的用户角色' },
        { status: 400 }
      )
    }

    // 创建用户
    const userData: any = {
      email,
      name,
      role,
      isActive: true
    }

    // 如果提供了密码，则加密存储
    if (password) {
      const saltRounds = 10
      userData.password = await bcrypt.hash(password, saltRounds)
    }

    const user = await prisma.user.create({
      data: userData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            videos: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: user,
      message: '用户创建成功'
    })
  } catch (error) {
    console.error('创建用户失败:', error)
    return NextResponse.json(
      { success: false, error: '创建用户失败' },
      { status: 500 }
    )
  }
}
