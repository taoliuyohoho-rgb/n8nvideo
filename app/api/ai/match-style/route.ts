import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { recommendRank } from '@/src/services/recommendation/recommend'
import '@/src/services/recommendation/index'


export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      productName,
      category,
      targetCountry,
      sellingPoints,
      targetAudience
    } = body

    // 调用推荐系统进行风格匹配（product->style）
    const recommendation = await recommendRank({
      scenario: 'product->style' as any,
      task: {
        subjectRef: { entityType: 'product', entityId: productName }, // 用产品名作标识
        category: category,
        contentType: 'video'
      },
      context: {
        region: targetCountry,
        audience: targetAudience
      },
      constraints: {
        maxLatencyMs: 5000
      }
    })

    const chosenStyleId = recommendation.chosen.id
    const selectedStyle = await prisma.template.findUnique({ where: { id: chosenStyleId } })
    
    // 构建所有候选（chosen + alternatives）
    const allCandidateIds = [
      recommendation.chosen.id,
      recommendation.alternatives.fineTop2?.id,
      ...(recommendation.alternatives.coarseExtras || []).map((c: any) => c.id),
      ...(recommendation.alternatives.outOfPool || []).map((c: any) => c.id)
    ].filter(Boolean)
    
    const allCandidates = await prisma.template.findMany({
      where: { id: { in: allCandidateIds } }
    })

    const sortedStyles = allCandidates.map(t => ({
      ...t,
      matchScore: t.id === chosenStyleId ? (recommendation.chosen.fineScore || 1) * 100 : 50
    }))

    // 记录模板分析
    if (selectedStyle) {
      await prisma.templateAnalysis.create({
        data: {
          templateId: selectedStyle.id,
          analysis: JSON.stringify({
            productName,
            category,
            targetCountry,
            decisionId: recommendation.decisionId,
            matchScore: recommendation.chosen.fineScore || 0,
            matchReasons: ['推荐系统选择', 'AI评分']
          }),
          score: (recommendation.chosen.fineScore || 0) * 100
        }
      })
    }

    return NextResponse.json({
      success: true,
      selectedStyle,
      allCandidates: sortedStyles.slice(0, 5),
      matchScore: (recommendation.chosen.fineScore || 0) * 100,
      decisionId: recommendation.decisionId
    })

  } catch (error) {
    console.error('风格匹配错误:', error)
    return NextResponse.json(
      { success: false, error: '风格匹配失败' },
      { status: 500 }
    )
  }
}
