#!/usr/bin/env node

/**
 * 创建管理员用户脚本
 * 用于在部署后创建初始管理员账号
 */

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createAdminUser() {
  console.log('🔐 开始创建管理员用户...')

  try {
    // 检查是否已存在管理员用户
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'admin' }
    })

    if (existingAdmin) {
      console.log(`✅ 管理员用户已存在: ${existingAdmin.email}`)
      return
    }

    // 创建管理员用户
    const hashedPassword = await bcrypt.hash('dongnanyaqifei', 10)
    
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@126.com',
        name: '管理员',
        password: hashedPassword,
        role: 'admin',
        isActive: true
      }
    })

    console.log(`✅ 管理员用户创建成功!`)
    console.log(`📧 邮箱: ${adminUser.email}`)
    console.log(`🔑 密码: dongnanyaqifei`)
    console.log(`👤 角色: ${adminUser.role}`)

  } catch (error) {
    console.error('❌ 创建管理员用户失败:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

createAdminUser()
