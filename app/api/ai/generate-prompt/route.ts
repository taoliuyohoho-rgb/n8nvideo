import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { recommendRank } from '@/src/services/recommendation/recommend'
import '@/src/services/recommendation/index'
import { aiExecutor } from '@/src/services/ai/AiExecutor'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      productName,
      productImage,
      sellingPoints,
      marketingInfo,
      targetCountry,
      targetAudience,
      competitorUrl,
      referenceVideo,
      selectedStyleId
    } = body

    // 获取选中的模板信息
    const selectedTemplate = await prisma.template.findUnique({
      where: { id: selectedStyleId }
    })

    if (!selectedTemplate) {
      return NextResponse.json(
        { success: false, error: '未找到选中的模板' },
        { status: 404 }
      )
    }

    // 选择 Prompt 模板（task->prompt）
    const promptReco = await recommendRank({
      scenario: 'task->prompt',
      task: { taskType: 'video-script', contentType: 'text' },
      context: { region: targetCountry },
      constraints: { maxLatencyMs: 8000 },
    })

    let promptTemplateText = ''
    try {
      const tpl = await prisma.promptTemplate.findUnique({ where: { id: promptReco.chosen.id } })
      if (tpl?.content) {
        // 确保默认变量被正确设置
        const defaultVariables = {
          minSellingPoints: 3,
          maxSellingPoints: 10,
          minPainPoints: 1,
          maxPainPoints: 5,
          maxOther: 3
        }
        
        promptTemplateText = tpl.content
          .replace(/\{\{minSellingPoints\}\}/g, String(defaultVariables.minSellingPoints))
          .replace(/\{\{maxSellingPoints\}\}/g, String(defaultVariables.maxSellingPoints))
          .replace(/\{\{minPainPoints\}\}/g, String(defaultVariables.minPainPoints))
          .replace(/\{\{maxPainPoints\}\}/g, String(defaultVariables.maxPainPoints))
          .replace(/\{\{maxOther\}\}/g, String(defaultVariables.maxOther))
          .replace(/\{\{productName\}\}/g, productName || '')
          .replace(/\{\{category\}\}/g, selectedTemplate?.recommendedCategories || '')
          .replace(/\{\{sellingPoints\}\}/g, Array.isArray(sellingPoints) ? sellingPoints.slice(0, 5).join(', ') : (sellingPoints || ''))
          .replace(/\{\{targetAudience\}\}/g, targetAudience || '')
          .replace(/\{\{targetCountry\}\}|\{\{country\}\}/g, targetCountry || '')
      }
    } catch {}

    if (!promptTemplateText) {
      promptTemplateText = generateSoraPrompt({
        productName,
        sellingPoints,
        marketingInfo,
        targetCountry,
        targetAudience,
        selectedTemplate
      })
    }

    // 选择模型（task->model）
    const modelReco = await recommendRank({
      scenario: 'task->model',
      task: { taskType: 'script-generation', contentType: 'text', jsonRequirement: false },
      context: { region: targetCountry },
      constraints: { maxLatencyMs: 8000 },
    })

    // 执行生成脚本文案（埋点 execute_*）
    const provider = 'gemini' // 文本生成，可优先Gemini，后续映射模型provider
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/recommend/feedback`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decisionId: modelReco.decisionId, eventType: 'execute_start', payload: { chosenId: modelReco?.chosen?.id, targetType: 'model' } })
      })
    } catch {}
    const startTs = Date.now()
    const soraPrompt = await aiExecutor.enqueue(() => aiExecutor.execute({ provider, prompt: promptTemplateText, useSearch: false }))
    const latencyMs = Date.now() - startTs
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/recommend/feedback`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decisionId: modelReco.decisionId, eventType: 'execute_complete', payload: { chosenId: modelReco?.chosen?.id, latencyMs, success: true }, latencyMs })
      })
    } catch {}

    // 保存视频生成记录
    const video = await prisma.video.create({
      data: {
        templateId: selectedStyleId || 'default-template',
        userId: 'demo-user', // 实际应用中从认证获取
        generatedPrompt: soraPrompt,
        promptGenerationAI: modelReco.chosen.title || 'gemini',
        videoGenerationAI: selectedTemplate.videoGenerationAI || 'sora',
        status: 'generated'
      }
    })

    return NextResponse.json({
      success: true,
      soraPrompt,
      videoId: video.id,
      templateInfo: {
        name: selectedTemplate.name,
        description: selectedTemplate.description,
        structure: selectedTemplate.structure
      }
    })

  } catch (error) {
    console.error('Prompt生成错误:', error)
    return NextResponse.json(
      { success: false, error: 'Prompt生成失败' },
      { status: 500 }
    )
  }
}

function generateSoraPrompt({
  productName,
  sellingPoints,
  marketingInfo,
  targetCountry,
  targetAudience,
  selectedTemplate
}: any) {
  // 构建基础prompt
  let prompt = `Create a professional product video for "${productName}" targeting ${targetCountry} market. `

  // 添加产品信息
  if (sellingPoints) {
    const points = Array.isArray(sellingPoints) ? sellingPoints : [sellingPoints]
    prompt += `Key selling points: ${points.join(', ')}. `
  }

  // 添加营销信息
  if (marketingInfo) {
    prompt += `Marketing message: ${marketingInfo}. `
  }

  // 添加目标受众
  if (targetAudience) {
    prompt += `Target audience: ${targetAudience}. `
  }

  // 添加模板信息
  if (selectedTemplate) {
    prompt += `Video structure: ${selectedTemplate.structure}. `
    prompt += `Hook style: ${selectedTemplate.hookPool}. `
    prompt += `Video style: ${selectedTemplate.videoStylePool}. `
    prompt += `Tone: ${selectedTemplate.tonePool}. `
    prompt += `Suggested length: ${selectedTemplate.suggestedLength}. `
  }

  // 添加技术要求
  prompt += `Technical requirements: High quality 4K video, smooth camera movements, professional editing, suitable for social media platforms. `

  // 添加时长和格式
  prompt += `Duration: 15-30 seconds, vertical format (9:16) for mobile viewing, with clear product visibility and engaging visuals.`

  return prompt
}
