import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { SearchService } from '@/src/services/search/SearchService'

/**
 * AI搜索竞品API
 * 基于商品信息自动搜索相关竞品
 */
export async function POST(request: NextRequest) {
  try {
    const {
      productId,
      query,
      searchType = 'competitor',
      maxItems,
      maxCharsPerItem,
      maxTotalChars
    } = await request.json()

    if (!productId) {
      return NextResponse.json(
        { success: false, error: '请先选择商品' },
        { status: 400 }
      )
    }

    // 获取商品信息
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        name: true,
        category: true,
        targetCountries: true,
        sellingPoints: true
      }
    })

    if (!product) {
      return NextResponse.json(
        { success: false, error: '商品不存在' },
        { status: 404 }
      )
    }

    // 处理targetCountries - 可能是字符串或数组
    let targetCountriesStr = '全球'
    if (product.targetCountries) {
      if (Array.isArray(product.targetCountries)) {
        targetCountriesStr = product.targetCountries.join(', ')
      } else if (typeof product.targetCountries === 'string') {
        targetCountriesStr = product.targetCountries
      }
    }

    // 构建搜索关键词
    let sellingPointsArray: string[] = []
    try {
      if (product.sellingPoints && typeof product.sellingPoints === 'string') {
        const parsed = JSON.parse(product.sellingPoints)
        if (Array.isArray(parsed)) {
          sellingPointsArray = parsed.map((sp: any) => typeof sp === 'string' ? sp : sp.point || sp).slice(0, 3)
        }
      } else if (Array.isArray(product.sellingPoints)) {
        sellingPointsArray = product.sellingPoints.map((sp: any) => typeof sp === 'string' ? sp : sp.point || sp).slice(0, 3)
      }
    } catch (error) {
      console.warn('Failed to parse sellingPoints:', error)
    }

    const searchKeywords = [
      query === 'auto' ? '' : query.trim(),
      product.name,
      product.category,
      ...sellingPointsArray
    ].filter(Boolean).join(' ')

    // 结果数量与长度限制（提供安全默认值与边界）
    const effectiveMaxItems = Math.min(Math.max(Number(maxItems ?? 6), 1), 10)
    const perItemCharLimit = Math.min(Math.max(Number(maxCharsPerItem ?? 180), 40), 600)
    const totalCharLimit = Math.min(Math.max(Number(maxTotalChars ?? 2000), 300), 10000)

    // 实际搜索（通过 SearchService 调用 Tavily 等 provider）
    const rawResults = await SearchService.search({
      query: searchKeywords,
      maxResults: effectiveMaxItems,
      language: 'zh',
      region: 'CN'
    })

    // 截断标题/描述并限制总字数
    const clamp = (text: string, limit: number) => {
      const t = String(text || '')
      if (t.length <= limit) return t
      return t.slice(0, Math.max(0, limit - 1)) + '…'
    }

    const trimmed = rawResults.slice(0, effectiveMaxItems).map(r => ({
      ...r,
      title: clamp(r.title, 100),
      description: clamp(r.description, perItemCharLimit)
    }))

    // 计算并在极端情况下做一次全局截断（仅影响描述，保留结构）
    let accumulated = 0
    const results = trimmed.map(r => {
      const remaining = totalCharLimit - accumulated
      if (remaining <= 0) {
        return { ...r, description: '' }
      }
      const desc = clamp(r.description, remaining)
      accumulated += desc.length
      return { ...r, description: desc }
    })

    console.log('AI Search completed:', {
      productId,
      searchQuery: query,
      searchType,
      resultsCount: results.length,
      keywords: searchKeywords
    })

    return NextResponse.json({
      success: true,
      data: {
        query,
        keywords: searchKeywords,
        results,
        images: results.flatMap(r => r.images || []).slice(0, 3),
        totalResults: results.length,
        searchTime: Date.now(),
        limits: {
          maxItems: effectiveMaxItems,
          maxCharsPerItem: perItemCharLimit,
          maxTotalChars: totalCharLimit
        }
      }
    })

  } catch (error: any) {
    console.error('AI搜索竞品失败:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'AI搜索失败',
        details: error.stack
      },
      { status: 500 }
    )
  }
}
