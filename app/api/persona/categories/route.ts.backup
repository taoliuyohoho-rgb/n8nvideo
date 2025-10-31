import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { CategoryInfo } from '@/types/persona'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const parentId = searchParams.get('parentId')
    const level = searchParams.get('level')
    const includeChildren = searchParams.get('includeChildren') === 'true'

    // 构建查询条件
    const where: any = {
      isActive: true
    }

    if (parentId) {
      where.parentId = parentId
    }

    if (level) {
      where.level = parseInt(level)
    }

    // 获取类目列表
    const categories = await prisma.category.findMany({
      where,
      orderBy: [
        { level: 'asc' },
        { name: 'asc' }
      ]
    })

    // 如果需要包含子类目，构建层级结构
    let result: CategoryInfo[] = categories.map(cat => ({
      id: cat.id,
      name: cat.name,
      description: cat.description || undefined,
      parentId: cat.parentId || undefined,
      level: cat.level,
      targetMarket: cat.targetMarket || undefined,
      isActive: cat.isActive
    }))

    if (includeChildren) {
      // 构建层级结构
      const categoryMap = new Map<string, CategoryInfo>()
      const rootCategories: CategoryInfo[] = []

      // 先创建所有类目的映射
      result.forEach(cat => {
        categoryMap.set(cat.id, { ...cat, children: [] })
      })

      // 构建层级关系
      result.forEach(cat => {
        if (cat.parentId && categoryMap.has(cat.parentId)) {
          const parent = categoryMap.get(cat.parentId)!
          parent.children = parent.children || []
          parent.children.push(categoryMap.get(cat.id)!)
        } else {
          rootCategories.push(categoryMap.get(cat.id)!)
        }
      })

      result = rootCategories
    }

    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error) {
    console.error('获取类目列表失败:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: '获取类目列表失败' 
      },
      { status: 500 }
    )
  }
}
