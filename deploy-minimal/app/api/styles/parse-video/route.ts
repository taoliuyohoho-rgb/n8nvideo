import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface VideoParseRequest {
  videoUrl: string
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
  videoAnalysis: {
    duration: number
    scenes: string[]
    editingRhythm: string
    visualStyle: string
    audioStyle: string
  }
}

export async function POST(request: NextRequest) {
  try {
    const { videoUrl, category, targetCountry }: VideoParseRequest = await request.json()

    if (!videoUrl) {
      return NextResponse.json(
        { success: false, error: '视频URL不能为空' },
        { status: 400 }
      )
    }

    // 调用视频分析服务
    const videoAnalysis = await analyzeVideo(videoUrl)
    
    // 基于视频分析结果生成风格建议
    const generatedStyles = await generateStylesFromVideo(videoAnalysis, {
      category,
      targetCountry
    })

    return NextResponse.json({
      success: true,
      data: {
        styles: generatedStyles,
        videoAnalysis,
        videoInfo: {
          url: videoUrl,
          category,
          targetCountry
        }
      }
    })

  } catch (error) {
    console.error('视频解析失败:', error)
    return NextResponse.json(
      { success: false, error: '视频解析失败' },
      { status: 500 }
    )
  }
}

async function analyzeVideo(videoUrl: string) {
  // 这里应该调用实际的视频分析服务
  // 为了演示，返回模拟的分析结果
  
  return {
    duration: 45,
    scenes: [
      '开场产品特写',
      '功能演示场景',
      '使用场景展示',
      '结尾呼吁行动'
    ],
    editingRhythm: '快节奏剪辑，平均每3秒一个镜头切换',
    visualStyle: '明亮色调，专业拍摄，稳定镜头',
    audioStyle: '背景音乐，旁白解说',
    targetAudience: ['年轻用户', '科技爱好者'],
    performanceScore: 8.5
  }
}

async function generateStylesFromVideo(
  videoAnalysis: any,
  context: { category?: string; targetCountry?: string }
): Promise<GeneratedStyle[]> {
  
  const mockStyles: GeneratedStyle[] = [
    {
      id: 'video-style-1',
      name: '快节奏产品展示',
      description: '基于视频分析，适合快节奏的产品展示风格',
      structure: videoAnalysis.scenes.join(' → '),
      hookPool: '产品亮点,快速切换,视觉冲击',
      videoStylePool: videoAnalysis.visualStyle,
      tonePool: '活力,年轻,时尚',
      suggestedLength: `${videoAnalysis.duration}s`,
      recommendedCategories: context.category || '电子产品',
      targetCountries: context.targetCountry || '美国',
      templatePrompt: `基于视频分析的快节奏产品展示，${videoAnalysis.editingRhythm}`,
      confidence: 0.88,
      videoAnalysis: {
        duration: videoAnalysis.duration,
        scenes: videoAnalysis.scenes,
        editingRhythm: videoAnalysis.editingRhythm,
        visualStyle: videoAnalysis.visualStyle,
        audioStyle: videoAnalysis.audioStyle
      }
    },
    {
      id: 'video-style-2',
      name: '专业功能演示',
      description: '突出产品功能特性的专业演示风格',
      structure: '产品介绍 → 功能演示 → 使用效果 → 总结',
      hookPool: '功能优势,专业演示,技术细节',
      videoStylePool: '专业拍摄,清晰画质,稳定镜头',
      tonePool: '专业,可信,技术导向',
      suggestedLength: '60s',
      recommendedCategories: context.category || '科技产品',
      targetCountries: context.targetCountry || '全球',
      templatePrompt: '专业功能演示，突出产品技术优势和使用效果',
      confidence: 0.82,
      videoAnalysis: {
        duration: videoAnalysis.duration,
        scenes: videoAnalysis.scenes,
        editingRhythm: videoAnalysis.editingRhythm,
        visualStyle: videoAnalysis.visualStyle,
        audioStyle: videoAnalysis.audioStyle
      }
    },
    {
      id: 'video-style-3',
      name: '情感化使用场景',
      description: '通过真实使用场景展示产品价值',
      structure: '生活场景 → 产品出现 → 问题解决 → 美好结局',
      hookPool: '生活场景,情感共鸣,真实体验',
      videoStylePool: '生活化拍摄,自然光线,真实场景',
      tonePool: '温暖,亲切,生活化',
      suggestedLength: '45s',
      recommendedCategories: context.category || '生活用品',
      targetCountries: context.targetCountry || '中国',
      templatePrompt: '情感化使用场景，通过真实生活展示产品价值',
      confidence: 0.75,
      videoAnalysis: {
        duration: videoAnalysis.duration,
        scenes: videoAnalysis.scenes,
        editingRhythm: videoAnalysis.editingRhythm,
        visualStyle: videoAnalysis.visualStyle,
        audioStyle: videoAnalysis.audioStyle
      }
    }
  ]

  // 模拟AI分析过程
  await new Promise(resolve => setTimeout(resolve, 3000))

  return mockStyles
}

// 批量保存视频解析的风格到数据库
export async function PUT(request: NextRequest) {
  try {
    const { styles, productId, videoUrl } = await request.json()

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
          source: 'user_video_analysis',
          sourceVideoId: videoUrl,
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
