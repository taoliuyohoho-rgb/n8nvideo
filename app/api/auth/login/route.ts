import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: '邮箱和密码是必填项' },
        { status: 400 }
      )
    }

    // 查找用户
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: '用户不存在' },
        { status: 401 }
      )
    }

    if (!user.isActive) {
      return NextResponse.json(
        { success: false, error: '账户已被禁用' },
        { status: 401 }
      )
    }

    // 验证密码
    if (!user.password) {
      return NextResponse.json(
        { success: false, error: '密码未设置' },
        { status: 401 }
      )
    }

    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, error: '密码错误' },
        { status: 401 }
      )
    }

    // 返回用户信息（不包含密码）
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json({
      success: true,
      data: {
        user: userWithoutPassword,
        message: '登录成功'
      }
    })

  } catch (error) {
    console.error('Login failed:', error)
    return NextResponse.json(
      { success: false, error: '登录失败' },
      { status: 500 }
    )
  }
}
