import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// 获取商品列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const category = searchParams.get('category')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: any = {}
    
    // 搜索条件
    if (search) {
      where.name = {
        contains: search
      }
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
          targetAudience: true,
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

    // 解析字段为数组（PostgreSQL Json类型直接返回，兼容旧字符串）
    const parsedProducts = products.map((product: any) => {
      const parsedProduct = { ...product }
      
      // 解析 sellingPoints
      if (Array.isArray(product.sellingPoints)) {
        parsedProduct.sellingPoints = product.sellingPoints
      } else if (product.sellingPoints && typeof product.sellingPoints === 'string') {
        try {
          parsedProduct.sellingPoints = JSON.parse(product.sellingPoints)
        } catch (e) {
          parsedProduct.sellingPoints = []
        }
      } else {
        parsedProduct.sellingPoints = []
      }
      
      // 解析 targetCountries
      if (Array.isArray(product.targetCountries)) {
        parsedProduct.targetCountries = product.targetCountries
      } else if (product.targetCountries && typeof product.targetCountries === 'string') {
        try {
          parsedProduct.targetCountries = JSON.parse(product.targetCountries)
        } catch (e) {
          parsedProduct.targetCountries = []
        }
      } else {
        parsedProduct.targetCountries = []
      }
      
      // 解析 painPoints
      if (Array.isArray(product.painPoints)) {
        parsedProduct.painPoints = product.painPoints
      } else if (product.painPoints && typeof product.painPoints === 'string') {
        try {
          parsedProduct.painPoints = JSON.parse(product.painPoints)
        } catch (e) {
          parsedProduct.painPoints = []
        }
      } else {
        parsedProduct.painPoints = []
      }
      
      // 解析 targetAudience
      if (Array.isArray(product.targetAudience)) {
        parsedProduct.targetAudience = product.targetAudience
      } else if (product.targetAudience && typeof product.targetAudience === 'string') {
        try {
          parsedProduct.targetAudience = JSON.parse(product.targetAudience)
        } catch (e) {
          parsedProduct.targetAudience = []
        }
      } else {
        parsedProduct.targetAudience = []
      }
      
      return parsedProduct
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
  let data: any
  try {
    data = await request.json()
    
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
        targetCountries: Array.isArray(data.targetCountries) ? JSON.stringify(data.targetCountries) : JSON.stringify([]),
        targetAudience: data.targetAudience || null,
        painPoints: data.painPoints && Array.isArray(data.painPoints) ? data.painPoints : null,
        painPointsSource: data.painPoints && Array.isArray(data.painPoints) && data.painPoints.length > 0 ? '手动输入' : null,
        source: 'manual',
        isUserGenerated: true,
        needsReview: false
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        ...product
      },
      message: '商品创建成功',
      existed: false
    })

  } catch (error: any) {
    console.error('创建商品失败:', error)
    console.error('错误代码:', error.code)
    console.error('错误堆栈:', error.stack)
    
    // 处理唯一约束冲突（P2002）
    if (error.code === 'P2002') {
      // 返回已存在的商品
      const existingProduct = await prisma.product.findFirst({
        where: { name: data.name }
      })
      
      if (existingProduct) {
        // 解析JSON字段
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
              : existingProduct.targetCountries
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
        name: data.name,
        description: data.description || '',
        category: data.category || '未分类',
        subcategory: data.subcategory || '',
        sellingPoints: Array.isArray(data.sellingPoints) ? data.sellingPoints : [],
        skuImages: Array.isArray(data.skuImages) ? JSON.stringify(data.skuImages) : JSON.stringify([]),
        targetCountries: Array.isArray(data.targetCountries) ? JSON.stringify(data.targetCountries) : JSON.stringify([]),
        targetAudience: data.targetAudience || null,
        painPoints: data.painPoints && Array.isArray(data.painPoints) ? data.painPoints : null,
        painPointsLastUpdate: data.painPoints && Array.isArray(data.painPoints) && data.painPoints.length > 0 ? new Date() : undefined,
        painPointsSource: data.painPoints && Array.isArray(data.painPoints) && data.painPoints.length > 0 ? '手动编辑' : undefined
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
