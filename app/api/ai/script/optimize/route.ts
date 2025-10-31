import { NextRequest, NextResponse } from 'next/server'
import { aiExecutor } from '@/src/services/ai/AiExecutor'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { scriptContent, productInfo, targetAudience } = body

    if (!scriptContent) {
      return NextResponse.json(
        { success: false, error: '脚本内容不能为空' },
        { status: 400 }
      )
    }

    // 获取脚本质量评估prompt模板
    const qualityPrompt = await prisma.promptTemplate.findFirst({
      where: {
        name: '脚本质量评估',
        businessModule: 'video-script'
      }
    })

    if (!qualityPrompt) {
      return NextResponse.json(
        { success: false, error: '未找到质量评估模板' },
        { status: 404 }
      )
    }

    // 构建评估prompt
    const prompt = qualityPrompt.content
      .replace(/\{\{scriptContent\}\}/g, scriptContent)
      .replace(/\{\{productInfo\}\}/g, productInfo || '')
      .replace(/\{\{targetAudience\}\}/g, targetAudience || '')

    // 使用AI进行质量评估
    const evaluation = await aiExecutor.enqueue(() => 
      aiExecutor.execute({ 
        provider: 'gemini', 
        prompt, 
        useSearch: false,
        jsonMode: true as any
      })
    )

    let evaluationResult
    try {
      evaluationResult = JSON.parse(evaluation)
    } catch (error) {
      // 如果解析失败，返回基础评估
      evaluationResult = {
        overallScore: 60,
        scores: {
          content: 15,
          structure: 15,
          emotion: 15,
          conversion: 15
        },
        strengths: ['脚本结构完整'],
        weaknesses: ['内容需要优化'],
        suggestions: ['增加具体数据和事实', '强化情感表达', '明确行动号召'],
        improvedScript: scriptContent
      }
    }

    // 如果评分低于70分，尝试自动优化
    if (evaluationResult.overallScore < 70) {
      try {
        // 获取高质量脚本生成模板
        const scriptPrompt = await prisma.promptTemplate.findFirst({
          where: {
            name: '脚本生成-高质量标准模板',
            businessModule: 'video-script'
          }
        })

        if (scriptPrompt) {
          const optimizedPrompt = scriptPrompt.content
            .replace(/\{\{productName\}\}/g, productInfo?.name || '')
            .replace(/\{\{category\}\}/g, productInfo?.category || '')
            .replace(/\{\{sellingPoints\}\}/g, productInfo?.sellingPoints || '')
            .replace(/\{\{targetAudience\}\}/g, targetAudience || '')
            .replace(/\{\{duration\}\}/g, '30')
            .replace(/\{\{painPoints\}\}/g, evaluationResult.weaknesses?.join(', ') || '')
            .replace(/\{\{usageScenarios\}\}/g, productInfo?.usageScenarios || '')

          const optimizedScript = await aiExecutor.enqueue(() => 
            aiExecutor.execute({ 
              provider: 'gemini', 
              prompt: optimizedPrompt, 
              useSearch: false,
              jsonMode: true as any
            })
          )

          try {
            const optimizedResult = JSON.parse(optimizedScript)
            evaluationResult.improvedScript = optimizedResult.script || optimizedScript
            evaluationResult.optimizationApplied = true
          } catch (error) {
            evaluationResult.improvedScript = optimizedScript
            evaluationResult.optimizationApplied = true
          }
        }
      } catch (error) {
        console.error('脚本优化失败:', error)
      }
    }

    return NextResponse.json({
      success: true,
      evaluation: evaluationResult
    })

  } catch (error) {
    console.error('脚本质量评估错误:', error)
    return NextResponse.json(
      { success: false, error: '脚本质量评估失败' },
      { status: 500 }
    )
  }
}
