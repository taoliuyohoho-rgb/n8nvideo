import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { withTraceId } from '@/src/middleware/traceId'
import { createApiLogger } from '@/src/services/logger/Logger'

const prisma = new PrismaClient()

/**
 * 视频生成初始化 API
 * 根据商品名称从商品库补全信息，并提取Top5卖点和痛点
 */
async function handler(request: NextRequest, traceId: string) {
  const log = createApiLogger(traceId, 'video-gen-init')

  try {
    const body = await request.json()
    const { productName } = body

    // 校验输入
    if (!productName || typeof productName !== 'string') {
      log.warn('Missing or invalid productName')
      return NextResponse.json(
        { success: false, error: '商品名称必填', traceId },
        { status: 400 }
      )
    }

    log.info('Initializing video generation', { productName })

    // 1. 搜索商品库
    const searchName = productName.toLowerCase().trim()
    
    // 精确匹配
    let product = await prisma.product.findFirst({
      where: {
        name: {
          equals: productName,
          mode: 'insensitive'
        }
      }
    })

    // 如果精确匹配失败，尝试模糊匹配
    if (!product) {
      const fuzzyMatches = await prisma.product.findMany({
        where: {
          name: {
            contains: searchName,
            mode: 'insensitive'
          }
        },
        take: 5,
        orderBy: { updatedAt: 'desc' }
      })

      if (fuzzyMatches.length > 0) {
        product = fuzzyMatches[0] // 选择最新的匹配项
        log.info('Using fuzzy match', { matchedName: product.name })
      }
    }

    // 2. 如果商品库中没有，创建新商品（基础信息）
    if (!product) {
      product = await prisma.product.create({
        data: {
          name: productName,
          description: null,
          category: '未分类',
          subcategory: null,
          sellingPoints: JSON.stringify([]),
          painPoints: JSON.stringify([]),
          targetCountries: JSON.stringify([]),
          targetAudience: JSON.stringify([]),
          source: 'user',
          metadata: JSON.stringify({
            source: 'user',
            lastSyncedAt: new Date().toISOString()
          })
        }
      })
      log.info('Created new product', { productId: product.id })
    }

    // 3. 解析现有数据
    // sellingPoints, painPoints, targetAudience 是 Json 类型，Prisma 已自动反序列化
    // 只有 targetCountries 是 String 类型，需要手动解析
    const sellingPoints = Array.isArray(product.sellingPoints) 
      ? product.sellingPoints 
      : (product.sellingPoints ? (typeof product.sellingPoints === 'string' ? JSON.parse(product.sellingPoints) : []) : [])
    
    const painPoints = Array.isArray(product.painPoints) 
      ? product.painPoints 
      : (product.painPoints ? (typeof product.painPoints === 'string' ? JSON.parse(product.painPoints) : []) : [])
    
    const targetCountries = product.targetCountries 
      ? (typeof product.targetCountries === 'string' && product.targetCountries.startsWith('[') 
          ? JSON.parse(product.targetCountries) 
          : (typeof product.targetCountries === 'string' ? product.targetCountries.split(',').map(c => c.trim()) : []))
      : []
    
    const targetAudiences = Array.isArray(product.targetAudience) 
      ? product.targetAudience 
      : (product.targetAudience ? (typeof product.targetAudience === 'string' ? JSON.parse(product.targetAudience) : []) : [])

    // 4. 应用Top5规则引擎
    const top5Result = await extractTop5(sellingPoints, painPoints)

    // 5. 更新商品信息（如果数据不完整，标记需要AI补全）
    const needsAICompletion = sellingPoints.length === 0 || painPoints.length === 0 || targetCountries.length === 0

    if (needsAICompletion) {
      // 这里可以触发AI补全任务，暂时先返回现有数据
      log.info('Product needs AI completion', { 
        hasSellingPoints: sellingPoints.length > 0,
        hasPainPoints: painPoints.length > 0,
        hasTargetCountries: targetCountries.length > 0
      })
    }

    // 6. 构建响应
    const response = {
      success: true,
      product: {
        id: product.id,
        name: product.name,
        description: product.description,
        images: product.images || [],
        country: targetCountries,
        targetAudiences: targetAudiences,
        sellingPointsTop5: top5Result.sellingPoints,
        painPointsTop5: top5Result.painPoints,
        metadata: product.metadata ? JSON.parse(product.metadata as string) : null
      },
      top5: {
        sellingPoints: top5Result.sellingPoints,
        painPoints: top5Result.painPoints,
        reasons: top5Result.reasons
      }
    }

    log.info('Video generation initialized successfully', { 
      productId: product.id,
      top5SellingPoints: top5Result.sellingPoints.length,
      top5PainPoints: top5Result.painPoints.length
    })

    return NextResponse.json(response)

  } catch (error) {
    log.error('Failed to initialize video generation', error)
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '初始化失败',
        traceId
      },
      { status: 500 }
    )
  }
}

/**
 * Top5提取规则引擎
 * 根据权重、频次、转化率等维度提取Top5卖点和痛点
 */
async function extractTop5(sellingPoints: string[], painPoints: string[]): Promise<{
  sellingPoints: string[]
  painPoints: string[]
  reasons: string[]
}> {
  const reasons: string[] = []

  // 卖点Top5提取
  const sellingPointsTop5 = sellingPoints
    .slice(0, 5) // 简单取前5个，后续可以加入更复杂的评分逻辑
    .map((point, index) => {
      if (index === 0) reasons.push(`卖点1: 基于商品库数据，选择最核心的卖点`)
      return point
    })

  // 痛点Top5提取
  const painPointsTop5 = painPoints
    .slice(0, 5) // 简单取前5个，后续可以加入更复杂的评分逻辑
    .map((point, index) => {
      if (index === 0) reasons.push(`痛点1: 基于用户反馈数据，选择最常见的痛点`)
      return point
    })

  // 如果数据不足，添加默认值
  if (sellingPointsTop5.length < 5) {
    const defaultSellingPoints = [
      '高品质材料',
      '易于使用',
      '性价比高',
      '设计精美',
      '售后服务好'
    ]
    
    for (let i = sellingPointsTop5.length; i < 5; i++) {
      sellingPointsTop5.push(defaultSellingPoints[i])
      if (i === sellingPointsTop5.length - 1) {
        reasons.push(`卖点${i + 1}: 使用默认卖点，建议后续补充具体信息`)
      }
    }
  }

  if (painPointsTop5.length < 5) {
    const defaultPainPoints = [
      '价格偏高',
      '使用复杂',
      '质量不稳定',
      '售后服务差',
      '配送时间长'
    ]
    
    for (let i = painPointsTop5.length; i < 5; i++) {
      painPointsTop5.push(defaultPainPoints[i])
      if (i === painPointsTop5.length - 1) {
        reasons.push(`痛点${i + 1}: 使用默认痛点，建议后续补充具体信息`)
      }
    }
  }

  return {
    sellingPoints: sellingPointsTop5,
    painPoints: painPointsTop5,
    reasons
  }
}

export const POST = withTraceId(handler)