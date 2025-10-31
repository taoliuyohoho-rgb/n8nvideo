/**
 * 视频生成Prompt API
 * 简化版本：只需要产品信息，自动推荐模型和Prompt模板
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { recommendRank } from '@/src/services/recommendation/recommend'
import { aiExecutor } from '@/src/services/ai/AiExecutor'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      productId,
      productName,
      sellingPoints,
      targetCountry,
      targetAudience,
      category,
    } = body

    if (!productName) {
      return NextResponse.json(
        { success: false, error: '缺少产品名称' },
        { status: 400 }
      )
    }

    // 步骤1: 推荐Prompt模板
    console.log('📝 推荐Prompt模板...')
    let promptRecommendation
    try {
      promptRecommendation = await recommendRank({
        scenario: 'task->prompt',
        task: { 
          taskType: 'video-script', 
          contentType: 'text',
          language: 'zh',
        },
        context: { 
          region: targetCountry || 'CN',
          category: category
        },
        constraints: { maxLatencyMs: 5000 },
      })
    } catch (err) {
      console.error('Prompt模板推荐失败:', err)
      promptRecommendation = null
    }

    // 步骤2: 推荐模型
    console.log('🤖 推荐生成模型...')
    let modelRecommendation
    try {
      modelRecommendation = await recommendRank({
        scenario: 'task->model',
        task: { 
          taskType: 'video-generation',
          contentType: 'video',
          jsonRequirement: false,
          language: 'zh',
        },
        context: { 
          region: targetCountry || 'CN',
          category: category
        },
        constraints: { maxLatencyMs: 5000 },
      })
    } catch (err) {
      console.error('模型推荐失败:', err)
      modelRecommendation = null
    }

    // 步骤3: 获取Prompt模板内容
    let promptTemplateText = ''
    if (promptRecommendation?.chosen?.id) {
      try {
        const promptTemplate = await prisma.promptTemplate.findUnique({ 
          where: { id: promptRecommendation.chosen.id } 
        })
      
      if (promptTemplate?.content) {
        // 替换变量
        promptTemplateText = promptTemplate.content
          .replace(/\{\{productName\}\}/g, productName || '')
          .replace(/\{\{category\}\}/g, category || '')
          .replace(/\{\{sellingPoints\}\}/g, Array.isArray(sellingPoints) 
            ? sellingPoints.slice(0, 5).join(', ') 
            : (sellingPoints || ''))
          .replace(/\{\{targetAudience\}\}/g, targetAudience || '')
          .replace(/\{\{targetCountry\}\}|\{\{country\}\}/g, targetCountry || '')
          .replace(/\{\{duration\}\}/g, '30')
      }
      } catch (err) {
        console.error('获取Prompt模板失败:', err)
      }
    }

    // 如果没有模板，使用默认生成逻辑
    if (!promptTemplateText) {
      promptTemplateText = generateDefaultVideoPrompt({
        productName,
        sellingPoints,
        targetCountry,
        targetAudience,
        category,
      })
    }

    // 步骤4: 生成最终Prompt
    console.log('✨ 生成最终Prompt...')
    const provider = 'gemini' // 默认使用Gemini
    
    // 记录执行开始
    if (modelRecommendation?.decisionId && modelRecommendation?.chosen?.id) {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/recommend/feedback`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            decisionId: modelRecommendation.decisionId, 
            eventType: 'execute_start', 
            payload: { 
              chosenId: modelRecommendation.chosen.id, 
              targetType: 'model' 
            } 
          })
        })
      } catch (err) {
        console.warn('反馈记录失败:', err)
      }
    }

    const startTs = Date.now()
    let generatedPrompt = await aiExecutor.enqueue(() => 
      aiExecutor.execute({ 
        provider, 
        prompt: promptTemplateText, 
        useSearch: false 
      })
    )
    const latencyMs = Date.now() - startTs

    // 记录执行完成
    if (modelRecommendation?.decisionId && modelRecommendation?.chosen?.id) {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/recommend/feedback`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            decisionId: modelRecommendation.decisionId, 
            eventType: 'execute_complete', 
            payload: { 
              chosenId: modelRecommendation.chosen.id, 
              latencyMs, 
              success: true 
            }, 
            latencyMs 
          })
        })
      } catch (err) {
        console.warn('反馈记录失败:', err)
      }
    }

    // 尝试解析JSON格式
    try {
      const parsed = JSON.parse(generatedPrompt)
      generatedPrompt = parsed.script || parsed.prompt || generatedPrompt
    } catch {
      // 保持原样
    }

    // 保存到历史记录
    let historyId: string | undefined
    try {
      const history = await prisma.promptGenerationHistory.create({
        data: {
          productId,
          productName,
          productCategory: category,
          generatedPrompt,
          promptTemplate: promptRecommendation?.chosen ? {
            id: promptRecommendation.chosen.id,
            title: promptRecommendation.chosen.title,
          } : null,
          modelUsed: {
            id: modelRecommendation?.chosen?.id || 'default',
            title: modelRecommendation?.chosen?.title || 'Default Model',
            provider: provider,
          },
          inputParams: {
            productId,
            productName,
            sellingPoints,
            targetCountry,
            targetAudience,
            category,
          },
          recommendations: {
            model: modelRecommendation?.chosen,
            promptTemplate: promptRecommendation?.chosen,
          },
          metadata: {
            latencyMs,
            promptTemplateUsed: !!promptTemplateText,
            recommendationUsed: !!(modelRecommendation && promptRecommendation),
          },
          status: 'success',
        }
      })
      historyId = history.id
      console.log('✅ Prompt历史记录已保存:', historyId)
    } catch (err) {
      console.error('保存Prompt历史记录失败:', err)
      // 不影响主流程，继续返回结果
    }

    return NextResponse.json({
      success: true,
      prompt: generatedPrompt,
      historyId, // 返回历史记录ID
      recommendations: {
        model: {
          id: modelRecommendation?.chosen?.id || 'default',
          title: modelRecommendation?.chosen?.title || 'Default Model',
          provider: provider,
        },
        promptTemplate: {
          id: promptRecommendation?.chosen?.id || 'default',
          title: promptRecommendation?.chosen?.title || 'Default Template',
        }
      },
      metadata: {
        latencyMs,
        promptTemplateUsed: !!promptTemplateText,
        recommendationUsed: !!(modelRecommendation && promptRecommendation),
      }
    })

  } catch (error) {
    console.error('视频Prompt生成错误:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Prompt生成失败' 
      },
      { status: 500 }
    )
  }
}

/**
 * 生成默认视频Prompt（当没有模板时）
 */
function generateDefaultVideoPrompt({
  productName,
  sellingPoints,
  targetCountry,
  targetAudience,
  category,
}: {
  productName: string
  sellingPoints?: string[] | string
  targetCountry?: string
  targetAudience?: string
  category?: string
}) {
  let prompt = `为产品"${productName}"生成一个专业的视频脚本。\n\n`

  if (category) {
    prompt += `产品类别：${category}\n`
  }

  if (targetCountry) {
    prompt += `目标市场：${targetCountry}\n`
  }

  if (targetAudience) {
    prompt += `目标受众：${targetAudience}\n`
  }

  if (sellingPoints) {
    const points = Array.isArray(sellingPoints) ? sellingPoints : [sellingPoints]
    if (points.length > 0) {
      prompt += `核心卖点：${points.join('、')}\n`
    }
  }

  prompt += `\n请生成一个15-30秒的视频脚本，包含：\n`
  prompt += `1. 引人注目的开场（hook）\n`
  prompt += `2. 产品展示和核心价值\n`
  prompt += `3. 行动召唤（CTA）\n\n`
  prompt += `要求：简洁有力，适合社交媒体平台，竖屏格式（9:16）。`

  return prompt
}

