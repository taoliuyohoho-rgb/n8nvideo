import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    console.log('🗄️ 开始初始化数据库...')

    // 1. 创建管理员用户
    console.log('创建管理员用户...')
    const hashedPassword = await bcrypt.hash('dongnanyaqifei', 10)
    
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@126.com' },
      update: {},
      create: {
        email: 'admin@126.com',
        name: '管理员',
        password: hashedPassword,
        role: 'admin',
        isActive: true
      }
    })
    console.log(`✅ 管理员用户创建成功: ${adminUser.email}`)

    // 2. 创建示例商品
    console.log('创建示例商品...')
    const product = await prisma.product.upsert({
      where: { id: 'default-product' },
      update: {},
      create: {
        id: 'default-product',
        name: '电磁炉',
        description: '高效加热，多功能烹饪，智能触控',
        category: '家居用品',
        subcategory: '厨房电器',
        sellingPoints: JSON.stringify(['新人-5RM', '限时7折', '高效节能', '安全可靠', '易清洁']),
        skuImages: JSON.stringify(['https://example.com/induction_cooker.jpg']),
        targetCountries: JSON.stringify(['MY', 'SG', 'TH'])
      }
    })
    console.log(`✅ 商品创建成功: ${product.name}`)

    return NextResponse.json({
      success: true,
      message: '数据库初始化成功',
      data: {
        adminUser: {
          email: adminUser.email,
          name: adminUser.name,
          role: adminUser.role
        },
        product: {
          name: product.name,
          category: product.category
        }
      }
    })

  } catch (error) {
    console.error('❌ 数据库初始化失败:', error)
    return NextResponse.json(
      { success: false, error: '数据库初始化失败' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
