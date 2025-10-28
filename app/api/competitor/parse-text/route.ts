import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { aiExecutor } from '@/src/services/ai/AiExecutor'

const prisma = new PrismaClient()

/**
 * 竞品文本解析API
 * 用户输入竞品商详文本，AI解析出卖点/痛点，去重后添加到商品库
 */
export async function POST(request: NextRequest) {
  try {
    const { productId, competitorText, competitorUrl } = await request.json()

    if (!competitorText || typeof competitorText !== 'string') {
      return NextResponse.json(
        { success: false, error: '竞品文本必填' },
        { status: 400 }
      )
    }

    // TODO: 调用AI解析竞品文本，提取卖点和痛点
    // 这里先做简单的分割处理，后续接入真实AI
    const parsedData = await parseCompetitorText(competitorText)

    if (!productId) {
      // 如果没有productId，只返回解析结果，不更新数据库
      return NextResponse.json({
        success: true,
        data: {
          sellingPoints: parsedData.sellingPoints,
          painPoints: parsedData.painPoints,
          message: '解析成功，请选择商品后再添加到商品库'
        }
      })
    }

    // 查询现有商品的卖点和痛点
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        sellingPoints: true,
        painPoints: true
      }
    })

    if (!product) {
      return NextResponse.json(
        { success: false, error: '商品不存在' },
        { status: 404 }
      )
    }

    // 解析现有数据
    const parseJSON = (field: string | null): string[] => {
      if (!field) return []
      try {
        const parsed = JSON.parse(field)
        return Array.isArray(parsed) ? parsed : []
      } catch {
        return []
      }
    }

    const existingSellingPoints = parseJSON(String(product.sellingPoints))
    const existingPainPoints = parseJSON(String(product.painPoints))

    // 去重合并（小写比较，避免重复）
    const mergeUnique = (existing: string[], newItems: string[]): string[] => {
      const existingLower = new Set(existing.map(s => s.toLowerCase().trim()))
      const merged = [...existing]
      
      for (const item of newItems) {
        const trimmed = item.trim()
        if (trimmed && !existingLower.has(trimmed.toLowerCase())) {
          merged.push(trimmed)
          existingLower.add(trimmed.toLowerCase())
        }
      }
      
      return merged
    }

    const updatedSellingPoints = mergeUnique(existingSellingPoints, parsedData.sellingPoints)
    const updatedPainPoints = mergeUnique(existingPainPoints, parsedData.painPoints)

    // 更新商品库
    await prisma.product.update({
      where: { id: productId },
      data: {
        sellingPoints: JSON.stringify(updatedSellingPoints),
        painPoints: JSON.stringify(updatedPainPoints),
        lastUserUpdate: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        addedSellingPoints: parsedData.sellingPoints.length,
        addedPainPoints: parsedData.painPoints.length,
        totalSellingPoints: updatedSellingPoints.length,
        totalPainPoints: updatedPainPoints.length,
        sellingPoints: updatedSellingPoints,
        painPoints: updatedPainPoints
      }
    })
  } catch (error) {
    console.error('竞品文本解析失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '解析失败'
      },
      { status: 500 }
    )
  }
}

/**
 * 使用AI解析竞品文本（真实AI实现）
 */
async function parseCompetitorText(text: string): Promise<{
  sellingPoints: string[]
  painPoints: string[]
}> {
  try {
    const prompt = `请分析以下竞品商详文本，提取出：
1. 卖点（产品特性、优势、功能、材质、技术、设计等）
2. 痛点（用户问题、困扰、需求、缺点等）

要求：
- 每个卖点/痛点独立成句，简洁明确（5-20字）
- 卖点至少提取3个，最多10个
- 痛点至少提取1个，最多5个
- 以JSON格式返回：{"sellingPoints": ["卖点1", "卖点2", ...], "painPoints": ["痛点1", "痛点2", ...]}

竞品文本：
${text}

请直接返回JSON，不要有其他说明文字。`

    // 使用aiExecutor调用AI
    const response = await aiExecutor.enqueue(() =>
      aiExecutor.execute({
        provider: 'gemini', // 使用Gemini，可根据配置调整
        prompt,
        useSearch: false
      })
    )

    // 解析AI返回的JSON
    const cleanResponse = response.trim().replace(/^```json\s*/, '').replace(/\s*```$/, '')
    const parsed = JSON.parse(cleanResponse)

    // 验证并清洗数据
    const sellingPoints = Array.isArray(parsed.sellingPoints) 
      ? parsed.sellingPoints.filter((p: any) => typeof p === 'string' && p.trim().length > 0)
      : []
    
    const painPoints = Array.isArray(parsed.painPoints)
      ? parsed.painPoints.filter((p: any) => typeof p === 'string' && p.trim().length > 0)
      : []

    // 如果AI返回为空，降级到简单提取
    if (sellingPoints.length === 0) {
      const lines = text.split(/[。，；\n]/).map(l => l.trim()).filter(Boolean)
      sellingPoints.push(...lines.filter(l => l.length > 2 && l.length < 50).slice(0, 5))
    }

    return {
      sellingPoints: sellingPoints.slice(0, 10),
      painPoints: painPoints.slice(0, 5)
    }
  } catch (error) {
    console.error('AI解析失败，使用降级逻辑:', error)
    
    // 降级：简单关键词提取
    const lines = text.split(/[。，；\n]/).map(l => l.trim()).filter(Boolean)
    const sellingPoints = lines.filter(l => l.length > 2 && l.length < 50).slice(0, 5)
    const painPoints: string[] = []
    
    return { sellingPoints, painPoints }
  }
}

