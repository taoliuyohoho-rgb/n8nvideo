import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { withTraceId } from '@/src/middleware/traceId'
import { createApiLogger } from '@/src/services/logger/Logger'
import { recommendRank } from '@/src/services/recommendation/recommend'
import '@/src/services/recommendation/index'
import { callModel } from '@/src/services/ai/rules'
import { filterProductInfo } from '../../../../src/utils/productInfoFilter'
import type { ProductContext } from '../../../../src/services/recommendation/scorers/productInfoMatcher'

const prisma = new PrismaClient()

/**
 * 脚本生成 API
 * 根据商品信息和人设生成 15 秒 UGC 视频脚本
 */
async function handler(request: NextRequest, traceId: string) {
  const log = createApiLogger(traceId, 'script-generate')

  try {
    const body = await request.json()
    const { productId, personaId, variants = 1 } = body

    // 校验输入
    if (!productId) {
      log.warn('Missing productId')
      return NextResponse.json(
        { success: false, error: '商品ID必填', traceId },
        { status: 400 }
      )
    }

    if (!personaId) {
      log.warn('Missing personaId')
      return NextResponse.json(
        { success: false, error: '人设ID必填', traceId },
        { status: 400 }
      )
    }

    log.info('Generating script', { productId, personaId, variants })

    // 1. 获取商品信息
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        category: true,
        subcategory: true,
        description: true,
        sellingPoints: true,
        targetAudience: true,
        targetCountries: true
      }
    })

    if (!product) {
      log.warn('Product not found', { productId })
      return NextResponse.json(
        { success: false, error: '商品不存在', traceId },
        { status: 404 }
      )
    }

    // 2. 获取人设信息
    const persona = await prisma.persona.findUnique({
      where: { id: personaId }
    })

    if (!persona) {
      log.warn('Persona not found', { personaId })
      return NextResponse.json(
        { success: false, error: '人设不存在', traceId },
        { status: 404 }
      )
    }

    // 3. 解析商品和人设数据
    const rawSellingPoints = product.sellingPoints ? JSON.parse(product.sellingPoints as string) : []
    const targetCountries = product.targetCountries ? JSON.parse(product.targetCountries as string) : []
    const rawTargetAudiences = product.targetAudience ? JSON.parse(product.targetAudience as string) : []
    
    // 4. 使用推荐引擎筛选最匹配的前5个卖点和目标受众
    const productContext: ProductContext = {
      productName: product.name || '未知商品',
      category: product.category || '未分类',
      subcategory: product.subcategory || undefined,
      description: product.description || undefined,
      targetCountries: Array.isArray(targetCountries) ? targetCountries : [],
      existingSellingPoints: rawSellingPoints,
      existingPainPoints: [],
      existingTargetAudience: rawTargetAudiences
    }
    
    const filteredInfo = await filterProductInfo(
      rawSellingPoints,
      [],
      rawTargetAudiences,
      productContext,
      {
        maxSellingPoints: 5,
        maxPainPoints: 0,
        maxTargetAudience: 5,
        enableDeduplication: true,
        enableRelevanceScoring: true
      }
    )
    
    const sellingPoints = filteredInfo.sellingPoints
    const targetAudiences = filteredInfo.targetAudience
    
    const coreIdentity = persona.coreIdentity as any
    const vibe = persona.vibe as any

    // 4. 推荐Prompt模板
    const promptRecommendation = await recommendRank({
      scenario: 'task->prompt',
      task: { 
        taskType: 'script-generation', 
        contentType: 'text',
        jsonRequirement: true
      },
      context: { 
        region: targetCountries[0] || 'US',
        channel: 'general'
      },
      constraints: { maxLatencyMs: 8000 }
    })

    log.info('Prompt recommendation received', { 
      chosenId: promptRecommendation.chosen.id,
      decisionId: promptRecommendation.decisionId
    })

    // 5. 获取选中的Prompt模板
    const promptTemplate = await prisma.promptTemplate.findUnique({
      where: { id: promptRecommendation.chosen.id }
    })

    if (!promptTemplate) {
      log.error('Prompt template not found', { templateId: promptRecommendation.chosen.id })
      return NextResponse.json(
        { success: false, error: 'Prompt模板不存在', traceId },
        { status: 404 }
      )
    }

    // 6. 推荐AI模型
    const modelRecommendation = await recommendRank({
      scenario: 'task->model',
      task: { 
        taskType: 'script-generation', 
        contentType: 'text',
        jsonRequirement: true
      },
      context: { 
        region: targetCountries[0] || 'US',
        channel: 'general'
      },
      constraints: { maxLatencyMs: 8000 }
    })

    log.info('Model recommendation received', { 
      chosenId: modelRecommendation.chosen.id,
      decisionId: modelRecommendation.decisionId
    })

    // 7. 构建Prompt
    const promptText = buildScriptPrompt(promptTemplate.content, {
      productName: product.name,
      category: product.category,
      sellingPoints: sellingPoints.join(', '),
      targetAudience: targetAudiences.join(', '),
      personaName: coreIdentity.name,
      personaAge: coreIdentity.age,
      personaOccupation: coreIdentity.occupation,
      personaLocation: coreIdentity.location,
      personaTraits: Array.isArray(vibe.traits) ? vibe.traits.join(', ') : 'friendly, authentic',
      personaCommunicationStyle: vibe.communicationStyle || 'clear and conversational',
      duration: 15
    })

    // 8. 调用AI生成脚本
    const aiResult = await callModel({
      prompt: promptText,
      task: 'script-generation',
      evidenceMode: true,
      schema: getScriptSchema()
    })

    if (!aiResult.success || !aiResult.data) {
      log.error('AI generation failed', { error: aiResult.error })
      return NextResponse.json(
        { success: false, error: '脚本生成失败', traceId },
        { status: 500 }
      )
    }

    // 9. 验证和清理数据
    const script = validateAndCleanScript(aiResult.data)

    // 10. 记录反馈
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/recommend/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decisionId: promptRecommendation.decisionId,
          eventType: 'execute_complete',
          payload: {
            chosenId: promptRecommendation.chosen.id,
            success: true,
            latencyMs: 0 // 实际应该记录真实耗时
          }
        })
      })
    } catch (error) {
      log.warn('Failed to record feedback', { error })
    }

    log.info('Script generated successfully', { 
      productId,
      personaId,
      scriptAngle: script.angle
    })

    return NextResponse.json({
      success: true,
      scripts: [script], // 目前只生成一个变体
      modelUsed: {
        provider: modelRecommendation.chosen.provider,
        model: modelRecommendation.chosen.model,
        promptTemplate: promptTemplate.name
      }
    })

  } catch (error) {
    log.error('Failed to generate script', error)
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '脚本生成失败',
        traceId
      },
      { status: 500 }
    )
  }
}

