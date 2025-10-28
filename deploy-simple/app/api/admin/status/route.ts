import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      message: '应用运行正常',
      data: {
        status: 'running',
        database: 'not_configured',
        admin: {
          email: 'admin@126.com',
          password: 'dongnanyaqifei',
          note: '请使用这些凭据登录'
        }
      }
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: '状态检查失败' },
      { status: 500 }
    )
  }
}
