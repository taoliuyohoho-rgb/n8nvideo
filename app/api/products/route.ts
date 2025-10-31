import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { PermissionService, Resource, Action } from '@/src/services/permission/permission.service'
import { convertDatabaseProductToBusiness } from '@/utils/dataConverter'
import { isBusinessProduct, isSuccessApiResponse } from '@/utils/typeGuards'
import type { BusinessProduct, ApiResponse, PaginatedResponse } from '@/types/business'
import type { DatabaseProduct } from '@/types/database'

// 获取商品列表
export async function GET(request: NextRequest) {
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
      Action.READ
    )
    
    if (!hasPermission) {
      return NextResponse.json({ error: '权限不足' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const category = searchParams.get('category')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: Record<string, unknown> = {}
    
    // 添加数据过滤条件
    const dataFilter = PermissionService.getDataFilter(user)
    Object.assign(where, dataFilter)
    
    // 搜索条件（支持名称/描述/类目/子类目模糊匹配）
    if (search) {
      const keyword = String(search).trim()
      where.OR = [
        { name: { contains: keyword } },
        { description: { contains: keyword } },
        { category: { contains: keyword } },
        { subcategory: { contains: keyword } }
      ]
    }
    
    // 类目筛选
    if (category && category !== 'all') {
      where.category = category
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        select: {
          id: true,
          name: true,
          description: true,
          category: true,
          subcategory: true,
          sellingPoints: true,
          targetCountries: true,
          country: true,
          targetAudience: true,
          targetAudiences: true,
          painPoints: true,
          painPointsLastUpdate: true,
          painPointsSource: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit
      }),
      prisma.product.count({ where })
    ])

    // 调试：打印折叠锅的原始数据
    const debugProduct = products.find((p: any) => p.name?.includes('折叠'))
    if (debugProduct) {
      console.log('[API]/products 折叠锅原始数据:', {
        name: debugProduct.name,
        sellingPointsType: typeof debugProduct.sellingPoints,
        sellingPointsValue: debugProduct.sellingPoints,
        sellingPointsIsArray: Array.isArray(debugProduct.sellingPoints)
      })
    }

    // 转换数据库商品为业务商品
    const parsedProducts: BusinessProduct[] = products.map((product) => {
      return convertDatabaseProductToBusiness(product as DatabaseProduct)
    })

    // 获取所有类目用于筛选
    const categories = await prisma.product.findMany({
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' }
    })

    return NextResponse.json({
      success: true,
      data: {
        products: parsedProducts,
        categories: categories.map((c: any) => c.category),
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total
        }
      }
    })

  } catch (error) {
    console.error('获取商品列表失败:', error)
    console.error('错误详情:', error instanceof Error ? error.stack : error)
    return NextResponse.json(
      { 
        success: false, 
        error: '获取商品列表失败',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// 创建商品
export async function POST(request: NextRequest) {
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
      Action.CREATE
    )
    
    if (!hasPermission) {
      return NextResponse.json({ error: '权限不足' }, { status: 403 })
    }

    const data = await request.json()
    
    // 验证必填字段
    if (!data.name) {
      return NextResponse.json(
        { success: false, error: '商品名称是必填项' },
        { status: 400 }
      )
    }

    // 处理自定义类目
    if (data.category === 'custom') {
      data.category = data.customCategory || '未分类'
    }

    // 检查是否已存在同名商品（SQLite 不支持 mode: 'insensitive'，做手动忽略大小写对比）
    const incomingName: string = String(data.name).trim()
    let existingProduct: any = await prisma.product.findFirst({
      where: { name: incomingName }
    })
    if (!existingProduct) {
      const candidates = await prisma.product.findMany({
        select: {
          id: true,
          name: true,
          description: true,
          category: true,
          subcategory: true,
          sellingPoints: true,
          targetCountries: true,
          targetAudience: true,
          painPoints: true
        }
      })
      existingProduct = candidates.find(p => (p.name || '').toLowerCase() === incomingName.toLowerCase())
    }

    if (existingProduct) {
      // 如果商品已存在，返回已存在的商品信息，而不是创建新的
      // 前端应该使用这个已存在的商品ID
      
      // 解析JSON字段（PostgreSQL JSON类型直接返回对象）
      const parsedProduct: any = { ...existingProduct }
      
      if (existingProduct.sellingPoints) {
        parsedProduct.sellingPoints = Array.isArray(existingProduct.sellingPoints) 
          ? existingProduct.sellingPoints 
          : []
      }
      
      if (existingProduct.targetCountries) {
        try {
          parsedProduct.targetCountries = typeof existingProduct.targetCountries === 'string'
            ? JSON.parse(existingProduct.targetCountries)
            : Array.isArray(existingProduct.targetCountries)
              ? existingProduct.targetCountries
              : []
        } catch (e) {
          parsedProduct.targetCountries = []
        }
      }
      
      if (existingProduct.targetAudience) {
        parsedProduct.targetAudience = Array.isArray(existingProduct.targetAudience)
          ? existingProduct.targetAudience
          : []
      }
      
      if (existingProduct.painPoints) {
        parsedProduct.painPoints = Array.isArray(existingProduct.painPoints)
          ? existingProduct.painPoints
          : []
      }
      
      return NextResponse.json({
        success: true,
        data: parsedProduct,
        message: '商品已存在，已返回现有商品信息',
        existed: true // 标记为已存在
      })
    }

    // 创建新商品
    const product = await prisma.product.create({
      data: {
        name: data.name,
        description: data.description || '',
        category: data.category || '未分类',
        subcategory: data.subcategory || '',
        sellingPoints: Array.isArray(data.sellingPoints) ? data.sellingPoints : [],
        skuImages: Array.isArray(data.skuImages) ? JSON.stringify(data.skuImages) : JSON.stringify([]),
        targetCountries: Array.isArray(data.targetCountries)
          ? JSON.stringify((data.targetCountries as any[]).map((c) => String(c || '').trim()).filter(Boolean))
          : JSON.stringify([]),
        country: Array.isArray(data.targetCountries)
          ? (data.targetCountries as any[]).map((c) => String(c || '').trim()).filter(Boolean)
          : [],
        targetAudience: data.targetAudience || null,
        painPoints: data.painPoints && Array.isArray(data.painPoints) ? data.painPoints : null,
        painPointsSource: data.painPoints && Array.isArray(data.painPoints) && data.painPoints.length > 0 ? '手动输入' : null,
        source: 'manual',
        isUserGenerated: true,
        needsReview: false,
        organizationId: user.organizationId // 自动归属到用户组织
      }
    })

    // 统一解析返回（确保前端立即显示数组字段）
    const parsedProduct: any = { ...product }
    // sellingPoints(Json) 直接是数组或对象
    if (product.sellingPoints) {
      parsedProduct.sellingPoints = Array.isArray(product.sellingPoints) ? product.sellingPoints : []
    } else {
      parsedProduct.sellingPoints = []
    }
    // targetCountries(String -> JSON字符串)
    if (product.targetCountries) {
      try {
        parsedProduct.targetCountries = typeof product.targetCountries === 'string'
          ? JSON.parse(product.targetCountries as unknown as string)
          : Array.isArray(product.targetCountries)
            ? product.targetCountries
            : []
      } catch {
        parsedProduct.targetCountries = []
      }
    } else {
      parsedProduct.targetCountries = []
    }
    // targetAudience(Json)
    if (product.targetAudience) {
      parsedProduct.targetAudience = Array.isArray(product.targetAudience) ? product.targetAudience : []
    } else {
      parsedProduct.targetAudience = []
    }
    // painPoints(Json)
    if (product.painPoints) {
      parsedProduct.painPoints = Array.isArray(product.painPoints) ? product.painPoints : []
    } else {
      parsedProduct.painPoints = []
    }

    return NextResponse.json({
      success: true,
      data: parsedProduct,
      message: '商品创建成功',
      existed: false
    })

  } catch (error: unknown) {
    console.error('创建商品失败:', error)
    console.error('错误代码:', (error as any).code)
    console.error('错误堆栈:', (error as any).stack)
    
    // 处理唯一约束冲突（P2002）
    if ((error as any).code === 'P2002') {
      // 返回已存在的商品
      const existingProduct = await prisma.product.findFirst({
        where: { name: data.name }
      })
      
      if (existingProduct) {
        // 解析JSON字段
        const parsedProduct = convertDatabaseProductToBusiness(existingProduct as DatabaseProduct)
        
        return NextResponse.json({
          success: true,
          data: parsedProduct,
          message: '商品已存在，已返回现有商品信息',
          existed: true
        })
      }
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: '创建商品失败',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// 更新商品
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json()
    console.log('更新商品请求数据:', data)
    
    // 验证必填字段
    if (!data.id || !data.name) {
      return NextResponse.json(
        { success: false, error: '商品ID和名称是必填项' },
        { status: 400 }
      )
    }

    // 处理自定义类目
    if (data.category === 'custom') {
      data.category = data.customCategory || '未分类'
    }

    // 更新商品
    const product = await prisma.product.update({
      where: { id: data.id },
      data: {
        // 仅在提供对应字段时才更新，避免覆盖未提交的字段
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.description !== undefined ? { description: data.description || '' } : {}),
        ...(data.category !== undefined ? { category: data.category || '未分类' } : {}),
        ...(data.subcategory !== undefined ? { subcategory: data.subcategory || '' } : {}),
        ...(data.sellingPoints !== undefined
          ? { sellingPoints: Array.isArray(data.sellingPoints) ? data.sellingPoints : [] }
          : {}),
        ...(data.skuImages !== undefined
          ? { skuImages: Array.isArray(data.skuImages) ? JSON.stringify(data.skuImages) : JSON.stringify([]) }
          : {}),
        // targetCountries 仅当有传入时才更新，避免在部分字段更新时被意外清空
        ...(data.targetCountries !== undefined
          ? (() => {
              const arr = Array.isArray(data.targetCountries)
                ? (data.targetCountries as any[]).map((c) => String(c || '').trim()).filter(Boolean)
                : typeof data.targetCountries === 'string'
                  ? (() => { try { const v = JSON.parse(data.targetCountries as any); return Array.isArray(v) ? v : []; } catch { return []; } })()
                  : []
              return {
                targetCountries: JSON.stringify(arr),
                country: arr
              }
            })()
          : {}),
        ...(data.targetAudience !== undefined ? { targetAudience: data.targetAudience || null } : {}),
        ...(data.painPoints !== undefined
          ? Array.isArray(data.painPoints) && data.painPoints.length > 0
            ? {
                painPoints: data.painPoints,
                painPointsLastUpdate: new Date(),
                painPointsSource: '手动编辑'
              }
            : {
                painPoints: [],
                painPointsLastUpdate: null,
                painPointsSource: null
              }
          : {})
      }
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
