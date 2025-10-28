import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * PUT /api/admin/personas/[id] - 更新人设
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const { productId, coreIdentity, look, vibe, context, why, modelUsed } = body

    // 校验必需字段
    if (!coreIdentity || !look || !vibe || !context || !why) {
      return NextResponse.json(
        { success: false, error: '缺少必需字段' },
        { status: 400 }
      )
    }

    // 如果更新了productId，验证商品存在
    if (productId) {
      const product = await prisma.product.findUnique({
        where: { id: productId }
      })

      if (!product) {
        return NextResponse.json(
          { success: false, error: '商品不存在' },
          { status: 404 }
        )
      }
    }

    // 更新人设
    const persona = await prisma.persona.update({
      where: { id },
      data: {
        ...(productId && { productId }),
        coreIdentity,
        look,
        vibe,
        context,
        why,
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
    console.error('更新人设失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '更新人设失败'
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/personas/[id] - 删除人设
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    await prisma.persona.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true
    })
  } catch (error) {
    console.error('删除人设失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '删除人设失败'
      },
      { status: 500 }
    )
  }
}

