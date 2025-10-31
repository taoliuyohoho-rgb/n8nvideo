import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // 简单的硬编码验证
    // 超管账号
    if (email === 'superadmin@126.com' && password === 'dongnanyaqifei') {
      return NextResponse.json({
        success: true,
        data: {
          id: 'superadmin-001',
          email: 'superadmin@126.com',
          name: '超级管理员',
          role: 'super_admin',
          isActive: true
        },
        message: '登录成功'
      })
    }
    
    // 普通管理员账号（可以访问管理后台）
    if (email === 'admin@126.com' && password === 'dongnanyaqifei') {
      return NextResponse.json({
        success: true,
        data: {
          id: 'admin-001',
          email: 'admin@126.com',
          name: '管理员',
          role: 'admin',
          isActive: true
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
