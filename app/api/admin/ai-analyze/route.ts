import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// AI分析产品痛点
export async function POST(request: NextRequest) {
  try {
    const { painPointId, comments } = await request.json()

    if (!painPointId || !comments || !Array.isArray(comments)) {
      return NextResponse.json(
        { success: false, error: '痛点ID和评论数据是必填项' },
        { status: 400 }
      )
    }

    // 获取痛点信息
    const painPoint = await prisma.productPainPoint.findUnique({
      where: { id: painPointId }
    })

    if (!painPoint) {
      return NextResponse.json(
        { success: false, error: '痛点分析不存在' },
        { status: 404 }
      )
    }

    // 模拟AI分析过程
    const analysisResult = await performAIAnalysis(comments)

    // 更新痛点分析结果
    const updatedPainPoint = await prisma.productPainPoint.update({
      where: { id: painPointId },
      data: {
        aiAnalysis: JSON.stringify(analysisResult.analysis),
        keywords: JSON.stringify(analysisResult.keywords),
        sentiment: analysisResult.sentiment,
        severity: analysisResult.severity,
        frequency: analysisResult.frequency
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            category: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedPainPoint,
      message: 'AI分析完成'
    })
  } catch (error) {
    console.error('AI分析失败:', error)
    return NextResponse.json(
      { success: false, error: 'AI分析失败' },
      { status: 500 }
    )
  }
}

// 模拟AI分析函数
async function performAIAnalysis(comments: any[]) {
  // 这里应该调用实际的AI服务（如OpenAI、Claude等）
  // 现在返回模拟的分析结果
  
  const allText = comments.map(c => c.content).join(' ')
  
  // 模拟关键词提取
  const keywords = extractKeywords(allText)
  
  // 模拟情感分析
  const sentiment = analyzeSentiment(allText)
  
  // 模拟痛点提取
  const painPoints = extractPainPoints(comments)
  
  // 模拟严重程度分析
  const severity = analyzeSeverity(painPoints)
  
  // 模拟频次统计
  const frequency = painPoints.length

  return {
    analysis: {
      summary: '基于用户评论的痛点分析结果',
      painPoints,
      insights: [
        '用户最关心的是产品质量',
        '价格敏感度较高',
        '对售后服务有较高期望'
      ],
      recommendations: [
        '提升产品质量控制',
        '优化价格策略',
        '加强售后服务'
      ]
    },
    keywords,
    sentiment,
    severity,
    frequency
  }
}

// 模拟关键词提取
function extractKeywords(text: string): string[] {
  const commonWords = ['的', '了', '是', '在', '有', '和', '与', '或', '但', '然而']
  const words = text.split(/[\s,，。！？；：""''（）【】]/)
    .filter(word => word.length > 1 && !commonWords.includes(word))
    .map(word => word.toLowerCase())
  
  const wordCount: { [key: string]: number } = {}
  words.forEach(word => {
    wordCount[word] = (wordCount[word] || 0) + 1
  })
  
  return Object.entries(wordCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([word]) => word)
}

// 模拟情感分析
function analyzeSentiment(text: string): string {
  const positiveWords = ['好', '棒', '优秀', '满意', '推荐', '喜欢', '赞', '完美']
  const negativeWords = ['差', '坏', '糟糕', '失望', '问题', '不好', '垃圾', '烂']
  
  const positiveCount = positiveWords.reduce((count, word) => 
    count + (text.includes(word) ? 1 : 0), 0)
  const negativeCount = negativeWords.reduce((count, word) => 
    count + (text.includes(word) ? 1 : 0), 0)
  
  if (positiveCount > negativeCount) return 'positive'
  if (negativeCount > positiveCount) return 'negative'
  return 'neutral'
}

// 模拟痛点提取
function extractPainPoints(comments: any[]): string[] {
  const painPointPatterns = [
    /质量.*问题/,
    /价格.*贵/,
    /服务.*差/,
    /物流.*慢/,
    /包装.*破损/,
    /功能.*故障/,
    /客服.*态度/,
    /售后.*问题/
  ]
  
  const painPoints: string[] = []
  
  comments.forEach(comment => {
    painPointPatterns.forEach(pattern => {
      if (pattern.test(comment.content)) {
        const match = comment.content.match(pattern)
        if (match) {
          painPoints.push(match[0])
        }
      }
    })
  })
  
  return Array.from(new Set(painPoints)) // 去重
}

// 模拟严重程度分析
function analyzeSeverity(painPoints: string[]): string {
  const highSeverityKeywords = ['严重', '无法', '完全', '彻底', '根本']
  const mediumSeverityKeywords = ['比较', '有点', '稍微', '一些']
  
  const text = painPoints.join(' ')
  
  if (highSeverityKeywords.some(keyword => text.includes(keyword))) {
    return 'high'
  }
  if (mediumSeverityKeywords.some(keyword => text.includes(keyword))) {
    return 'medium'
  }
  return 'low'
}
