import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

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

    // 粗排阶段：基于基本字段匹配
    const roughCandidates = await prisma.template.findMany({
      where: {
        isActive: true,
        OR: [
          { recommendedCategories: { contains: category } },
          { targetCountries: { contains: targetCountry } }
        ]
      },
      take: 10
    })

    // 精排阶段：使用更多维度进行匹配
    const scoredStyles = roughCandidates.map((template: any) => {
      let score = 0
      
      // 类目匹配分数
      if (template.recommendedCategories.includes(category)) {
        score += 30
      }
      
      // 目标国家匹配分数
      if (template.targetCountries.includes(targetCountry)) {
        score += 25
      }
      
      // 语调匹配分数（基于产品类型）
      if (category === '电子产品' && template.tonePool.includes('professional')) {
        score += 20
      } else if (category === '美妆护肤' && template.tonePool.includes('elegant')) {
        score += 20
      } else if (category === '运动健身' && template.tonePool.includes('energetic')) {
        score += 20
      }
      
      // 目标受众匹配分数
      if (targetAudience && template.tonePool) {
        // 基于语调池进行匹配
        if (template.tonePool.includes('professional') && targetAudience.includes('business')) {
          score += 15
        }
        if (template.tonePool.includes('casual') && targetAudience.includes('young')) {
          score += 15
        }
      }
      
      return {
        ...template,
        matchScore: score
      }
    })

    // 按分数排序，选择最高分的风格
    const sortedStyles = scoredStyles.sort((a: any, b: any) => b.matchScore - a.matchScore)
    const selectedStyle = sortedStyles[0]

    // 记录模板分析
    if (selectedStyle) {
      await prisma.templateAnalysis.create({
        data: {
          templateId: selectedStyle.id,
          analysis: JSON.stringify({
            productName,
            category,
            targetCountry,
            matchScore: selectedStyle.matchScore,
            matchReasons: [
              '类目匹配',
              '目标国家匹配',
              '语调匹配',
              '受众匹配'
            ]
          }),
          score: selectedStyle.matchScore
        }
      })
    }

    return NextResponse.json({
      success: true,
      selectedStyle: selectedStyle,
      allCandidates: sortedStyles.slice(0, 5), // 返回前5个候选
      matchScore: selectedStyle?.matchScore || 0
    })

  } catch (error) {
    console.error('风格匹配错误:', error)
    return NextResponse.json(
      { success: false, error: '风格匹配失败' },
      { status: 500 }
    )
  }
}
