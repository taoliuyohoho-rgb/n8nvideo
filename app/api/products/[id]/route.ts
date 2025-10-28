import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// 删除商品
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // 级联清理：在删除商品前清理所有外键依赖，避免外键约束错误
    await prisma.$transaction(async (tx) => {
      // 1) 模板 → 视频/广告数据/视频分析 → 模板分析 → 模板
      const templates = await tx.template.findMany({ where: { productId: id }, select: { id: true } })
      const templateIds = templates.map(t => t.id)
      if (templateIds.length > 0) {
        const videos = await tx.video.findMany({ where: { templateId: { in: templateIds } }, select: { id: true } })
        const videoIds = videos.map(v => v.id)
        if (videoIds.length > 0) {
          await tx.adData.deleteMany({ where: { videoId: { in: videoIds } } })
          await tx.videoAnalysis.deleteMany({ where: { videoId: { in: videoIds } } })
          await tx.video.deleteMany({ where: { id: { in: videoIds } } })
        }
        await tx.templateAnalysis.deleteMany({ where: { templateId: { in: templateIds } } })
        await tx.template.deleteMany({ where: { id: { in: templateIds } } })
      }

      // 2) 解绑风格与商品关联（保留风格）
      await tx.style.updateMany({ where: { productId: id }, data: { productId: null } })

      // 3) 商品映射
      await tx.productMapping.deleteMany({ where: { productId: id } })

      // 4) 痛点及评论
      const painPoints = await tx.productPainPoint.findMany({ where: { productId: id }, select: { id: true } })
      const painPointIds = painPoints.map(p => p.id)
      if (painPointIds.length > 0) {
        await tx.productComment.deleteMany({ where: { painPointId: { in: painPointIds } } })
        await tx.productPainPoint.deleteMany({ where: { id: { in: painPointIds } } })
      }

      // 5) 最后删除商品本体
      await tx.product.delete({ where: { id } })
    })

    return NextResponse.json({
      success: true,
      message: '商品删除成功'
    })

  } catch (error) {
    console.error('删除商品失败:', error)
    return NextResponse.json(
      { success: false, error: '删除商品失败' },
      { status: 500 }
    )
  }
}

// 更新商品
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const data = await request.json()
    console.log('更新商品请求数据:', data)
    
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

    // 更新商品
    const product = await prisma.product.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description || '',
        category: data.category || '未分类',
        subcategory: data.subcategory || '',
        sellingPoints: Array.isArray(data.sellingPoints) ? data.sellingPoints : [],
        skuImages: Array.isArray(data.skuImages) ? JSON.stringify(data.skuImages) : JSON.stringify([]),
        targetCountries: Array.isArray(data.targetCountries) ? JSON.stringify(data.targetCountries) : JSON.stringify([]),
        targetAudience: data.targetAudience && Array.isArray(data.targetAudience) ? data.targetAudience : null,
        painPoints: data.painPoints && Array.isArray(data.painPoints) ? data.painPoints : null,
        painPointsLastUpdate: data.painPoints && Array.isArray(data.painPoints) && data.painPoints.length > 0 ? new Date() : undefined,
        painPointsSource: data.painPoints && Array.isArray(data.painPoints) && data.painPoints.length > 0 ? '手动编辑' : undefined
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

// 获取单个商品
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        templates: true,
        productMappings: true,
        painPointAnalyses: true
      }
    })

    if (!product) {
      return NextResponse.json(
        { success: false, error: '商品不存在' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: product
    })

  } catch (error) {
    console.error('获取商品失败:', error)
    return NextResponse.json(
      { success: false, error: '获取商品失败' },
      { status: 500 }
    )
  }
}
