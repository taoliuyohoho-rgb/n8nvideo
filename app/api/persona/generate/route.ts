import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { aiExecutor } from '@/src/services/ai/AiExecutor'
import type { PersonaGenerationRequest, PersonaContent } from '@/types/persona'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      categoryId, 
      productId, 
      textDescription, 
      aiModel, 
      promptTemplate,
      variantIndex = 0, // 🆕 支持变体索引，用于生成不同的人设
      targetCountry 
    } = body

    // 获取商品信息（如果提供了productId）
    let product: any = null
    if (productId) {
      product = await prisma.product.findUnique({ where: { id: productId } })
    }

    // 允许缺少 categoryId：若缺失则通过商品类目名回填/创建
    let effectiveCategoryId: string | null = categoryId || (product?.categoryId ?? null)
    let category: any = null
    if (effectiveCategoryId) {
      try {
        category = await (prisma as any).category.findUnique({ where: { id: effectiveCategoryId } })
      } catch {
        category = null
      }
    }
    if (!category) {
      const categoryName = (product?.category as string) || '未分类'
      const cat = await (prisma as any).category.upsert({
        where: { name: categoryName },
        update: {},
        create: { name: categoryName }
      })
      effectiveCategoryId = cat.id
      category = cat
    }

    // 获取Prompt模板
    const template = await prisma.promptTemplate.findUnique({
      where: { id: promptTemplate }
    })

    if (!template) {
      return NextResponse.json(
        { success: false, error: 'Prompt模板不存在' },
        { status: 404 }
      )
    }

    // 构建生成Prompt
    let prompt = template.content

    // 🆕 添加变体提示语，增加多样性
    const variantPrompts = [
      '', // 默认不添加
      '\n\n请生成一个年轻群体的人设（18-30岁）。',
      '\n\n请生成一个中年群体的人设（30-45岁）。',
      '\n\n请生成一个高收入群体的人设。',
      '\n\n请生成一个注重性价比的人设。',
      '\n\n请生成一个追求时尚潮流的人设。'
    ]
    
    if (variantIndex > 0 && variantIndex < variantPrompts.length) {
      prompt += variantPrompts[variantIndex]
    }

    // 替换变量
    const variables = {
      category: category.name,
      targetMarket: targetCountry || category.targetMarket || '全球市场',
      productInfo: `商品名称：${product?.name || ''}\n商品描述：${product?.description || ''}\n卖点：${product?.sellingPoints ? 
        (Array.isArray(product.sellingPoints) ? 
          product.sellingPoints.join(', ') : 
          JSON.stringify(product.sellingPoints)) : ''}`,
      textDescription: textDescription || ''
    }

    // 替换模板中的变量
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
      prompt = prompt.replace(regex, value)
    })

    // 调用AI生成人设
    let aiResponse: string
    try {
      const idLower = (aiModel || '').toLowerCase()
      const provider = idLower.includes('gemini') ? 'gemini'
        : (idLower.includes('doubao') || (aiModel || '').includes('字节')) ? 'doubao'
        : idLower.includes('deepseek') ? 'deepseek'
        : idLower.includes('claude') ? 'claude'
        : 'openai'

      console.log('AI调用参数:', { provider, aiModel, promptLength: prompt.length })
      console.log('Prompt内容:', prompt.substring(0, 200) + '...')

      aiResponse = await aiExecutor.execute({
        provider,
        prompt: prompt,
        useSearch: false
      })
      
      console.log('AI响应长度:', aiResponse.length)
      console.log('AI响应内容:', aiResponse.substring(0, 200) + '...')
    } catch (error) {
      console.error('AI执行失败:', error)
      return NextResponse.json(
        { success: false, error: 'AI生成失败: ' + (error instanceof Error ? error.message : '未知错误') },
        { status: 500 }
      )
    }

    // 解析AI返回的内容
    let generatedContent: PersonaContent
    try {
      const jsonMatch = aiResponse?.match(/\{[\s\S]*\}/)
      let parsed: any = null
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0])
      }
      if (parsed?.coreIdentity) {
        generatedContent = {
          basicInfo: {
            age: parsed.coreIdentity.age?.toString() || '25-35',
            gender: parsed.coreIdentity.gender || '不限',
            occupation: parsed.coreIdentity.occupation || '专业人士',
            income: '中等收入',
            location: parsed.coreIdentity.location || '城市'
          },
          behavior: {
            purchaseHabits: '注重品质和性价比',
            usageScenarios: '日常使用',
            decisionFactors: '品质、价格、品牌',
            brandPreference: '注重口碑和评价'
          },
          preferences: {
            priceSensitivity: '中等',
            featureNeeds: ['品质', '功能', '设计'],
            qualityExpectations: '高品质',
            serviceExpectations: '专业服务'
          },
          psychology: {
            values: parsed.context?.values ? [parsed.context.values] : ['品质', '效率', '创新'],
            lifestyle: '现代都市生活',
            painPoints: parsed.context?.frustrations ? [parsed.context.frustrations] : ['时间紧张', '品质要求高'],
            motivations: ['提升生活品质', '追求效率']
          }
        }
      } else {
        // 默认结构
        generatedContent = {
          basicInfo: { age: '25-35', gender: '不限', occupation: '专业人士', income: '中等收入', location: '城市' },
          behavior: { purchaseHabits: '注重品质和性价比', usageScenarios: '日常使用', decisionFactors: '品质、价格、品牌', brandPreference: '注重口碑和评价' },
          preferences: { priceSensitivity: '中等', featureNeeds: ['品质', '功能', '设计'], qualityExpectations: '高品质', serviceExpectations: '专业服务' },
          psychology: { values: ['品质', '效率', '创新'], lifestyle: '现代都市生活', painPoints: ['时间紧张', '品质要求高'], motivations: ['提升生活品质', '追求效率'] }
        }
      }
    } catch (parseError) {
      console.error('解析AI响应失败:', parseError)
      generatedContent = {
        basicInfo: { age: '25-35', gender: '不限', occupation: '专业人士', income: '中等收入', location: '城市' },
        behavior: { purchaseHabits: '注重品质和性价比', usageScenarios: '日常使用', decisionFactors: '品质、价格、品牌', brandPreference: '注重口碑和评价' },
        preferences: { priceSensitivity: '中等', featureNeeds: ['品质', '功能', '设计'], qualityExpectations: '高品质', serviceExpectations: '专业服务' },
        psychology: { values: ['品质', '效率', '创新'], lifestyle: '现代都市生活', painPoints: ['时间紧张', '品质要求高'], motivations: ['提升生活品质', '追求效率'] }
      }
    }

    // 🆕 保存人设到数据库
    try {
      // 解析出AI结构（可选）
      const jsonMatch = aiResponse?.match(/\{[\s\S]*\}/)
      let parsedAI: any = {}
      if (jsonMatch) {
        try { parsedAI = JSON.parse(jsonMatch[0]) } catch {}
      }

      // 构建数据库人设对象（使用 UncheckedCreateInput 字段）
      const personaData: any = {
        productId: productId || null,
        categoryId: effectiveCategoryId || 'default-category',
        name: parsedAI.coreIdentity?.name || `${category?.name || '用户'}人设${variantIndex > 0 ? variantIndex : ''}`,
        description: textDescription || null,
        generatedContent: generatedContent,
        aiModel: aiModel || 'gemini-pro',
        promptTemplate: promptTemplate || 'default-template',
        why: parsedAI?.why || 'auto-generated',
        version: 1,
        isActive: true,
        // 兼容旧字段
        coreIdentity: parsedAI.coreIdentity || null,
        look: parsedAI.look || null,
        vibe: parsedAI.vibe || null,
        context: parsedAI.context || null,
      }

      const savedPersona = await prisma.persona.create({
        data: personaData,
        include: {
          product: { select: { id: true, name: true, category: true, subcategory: true } }
        }
      })

      return NextResponse.json({ success: true, data: { persona: savedPersona } })
    } catch (saveError) {
      console.error('❌ 保存人设失败:', saveError)
      return NextResponse.json({ success: false, error: '人设保存失败' }, { status: 500 })
    }

  } catch (error) {
    console.error('人设生成失败:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: '人设生成失败: ' + (error instanceof Error ? error.message : '未知错误')
      },
      { status: 500 }
    )
  }
}