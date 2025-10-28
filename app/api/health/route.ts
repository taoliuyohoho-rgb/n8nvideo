import { NextResponse } from 'next/server'

/**
 * 健康检查 API
 * 用于检查服务是否正常运行
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'n8nvideo'
  })
}