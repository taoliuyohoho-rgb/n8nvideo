/**
 * Prompt生成历史记录API
 * GET: 查询历史记录列表
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')
    const productName = searchParams.get('productName')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')

    // 构建查询条件
    const where: Record<string, unknown> = {}
    if (productId) {
      where.productId = productId
    }
    if (productName) {
      where.productName = { contains: productName }
    }
    if (status) {
      where.status = status
    }

    // 查询总数
    const total = await prisma.promptGenerationHistory.count({ where })

    // 查询列表
    const histories = await prisma.promptGenerationHistory.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        productId: true,
        productName: true,
        productCategory: true,
        generatedPrompt: true,
        promptTemplate: true,
        modelUsed: true,
        status: true,
        metadata: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    return NextResponse.json({
      success: true,
      data: histories,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      }
    })

  } catch (error) {
    console.error('查询Prompt历史记录错误:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '查询失败' 
      },
      { status: 500 }
    )
  }
}

