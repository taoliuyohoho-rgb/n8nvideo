import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { PermissionService } from '@/src/services/permission/permission.service'
import { Resource, Action } from '@/types/permissions'

// 获取商品类目配置
export async function GET(request: NextRequest) {
  try {
    // 验证用户权限
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: '未认证用户' }, { status: 401 })
    }

    const hasPermission = await PermissionService.checkPermission(
      user as any,
      Resource.PRODUCTS,
      Action.READ
    )
    
    if (!hasPermission) {
      return NextResponse.json({ error: '权限不足' }, { status: 403 })
    }

    // 获取所有活跃的类目
    const categories = await prisma.category.findMany({
      where: {
        isActive: true
      },
      orderBy: [
        { level: 'asc' },
        { name: 'asc' }
      ]
    })

    // 构建层级结构
    const categoryMap = new Map<string, any>()
    const rootCategories: any[] = []

    // 先创建所有类目的映射
    categories.forEach(cat => {
      categoryMap.set(cat.id, { 
        id: cat.id,
        name: cat.name,
        description: cat.description,
        parentId: cat.parentId,
        level: cat.level,
        targetMarket: cat.targetMarket,
        children: []
      })
    })

    // 构建层级关系
    categories.forEach(cat => {
      if (cat.parentId && categoryMap.has(cat.parentId)) {
        const parent = categoryMap.get(cat.parentId)!
        parent.children.push(categoryMap.get(cat.id)!)
      } else {
        rootCategories.push(categoryMap.get(cat.id)!)
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        categories: rootCategories,
        flatCategories: categories.map(cat => ({
          id: cat.id,
          name: cat.name,
          description: cat.description,
          parentId: cat.parentId,
          level: cat.level,
          targetMarket: cat.targetMarket
        }))
      }
    })

  } catch (error) {
    console.error('获取商品类目配置失败:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: '获取商品类目配置失败',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// 保存商品类目配置
export async function POST(request: NextRequest) {
  try {
    // 验证用户权限
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: '未认证用户' }, { status: 401 })
    }

    const hasPermission = await PermissionService.checkPermission(
      user as any,
      Resource.PRODUCTS,
      Action.UPDATE
    )
    
    if (!hasPermission) {
      return NextResponse.json({ error: '权限不足' }, { status: 403 })
    }

    const { categories, subcategories, countries } = await request.json()

    // 验证输入数据
    if (!categories || !Array.isArray(categories)) {
      return NextResponse.json(
        { success: false, error: '类目数据格式错误' },
        { status: 400 }
      )
    }

    // 开始事务处理
    const result = await prisma.$transaction(async (tx) => {
      // 1. 处理一级类目
      const categoryResults = []
      for (const categoryName of categories) {
        if (typeof categoryName !== 'string' || !categoryName.trim()) {
          continue
        }

        const trimmedName = categoryName.trim()
        
        // 检查是否已存在
        let category = await tx.category.findFirst({
          where: {
            name: trimmedName,
            level: 1,
            parentId: null
          }
        })

        if (!category) {
          // 创建新类目
          category = await tx.category.create({
            data: {
              name: trimmedName,
              level: 1,
              parentId: null,
              isActive: true
            }
          })
        } else if (!category.isActive) {
          // 重新激活已存在的类目
          category = await tx.category.update({
            where: { id: category.id },
            data: { isActive: true }
          })
        }

        categoryResults.push(category)
      }

      // 2. 处理二级类目
      const subcategoryResults = []
      if (subcategories && Array.isArray(subcategories)) {
        for (const subcategoryName of subcategories) {
          if (typeof subcategoryName !== 'string' || !subcategoryName.trim()) {
            continue
          }

          const trimmedName = subcategoryName.trim()
          
          // 检查是否已存在
          let subcategory = await tx.category.findFirst({
            where: {
              name: trimmedName,
              level: 2
            }
          })

          if (!subcategory) {
            // 创建新二级类目（暂时不关联父类目，后续可以优化）
            subcategory = await tx.category.create({
              data: {
                name: trimmedName,
                level: 2,
                parentId: null, // 暂时设为null，后续可以关联到具体的一级类目
                isActive: true
              }
            })
          } else if (!subcategory.isActive) {
            // 重新激活已存在的类目
            subcategory = await tx.category.update({
              where: { id: subcategory.id },
              data: { isActive: true }
            })
          }

          subcategoryResults.push(subcategory)
        }
      }

      // 3. 同步删除（软删除）：将未包含在此次提交中的类目标记为非活跃
      // 同步一级类目
      await tx.category.updateMany({
        where: {
          level: 1,
          NOT: {
            name: { in: categories.filter((n: string) => typeof n === 'string').map((n: string) => n.trim()) }
          }
        },
        data: { isActive: false }
      })

      // 同步二级类目（如果提供了二级类目数组，则按该数组同步；未提供则跳过）
      if (Array.isArray(subcategories)) {
        await tx.category.updateMany({
          where: {
            level: 2,
            NOT: {
              name: { in: subcategories.filter((n: string) => typeof n === 'string').map((n: string) => n.trim()) }
            }
          },
          data: { isActive: false }
        })
      }

      return {
        categories: categoryResults,
        subcategories: subcategoryResults
      }
    })

    console.log('商品类目配置保存成功:', result)

    return NextResponse.json({
      success: true,
      message: '商品类目配置保存成功',
      data: result
    })

  } catch (error) {
    console.error('保存商品类目配置失败:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: '保存商品类目配置失败',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// 删除类目
export async function DELETE(request: NextRequest) {
  try {
    // 验证用户权限
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: '未认证用户' }, { status: 401 })
    }

    const hasPermission = await PermissionService.checkPermission(
      user as any,
      Resource.PRODUCTS,
      Action.DELETE
    )
    
    if (!hasPermission) {
      return NextResponse.json({ error: '权限不足' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('id')

    if (!categoryId) {
      return NextResponse.json(
        { success: false, error: '缺少类目ID参数' },
        { status: 400 }
      )
    }

    // 软删除：将类目标记为非活跃状态
    await prisma.category.update({
      where: { id: categoryId },
      data: { isActive: false }
    })

    return NextResponse.json({
      success: true,
      message: '类目删除成功'
    })

  } catch (error) {
    console.error('删除类目失败:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: '删除类目失败',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
