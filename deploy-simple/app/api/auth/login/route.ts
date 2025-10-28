import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // 验证必填字段
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: '邮箱和密码是必填项' },
        { status: 400 }
      )
    }

    // 简单的硬编码验证（临时解决方案）
    if (email === 'admin@126.com' && password === 'dongnanyaqifei') {
      return NextResponse.json({
        success: true,
        data: {
          id: 'admin-001',
          email: 'admin@126.com',
          name: '管理员',
          role: 'admin',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          _count: {
            videos: 0
          }
        },
        message: '登录成功'
      })
    }

    return NextResponse.json(
      { success: false, error: '邮箱或密码错误' },
      { status: 401 }
    )

  } catch (error) {
    console.error('登录失败:', error)
    return NextResponse.json(
      { success: false, error: '登录失败，请重试' },
      { status: 500 }
    )
  }
}