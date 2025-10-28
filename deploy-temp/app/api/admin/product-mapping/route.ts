import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// 获取待确认的商品映射
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'pending'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const mappings = await prisma.productMapping.findMany({
      where: { status: status as any },
      include: {
        product: true
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' }
    })

    const total = await prisma.productMapping.count({
      where: { status: status as any }
    })

    return NextResponse.json({
      success: true,
      data: mappings,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('获取商品映射失败:', error)
    return NextResponse.json(
      { success: false, error: '获取商品映射失败' },
      { status: 500 }
    )
  }
}

// 创建新的商品映射
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      productId,
      platform,
      platformProductId,
      platformName,
      confidence,
      suggestedBy = 'manual'
    } = body

    const mapping = await prisma.productMapping.create({
      data: {
        productId,
        platform,
        platformProductId,
        platformName,
        confidence,
        status: 'pending',
        suggestedBy
      }
    })

    return NextResponse.json({
      success: true,
      data: mapping
    })

  } catch (error) {
    console.error('创建商品映射失败:', error)
    return NextResponse.json(
      { success: false, error: '创建商品映射失败' },
      { status: 500 }
    )
  }
}

// 确认或拒绝商品映射
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status, confirmedBy } = body

    if (!['confirmed', 'rejected'].includes(status)) {
      return NextResponse.json(
        { success: false, error: '无效的状态' },
        { status: 400 }
      )
    }

    const mapping = await prisma.productMapping.update({
      where: { id },
      data: {
        status: status as any,
        confirmedAt: new Date(),
        confirmedBy
      }
    })

    return NextResponse.json({
      success: true,
      data: mapping
    })

  } catch (error) {
    console.error('更新商品映射失败:', error)
    return NextResponse.json(
      { success: false, error: '更新商品映射失败' },
      { status: 500 }
    )
  }
}
