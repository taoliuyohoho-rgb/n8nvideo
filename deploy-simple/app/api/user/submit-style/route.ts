import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// 用户提交风格信息
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      userId,
      styleData,
      source,
      sourceVideoId,
      sourceUrl,
      targetId // 如果是修改现有风格
    } = body

    if (!userId || !styleData) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // 创建用户提交记录
    const submission = await prisma.userSubmission.create({
      data: {
        userId,
        type: 'style',
        targetId,
        data: JSON.stringify(styleData),
        source: source || 'user_modified',
        sourceVideoId,
        sourceUrl
      }
    })

    return NextResponse.json({
      success: true,
      data: submission,
      message: '风格信息已提交，等待管理员审核'
    })

  } catch (error) {
    console.error('Submit style failed:', error)
    return NextResponse.json(
      { error: 'Failed to submit style' },
      { status: 500 }
    )
  }
}
