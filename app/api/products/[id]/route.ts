import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { PermissionService, Resource, Action } from '@/src/services/permission/permission.service'
import { convertDatabaseProductToBusiness } from '@/utils/dataConverter'
import { isBusinessProduct } from '@/utils/typeGuards'
import type { BusinessProduct, ApiResponse } from '@/types/business'
import type { DatabaseProduct } from '@/types/database'

// 获取商品详情（解析数组字段）
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: '未认证用户' }, { status: 401 })
    }

    const hasPermission = await PermissionService.checkPermission(
      user,
      Resource.PRODUCTS,
      Action.READ
    )
    
    if (!hasPermission) {
      return NextResponse.json({ error: '权限不足' }, { status: 403 })
    }

    const product = await prisma.product.findUnique({ where: { id: params.id } })
    if (!product) {
      return NextResponse.json({ success: false, error: '商品不存在' }, { status: 404 })
    }

    // 转换数据库商品为业务商品
    const parsed = convertDatabaseProductToBusiness(product as DatabaseProduct)

    return NextResponse.json({ success: true, data: parsed })
  } catch (error) {
    console.error('获取商品失败:', error)
    return NextResponse.json(
      { success: false, error: '获取商品失败' },
      { status: 500 }
    )
  }
}

// 获取当前用户（临时实现，需要根据实际认证方式调整）
async function getCurrentUser(request: NextRequest) {
  // TODO: 实现实际的用户认证逻辑
  // 这里需要根据你的认证方式（JWT、Session等）来获取当前用户
  // 暂时返回一个模拟用户，实际使用时需要实现
  return {
    id: 'temp_user_id',
    email: 'admin@example.com',
    name: 'Admin User',
    password: null,
    role: 'super_admin',
    organizationId: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
}

// 更新商品
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // TODO: 从认证中获取当前用户
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: '未认证用户' }, { status: 401 })
    }

    // 检查权限
    const hasPermission = await PermissionService.checkPermission(
      user,
      Resource.PRODUCTS,
      Action.UPDATE
    )
    
    if (!hasPermission) {
      return NextResponse.json({ error: '权限不足' }, { status: 403 })
    }

    const data = await request.json()
    const productId = params.id
    
    // 验证必填字段（仅在提供了 name 时校验非空，支持部分字段更新）
    if (data.name !== undefined && !data.name) {
      return NextResponse.json(
        { success: false, error: '商品名称是必填项' },
        { status: 400 }
      )
    }

    // 处理自定义类目
    if (data.category === 'custom') {
      data.category = data.customCategory || '未分类'
    }

    // 构建更新数据
    const updateData: Record<string, unknown> = {}
    
    if (data.name !== undefined) updateData.name = data.name
    if (data.description !== undefined) updateData.description = data.description
    if (data.category !== undefined) updateData.category = data.category
    if (data.subcategory !== undefined) updateData.subcategory = data.subcategory
    if (data.sellingPoints !== undefined) updateData.sellingPoints = data.sellingPoints
    if (data.skuImages !== undefined) updateData.skuImages = JSON.stringify(data.skuImages)
    if (data.targetCountries !== undefined) {
      updateData.targetCountries = JSON.stringify(data.targetCountries)
      updateData.country = data.targetCountries
    }
    if (data.targetAudience !== undefined) updateData.targetAudience = data.targetAudience
    if (data.painPoints !== undefined) {
      updateData.painPoints = data.painPoints
      updateData.painPointsLastUpdate = new Date()
      updateData.painPointsSource = '手动编辑'
    }

    // 更新商品
    const product = await prisma.product.update({
      where: { id: productId },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      data: product,
      message: '商品更新成功'
    })

  } catch (error) {
    console.error('更新商品失败:', error)
    return NextResponse.json(
      { success: false, error: '更新商品失败' },
      { status: 500 }
    )
  }
}

// 删除商品
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // TODO: 从认证中获取当前用户
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: '未认证用户' }, { status: 401 })
    }

    // 检查权限
    const hasPermission = await PermissionService.checkPermission(
      user,
      Resource.PRODUCTS,
      Action.DELETE
    )
    
    if (!hasPermission) {
      return NextResponse.json({ error: '权限不足' }, { status: 403 })
    }

    const productId = params.id

    // 检查商品是否存在
    const product = await prisma.product.findUnique({
      where: { id: productId }
    })

    if (!product) {
      return NextResponse.json(
        { success: false, error: '商品不存在' },
        { status: 404 }
      )
    }

    // 删除商品
    await prisma.product.delete({
      where: { id: productId }
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
