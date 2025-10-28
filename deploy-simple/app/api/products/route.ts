import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// 获取商品列表
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

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        select: {
          id: true,
          name: true,
          description: true,
          category: true,
          subcategory: true,
          sellingPoints: true,
          targetCountries: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit
      }),
      prisma.product.count({ where })
    ])

    // 获取所有类目用于筛选
    const categories = await prisma.product.findMany({
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' }
    })

    return NextResponse.json({
      success: true,
      data: {
        products,
        categories: categories.map((c: any) => c.category),
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total
        }
      }
    })

  } catch (error) {
    console.error('获取商品列表失败:', error)
    return NextResponse.json(
      { success: false, error: '获取商品列表失败' },
      { status: 500 }
    )
  }
}

// 创建商品
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    // 验证必填字段
    if (!data.name) {
      return NextResponse.json(
        { success: false, error: '商品名称是必填项' },
        { status: 400 }
      )
    }

    // 处理自定义类目
    if (data.category === 'custom') {
      data.category = data.customCategory || '未分类'
    }

    // 创建商品
    const product = await prisma.product.create({
      data: {
        name: data.name,
        description: data.description || '',
        category: data.category || '未分类',
        subcategory: data.subcategory || '',
        sellingPoints: Array.isArray(data.sellingPoints) ? JSON.stringify(data.sellingPoints) : JSON.stringify([]),
        skuImages: Array.isArray(data.skuImages) ? JSON.stringify(data.skuImages) : JSON.stringify([]),
        targetCountries: Array.isArray(data.targetCountries) ? JSON.stringify(data.targetCountries) : JSON.stringify([])
      }
    })

    return NextResponse.json({
      success: true,
      data: product,
      message: '商品创建成功'
    })

  } catch (error) {
    console.error('创建商品失败:', error)
    return NextResponse.json(
      { success: false, error: '创建商品失败' },
      { status: 500 }
    )
  }
}

// 更新商品
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json()
    console.log('更新商品请求数据:', data)
    
    // 验证必填字段
    if (!data.id || !data.name) {
      return NextResponse.json(
        { success: false, error: '商品ID和名称是必填项' },
        { status: 400 }
      )
    }

    // 处理自定义类目
    if (data.category === 'custom') {
      data.category = data.customCategory || '未分类'
    }

    // 更新商品
    const product = await prisma.product.update({
      where: { id: data.id },
      data: {
        name: data.name,
        description: data.description || '',
        category: data.category || '未分类',
        subcategory: data.subcategory || '',
        sellingPoints: Array.isArray(data.sellingPoints) ? JSON.stringify(data.sellingPoints) : JSON.stringify([]),
        skuImages: Array.isArray(data.skuImages) ? JSON.stringify(data.skuImages) : JSON.stringify([]),
        targetCountries: Array.isArray(data.targetCountries) ? JSON.stringify(data.targetCountries) : JSON.stringify([])
      }
    })

    return NextResponse.json({
      success: true,
      data: product,
      message: '商品更新成功'
    })

  } catch (error) {
    console.error('更新商品失败:', error)
    return NextResponse.json(
      { success: false, error: '更新商品失败' },
      { status: 500 }
    )
  }
}
