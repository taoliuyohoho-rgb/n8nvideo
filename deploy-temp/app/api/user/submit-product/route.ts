import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// 用户提交商品信息更新
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      userId,
      productData,
      source,
      sourceVideoId,
      sourceUrl,
      targetId // 如果是更新现有商品
    } = body

    if (!userId || !productData) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // 获取原始数据（如果存在）
    let originalData = null
    if (targetId) {
      const existingProduct = await prisma.product.findUnique({
        where: { id: targetId }
      })
      if (existingProduct) {
        originalData = {
          sellingPoints: existingProduct.sellingPoints,
          description: existingProduct.description,
          category: existingProduct.category,
          subcategory: existingProduct.subcategory,
          targetCountries: existingProduct.targetCountries
        }
      }
    }

    // 创建用户提交记录
    const submission = await prisma.userSubmission.create({
      data: {
        userId,
        type: 'product',
        targetId,
        data: JSON.stringify(productData),
        originalData: originalData ? JSON.stringify(originalData) : null,
        source: source || 'user_analysis',
        sourceVideoId,
        sourceUrl
      }
    })

    return NextResponse.json({
      success: true,
      data: submission,
      message: '商品信息已提交，等待管理员审核'
    })

  } catch (error) {
    console.error('Submit product failed:', error)
    return NextResponse.json(
      { error: 'Failed to submit product' },
      { status: 500 }
    )
  }
}
