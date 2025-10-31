import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    
    if (action === 'auth') {
      // 启动OAuth授权流程
      const clientId = process.env.GOOGLE_CLIENT_ID
      const host = request.headers.get('x-forwarded-host') || request.headers.get('host')
      const proto = request.headers.get('x-forwarded-proto') || (process.env.NODE_ENV === 'production' ? 'https' : 'http')
      const origin = host ? `${proto}://${host}` : undefined
      const redirectUri = process.env.GOOGLE_REDIRECT_URI || (origin ? `${origin}/api/auth/google/callback` : undefined)
      const scope = 'https://www.googleapis.com/auth/spreadsheets.readonly'
      
      if (!clientId || !redirectUri) {
        return NextResponse.json(
          { success: false, error: 'Google OAuth 配置不完整（缺少 Client ID 或重定向URI）' },
          { status: 400 }
        )
      }
      
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${clientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `response_type=code&` +
        `scope=${encodeURIComponent(scope)}&` +
        `access_type=offline&` +
        `prompt=consent`
      
      return NextResponse.json({
        success: true,
        authUrl,
        message: '请访问授权URL完成OAuth认证'
      })
    }
    
    return NextResponse.json(
      { success: false, error: '无效的操作' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Google OAuth 启动失败:', error)
    return NextResponse.json(
      { success: false, error: 'OAuth 启动失败' },
      { status: 500 }
    )
  }
}
