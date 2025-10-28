import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

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

    // 生成Sora prompt
    const soraPrompt = generateSoraPrompt({
      productName,
      sellingPoints,
      marketingInfo,
      targetCountry,
      targetAudience,
      selectedTemplate
    })

    // 保存视频生成记录
    const video = await prisma.video.create({
      data: {
        templateId: selectedStyleId || 'default-template',
        userId: 'demo-user', // 实际应用中从认证获取
        generatedPrompt: soraPrompt,
        promptGenerationAI: selectedTemplate.promptGenerationAI || 'gemini',
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
