import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// 删除商品
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    await prisma.product.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: '商品删除成功'
    })

  } catch (error) {
    console.error('删除商品失败:', error)
    return NextResponse.json(
      { success: false, error: '删除商品失败' },
      { status: 500 }
    )
  }
}

// 获取单个商品
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        templates: true,
        productMappings: true,
        painPointAnalyses: true
      }
    })

    if (!product) {
      return NextResponse.json(
        { success: false, error: '商品不存在' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: product
    })

  } catch (error) {
    console.error('获取商品失败:', error)
    return NextResponse.json(
      { success: false, error: '获取商品失败' },
      { status: 500 }
    )
  }
}
