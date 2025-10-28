import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * GET /api/admin/personas - 获取所有人设列表
 */
export async function GET(request: NextRequest) {
  try {
    const personas = await prisma.persona.findMany({
      include: {
        product: {
          select: {
            id: true,
            name: true,
            category: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      data: personas
    })
  } catch (error) {
    console.error('获取人设列表失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '获取人设列表失败'
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/personas - 创建新人设
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { productId, coreIdentity, look, vibe, context, why, modelUsed } = body

    // 校验必需字段
    if (!productId || !coreIdentity || !look || !vibe || !context || !why) {
      return NextResponse.json(
        { success: false, error: '缺少必需字段' },
        { status: 400 }
      )
    }

    // 验证商品存在
    const product = await prisma.product.findUnique({
      where: { id: productId }
    })

    if (!product) {
      return NextResponse.json(
        { success: false, error: '商品不存在' },
        { status: 404 }
      )
    }

    // 获取当前最大版本号
    const latestPersona = await prisma.persona.findFirst({
      where: { productId },
      orderBy: { version: 'desc' }
    })

    const nextVersion = latestPersona ? latestPersona.version + 1 : 1

    // 创建人设
    const persona = await prisma.persona.create({
      data: {
        productId,
        version: nextVersion,
        coreIdentity,
        look,
        vibe,
        context,
        why,
        createdBy: 'admin',
        modelUsed: modelUsed || null
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
      data: persona
    })
  } catch (error) {
    console.error('创建人设失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '创建人设失败'
      },
      { status: 500 }
    )
  }
}

