import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function migratePermissions() {
  try {
    console.log('开始权限管理数据迁移...')

    // 1. 创建默认组织 "sea搞起"
    console.log('创建默认组织...')
    let defaultOrg = await prisma.organization.findFirst({
      where: { name: 'sea搞起' }
    })
    
    if (!defaultOrg) {
      defaultOrg = await prisma.organization.create({
        data: {
          name: 'sea搞起',
          description: '默认组织',
          createdBy: 'system',
          isActive: true
        }
      })
    }
    console.log('默认组织创建成功:', defaultOrg.id)

    // 2. 更新现有用户角色
    console.log('更新用户角色...')
    
    // 查找现有的admin用户，设为超级管理员
    const adminUsers = await prisma.user.findMany({
      where: {
        OR: [
          { email: 'admin@example.com' },
          { role: 'admin' }
        ]
      }
    })

    for (const user of adminUsers) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          role: 'super_admin',
          organizationId: null // 超级管理员不属于任何组织
        }
      })
      console.log(`用户 ${user.email} 设为超级管理员`)
    }

    // 3. 创建yixuan管理员用户（如果不存在）
    console.log('创建yixuan管理员...')
    const yixuanUser = await prisma.user.upsert({
      where: { email: 'yixuan@example.com' },
      update: {
        role: 'admin',
        organizationId: defaultOrg.id
      },
      create: {
        email: 'yixuan@example.com',
        name: 'yixuan',
        role: 'admin',
        organizationId: defaultOrg.id,
        isActive: true,
        password: await bcrypt.hash('password123', 10) // 默认密码
      }
    })
    console.log('yixuan管理员创建成功:', yixuanUser.id)

    // 4. 将现有商品归属到默认组织
    console.log('迁移现有商品到默认组织...')
    const productUpdateResult = await prisma.product.updateMany({
      where: { organizationId: null },
      data: { organizationId: defaultOrg.id }
    })
    console.log(`迁移了 ${productUpdateResult.count} 个商品到默认组织`)

    // 5. 更新其他用户为运营角色
    console.log('更新其他用户角色...')
    const otherUsers = await prisma.user.findMany({
      where: {
        AND: [
          { role: { not: 'super_admin' } },
          { email: { not: 'yixuan@example.com' } }
        ]
      }
    })

    for (const user of otherUsers) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          role: 'operator',
          organizationId: defaultOrg.id
        }
      })
      console.log(`用户 ${user.email} 设为运营角色`)
    }

    // 6. 验证迁移结果
    console.log('验证迁移结果...')
    const orgStats = await prisma.organization.findUnique({
      where: { id: defaultOrg.id },
      include: {
        _count: {
          select: {
            users: true,
            products: true
          }
        }
      }
    })

    const userStats = await prisma.user.groupBy({
      by: ['role'],
      _count: {
        role: true
      }
    })

    console.log('迁移完成!')
    console.log('组织统计:', {
      name: orgStats?.name,
      userCount: orgStats?._count.users,
      productCount: orgStats?._count.products
    })
    console.log('用户角色统计:', userStats)

  } catch (error) {
    console.error('迁移失败:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// 运行迁移
if (require.main === module) {
  migratePermissions()
    .then(() => {
      console.log('权限管理数据迁移完成!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('迁移失败:', error)
      process.exit(1)
    })
}

export { migratePermissions }
