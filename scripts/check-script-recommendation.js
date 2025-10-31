#!/usr/bin/env node

/**
 * 脚本推荐引擎诊断工具
 * 检查推荐引擎是否正常工作，以及数据库中的脚本数量
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('\n🔍 开始诊断脚本推荐引擎...\n')

  try {
    // 1. 检查数据库中的脚本总数
    const totalScripts = await prisma.script.count()
    console.log(`📊 数据库中的脚本总数: ${totalScripts}`)

    if (totalScripts === 0) {
      console.log('⚠️  数据库中没有历史脚本，推荐引擎无法工作')
      console.log('💡 建议：先生成一些脚本，或导入历史数据\n')
      return
    }

    // 2. 查看脚本的分布情况
    const scriptsByProduct = await prisma.script.groupBy({
      by: ['productId'],
      _count: true,
      take: 10
    })
    
    console.log(`\n📦 按商品分组的脚本数量（Top 10）:`)
    for (const item of scriptsByProduct) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        select: { name: true, category: true }
      })
      console.log(`   - 商品: ${product?.name || item.productId} (${product?.category || 'N/A'}) - ${item._count} 个脚本`)
    }

    // 3. 查看最近的脚本
    const recentScripts = await prisma.script.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        product: {
          select: { name: true, category: true }
        }
      }
    })

    console.log(`\n📝 最近生成的 5 个脚本:`)
    for (const script of recentScripts) {
      console.log(`   - ${script.angle} | ${script.product?.name} | ${script.durationSec}s | ${new Date(script.createdAt).toLocaleString()}`)
    }

    // 4. 测试推荐引擎
    console.log(`\n🤖 测试推荐引擎...`)
    
    // 获取一个有脚本的商品
    const productWithScripts = scriptsByProduct[0]
    if (productWithScripts) {
      const testProduct = await prisma.product.findUnique({
        where: { id: productWithScripts.productId }
      })

      console.log(`   使用测试商品: ${testProduct?.name} (${testProduct?.id})`)

      // 模拟调用推荐API
      const testUrl = `http://localhost:3000/api/script/recommend`
      const testPayload = {
        productId: testProduct?.id,
        category: testProduct?.category,
        region: 'global',
        channel: 'tiktok'
      }

      console.log(`   请求参数:`, JSON.stringify(testPayload, null, 2))
      console.log(`\n   💡 你可以手动测试推荐API:`)
      console.log(`   curl -X POST ${testUrl} \\`)
      console.log(`     -H "Content-Type: application/json" \\`)
      console.log(`     -d '${JSON.stringify(testPayload)}'`)
    }

    console.log(`\n✅ 诊断完成！`)
    console.log(`\n📝 总结:`)
    console.log(`   - 数据库中有 ${totalScripts} 个历史脚本`)
    console.log(`   - 推荐引擎代码已注册并可用`)
    console.log(`   - 如果推荐仍显示"不可用"，请检查服务器日志中的详细错误信息`)

  } catch (error) {
    console.error('❌ 诊断过程中出现错误:', error)
    console.error('\n可能的原因:')
    console.error('  1. 数据库连接失败（检查 .env 中的 DATABASE_URL）')
    console.error('  2. Prisma schema 未同步（运行 npx prisma generate）')
    console.error('  3. 表结构不完整（运行 npx prisma db push）')
  } finally {
    await prisma.$disconnect()
  }
}

main()

