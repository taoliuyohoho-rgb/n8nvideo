import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// 获取风格列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const category = searchParams.get('category')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: any = {}
    
    // 搜索条件
    if (search) {
      where.name = {
        contains: search
      }
    }
    
    // 类目筛选
    if (category && category !== 'all') {
      where.category = category
    }

    const [styles, total, categories] = await Promise.all([
      prisma.style.findMany({
        where,
        select: {
          id: true,
          name: true,
          description: true,
          category: true,
          subcategory: true,
          tone: true,
          scriptStructure: true,
          visualStyle: true,
          targetAudience: true,
          productId: true,
          templatePerformance: true,
          hookPool: true,
          targetCountries: true,
          isActive: true,
          createdAt: true,
          product: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit
      }),
      prisma.style.count({ where }),
      // 从商品库获取所有类目
      prisma.product.findMany({
        select: { category: true },
        distinct: ['category'],
        orderBy: { category: 'asc' }
      })
    ])

    return NextResponse.json({
      success: true,
      data: {
        styles,
        categories: categories.map((c: any) => c.category), // 从商品库拉取的类目
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total
        }
      }
    })

  } catch (error) {
    console.error('获取风格列表失败:', error)
    return NextResponse.json(
      { success: false, error: '获取风格列表失败' },
      { status: 500 }
    )
  }
}

// 创建风格
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    // 验证必填字段
    if (!data.name) {
      return NextResponse.json(
        { success: false, error: '风格名称是必填项' },
        { status: 400 }
      )
    }

    if (!data.category) {
      return NextResponse.json(
        { success: false, error: '类目是必填项' },
        { status: 400 }
      )
    }

    // 验证类目是否存在于商品库中
    const categoryExists = await prisma.product.findFirst({
      where: { category: data.category }
    })

    if (!categoryExists) {
      return NextResponse.json(
        { success: false, error: `类目 "${data.category}" 不存在于商品库中，请先创建该类目的商品` },
        { status: 400 }
      )
    }

    // 验证关联的商品是否存在（如果提供了productId）
    if (data.productId) {
      const product = await prisma.product.findUnique({
        where: { id: data.productId }
      })
      if (!product) {
        return NextResponse.json(
          { success: false, error: '关联的商品不存在' },
          { status: 400 }
        )
      }
    }

    // 创建风格
    const style = await prisma.style.create({
      data: {
        name: data.name,
        description: data.description || '',
        category: data.category, // 从商品库拉取的类目，不允许自定义
        subcategory: data.subcategory || '',
        tone: data.tone || 'professional',
        scriptStructure: data.scriptStructure ? JSON.stringify(data.scriptStructure) : null,
        visualStyle: data.visualStyle ? JSON.stringify(data.visualStyle) : null,
        targetAudience: data.targetAudience ? JSON.stringify(data.targetAudience) : null,
        productId: data.productId || null,
        templatePerformance: data.templatePerformance || null,
        hookPool: data.hookPool ? JSON.stringify(data.hookPool) : null,
        targetCountries: data.targetCountries ? JSON.stringify(data.targetCountries) : null,
        isActive: data.isActive !== undefined ? data.isActive : true
      }
    })

    return NextResponse.json({
      success: true,
      data: style,
      message: '风格创建成功'
    })

  } catch (error) {
    console.error('创建风格失败:', error)
    return NextResponse.json(
      { success: false, error: '创建风格失败' },
      { status: 500 }
    )
  }
}
