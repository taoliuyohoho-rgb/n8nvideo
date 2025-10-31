import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { PersonaSaveRequest } from '@/types/persona'

export async function POST(request: NextRequest) {
  try {
    const body: any = await request.json()
    const {
      name,
      description,
      // 新字段：多选
      categoryIds,
      productIds,
      // 旧字段：单选（向后兼容）
      categoryId,
      productId,
      textDescription,
      generatedContent,
      aiModel,
      promptTemplate,
      generationParams
    } = body

    // 处理多选数据（兼容旧格式）
    const finalCategoryIds = categoryIds && categoryIds.length > 0 
      ? categoryIds 
      : (categoryId ? [categoryId] : [])
    
    const finalProductIds = productIds && productIds.length > 0
      ? productIds
      : (productId ? [productId] : [])

    // 验证必填字段
    if (!name || finalCategoryIds.length === 0 || !generatedContent || !aiModel || !promptTemplate) {
      return NextResponse.json(
        { success: false, error: '缺少必填字段：需要名称和至少一个类目' },
        { status: 400 }
      )
    }

    // 验证所有类目是否存在
    for (const catId of finalCategoryIds) {
      const category = await prisma.category.findUnique({
        where: { id: catId }
      })

      if (!category) {
        return NextResponse.json(
          { success: false, error: `类目不存在: ${catId}` },
          { status: 404 }
        )
      }
    }

    // 验证所有商品是否存在
    for (const prodId of finalProductIds) {
      const product = await prisma.product.findUnique({
        where: { id: prodId }
      })

      if (!product) {
        return NextResponse.json(
          { success: false, error: `商品不存在: ${prodId}` },
          { status: 404 }
        )
      }
    }

    console.log('💾 创建人设，多选数据:', { 
      categoryIds: finalCategoryIds, 
      productIds: finalProductIds 
    })

    // 从 generatedContent 中提取结构化字段
    // 兼容多种数据结构：可能直接是完整结构，也可能在 basicInfo 等字段中
    const extractedCoreIdentity = generatedContent?.coreIdentity || {
      name: generatedContent?.basicInfo?.name || name,
      age: generatedContent?.basicInfo?.age || generatedContent?.age || 25,
      gender: generatedContent?.basicInfo?.gender || generatedContent?.gender || '不限',
      location: generatedContent?.basicInfo?.location || generatedContent?.location || '全球',
      occupation: generatedContent?.basicInfo?.occupation || generatedContent?.occupation || '专业人士'
    }
    
    const extractedLook = generatedContent?.look || {
      generalAppearance: '现代简约',
      hair: '整洁得体',
      clothingAesthetic: '简约舒适',
      signatureDetails: '注重品质'
    }
    
    const extractedVibe = generatedContent?.vibe || {
      traits: ['专业', '友好', '理性'],
      demeanor: '友好专业',
      communicationStyle: '清晰简洁'
    }
    
    const extractedContext = generatedContent?.context || {
      hobbies: generatedContent?.preferences?.featureNeeds?.join('、') || '品质生活',
      values: generatedContent?.psychology?.values?.join('、') || '品质、效率',
      frustrations: generatedContent?.psychology?.painPoints?.join('、') || '时间紧张',
      homeEnvironment: '现代都市'
    }
    
    const extractedWhy = generatedContent?.why || `${name}是${extractedCoreIdentity.location}的${extractedCoreIdentity.occupation}，关注品质与实用性`

    console.log('🔍 提取的人设结构:', { 
      coreIdentity: extractedCoreIdentity,
      hasLook: !!extractedLook,
      hasVibe: !!extractedVibe,
      hasContext: !!extractedContext
    })

    // 创建人设（支持多对多关系）
    const persona = await prisma.persona.create({
      data: {
        name,
        description,
        // 主类目和主商品（兼容旧数据和脚本生成）
        categoryId: finalCategoryIds[0] || 'default-category',
        productId: finalProductIds[0] || null,
        textDescription: textDescription || null,
        generatedContent: generatedContent as any,
        // ✅ 同时保存结构化字段，确保前端能正确读取
        coreIdentity: extractedCoreIdentity as any,
        look: extractedLook as any,
        vibe: extractedVibe as any,
        context: extractedContext as any,
        why: extractedWhy,
        aiModel,
        promptTemplate,
        generationParams: generationParams ? generationParams as any : null,
        createdBy: 'system', // TODO: 从认证信息中获取
        // 多对多关系
        personaCategories: {
          create: finalCategoryIds.map((catId: string, index: number) => ({
            categoryId: catId,
            isPrimary: index === 0 // 第一个为主类目
          }))
        },
        personaProducts: finalProductIds.length > 0 ? {
          create: finalProductIds.map((prodId, index) => ({
            productId: prodId,
            isPrimary: index === 0 // 第一个为主商品
          }))
        } : undefined
      }
    })

    console.log('✅ 人设创建成功:', persona.id, '关联类目:', finalCategoryIds.length, '关联商品:', finalProductIds.length)

    return NextResponse.json({
      success: true,
      data: {
        personaId: persona.id,
        message: '人设保存成功'
      }
    })

  } catch (error) {
    console.error('❌ 保存人设失败:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: '保存人设失败' 
      },
      { status: 500 }
    )
  }
}
