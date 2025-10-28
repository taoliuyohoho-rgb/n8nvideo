import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// 获取所有产品痛点分析
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')
    const platform = searchParams.get('platform')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    const where: any = {}
    if (productId) where.productId = productId
    if (platform) where.platform = platform

    const [painPoints, total] = await Promise.all([
      prisma.productPainPoint.findMany({
        where,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              category: true
            }
          },
          comments: {
            take: 5,
            orderBy: {
              createdAt: 'desc'
            }
          },
          _count: {
            select: {
              comments: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.productPainPoint.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: {
        painPoints,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    })
  } catch (error) {
    console.error('获取痛点分析失败:', error)
    return NextResponse.json(
      { success: false, error: '获取痛点分析失败' },
      { status: 500 }
    )
  }
}

// 创建新的痛点分析
export async function POST(request: NextRequest) {
  try {
    const {
      productId,
      platform,
      productUrl,
      productName,
      painPoints,
      painCategories,
      severity,
      frequency,
      keywords,
      sentiment,
      sourceData
    } = await request.json()

    // 验证必填字段
    if (!productId || !platform || !productName || !painPoints) {
      return NextResponse.json(
        { success: false, error: '产品ID、平台、产品名称和痛点是必填项' },
        { status: 400 }
      )
    }

    // 检查产品是否存在
    const product = await prisma.product.findUnique({
      where: { id: productId }
    })

    if (!product) {
      return NextResponse.json(
        { success: false, error: '产品不存在' },
        { status: 404 }
      )
    }

    const painPoint = await prisma.productPainPoint.create({
      data: {
        productId,
        platform,
        productUrl,
        productName,
        painPoints: JSON.stringify(painPoints),
        painCategories: painCategories ? JSON.stringify(painCategories) : null,
        severity,
        frequency,
        keywords: keywords ? JSON.stringify(keywords) : null,
        sentiment,
        sourceData: sourceData ? JSON.stringify(sourceData) : null
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            category: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: painPoint,
      message: '痛点分析创建成功'
    })
  } catch (error) {
    console.error('创建痛点分析失败:', error)
    return NextResponse.json(
      { success: false, error: '创建痛点分析失败' },
      { status: 500 }
    )
  }
}
