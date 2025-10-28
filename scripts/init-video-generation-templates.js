#!/usr/bin/env node

/**
 * 初始化视频生成相关的Prompt模板
 * 包括人设生成和脚本生成模板
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function initPersonaTemplates() {
  console.log('初始化人设生成模板...')
  
  try {
    const response = await fetch('http://localhost:3000/api/admin/prompts/init-persona-templates', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (response.ok) {
      const data = await response.json()
      console.log('✅ 人设生成模板初始化成功:', data.message)
      if (data.templates) {
        data.templates.forEach(template => {
          console.log(`  - ${template.name} (${template.businessModule})`)
        })
      }
    } else {
      console.error('❌ 人设生成模板初始化失败:', response.statusText)
    }
  } catch (error) {
    console.error('❌ 人设生成模板初始化失败:', error.message)
  }
}

async function initScriptTemplates() {
  console.log('初始化脚本生成模板...')
  
  try {
    const response = await fetch('http://localhost:3000/api/admin/prompts/init-script-templates', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (response.ok) {
      const data = await response.json()
      console.log('✅ 脚本生成模板初始化成功:', data.message)
      if (data.templates) {
        data.templates.forEach(template => {
          console.log(`  - ${template.name} (${template.businessModule})`)
        })
      }
    } else {
      console.error('❌ 脚本生成模板初始化失败:', response.statusText)
    }
  } catch (error) {
    console.error('❌ 脚本生成模板初始化失败:', error.message)
  }
}

async function main() {
  console.log('🚀 开始初始化视频生成模板...\n')

  await initPersonaTemplates()
  console.log('')
  await initScriptTemplates()
  
  console.log('\n✅ 所有模板初始化完成！')
  
  await prisma.$disconnect()
}

main().catch((error) => {
  console.error('❌ 初始化失败:', error)
  process.exit(1)
})
