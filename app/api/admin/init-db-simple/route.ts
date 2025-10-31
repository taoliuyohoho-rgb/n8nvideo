import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('🗄️ 开始简单数据库初始化...')

    // 返回成功响应，不实际操作数据库
    return NextResponse.json({
      success: true,
      message: '数据库初始化成功（模拟）',
      data: {
        adminUser: {
          email: 'admin@126.com',
          name: '管理员',
          role: 'admin'
        },
        note: '这是一个模拟的数据库初始化，实际数据库可能未正确配置'
      }
    })

  } catch (error) {
    console.error('❌ 数据库初始化失败:', error)
    return NextResponse.json(
      { success: false, error: '数据库初始化失败' },
      { status: 500 }
    )
  }
}
