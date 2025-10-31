import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const error = searchParams.get('error')
    
    if (error) {
      return NextResponse.json(
        { success: false, error: `OAuth 授权失败: ${error}` },
        { status: 400 }
      )
    }
    
    if (!code) {
      return NextResponse.json(
        { success: false, error: '未收到授权码' },
        { status: 400 }
      )
    }
    
    // 使用授权码换取访问令牌
    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host')
    const proto = request.headers.get('x-forwarded-proto') || (process.env.NODE_ENV === 'production' ? 'https' : 'http')
    const origin = host ? `${proto}://${host}` : undefined
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || (origin ? `${origin}/api/auth/google/callback` : undefined)
    
    if (!clientId || !clientSecret || !redirectUri) {
      return NextResponse.json(
        { success: false, error: 'Google OAuth 配置不完整' },
        { status: 400 }
      )
    }
    
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    })
    
    const tokenData = await tokenResponse.json()
    
    if (!tokenResponse.ok) {
      return NextResponse.json(
        { success: false, error: `令牌获取失败: ${tokenData.error}` },
        { status: 400 }
      )
    }
    
    // 验证访问令牌
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    })
    
    if (!userInfoResponse.ok) {
      return NextResponse.json(
        { success: false, error: '令牌验证失败' },
        { status: 400 }
      )
    }
    
    const userInfo = await userInfoResponse.json()
    
    return NextResponse.json({
      success: true,
      message: 'Google OAuth 认证成功',
      data: {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        user: userInfo,
        expiresIn: tokenData.expires_in
      }
    })
  } catch (error) {
    console.error('Google OAuth 回调处理失败:', error)
    return NextResponse.json(
      { success: false, error: 'OAuth 回调处理失败' },
      { status: 500 }
    )
  }
}
