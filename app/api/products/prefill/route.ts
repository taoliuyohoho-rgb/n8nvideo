import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * 商品预填 API
 * 根据商品名查询商品库，返回可用字段（标题、卖点、图、规格、目标国家）
 * 不足部分标记需AI补全
 */
export async function POST(request: NextRequest) {
  try {
    const { productName } = await request.json()

    if (!productName || typeof productName !== 'string') {
      return NextResponse.json(
        { success: false, error: '商品名称必填' },
        { status: 400 }
      )
    }

    // 搜索商品库（SQLite 不支持 mode: 'insensitive'，使用小写匹配）
    const searchName = productName.toLowerCase()
    
    const allProducts = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        subcategory: true,
        sellingPoints: true,
        skuImages: true,
        targetCountries: true,
        targetAudience: true,
        painPoints: true,
        createdAt: true,
        updatedAt: true
      }
    })

    // 精确匹配（忽略大小写）
    const exactMatch = allProducts.find(p => p.name.toLowerCase() === searchName)

    // 模糊匹配（包含关键词）
    const fuzzyMatches = allProducts
      .filter(p => p.name.toLowerCase().includes(searchName))
      .slice(0, 5)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

    // 优先使用精确匹配，否则返回候选列表
    const primaryMatch = exactMatch || (fuzzyMatches.length > 0 ? fuzzyMatches[0] : null)

    if (!primaryMatch) {
      return NextResponse.json({
        success: true,
        data: {
          found: false,
          needsAI: {
            name: true,
            description: true,
            category: true,
            sellingPoints: true,
            skuImages: true,
            targetCountries: true
          },
          candidates: []
        }
      })
    }

    // 解析 JSON/数组 字段（兼容 Postgres JSON 与历史字符串）
    const toArray = (field: any): any[] => {
      if (!field) return []
      if (Array.isArray(field)) return field
      if (typeof field === 'string') {
        try {
          const v = JSON.parse(field)
          return Array.isArray(v) ? v : []
        } catch {
          return []
        }
      }
      return []
    }

    const sellingPoints = toArray(primaryMatch.sellingPoints)
    const skuImages = toArray(primaryMatch.skuImages)
    const targetCountries = toArray(primaryMatch.targetCountries)
    const painPoints = toArray(primaryMatch.painPoints)
    const targetAudience = toArray(primaryMatch.targetAudience)

    // 判断哪些字段需要AI补全
    const needsAI = {
      name: false, // 已有
      description: !primaryMatch.description || primaryMatch.description.trim() === '',
      category: !primaryMatch.category || primaryMatch.category === '未分类',
      sellingPoints: !sellingPoints || sellingPoints.length === 0,
      skuImages: !skuImages || skuImages.length === 0,
      targetCountries: !targetCountries || targetCountries.length === 0,
      targetAudience: !targetAudience || targetAudience.length === 0
    }

    // 返回预填数据
    return NextResponse.json({
      success: true,
      data: {
        found: true,
        product: {
          id: primaryMatch.id,
          name: primaryMatch.name,
          description: primaryMatch.description,
          category: primaryMatch.category,
          subcategory: primaryMatch.subcategory,
          sellingPoints,
          skuImages,
          targetCountries,
          painPoints,
          targetAudience
        },
        needsAI,
        candidates: fuzzyMatches.map((match) => ({
          id: match.id,
          name: match.name,
          category: match.category
        }))
      }
    })
  } catch (error) {
    console.error('商品预填失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '商品预填失败'
      },
      { status: 500 }
    )
  }
}

