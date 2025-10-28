import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface DocumentParseRequest {
  content: string
  type: 'text' | 'url'
  category?: string
  targetCountry?: string
}

interface GeneratedStyle {
  id: string
  name: string
  description: string
  structure: string
  hookPool: string
  videoStylePool: string
  tonePool: string
  suggestedLength: string
  recommendedCategories: string
  targetCountries: string
  templatePrompt: string
  confidence: number
}

export async function POST(request: NextRequest) {
  try {
    const { content, type, category, targetCountry }: DocumentParseRequest = await request.json()

    if (!content) {
      return NextResponse.json(
        { success: false, error: '文档内容不能为空' },
        { status: 400 }
      )
    }

    // 如果是URL，先获取内容
    let documentContent = content
    if (type === 'url') {
      try {
        const response = await fetch(content)
        if (!response.ok) {
          throw new Error('无法访问该URL')
        }
        documentContent = await response.text()
      } catch (error) {
        return NextResponse.json(
          { success: false, error: '无法获取URL内容' },
          { status: 400 }
        )
      }
    }

    // 调用AI分析生成风格建议
    const generatedStyles = await generateStylesFromDocument(documentContent, {
      category,
      targetCountry
    })

    return NextResponse.json({
      success: true,
      data: {
        styles: generatedStyles,
        documentInfo: {
          type,
          contentLength: documentContent.length,
          category,
          targetCountry
        }
      }
    })

  } catch (error) {
    console.error('文档解析失败:', error)
    return NextResponse.json(
      { success: false, error: '文档解析失败' },
      { status: 500 }
    )
  }
}

async function generateStylesFromDocument(
  content: string, 
  context: { category?: string; targetCountry?: string }
): Promise<GeneratedStyle[]> {
  // 这里应该调用AI服务进行文档分析
  // 为了演示，我们生成一些模拟的风格建议
  
  const mockStyles: GeneratedStyle[] = [
    {
      id: 'style-1',
      name: '专业产品展示风格',
      description: '基于文档内容分析，适合专业产品的视频展示风格',
      structure: '开场产品特写 → 功能演示 → 使用场景 → 结尾呼吁',
      hookPool: '产品亮点,功能优势,使用效果',
      videoStylePool: '专业拍摄,清晰画质,稳定镜头',
      tonePool: '专业,可信,权威',
      suggestedLength: '30s',
      recommendedCategories: context.category || '电子产品',
      targetCountries: context.targetCountry || '美国',
      templatePrompt: '基于文档分析的专业产品展示视频，突出产品核心功能和优势',
      confidence: 0.85
    },
    {
      id: 'style-2', 
      name: '情感化故事风格',
      description: '通过故事化叙述，增强用户情感共鸣',
      structure: '问题引入 → 产品出现 → 解决方案 → 美好结局',
      hookPool: '用户痛点,情感共鸣,生活改变',
      videoStylePool: '温暖色调,生活化场景,情感化剪辑',
      tonePool: '温暖,亲切,有感染力',
      suggestedLength: '45s',
      recommendedCategories: context.category || '生活用品',
      targetCountries: context.targetCountry || '中国',
      templatePrompt: '情感化故事叙述，通过用户故事展示产品价值',
      confidence: 0.78
    },
    {
      id: 'style-3',
      name: '对比测试风格',
      description: '通过对比测试展示产品优势',
      structure: '问题展示 → 对比测试 → 结果展示 → 结论',
      hookPool: '测试结果,性能对比,数据证明',
      videoStylePool: '对比镜头,数据展示,测试场景',
      tonePool: '客观,数据驱动,可信',
      suggestedLength: '60s',
      recommendedCategories: context.category || '科技产品',
      targetCountries: context.targetCountry || '全球',
      templatePrompt: '客观对比测试，用数据和事实证明产品优势',
      confidence: 0.72
    }
  ]

  // 模拟AI分析过程
  await new Promise(resolve => setTimeout(resolve, 2000))

  return mockStyles
}

// 批量保存风格到数据库
export async function PUT(request: NextRequest) {
  try {
    const { styles, productId } = await request.json()

    if (!styles || !Array.isArray(styles)) {
      return NextResponse.json(
        { success: false, error: '风格数据格式错误' },
        { status: 400 }
      )
    }

    // 获取默认商品ID
    const defaultProduct = await prisma.product.findFirst()
    if (!defaultProduct) {
      return NextResponse.json(
        { success: false, error: '请先创建商品' },
        { status: 400 }
      )
    }

    const savedStyles = []
    
    for (const style of styles) {
      const savedStyle = await prisma.template.create({
        data: {
          templateId: `TMP${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: style.name,
          description: style.description,
          productId: productId || defaultProduct.id,
          structure: style.structure,
          hookPool: style.hookPool,
          videoStylePool: style.videoStylePool,
          tonePool: style.tonePool,
          suggestedLength: style.suggestedLength,
          recommendedCategories: style.recommendedCategories,
          targetCountries: style.targetCountries,
          templatePrompt: style.templatePrompt,
          source: 'user_document_analysis',
          isUserGenerated: true,
          needsReview: true,
          isActive: true
        }
      })
      
      savedStyles.push(savedStyle)
    }

    return NextResponse.json({
      success: true,
      data: {
        savedStyles,
        count: savedStyles.length
      },
      message: `成功保存 ${savedStyles.length} 个风格`
    })

  } catch (error) {
    console.error('保存风格失败:', error)
    return NextResponse.json(
      { success: false, error: '保存风格失败' },
      { status: 500 }
    )
  }
}
