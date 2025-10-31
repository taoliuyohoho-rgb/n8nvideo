import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { callModel } from '@/src/services/ai/contract'
import { recommendRank } from '@/src/services/recommendation/recommend'

/**
 * AI自动匹配人设的类目和商品
 * 基于人设的详细信息，使用AI推荐最匹配的类目和商品
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      personaName,
      description,
      personaContent,
      targetCountry
    } = body

    if (!personaName) {
      return NextResponse.json(
        { success: false, error: '缺少人设名称' },
        { status: 400 }
      )
    }

    // 从 Category 表获取所有可用的类目
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        description: true,
        targetMarket: true,
        _count: {
          select: { products: true }
        }
      },
      orderBy: { name: 'asc' }
    })

    // 转换为所需格式
    const categoriesWithCount = categories.map(c => ({
      id: c.id,
      name: c.name,
      description: c.description,
      productCount: c._count.products
    }))

    // 获取商品列表
    const products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        category: true,
        categoryId: true,
        description: true
      },
      where: {
        categoryId: { in: categoriesWithCount.map(c => c.id) }
      },
      take: 500
    })

    // 构建人设描述
    const personaDescription = buildPersonaDescription(personaName, description, personaContent, targetCountry)

    console.log('🤖 开始AI匹配:', { personaName, categoriesCount: categoriesWithCount.length, productsCount: products.length })

    // 使用推荐引擎获取最佳模型
    const modelRecommendation = await recommendRank({
      scenario: 'task->model',
      task: {
        taskType: 'persona.category-match',
        contentType: 'text',
        jsonRequirement: true,
        language: 'zh',
        category: personaName,
        region: targetCountry
      },
      context: {
        region: targetCountry,
        channel: 'admin'
      },
      constraints: {
        maxCostUSD: 0.05,
        requireJsonMode: true
      }
    })

    // 获取最佳Prompt模板
    const promptRecommendation = await recommendRank({
      scenario: 'task->prompt',
      task: {
        taskType: 'persona.category-match',
        contentType: 'text',
        jsonRequirement: true,
        category: personaName,
        region: targetCountry
      },
      context: {
        region: targetCountry,
        channel: 'admin'
      }
    })

    const selectedModelId = modelRecommendation.chosen.id
    const selectedPromptId = promptRecommendation.chosen.id

    console.log('🎯 AI推荐:', {
      model: selectedModelId,
      modelScore: modelRecommendation.chosen.fineScore,
      prompt: selectedPromptId,
      promptScore: promptRecommendation.chosen.fineScore
    })

    // 使用推荐的模型分析类目
    const categoryPrompt = `你是一个电商人设分析专家。根据以下人设信息，从给定的商品类目列表中选择最匹配的类目。

人设信息：
${personaDescription}

可选类目列表（按商品数量排序）：
${categoriesWithCount.map((c, i) => `${i + 1}. ${c.name} (${c.id}) - 含${c.productCount}个商品${c.description ? `\n   描述: ${c.description}` : ''}`).join('\n')}

请分析这个人设最可能购买哪些类目的商品，选择3-5个最相关的类目。
考虑因素：
1. 人设的职业、年龄、收入水平
2. 生活方式和使用场景
3. 目标市场的特点
4. 价格敏感度和品质期望

输出JSON格式：
{
  "categories": [
    {
      "categoryId": "类目ID",
      "categoryName": "类目名称",
      "reason": "推荐理由（50字以内）",
      "matchScore": 匹配分数0-100
    }
  ]
}`

    const categoryResult = await callModel({
      model: selectedModelId,
      messages: [{ role: 'user', content: categoryPrompt }],
      options: {
        temperature: 0.3,
        response_format: { type: 'json_object' }
      }
    })

    let matchedCategories: Array<{ categoryId: string, categoryName: string, reason: string, matchScore: number }> = []
    try {
      const parsed = JSON.parse(categoryResult.content)
      matchedCategories = parsed.categories || []
    } catch (err) {
      console.error('解析AI返回的类目失败:', err)
      // 回退到简单的关键词匹配
      return fallbackMatching(personaName, description, categoriesWithCount, products)
    }

    // 基于匹配的类目，推荐商品
    const matchedCategoryIds = matchedCategories.map(c => c.categoryId)
    const relevantProducts = products.filter(p => 
      p.categoryId && matchedCategoryIds.includes(p.categoryId)
    )

    if (relevantProducts.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          categories: matchedCategories,
          products: [],
          message: '找到匹配的类目，但这些类目下暂无商品'
        }
      })
    }

    // 使用推荐的模型推荐商品（限制在前30个，避免token过多）
    const productPrompt = `你是一个电商商品推荐专家。根据以下人设信息，从给定的商品列表中选择最匹配的商品。

人设信息：
${personaDescription}

可选商品列表：
${relevantProducts.slice(0, 30).map((p, i) => 
  `${i + 1}. ${p.name} (${p.id}) - 类目: ${p.category}${p.description ? `\n   描述: ${p.description.substring(0, 100)}` : ''}`
).join('\n')}

请选择5-10个最适合这个人设的商品。
考虑因素：
1. 商品是否符合人设的需求场景
2. 价格是否匹配人设的消费能力
3. 商品功能是否满足人设的痛点
4. 是否适合目标市场

输出JSON格式：
{
  "products": [
    {
      "productId": "商品ID",
      "productName": "商品名称",
      "reason": "推荐理由（50字以内）",
      "matchScore": 匹配分数0-100
    }
  ]
}`

    const productResult = await callModel({
      model: selectedModelId,
      messages: [{ role: 'user', content: productPrompt }],
      options: {
        temperature: 0.3,
        response_format: { type: 'json_object' }
      }
    })

    let matchedProducts: Array<{ productId: string, productName: string, reason: string, matchScore: number }> = []
    try {
      const parsed = JSON.parse(productResult.content)
      matchedProducts = parsed.products || []
    } catch (err) {
      console.error('解析AI返回的商品失败:', err)
      // 如果解析失败，随机选择一些商品
      matchedProducts = relevantProducts.slice(0, 5).map(p => ({
        productId: p.id,
        productName: p.name,
        reason: '系统推荐',
        matchScore: 70
      }))
    }

    console.log('✅ AI匹配完成:', {
      model: selectedModelId,
      categories: matchedCategories.length,
      products: matchedProducts.length
    })

    return NextResponse.json({
      success: true,
      data: {
        categories: matchedCategories.sort((a, b) => b.matchScore - a.matchScore),
        products: matchedProducts.sort((a, b) => b.matchScore - a.matchScore),
        message: `AI推荐完成：找到 ${matchedCategories.length} 个类目、${matchedProducts.length} 个商品`,
        aiModel: selectedModelId,
        aiPrompt: selectedPromptId,
        recommendation: {
          modelScore: modelRecommendation.chosen.fineScore,
          promptScore: promptRecommendation.chosen.fineScore
        }
      }
    })

  } catch (error) {
    console.error('❌ AI自动匹配失败:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '自动匹配失败'
      },
      { status: 500 }
    )
  }
}

/**
 * 构建人设描述
 */
