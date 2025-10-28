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
 * 人设生成 API
 * 根据商品信息生成理想的 UGC 创作者人设
 */
async function handler(request: NextRequest, traceId: string) {
  const log = createApiLogger(traceId, 'persona-generate')

  try {
    const body = await request.json()
    const { productId, overrides } = body

    // 校验输入
    if (!productId) {
      log.warn('Missing productId')
      return NextResponse.json(
        { success: false, error: '商品ID必填', traceId },
        { status: 400 }
      )
    }

    log.info('Generating persona', { productId })

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
        painPoints: true,
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

    // 2. 解析商品数据
    const rawSellingPoints = product.sellingPoints ? JSON.parse(product.sellingPoints as string) : []
    const rawPainPoints = product.painPoints ? JSON.parse(product.painPoints as string) : []
    const targetCountries = product.targetCountries ? JSON.parse(product.targetCountries as string) : []
    const rawTargetAudiences = product.targetAudience ? JSON.parse(product.targetAudience as string) : []
    
    // 3. 使用推荐引擎筛选最匹配的前5个卖点、痛点和目标受众
    const productContext: ProductContext = {
      productName: product.name || '未知商品',
      category: product.category || '未分类',
      subcategory: product.subcategory || undefined,
      description: product.description || undefined,
      targetCountries: Array.isArray(targetCountries) ? targetCountries : [],
      existingSellingPoints: rawSellingPoints,
      existingPainPoints: rawPainPoints,
      existingTargetAudience: rawTargetAudiences
    }
    
    const filteredInfo = await filterProductInfo(
      rawSellingPoints,
      rawPainPoints,
      rawTargetAudiences,
      productContext,
      {
        maxSellingPoints: 5,
        maxPainPoints: 5,
        maxTargetAudience: 5,
        enableDeduplication: true,
        enableRelevanceScoring: true
      }
    )
    
    const sellingPoints = filteredInfo.sellingPoints
    const painPoints = filteredInfo.painPoints
    const targetAudiences = filteredInfo.targetAudience

    // 3. 推荐Prompt模板
    const promptRecommendation = await recommendRank({
      scenario: 'task->prompt',
      task: { 
        taskType: 'persona-generation', 
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

    // 4. 获取选中的Prompt模板
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

    // 5. 推荐AI模型
    const modelRecommendation = await recommendRank({
      scenario: 'task->model',
      task: { 
        taskType: 'persona-generation', 
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

    // 6. 构建Prompt
    const promptText = buildPersonaPrompt(promptTemplate.content, {
      productName: product.name,
      country: targetCountries[0] || 'US',
      targetAudiences: targetAudiences.join(', '),
      sellingPointsTop5: sellingPoints.join(', '),
      painPointsTop5: painPoints.join(', ')
    })

    // 7. 调用AI生成人设
    const aiResult = await callModel({
      prompt: promptText,
      task: 'persona-generation',
      evidenceMode: true,
      schema: getPersonaSchema()
    })

    if (!aiResult.success || !aiResult.data) {
      log.error('AI generation failed', { error: aiResult.error })
      return NextResponse.json(
        { success: false, error: '人设生成失败', traceId },
        { status: 500 }
      )
    }

    // 8. 验证和清理数据
    const persona = validateAndCleanPersona(aiResult.data, overrides)

    // 9. 记录反馈
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

    log.info('Persona generated successfully', { 
      productId,
      personaName: persona.coreIdentity.name
    })

    // 从 modelRecommendation.chosen.name 解析 provider 和 model
    const [provider, model] = (modelRecommendation.chosen.name || modelRecommendation.chosen.title || '').split('/')

    return NextResponse.json({
      success: true,
      persona,
      modelUsed: {
        provider: provider || 'unknown',
        model: model || modelRecommendation.chosen.name || 'unknown',
        promptTemplate: promptTemplate.name
      }
    })

  } catch (error) {
    log.error('Failed to generate persona', error)
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '人设生成失败',
        traceId
      },
      { status: 500 }
    )
  }
}

/**
 * 构建人设生成Prompt
 */
function buildPersonaPrompt(template: string, variables: {
  productName: string
  country: string
  targetAudiences: string
  sellingPointsTop5: string
  painPointsTop5: string
}): string {
  return template
    .replace(/\{\{productName\}\}/g, variables.productName)
    .replace(/\{\{country\}\}/g, variables.country)
    .replace(/\{\{targetAudiences\}\}/g, variables.targetAudiences)
    .replace(/\{\{sellingPointsTop5\}\}/g, variables.sellingPointsTop5)
    .replace(/\{\{painPointsTop5\}\}/g, variables.painPointsTop5)
}

/**
 * 获取人设Schema定义
 */
function getPersonaSchema() {
  return {
    type: "object",
    properties: {
      coreIdentity: {
        type: "object",
        properties: {
          name: { type: "string" },
          age: { type: "number" },
          gender: { type: "string" },
          location: { type: "string" },
          occupation: { type: "string" }
        },
        required: ["name", "age", "gender", "location", "occupation"]
      },
      look: {
        type: "object",
        properties: {
          generalAppearance: { type: "string" },
          hair: { type: "string" },
          clothingAesthetic: { type: "string" },
          signatureDetails: { type: "string" }
        },
        required: ["generalAppearance", "hair", "clothingAesthetic", "signatureDetails"]
      },
      vibe: {
        type: "object",
        properties: {
          traits: { type: "array", items: { type: "string" } },
          demeanor: { type: "string" },
          communicationStyle: { type: "string" }
        },
        required: ["traits", "demeanor", "communicationStyle"]
      },
      context: {
        type: "object",
        properties: {
          hobbies: { type: "string" },
          values: { type: "string" },
          frustrations: { type: "string" },
          homeEnvironment: { type: "string" }
        },
        required: ["hobbies", "values", "frustrations", "homeEnvironment"]
      },
      why: { type: "string" }
    },
    required: ["coreIdentity", "look", "vibe", "context", "why"]
  }
}

/**
 * 验证和清理人设数据
 */
function validateAndCleanPersona(data: any, overrides?: any): any {
  const persona = {
    coreIdentity: {
      name: data.coreIdentity?.name || 'Alex',
      age: data.coreIdentity?.age || 28,
      gender: data.coreIdentity?.gender || 'non-binary',
      location: data.coreIdentity?.location || 'Urban area',
      occupation: data.coreIdentity?.occupation || 'Professional'
    },
    look: {
      generalAppearance: data.look?.generalAppearance || 'Clean and approachable',
      hair: data.look?.hair || 'Well-groomed',
      clothingAesthetic: data.look?.clothingAesthetic || 'Casual professional',
      signatureDetails: data.look?.signatureDetails || 'Friendly smile'
    },
    vibe: {
      traits: Array.isArray(data.vibe?.traits) ? data.vibe.traits : ['friendly', 'authentic', 'reliable'],
      demeanor: data.vibe?.demeanor || 'Warm and approachable',
      communicationStyle: data.vibe?.communicationStyle || 'Clear and conversational'
    },
    context: {
      hobbies: data.context?.hobbies || 'Various interests',
      values: data.context?.values || 'Quality and authenticity',
      frustrations: data.context?.frustrations || 'Common daily challenges',
      homeEnvironment: data.context?.homeEnvironment || 'Comfortable living space'
    },
    why: data.why || 'Experienced user with genuine insights'
  }

  // 应用覆盖
  if (overrides) {
    Object.assign(persona, overrides)
  }

  return persona
}

export const POST = withTraceId(handler)