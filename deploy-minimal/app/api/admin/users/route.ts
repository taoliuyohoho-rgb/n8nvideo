import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// 获取所有用户
export async function GET(request: NextRequest) {
  try {
    const users = await prisma.user.findMany({
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

    // 检查邮箱是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: '该邮箱已被使用' },
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
