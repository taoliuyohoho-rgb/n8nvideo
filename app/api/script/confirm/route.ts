import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { withTraceId } from '@/src/middleware/traceId'
import { createApiLogger } from '@/src/services/logger/Logger'

const prisma = new PrismaClient()

/**
 * 脚本确认 API
 * 将生成的脚本保存到数据库
 */
async function handler(request: NextRequest, traceId: string) {
  const log = createApiLogger(traceId, 'script-confirm')

  try {
    const body = await request.json()
    const { productId, personaId, scripts } = body

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

    if (!scripts || !Array.isArray(scripts) || scripts.length === 0) {
      log.warn('Missing or invalid scripts')
      return NextResponse.json(
        { success: false, error: '脚本数据必填', traceId },
        { status: 400 }
      )
    }

    log.info('Confirming scripts', { productId, personaId, scriptCount: scripts.length })

    // 1. 验证商品和人设存在
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

    // 2. 验证脚本数据结构
    const validatedScripts = []
    for (const script of scripts) {
      const validatedScript = validateScriptStructure(script)
      if (!validatedScript) {
        log.warn('Invalid script structure', { script })
        return NextResponse.json(
          { success: false, error: '脚本数据结构无效', traceId },
          { status: 400 }
        )
      }
      validatedScripts.push(validatedScript)
    }

    // 3. 获取当前版本号
    const latestScript = await prisma.script.findFirst({
      where: { productId },
      orderBy: { version: 'desc' }
    })

    const nextVersion = latestScript ? latestScript.version + 1 : 1

    // 4. 创建脚本记录
    const createdScripts = []
    for (let i = 0; i < validatedScripts.length; i++) {
      const script = validatedScripts[i]
      const createdScript = await prisma.script.create({
        data: {
          productId,
          personaId,
          version: nextVersion + i, // 每个脚本使用不同版本号
          angle: script.angle,
          energy: script.energy,
          durationSec: script.durationSec,
          lines: script.lines,
          shots: script.shots,
          technical: script.technical,
          createdBy: 'system', // 实际应用中从认证获取
          modelUsed: script.modelUsed || null,
          evidenceIds: script.evidenceIds || []
        }
      })
      createdScripts.push(createdScript)
    }

    log.info('Scripts confirmed successfully', { 
      scriptIds: createdScripts.map(s => s.id),
      productId,
      personaId,
      version: nextVersion
    })

    return NextResponse.json({
      success: true,
      scriptIds: createdScripts.map(s => s.id),
      version: nextVersion
    })

  } catch (error) {
    log.error('Failed to confirm scripts', error)
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '脚本确认失败',
        traceId
      },
      { status: 500 }
    )
  }
}

/**
 * 验证脚本数据结构
 */
function validateScriptStructure(script: any): any | null {
  try {
    // 检查必需字段
    const requiredFields = ['angle', 'energy', 'durationSec', 'lines', 'shots', 'technical']
    for (const field of requiredFields) {
      if (!script[field]) {
        return null
      }
    }

    // 检查lines结构
    const lines = script.lines
    const linesRequiredFields = ['open', 'main', 'close']
    for (const field of linesRequiredFields) {
      if (!lines[field] || typeof lines[field] !== 'string') {
        return null
      }
    }

    // 检查shots结构
    const shots = script.shots
    if (!Array.isArray(shots) || shots.length === 0) {
      return null
    }

    for (const shot of shots) {
      const shotRequiredFields = ['second', 'camera', 'action', 'visibility', 'audio']
      for (const field of shotRequiredFields) {
        if (!shot[field] || typeof shot[field] !== 'string') {
          return null
        }
      }
      if (typeof shot.second !== 'number' || shot.second < 0) {
        return null
      }
    }

    // 检查technical结构
    const technical = script.technical
    const technicalRequiredFields = ['orientation', 'filmingMethod', 'dominantHand', 'location', 'audioEnv']
    for (const field of technicalRequiredFields) {
      if (!technical[field] || typeof technical[field] !== 'string') {
        return null
      }
    }

    // 验证数据类型
    if (typeof script.durationSec !== 'number' || script.durationSec < 1 || script.durationSec > 60) {
      return null
    }

    if (typeof script.angle !== 'string' || script.angle.trim().length === 0) {
      return null
    }

    if (typeof script.energy !== 'string' || script.energy.trim().length === 0) {
      return null
    }

    return script
  } catch (error) {
    return null
  }
}

export const POST = withTraceId(handler)