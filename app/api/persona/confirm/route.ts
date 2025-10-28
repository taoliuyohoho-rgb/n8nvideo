import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { withTraceId } from '@/src/middleware/traceId'
import { createApiLogger } from '@/src/services/logger/Logger'

const prisma = new PrismaClient()

/**
 * 人设确认 API
 * 将生成的人设保存到数据库
 */
async function handler(request: NextRequest, traceId: string) {
  const log = createApiLogger(traceId, 'persona-confirm')

  try {
    const body = await request.json()
    const { productId, persona } = body

    // 校验输入
    if (!productId) {
      log.warn('Missing productId')
      return NextResponse.json(
        { success: false, error: '商品ID必填', traceId },
        { status: 400 }
      )
    }

    if (!persona) {
      log.warn('Missing persona')
      return NextResponse.json(
        { success: false, error: '人设数据必填', traceId },
        { status: 400 }
      )
    }

    log.info('Confirming persona', { productId })

    // 1. 验证商品存在
    const product = await prisma.product.findUnique({
      where: { id: productId }
    })

    if (!product) {
      log.warn('Product not found', { productId })
      return NextResponse.json(
        { success: false, error: '商品不存在', traceId },
        { status: 404 }
      )
    }

    // 2. 验证人设数据结构
    const validatedPersona = validatePersonaStructure(persona)
    if (!validatedPersona) {
      log.warn('Invalid persona structure')
      return NextResponse.json(
        { success: false, error: '人设数据结构无效', traceId },
        { status: 400 }
      )
    }

    // 3. 获取当前版本号
    const latestPersona = await prisma.persona.findFirst({
      where: { productId },
      orderBy: { version: 'desc' }
    })

    const nextVersion = latestPersona ? latestPersona.version + 1 : 1

    // 4. 创建人设记录
    const createdPersona = await prisma.persona.create({
      data: {
        productId,
        version: nextVersion,
        coreIdentity: validatedPersona.coreIdentity,
        look: validatedPersona.look,
        vibe: validatedPersona.vibe,
        context: validatedPersona.context,
        why: validatedPersona.why,
        createdBy: 'system', // 实际应用中从认证获取
        modelUsed: validatedPersona.modelUsed || null
      }
    })

    log.info('Persona confirmed successfully', { 
      personaId: createdPersona.id,
      productId,
      version: nextVersion
    })

    return NextResponse.json({
      success: true,
      personaId: createdPersona.id,
      version: nextVersion
    })

  } catch (error) {
    log.error('Failed to confirm persona', error)
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '人设确认失败',
        traceId
      },
      { status: 500 }
    )
  }
}

/**
 * 验证人设数据结构
 */
function validatePersonaStructure(persona: any): any | null {
  try {
    // 检查必需字段
    const requiredFields = ['coreIdentity', 'look', 'vibe', 'context', 'why']
    for (const field of requiredFields) {
      if (!persona[field]) {
        return null
      }
    }

    // 检查coreIdentity结构
    const coreIdentity = persona.coreIdentity
    const coreRequiredFields = ['name', 'age', 'gender', 'location', 'occupation']
    for (const field of coreRequiredFields) {
      if (!coreIdentity[field]) {
        return null
      }
    }

    // 检查look结构
    const look = persona.look
    const lookRequiredFields = ['generalAppearance', 'hair', 'clothingAesthetic', 'signatureDetails']
    for (const field of lookRequiredFields) {
      if (!look[field]) {
        return null
      }
    }

    // 检查vibe结构
    const vibe = persona.vibe
    const vibeRequiredFields = ['traits', 'demeanor', 'communicationStyle']
    for (const field of vibeRequiredFields) {
      if (!vibe[field]) {
        return null
      }
    }

    // 检查context结构
    const context = persona.context
    const contextRequiredFields = ['hobbies', 'values', 'frustrations', 'homeEnvironment']
    for (const field of contextRequiredFields) {
      if (!context[field]) {
        return null
      }
    }

    // 验证数据类型
    if (typeof coreIdentity.age !== 'number' || coreIdentity.age < 1 || coreIdentity.age > 100) {
      return null
    }

    if (!Array.isArray(vibe.traits) || vibe.traits.length === 0) {
      return null
    }

    if (typeof persona.why !== 'string' || persona.why.trim().length === 0) {
      return null
    }

    return persona
  } catch (error) {
    return null
  }
}

export const POST = withTraceId(handler)