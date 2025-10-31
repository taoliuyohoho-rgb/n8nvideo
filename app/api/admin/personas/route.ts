import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { aiExecutor } from '@/src/services/ai/AiExecutor'
import { getModelById } from '@/src/services/ai/estimation/models'


/**
 * GET /api/admin/personas - 获取所有人设列表
 */
export async function GET(request: NextRequest) {
  try {
    const personas = await prisma.persona.findMany({
      include: {
        product: {
          select: {
            id: true,
            name: true,
            category: true
          }
        },
        category: {
          select: {
            id: true,
            name: true
          }
        },
        // 多对多关系
        personaCategories: {
          include: {
            category: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        personaProducts: {
          include: {
            product: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      data: personas
    })
  } catch (error) {
    console.error('获取人设列表失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '获取人设列表失败'
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/personas - 创建新人设（支持直接保存或AI生成）
 * 
 * 两种模式：
 * 1. 直接保存：提供完整的 coreIdentity, look, vibe, context, why
 * 2. AI生成：提供 aiModel, promptTemplate，由AI生成后自动保存
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      productId, 
      coreIdentity, look, vibe, context, why, 
      modelUsed, 
      categoryId,
      // AI生成模式参数
      aiModel,
      promptTemplate,
      textDescription
    } = body

    if (!productId) {
      return NextResponse.json(
        { success: false, error: '缺少商品ID' },
        { status: 400 }
      )
    }

    // 判断是保存模式还是生成模式
    const isGenerateMode = aiModel && promptTemplate
    let finalCoreIdentity = coreIdentity
    let finalLook = look
    let finalVibe = vibe
    let finalContext = context
    let finalWhy = why
    let finalModelUsed = modelUsed

    if (isGenerateMode) {
      // AI生成模式：调用AI生成人设
      console.log('AI生成模式，开始生成人设...')
      
      // 获取商品信息
      const product = await prisma.product.findUnique({ where: { id: productId } })
      if (!product) {
        return NextResponse.json({ success: false, error: '商品不存在' }, { status: 404 })
      }

      // 获取或创建类目
      let effectiveCategoryId: string | null = categoryId || (product as any).categoryId || null
      let category: any = null
      if (effectiveCategoryId) {
        category = await prisma.category.findUnique({ where: { id: effectiveCategoryId } })
      }
      if (!category) {
        const categoryName = (product as any).category || '未分类'
        const cat = await prisma.category.upsert({
          where: { name: categoryName },
          update: {},
          create: { name: categoryName }
        })
        effectiveCategoryId = cat.id
        category = cat
      }

      // 获取Prompt模板
      const template = await prisma.promptTemplate.findUnique({ where: { id: promptTemplate } })
      if (!template) {
        return NextResponse.json({ success: false, error: 'Prompt模板不存在' }, { status: 404 })
      }

      // 构建Prompt
      let prompt = template.content
      const variables = {
        category: category.name,
        targetMarket: category.targetMarket || '全球市场',
        productInfo: `商品名称：${product.name || ''}\n商品描述：${(product as any).description || ''}\n卖点：${(product as any).sellingPoints ? 
          (Array.isArray((product as any).sellingPoints) ? 
            (product as any).sellingPoints.join(', ') : 
            JSON.stringify((product as any).sellingPoints)) : ''}`,
        textDescription: textDescription || ''
      }
      Object.entries(variables).forEach(([key, value]) => {
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
        prompt = prompt.replace(regex, value)
      })

      // 根据模型ID获取正确的provider和modelName
      let provider = 'openai' // 默认值
      let modelName = aiModel
      
      try {
        const modelInfo = await getModelById(aiModel)
        if (modelInfo) {
          provider = modelInfo.provider.toLowerCase()
          modelName = modelInfo.modelName
          console.log('从数据库获取模型信息:', { id: aiModel, provider, modelName })
        } else {
          // 如果数据库中没有找到，尝试从模型名称推断
          const idLower = (aiModel || '').toLowerCase()
          provider = idLower.includes('gemini') ? 'gemini' 
            : (idLower.includes('doubao') || aiModel.includes('字节')) ? 'doubao'
            : idLower.includes('deepseek') ? 'deepseek'
            : idLower.includes('claude') ? 'claude'
            : 'openai'
          console.log('从模型名称推断provider:', { aiModel, provider })
        }
      } catch (error) {
        console.error('获取模型信息失败，使用默认值:', error)
      }

      console.log('调用AI:', { provider, modelName, aiModel, promptLength: prompt.length })
      const aiResponse = await aiExecutor.execute({ provider, prompt, useSearch: false })
      console.log('AI响应长度:', aiResponse.length)

      // 解析AI返回
      const jsonMatch = aiResponse?.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        return NextResponse.json({ success: false, error: 'AI未返回有效JSON' }, { status: 500 })
      }
      const parsed = JSON.parse(jsonMatch[0])
      if (!parsed.coreIdentity) {
        return NextResponse.json({ success: false, error: 'AI返回格式不正确' }, { status: 500 })
      }

      // 使用AI生成的内容
      finalCoreIdentity = parsed.coreIdentity
      finalLook = parsed.look || {}
      finalVibe = parsed.vibe || {}
      finalContext = parsed.context || {}
      finalWhy = parsed.why || '系统自动生成'
      finalModelUsed = { provider, model: modelName, modelId: aiModel }
      
      console.log('AI生成成功，准备保存...')
    } else {
      // 直接保存模式：校验必需字段
      if (!coreIdentity || !look || !vibe || !context || !why) {
        return NextResponse.json(
          { success: false, error: '缺少必需字段' },
          { status: 400 }
        )
      }
    }

    // 获取当前最大版本号
    const latestPersona = await prisma.persona.findFirst({
      where: { productId },
      orderBy: { version: 'desc' }
    })

    const nextVersion = latestPersona ? latestPersona.version + 1 : 1

    // 创建人设
    // 解析类目ID：优先使用请求体的categoryId，其次使用商品的categoryId，最后兜底为默认类目
    let resolvedCategoryId: string | null = categoryId || null
    if (!resolvedCategoryId && isGenerateMode) {
      // 生成模式下已经在上面处理过了
      const product = await prisma.product.findUnique({ where: { id: productId } })
      resolvedCategoryId = (product as any)?.categoryId || null
    }
    if (!resolvedCategoryId) {
      resolvedCategoryId = 'default-category'
    }

    const persona = await prisma.persona.create({
      data: {
        productId,
        version: nextVersion,
        coreIdentity: finalCoreIdentity,
        look: finalLook,
        vibe: finalVibe,
        context: finalContext,
        why: finalWhy,
        createdBy: 'admin',
        modelUsed: finalModelUsed || null,
        categoryId: resolvedCategoryId
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            category: true
          }
        },
        category: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: persona
    })
  } catch (error) {
    console.error('创建人设失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '创建人设失败'
      },
      { status: 500 }
    )
  }
}

