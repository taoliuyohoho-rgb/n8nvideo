import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { recommendRank } from '@/src/services/recommendation/recommend'
import '@/src/services/recommendation/index' // 确保评分器被注册
import type { AIRecommendation, PersonaGenerationRequest } from '@/types/persona'
import { coerceProductTargetCountry } from '@/src/utils/geo'

export async function POST(request: NextRequest) {
  try {
    const body: PersonaGenerationRequest = await request.json()
    const { categoryId, productId, textDescription, targetCountry } = body

    // 允许仅提供 productId；若两者都缺失报错
    if (!categoryId && !productId) {
      return NextResponse.json(
        { success: false, error: '至少提供 categoryId 或 productId 之一' },
        { status: 400 }
      )
    }

    // 解析类目名称与商品信息
    let categoryName = ''
    let resolvedCategoryId: string | null = categoryId || null
    let product: any = null

    if (productId) {
      product = await prisma.product.findUnique({ where: { id: productId } })
      if (!product) {
        return NextResponse.json(
          { success: false, error: '商品不存在' },
          { status: 404 }
        )
      }
      categoryName = (product as any).category || '未分类'
      // 若请求未显式提供 categoryId，则从商品上补全（供后续生成人设接口使用）
      resolvedCategoryId = resolvedCategoryId || (product as any).categoryId || null
      // 若仍无法解析类目ID，保持为空（生成接口会自动补全/创建）
    } else if (categoryId) {
      // 没有直接查 Category，避免类型依赖；直接用占位名
      categoryName = `category:${categoryId}`
    }

    // 先查库中已有的人设（优先：商品ID/商品名；其次：类目/子类目）
    const productName = product?.name || ''
    const subcategory = product?.subcategory || ''

    // 先统计数据库中的人设总数
    const totalPersonasCount = await prisma.persona.count()
    console.log(`📊 数据库人设总数: ${totalPersonasCount}`)
    
    console.log('📊 人设查询参数:', {
      productId,
      productName,
      categoryName,
      subcategory,
      targetCountry
    })

    const rawPersonas = await prisma.persona.findMany({
      where: {
        OR: [
          ...(productId ? [{ productId }] : []),
          ...(productName ? [{ product: { name: productName } }] : []),
          ...(categoryName ? [{ product: { category: categoryName } }] : []),
          ...(subcategory ? [{ product: { subcategory } }] : [])
        ]
      },
      include: {
        product: { select: { id: true, name: true, category: true, subcategory: true } }
      },
      orderBy: [{ createdAt: 'desc' }],
      take: 50
    })

    console.log(`📦 数据库查询结果: ${rawPersonas.length} 个人设 (总数: ${totalPersonasCount})`)

    // 使用推荐引擎进行排序（替代手动排序）
    console.log('🤖 使用推荐引擎推荐人设')
    
    // 若未显式传入目标国家，从商品信息推断
    const resolvedRegion = targetCountry || coerceProductTargetCountry(product) || 'global'

    const personaRecommendation = await recommendRank({
      scenario: 'product->persona',
      task: {
        subjectRef: productId ? {
          entityType: 'product',
          entityId: productId
        } : undefined,
        category: categoryName,
        // subcategory 和 productName 作为扩展属性
        ...(subcategory && { subcategory }),
        ...(productName && { productName })
      } as any,
      context: {
        region: resolvedRegion,
        channel: 'admin'
      }
    })

    console.log('✅ 人设推荐完成:', personaRecommendation.chosen)

    // 从推荐结果中获取人设ID列表
    const recommendedPersonaIds = personaRecommendation.topK.map(c => c.id)

    if (recommendedPersonaIds.length > 0) {
      // 从数据库获取完整的人设信息
      const existingPersonas = await prisma.persona.findMany({
        where: {
          id: { in: recommendedPersonaIds }
        },
        include: {
          product: {
            select: { id: true, name: true, category: true, subcategory: true }
          }
        }
      })

      // 按推荐顺序排列并转换数据格式
      const sortedPersonas = recommendedPersonaIds
        .map(id => {
          const p = existingPersonas.find(persona => persona.id === id)
          if (!p) return null
          
          // 从 generatedContent 或 coreIdentity 中提取人设名称
          const pAny = p as any
          const personaName = pAny.name || 
                            (pAny.coreIdentity?.name) || 
                            (pAny.generatedContent?.basicInfo?.name) ||
                            '未命名人设'
          
          // 确保 coreIdentity 等字段存在，如果不存在则提供默认值
          return {
            ...p,
            coreIdentity: p.coreIdentity || { 
              name: personaName,
              age: 25,
              gender: '未知',
              location: '未知',
              occupation: '未知'
            },
            look: p.look || {},
            vibe: p.vibe || { 
              communicationStyle: '友好'
            },
            context: p.context || {
              hobbies: '未知',
              values: '未知'
            }
          }
        })
        .filter((p): p is NonNullable<typeof p> => p !== null)

      if (sortedPersonas.length > 0) {
        console.log('✅ 返回推荐人设:', sortedPersonas.length, '个')
        return NextResponse.json({
          success: true,
          data: {
            personas: sortedPersonas,
            chosenPersonaId: sortedPersonas[0]!.id,
            alternatives: sortedPersonas.slice(1).map((p: any) => p.id),
            categoryId: resolvedCategoryId,
            decisionId: personaRecommendation.decisionId
          }
        })
      }
    }

    console.log('🔍 开始推荐模型，类目:', categoryName)

    // 使用推荐引擎推荐AI模型
    const modelRecommendation = await recommendRank({
      scenario: 'task->model',
      task: { 
        taskType: 'persona.generate',
        contentType: 'text',
        jsonRequirement: true,
        language: 'zh',
        category: categoryName,  // 类目信息放在 task 里
        region: targetCountry || 'global',
        subjectRef: productId ? {
          entityType: 'product',
          entityId: productId
        } : undefined
      },
      context: { 
        region: targetCountry || 'global',
        channel: 'admin'
      },
      constraints: { 
        maxLatencyMs: 10000,
        maxCostUSD: 0.1,  // 使用正确的字段名
        requireJsonMode: true
      },
      options: {
        strategyVersion: 'v1'
      }
    })

    console.log('✅ 模型推荐完成:', modelRecommendation.chosen)

    // 获取推荐的模型详细信息（从数据库）
    const modelDetail = await prisma.estimationModel.findUnique({
      where: { id: modelRecommendation.chosen.id }
    })

    if (!modelDetail) {
      throw new Error(`推荐的模型不存在: ${modelRecommendation.chosen.id}`)
    }

    // 使用推荐引擎推荐Prompt模板
    const promptRecommendation = await recommendRank({
      scenario: 'task->prompt',
      task: { 
        taskType: 'persona.generate',  // 注意：数据库中的业务模块名称
        contentType: 'text',
        jsonRequirement: true,
        category: categoryName,  // 类目信息放在 task 里
        region: targetCountry || 'global',
        subjectRef: productId ? {
          entityType: 'product',
          entityId: productId
        } : undefined
      },
      context: { 
        region: targetCountry || 'global',
        channel: 'admin'
      },
      constraints: { 
        maxLatencyMs: 5000
      },
      options: {
        strategyVersion: 'v1'
      }
    })

    console.log('✅ Prompt推荐完成:', promptRecommendation.chosen)

    // 构建推荐的模型信息（使用实际的模型名称）
    const recommendedModel = {
      id: `${modelDetail.provider.toLowerCase()}/${modelDetail.modelName}`, // 实际调用用的模型名称
      name: modelRecommendation.chosen.title || `${modelDetail.provider}/${modelDetail.modelName}`,
      provider: modelDetail.provider,
      reason: modelRecommendation.chosen.reason 
        ? (typeof modelRecommendation.chosen.reason === 'string' 
            ? modelRecommendation.chosen.reason 
            : `评分: ${JSON.stringify(modelRecommendation.chosen.reason)}`)
        : `基于${categoryName}类目的历史表现推荐`,
      decisionId: modelRecommendation.decisionId,
      dbId: modelDetail.id,  // 数据库ID，用于反馈
      alternatives: await Promise.all(
        modelRecommendation.topK.slice(1, 3).map(async (alt) => {
          const altModel = await prisma.estimationModel.findUnique({
            where: { id: alt.id }
          })
          return {
            id: altModel ? `${altModel.provider.toLowerCase()}/${altModel.modelName}` : alt.id,
            name: alt.title || alt.id,
            reason: alt.reason
          }
        })
      )
    }

    // 获取推荐的Prompt模板
    const promptTemplate = await prisma.promptTemplate.findUnique({
      where: { id: promptRecommendation.chosen.id }
    })

    if (!promptTemplate) {
      // 如果推荐的模板不存在，创建默认模板
      console.warn('⚠️ 推荐的Prompt模板不存在，使用默认模板')
      
      let defaultTemplate = await prisma.promptTemplate.findFirst({
        where: {
          businessModule: 'persona.generate',
          isActive: true,
          isDefault: true
        }
      })

      if (!defaultTemplate) {
        defaultTemplate = await prisma.promptTemplate.create({
          data: {
            name: '人设生成默认模板',
            businessModule: 'persona.generate',
            content: `你是一个专业的用户研究专家。请根据以下信息，生成一个详细的用户人设。

类目：{{category}}
目标市场：{{targetMarket}}
商品信息：{{productInfo}}
用户描述：{{textDescription}}

请生成包含以下结构的JSON格式人设：
{
  "basicInfo": {
    "age": "年龄段",
    "gender": "性别",
    "occupation": "职业",
    "income": "收入水平",
    "location": "地区"
  },
  "behavior": {
    "purchaseHabits": "购买习惯",
    "usageScenarios": "使用场景",
    "decisionFactors": "决策因素",
    "brandPreference": "品牌偏好"
  },
  "preferences": {
    "priceSensitivity": "价格敏感度",
    "featureNeeds": ["功能需求1", "功能需求2"],
    "qualityExpectations": "品质期望",
    "serviceExpectations": "服务期望"
  },
  "psychology": {
    "values": ["价值观1", "价值观2"],
    "lifestyle": "生活方式",
    "painPoints": ["痛点1", "痛点2"],
    "motivations": ["动机1", "动机2"]
  }
}

要求：
1. 人设要真实可信，符合当地市场特征
2. 所有字段都要填写具体内容，不要使用占位符
3. 数组字段至少包含2-3个元素
4. 确保返回的是有效的JSON格式`,
            variables: 'category,targetMarket,productInfo,textDescription',
            isActive: true,
            isDefault: true
          }
        })
      }

      const recommendedPrompt = {
        id: defaultTemplate.id,
        content: defaultTemplate.content,
        variables: defaultTemplate.variables ? 
          defaultTemplate.variables.split(',').map((v: string) => v.trim()) : [],
        decisionId: promptRecommendation.decisionId,
        fallback: true
      }

      const result: AIRecommendation = {
        recommendedModel,
        recommendedPrompt
      }

      return NextResponse.json({
        success: true,
        data: result
      })
    }

    const recommendedPrompt = {
      id: promptTemplate.id,
      content: promptTemplate.content,
      variables: promptTemplate.variables ? 
        promptTemplate.variables.split(',').map((v: string) => v.trim()) : [],
      decisionId: promptRecommendation.decisionId,
      alternatives: promptRecommendation.topK.slice(1, 3).map(alt => ({
        id: alt.id,
        name: alt.title || alt.id,
        reason: alt.reason
      }))
    }

    const result: AIRecommendation = {
      recommendedModel,
      recommendedPrompt
    }

    console.log('🎯 推荐结果:', {
      model: recommendedModel.id,
      prompt: recommendedPrompt.id,
      modelDecisionId: recommendedModel.decisionId,
      promptDecisionId: recommendedPrompt.decisionId
    })

    return NextResponse.json({
      success: true,
      data: { personas: [], generatePlan: result, categoryId: resolvedCategoryId }
    })

  } catch (error) {
    console.error('❌ AI推荐失败:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'AI推荐失败' 
      },
      { status: 500 }
    )
  }
}