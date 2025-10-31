import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { PersonaListItem } from '@/types/persona'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    const search = searchParams.get('search')
    const categoryId = searchParams.get('categoryId')
    const productId = searchParams.get('productId')

    // 构建查询条件
    const where: any = {
      isActive: true
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (categoryId) {
      where.categoryId = categoryId
    }

    if (productId) {
      where.productId = productId
    }

    // 获取人设列表
    const [personas, total] = await Promise.all([
      prisma.persona.findMany({
        where,
        select: {
          id: true,
          name: true,
          description: true,
          categoryId: true,
          productId: true,
          createdAt: true,
          updatedAt: true,
          isActive: true,
          category: {
            select: {
              name: true
            }
          },
          product: {
            select: {
              name: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize
      }),
      prisma.persona.count({ where })
    ])

    // 转换数据格式
    const result: PersonaListItem[] = personas.map(persona => ({
      id: persona.id,
      name: persona.name,
      description: persona.description || undefined,
      categoryName: persona.category.name,
      productName: persona.product?.name || undefined,
      createdAt: persona.createdAt.toISOString(),
      updatedAt: persona.updatedAt.toISOString(),
      isActive: persona.isActive
    }))

    return NextResponse.json({
      success: true,
      data: {
        personas: result,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      }
    })

  } catch (error) {
    console.error('获取人设列表失败:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: '获取人设列表失败' 
      },
      { status: 500 }
    )
  }
}
