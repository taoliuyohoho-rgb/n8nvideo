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
      category = await prisma.category.findUnique({ where: { id: effectiveCategoryId } })
    }
    if (!category) {
      const categoryName = (product?.category as string) || '未分类'
      const cat = await prisma.category.upsert({
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
      console.log('开始解析AI响应...')
      console.log('AI响应内容:', aiResponse.substring(0, 500) + '...')
      
      // 尝试解析JSON
      const jsonMatch = aiResponse?.match(/\{[\s\S]*\}/)
      console.log('JSON匹配结果:', jsonMatch ? '找到JSON' : '未找到JSON')
      if (jsonMatch) {
        console.log('解析JSON:', jsonMatch[0].substring(0, 200) + '...')
        const parsed = JSON.parse(jsonMatch[0])
        console.log('JSON解析成功，内容:', Object.keys(parsed))
        
        // 转换AI返回的格式到期望的格式
        if (parsed.coreIdentity) {
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
          console.log('转换成功，使用AI生成的内容')
        } else {
          throw new Error('AI返回的JSON格式不正确')
        }
      } else {
        console.log('无法解析JSON，使用默认结构')
        // 如果无法解析JSON，使用默认结构
        generatedContent = {
          basicInfo: {
            age: '25-35',
            gender: '不限',
            occupation: '专业人士',
            income: '中等收入',
            location: '城市'
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
            values: ['品质', '效率', '创新'],
            lifestyle: '现代都市生活',
            painPoints: ['时间紧张', '品质要求高'],
            motivations: ['提升生活品质', '追求效率']
          }
        }
      }
    } catch (parseError) {
      console.error('解析AI响应失败:', parseError)
      // 使用默认结构
      generatedContent = {
        basicInfo: {
          age: '25-35',
          gender: '不限',
          occupation: '专业人士',
          income: '中等收入',
          location: '城市'
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
          values: ['品质', '效率', '创新'],
          lifestyle: '现代都市生活',
          painPoints: ['时间紧张', '品质要求高'],
          motivations: ['提升生活品质', '追求效率']
        }
      }
    }

    // 🆕 保存人设到数据库
    try {
      console.log('开始保存人设到数据库...')
      
      // 从AI生成的内容中提取人设信息
      const jsonMatch = aiResponse?.match(/\{[\s\S]*\}/)
      let parsedAI: any = {}
      
      if (jsonMatch) {
        try {
          parsedAI = JSON.parse(jsonMatch[0])
        } catch (e) {
          console.warn('无法解析AI响应为JSON:', e)
        }
      }
      
      // 构建数据库人设对象
      const personaData = {
        productId: productId || null,
        categoryId: effectiveCategoryId,
        name: parsedAI.coreIdentity?.name || `${category?.name || '用户'}人设${variantIndex > 0 ? variantIndex : ''}`,
        coreIdentity: parsedAI.coreIdentity || {
          name: parsedAI.coreIdentity?.name || generatedContent.basicInfo?.occupation || '用户',
          age: typeof generatedContent.basicInfo?.age === 'string' ? 
            parseInt(generatedContent.basicInfo.age.split('-')[0]) : 25,
          gender: generatedContent.basicInfo?.gender || '不限',
          location: generatedContent.basicInfo?.location || '城市',
          occupation: generatedContent.basicInfo?.occupation || '专业人士'
        },
        look: parsedAI.look || {
          generalAppearance: '现代都市',
          hair: '整洁',
          clothingAesthetic: '商务休闲',
          signatureDetails: '简约时尚'
        },
        vibe: parsedAI.vibe || {
          traits: generatedContent.psychology?.values || ['专业', '效率'],
          demeanor: '亲和',
          communicationStyle: '清晰直接'
        },
        context: parsedAI.context || {
          hobbies: generatedContent.preferences?.featureNeeds?.join('、') || '品质生活',
          values: generatedContent.psychology?.values?.join('、') || '品质、效率',
          frustrations: generatedContent.psychology?.painPoints?.join('、') || '时间紧张',
          homeEnvironment: '现代简约'
        },
        generatedContent: generatedContent,
        source: 'ai-generated',
        status: 'active',
        metadata: JSON.stringify({
          aiModel: aiModel,
          promptTemplate: promptTemplate,
          variantIndex: variantIndex,
          generatedAt: new Date().toISOString()
        })
      }
      
      const savedPersona = await prisma.persona.create({
        data: personaData,
        include: {
          product: {
            select: { id: true, name: true, category: true, subcategory: true }
          }
        }
      })
      
      console.log('✅ 人设保存成功:', savedPersona.id)
      
      return NextResponse.json({
        success: true,
        data: {
          persona: savedPersona // 返回完整的数据库对象
        }
      })
    } catch (saveError) {
      console.error('❌ 保存人设失败:', saveError)
      
      // 即使保存失败，也返回生成的内容（但标记未保存）
      return NextResponse.json({
        success: true,
        data: {
          persona: {
            coreIdentity: {
              name: generatedContent.basicInfo?.occupation || '用户',
              age: typeof generatedContent.basicInfo?.age === 'string' ? 
                parseInt(generatedContent.basicInfo.age.split('-')[0]) : 25,
              gender: generatedContent.basicInfo?.gender || '不限',
              location: generatedContent.basicInfo?.location || '城市',
              occupation: generatedContent.basicInfo?.occupation || '专业人士'
            },
            look: {},
            vibe: {
              communicationStyle: '清晰直接'
            },
            context: {
              hobbies: '品质生活',
              values: '品质、效率'
            },
            generatedContent,
            _unsaved: true // 标记未保存
          }
        },
        warning: '人设生成成功但保存失败'
      })
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