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
        categories: categories.map(c => c.category),
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
