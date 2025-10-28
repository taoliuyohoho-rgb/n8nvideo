import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const prompt = await prisma.promptTemplate.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        content: true,
        variables: true,
        performance: true,
        successRate: true,
        usageCount: true
      }
    })

    if (!prompt) {
      return NextResponse.json(
        { success: false, error: 'Prompt不存在' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      ...prompt
    })
  } catch (error) {
    console.error('获取Prompt失败:', error)
    return NextResponse.json(
      { success: false, error: '获取失败' },
      { status: 500 }
    )
  }
}

