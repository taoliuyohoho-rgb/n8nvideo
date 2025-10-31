import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { ProductInfo } from '@/types/persona'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('categoryId')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')

    // 构建查询条件
    const where: any = {}

    if (categoryId) {
      where.categoryId = categoryId
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    // 获取商品列表
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        select: {
          id: true,
          name: true,
          description: true,
          category: true,
          categoryId: true,
          subcategory: true,
          sellingPoints: true,
          targetAudience: true,
          targetCountries: true
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize
      }),
      prisma.product.count({ where })
    ])

    // 转换数据格式
    const result: ProductInfo[] = products.map(product => ({
      id: product.id,
      name: product.name,
      description: product.description || undefined,
      category: product.category,
      categoryId: product.categoryId || undefined,
      subcategory: product.subcategory || undefined,
      sellingPoints: Array.isArray(product.sellingPoints) 
        ? product.sellingPoints as string[]
        : undefined,
      targetAudience: product.targetAudience || undefined,
      targetCountries: Array.isArray(product.targetCountries)
        ? product.targetCountries as string[]
        : undefined
    }))

    return NextResponse.json({
      success: true,
      data: {
        products: result,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      }
    })

  } catch (error) {
    console.error('获取商品列表失败:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: '获取商品列表失败' 
      },
      { status: 500 }
    )
  }
}
