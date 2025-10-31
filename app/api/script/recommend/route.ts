/**
 * 脚本推荐 API
 * 根据商品特征推荐最适合的视频脚本
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { recommendRank } from '@/src/services/recommendation/recommend'
import '@/src/services/recommendation/index'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { productId, category, subcategory, region, channel, tone } = body

    if (!productId) {
      return NextResponse.json(
        { success: false, error: '缺少 productId' },
        { status: 400 }
      )
    }

    // 获取商品信息
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, name: true, category: true, subcategory: true }
    })

    if (!product) {
      return NextResponse.json(
        { success: false, error: '商品不存在' },
        { status: 404 }
      )
    }

    console.log('🤖 使用推荐引擎推荐脚本，商品:', product.name)

    // 使用推荐引擎（如果推荐引擎未配置，返回空结果）
    let scriptRecommendation
    try {
      scriptRecommendation = await recommendRank({
        scenario: 'product->script',
        task: {
          subjectRef: {
            entityType: 'product',
            entityId: productId
          },
          category: category || product.category,
          subcategory: subcategory || product.subcategory,
          tone: tone || 'professional'
        },
        context: {
          region: region || 'global',
          channel: channel || 'tiktok'
        }
      })
      console.log('✅ 脚本推荐完成:', scriptRecommendation.chosen)
    } catch (err) {
      console.warn('⚠️ 脚本推荐引擎暂不可用，返回空结果:', err instanceof Error ? err.message : err)
      // 返回空的推荐结果
      return NextResponse.json({
        success: true,
        data: {
          scripts: [],
          chosenScriptId: null,
          alternatives: [],
          decisionId: null,
          message: '推荐引擎暂不可用'
        }
      })
    }

    // 从推荐结果中获取脚本ID列表
    const recommendedScriptIds = scriptRecommendation.topK.map(c => c.id)

    if (recommendedScriptIds.length > 0) {
      // 从数据库获取完整的脚本信息
      const scripts = await prisma.script.findMany({
        where: {
          id: { in: recommendedScriptIds }
        },
        include: {
          product: {
            select: { id: true, name: true, category: true }
          },
          persona: {
            select: { id: true, name: true }
          }
        }
      })

      // 按推荐顺序排列
      const sortedScripts = recommendedScriptIds
        .map(id => scripts.find(s => s.id === id))
        .filter(Boolean)

      return NextResponse.json({
        success: true,
        data: {
          scripts: sortedScripts,
          chosenScriptId: sortedScripts[0]?.id,
          alternatives: sortedScripts.slice(1).map((s: any) => s.id),
          decisionId: scriptRecommendation.decisionId
        }
      })
    }

    // 没有推荐结果，返回空
    return NextResponse.json({
      success: true,
      data: {
        scripts: [],
        chosenScriptId: null,
        alternatives: [],
        decisionId: scriptRecommendation.decisionId
      }
    })

  } catch (error) {
    console.error('❌ 脚本推荐失败:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '脚本推荐失败' 
      },
      { status: 500 }
    )
  }
}

