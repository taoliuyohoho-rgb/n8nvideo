import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// 验证商品名称并返回模糊匹配结果
export async function POST(request: NextRequest) {
  try {
    const { productName } = await request.json()

    if (!productName) {
      return NextResponse.json(
        { success: false, error: '商品名称不能为空' },
        { status: 400 }
      )
    }

    // 精确匹配
    const exactMatch = await prisma.product.findFirst({
      where: {
        name: {
          equals: productName
        }
      },
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        subcategory: true,
        sellingPoints: true,
        targetCountries: true
      }
    })

    if (exactMatch) {
      return NextResponse.json({
        success: true,
        data: {
          exists: true,
          exactMatch: exactMatch,
          fuzzyMatches: []
        }
      })
    }

    // 模糊匹配
    const fuzzyMatches = await prisma.product.findMany({
      where: {
        name: {
          contains: productName
        }
      },
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        subcategory: true
      },
      take: 10,
      orderBy: { name: 'asc' }
    })

    return NextResponse.json({
      success: true,
      data: {
        exists: false,
        exactMatch: null,
        fuzzyMatches
      }
    })

  } catch (error) {
    console.error('商品验证失败:', error)
    return NextResponse.json(
      { success: false, error: '商品验证失败' },
      { status: 500 }
    )
  }
}