/**
 * 构建脚本生成Prompt
 */
function buildScriptPrompt(template: string, variables: {
  productName: string
  category: string
  sellingPoints: string
  targetAudience: string
  personaName: string
  personaAge: number
  personaOccupation: string
  personaLocation: string
  personaTraits: string
  personaCommunicationStyle: string
  duration: number
}): string {
  return template
    .replace(/\{\{productName\}\}/g, variables.productName)
    .replace(/\{\{category\}\}/g, variables.category)
    .replace(/\{\{sellingPoints\}\}/g, variables.sellingPoints)
    .replace(/\{\{targetAudience\}\}/g, variables.targetAudience)
    .replace(/\{\{personaName\}\}/g, variables.personaName)
    .replace(/\{\{personaAge\}\}/g, variables.personaAge.toString())
    .replace(/\{\{personaOccupation\}\}/g, variables.personaOccupation)
    .replace(/\{\{personaLocation\}\}/g, variables.personaLocation)
    .replace(/\{\{personaTraits\}\}/g, variables.personaTraits)
    .replace(/\{\{personaCommunicationStyle\}\}/g, variables.personaCommunicationStyle)
    .replace(/\{\{duration\}\}/g, variables.duration.toString())
}

/**
 * 获取脚本Schema定义
 */
function getScriptSchema() {
  return {
    type: "object",
    properties: {
      angle: { type: "string" },
      energy: { type: "string" },
      durationSec: { type: "number" },
      lines: {
        type: "object",
        properties: {
          open: { type: "string" },
          main: { type: "string" },
          close: { type: "string" }
        },
        required: ["open", "main", "close"]
      },
      shots: {
        type: "array",
        items: {
          type: "object",
          properties: {
            second: { type: "number" },
            camera: { type: "string" },
            action: { type: "string" },
            visibility: { type: "string" },
            audio: { type: "string" }
          },
          required: ["second", "camera", "action", "visibility", "audio"]
        }
      },
      technical: {
        type: "object",
        properties: {
          orientation: { type: "string" },
          filmingMethod: { type: "string" },
          dominantHand: { type: "string" },
          location: { type: "string" },
          audioEnv: { type: "string" }
        },
        required: ["orientation", "filmingMethod", "dominantHand", "location", "audioEnv"]
      }
    },
    required: ["angle", "energy", "durationSec", "lines", "shots", "technical"]
  }
}

/**
 * 验证和清理脚本数据
 */
function validateAndCleanScript(data: any): any {
  const script = {
    angle: data.angle || '产品展示',
    energy: data.energy || '积极向上',
    durationSec: data.durationSec || 15,
    lines: {
      open: data.lines?.open || '大家好，今天给大家分享一个好东西',
      main: data.lines?.main || '这个产品真的很不错，推荐给大家',
      close: data.lines?.close || '喜欢的话记得点赞关注哦'
    },
    shots: Array.isArray(data.shots) ? data.shots : [
      {
        second: 0,
        camera: '特写',
        action: '展示产品',
        visibility: '产品清晰可见',
        audio: '旁白+背景音乐'
      }
    ],
    technical: {
      orientation: data.technical?.orientation || '竖屏',
      filmingMethod: data.technical?.filmingMethod || '手持',
      dominantHand: data.technical?.dominantHand || '右手',
      location: data.technical?.location || '家庭环境',
      audioEnv: data.technical?.audioEnv || '安静室内'
    }
  }

  return script
}

export const POST = withTraceId(handler)