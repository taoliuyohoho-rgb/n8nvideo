import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'


// 更新风格
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json()
    const { id } = params
    
    // 验证必填字段（只有在提供name字段时才验证）
    if (data.name !== undefined && !data.name) {
      return NextResponse.json(
        { success: false, error: '风格名称是必填项' },
        { status: 400 }
      )
    }

    // 验证类目是否存在于商品库中（如果提供了category）
    if (data.category !== undefined) {
      const categoryExists = await prisma.product.findFirst({
        where: { category: data.category }
      })

      if (!categoryExists) {
        return NextResponse.json(
          { success: false, error: `类目 "${data.category}" 不存在于商品库中，请先创建该类目的商品` },
          { status: 400 }
        )
      }
    }

    // 验证关联的商品是否存在（如果提供了productId）
    if (data.productId && data.productId !== '' && data.productId !== undefined) {
      const product = await prisma.product.findUnique({
        where: { id: data.productId }
      })
      if (!product) {
        return NextResponse.json(
          { success: false, error: '关联的商品不存在' },
          { status: 400 }
        )
      }
    }

    // 更新风格
    const updateData: any = {}
    
    // 只更新提供的字段
    if (data.name !== undefined) updateData.name = data.name
    if (data.description !== undefined) updateData.description = data.description
    if (data.productId !== undefined && data.productId !== '') updateData.productId = data.productId
    if (data.category !== undefined) updateData.category = data.category
    if (data.subcategory !== undefined) updateData.subcategory = data.subcategory
    if (data.tone !== undefined) updateData.tone = data.tone
    if (data.scriptStructure !== undefined) updateData.scriptStructure = data.scriptStructure ? JSON.stringify(data.scriptStructure) : null
    if (data.visualStyle !== undefined) updateData.visualStyle = data.visualStyle ? JSON.stringify(data.visualStyle) : null
    if (data.targetAudience !== undefined) updateData.targetAudience = data.targetAudience ? JSON.stringify(data.targetAudience) : null
    if (data.templatePerformance !== undefined) updateData.templatePerformance = data.templatePerformance
    if (data.hookPool !== undefined) updateData.hookPool = data.hookPool ? JSON.stringify(data.hookPool) : null
    if (data.targetCountries !== undefined) updateData.targetCountries = data.targetCountries ? JSON.stringify(data.targetCountries) : null
    if (data.isActive !== undefined) updateData.isActive = data.isActive

    const style = await prisma.style.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      data: style,
      message: '风格更新成功'
    })

  } catch (error) {
    console.error('更新风格失败:', error)
    const errorMessage = error instanceof Error ? error.message : '未知错误'
    const errorStack = error instanceof Error ? error.stack : undefined
    console.error('错误详情:', errorMessage)
    if (errorStack) {
      console.error('错误堆栈:', errorStack)
    }
    return NextResponse.json(
      { success: false, error: `更新风格失败: ${errorMessage}` },
      { status: 500 }
    )
  }
}

// 删除风格
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    await prisma.style.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: '风格删除成功'
    })

  } catch (error) {
    console.error('删除风格失败:', error)
    return NextResponse.json(
      { success: false, error: '删除风格失败' },
      { status: 500 }
    )
  }
}