function buildPersonaDescription(
  name: string,
  description: string,
  content: any,
  targetCountry: string
): string {
  const parts = [
    `人设名称：${name}`,
    `目标市场：${targetCountry}`
  ]

  if (description) {
    parts.push(`描述：${description}`)
  }

  if (content?.basicInfo) {
    const { age, gender, occupation, income, location } = content.basicInfo
    if (age) parts.push(`年龄：${age}`)
    if (gender) parts.push(`性别：${gender}`)
    if (occupation) parts.push(`职业：${occupation}`)
    if (income) parts.push(`收入：${income}`)
    if (location) parts.push(`地区：${location}`)
  }

  if (content?.behavior) {
    const { purchaseHabits, usageScenarios } = content.behavior
    if (purchaseHabits) parts.push(`购买习惯：${purchaseHabits}`)
    if (usageScenarios) parts.push(`使用场景：${usageScenarios}`)
  }

  if (content?.preferences) {
    const { priceSensitivity, featureNeeds, qualityExpectations } = content.preferences
    if (priceSensitivity) parts.push(`价格敏感度：${priceSensitivity}`)
    if (featureNeeds && featureNeeds.length > 0) {
      parts.push(`功能需求：${featureNeeds.join('、')}`)
    }
    if (qualityExpectations) parts.push(`品质期望：${qualityExpectations}`)
  }

  if (content?.psychology) {
    const { lifestyle, painPoints, motivations } = content.psychology
    if (lifestyle) parts.push(`生活方式：${lifestyle}`)
    if (painPoints && painPoints.length > 0) {
      parts.push(`痛点：${painPoints.join('、')}`)
    }
    if (motivations && motivations.length > 0) {
      parts.push(`动机：${motivations.join('、')}`)
    }
  }

  return parts.join('\n')
}

/**
 * 回退方案：简单的关键词匹配
 */
function fallbackMatching(
  personaName: string,
  description: string,
  categories: Array<{ id: string, name: string, productCount: number }>,
  products: Array<{ id: string, name: string, category: string, categoryId?: string }>
) {
  const keywords = [
    personaName.toLowerCase(),
    description.toLowerCase()
  ].join(' ')

  // 简单的关键词匹配
  const matchedCategories = categories
    .filter(c => {
      const catName = c.name.toLowerCase()
      return keywords.split(/\s+/).some(kw => 
        catName.includes(kw) || kw.includes(catName.split(/\s+/)[0])
      )
    })
    .slice(0, 3)
    .map(c => ({
      categoryId: c.id,
      categoryName: c.name,
      reason: '关键词匹配',
      matchScore: 60
    }))

  const matchedCategoryIds = matchedCategories.map(c => c.categoryId)
  const matchedProducts = products
    .filter(p => p.categoryId && matchedCategoryIds.includes(p.categoryId))
    .slice(0, 5)
    .map(p => ({
      productId: p.id,
      productName: p.name,
      reason: '类目匹配',
      matchScore: 60
    }))

  return NextResponse.json({
    success: true,
    data: {
      categories: matchedCategories,
      products: matchedProducts,
      message: `关键词匹配完成：找到 ${matchedCategories.length} 个类目、${matchedProducts.length} 个商品`
    }
  })
}

