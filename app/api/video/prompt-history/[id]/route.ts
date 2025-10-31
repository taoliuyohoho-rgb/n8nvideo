/**
 * Prompt生成历史详情API
 * GET: 查询单条历史记录详情
 */

import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json(
        { success: false, error: '缺少历史记录ID' },
        { status: 400 }
      )
    }

    const history = await prisma.promptGenerationHistory.findUnique({
      where: { id }
    })

    if (!history) {
      return NextResponse.json(
        { success: false, error: '历史记录不存在' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: history,
    })

  } catch (error) {
    console.error('查询Prompt历史详情错误:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '查询失败' 
      },
      { status: 500 }
    )
  }
}

