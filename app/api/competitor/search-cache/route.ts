import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { EvidenceService } from '@/src/services/scraping/EvidenceService'

// 保存 AI 搜索结果到证据库（用于下次默认填充）
export async function POST(request: NextRequest) {
  try {
    const { productId, text, images } = await request.json()

    if (!productId || !text) {
      return NextResponse.json(
        { success: false, error: 'productId 与 text 为必填项' },
        { status: 400 }
      )
    }

    // 校验商品存在
    const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true, name: true } })
    if (!product) {
      return NextResponse.json(
        { success: false, error: '商品不存在' },
        { status: 404 }
      )
    }

    const evidenceService = new EvidenceService()
    const evidenceId = await evidenceService.saveEvidence({
      productId,
      platform: 'ai-search',
      url: 'ai-search',
      title: 'AI搜索结果缓存',
      description: String(text).slice(0, 10000), // 防止超长
      images: Array.isArray(images) ? images.filter(Boolean).map(String).slice(0, 10) : [],
      targetMarkets: [],
      targetAudiences: [],
      sellingPoints: [],
      painPoints: [],
      angles: [],
      evidenceMeta: {
        capturedAt: new Date().toISOString(),
        parserVer: '1.0',
        source: 'ai-search-cache'
      },
      rawContent: undefined
    })

    return NextResponse.json({ success: true, data: { id: evidenceId } })
  } catch (error) {
    console.error('保存AI搜索缓存失败:', error)
    return NextResponse.json(
      { success: false, error: '保存AI搜索缓存失败' },
      { status: 500 }
    )
  }
}

// 读取最近一次 AI 搜索缓存
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')

    if (!productId) {
      return NextResponse.json(
        { success: false, error: '缺少 productId' },
        { status: 400 }
      )
    }

    const evidence = await prisma.productEvidence.findFirst({
      where: { productId, platform: 'ai-search' },
      orderBy: { createdAt: 'desc' },
      select: { description: true, images: true, updatedAt: true, title: true }
    })

    if (!evidence) {
      return NextResponse.json({ success: true, data: null })
    }

    return NextResponse.json({
      success: true,
      data: {
        text: evidence.description || '',
        images: Array.isArray(evidence.images) ? evidence.images : [],
        updatedAt: evidence.updatedAt,
        title: evidence.title
      }
    })
  } catch (error) {
    console.error('读取AI搜索缓存失败:', error)
    return NextResponse.json(
      { success: false, error: '读取AI搜索缓存失败' },
      { status: 500 }
    )
  }
}


