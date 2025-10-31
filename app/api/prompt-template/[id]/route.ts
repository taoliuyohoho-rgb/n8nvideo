import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * 获取 Prompt 模板详情
 * GET /api/prompt-template/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Prompt模板ID不能为空' },
        { status: 400 }
      )
    }

    const template = await prisma.promptTemplate.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        businessModule: true,
        content: true,
        variables: true,
        description: true,
        performance: true,
        usageCount: true,
        successRate: true,
        isActive: true,
        isDefault: true,
        inputRequirements: true,
        outputRequirements: true,
        outputRules: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    if (!template) {
      return NextResponse.json(
        { success: false, error: 'Prompt模板不存在' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: template
    })
  } catch (error) {
    console.error('获取Prompt模板详情失败:', error)
    return NextResponse.json(
      { success: false, error: '服务器错误' },
      { status: 500 }
    )
  }
}

