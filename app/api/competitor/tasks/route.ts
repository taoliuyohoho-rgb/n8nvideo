import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId') || undefined
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    const where: any = {}
    if (productId) where.productId = productId

    const [tasks, total] = await Promise.all([
      prisma.competitorAnalysis.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.competitorAnalysis.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: { tasks, pagination: { page, limit, total, pages: Math.ceil(total / limit) } }
    })
  } catch (e) {
    return NextResponse.json({ success: false, error: '获取竞品任务失败' }, { status: 500 })
  }
}


