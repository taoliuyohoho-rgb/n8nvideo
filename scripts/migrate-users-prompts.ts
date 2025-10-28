import { PrismaClient } from '@prisma/client'
import { execSync } from 'child_process'

const db = new PrismaClient()

async function migrateUsersAndPrompts() {
  console.log('🚀 迁移用户和 Prompt 模板...\n')
  
  try {
    // 迁移用户
    console.log('📦 迁移用户...')
    const usersJson = execSync(
      `sqlite3 -json ./prisma/dev.db "SELECT * FROM users"`,
      { encoding: 'utf-8', cwd: '/Users/liutao/cursor/n8nvideo' }
    )
    const users = JSON.parse(usersJson || '[]')
    console.log(`找到 ${users.length} 个用户`)
    
    for (const user of users) {
      await db.user.upsert({
        where: { id: user.id },
        create: {
          id: user.id,
          email: user.email,
          name: user.name,
          password: user.password,
          role: user.role || 'viewer',
          isActive: Boolean(user.isActive),
          createdAt: new Date(user.createdAt),
          updatedAt: new Date(user.updatedAt)
        },
        update: {
          email: user.email,
          name: user.name,
          role: user.role || 'viewer',
          isActive: Boolean(user.isActive)
        }
      })
      console.log(`  ✅ ${user.email}`)
    }
    
    // 迁移 Prompt 模板
    console.log('\n📦 迁移 Prompt 模板...')
    const promptsJson = execSync(
      `sqlite3 -json ./prisma/dev.db "SELECT * FROM prompt_templates"`,
      { encoding: 'utf-8', cwd: '/Users/liutao/cursor/n8nvideo' }
    )
    const prompts = JSON.parse(promptsJson || '[]')
    console.log(`找到 ${prompts.length} 个模板`)
    
    for (const prompt of prompts) {
      await db.promptTemplate.upsert({
        where: { id: prompt.id },
        create: {
          id: prompt.id,
          name: prompt.name,
          businessModule: prompt.businessModule || 'general',
          content: prompt.content,
          variables: prompt.variables || null,
          description: prompt.description || null,
          performance: prompt.performance || null,
          usageCount: prompt.usageCount || 0,
          successRate: prompt.successRate || null,
          isActive: Boolean(prompt.isActive ?? true),
          isDefault: Boolean(prompt.isDefault ?? false),
          createdBy: prompt.createdBy || null,
          createdAt: new Date(prompt.createdAt),
          updatedAt: new Date(prompt.updatedAt)
        },
        update: {
          name: prompt.name,
          businessModule: prompt.businessModule || 'general',
          content: prompt.content,
          isActive: Boolean(prompt.isActive ?? true)
        }
      })
      console.log(`  ✅ ${prompt.name}`)
    }
    
    console.log('\n✅ 迁移完成！')
    console.log(`   - 用户: ${users.length} 个`)
    console.log(`   - Prompt模板: ${prompts.length} 个`)
    
  } catch (error) {
    console.error('❌ 迁移失败:', error)
    throw error
  } finally {
    await db.$disconnect()
  }
}

migrateUsersAndPrompts()
  .then(() => process.exit(0))
  .catch(() => process.exit(1))

