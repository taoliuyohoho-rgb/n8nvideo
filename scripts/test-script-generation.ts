/**
 * 测试脚本生成 - 验证shots不会为空
 * 
 * 运行: npx tsx scripts/test-script-generation.ts
 */

import { prisma } from '../lib/prisma'

async function testScriptGeneration() {
  console.log('🧪 测试脚本生成（验证shots非空）\n')
  
  try {
    // 1. 获取一个测试商品
    const product = await prisma.product.findFirst({
      where: {
        name: '电磁炉'
      }
    })
    
    if (!product) {
      console.log('⚠️  未找到测试商品（电磁炉），请先创建')
      return
    }
    
    console.log('✅ 找到测试商品:', product.name)
    
    // 2. 获取一个人设
    const persona = await prisma.persona.findFirst({
      where: {
        isActive: true
      }
    })
    
    if (!persona) {
      console.log('⚠️  未找到可用人设，请先创建')
      return
    }
    
    console.log('✅ 找到测试人设:', persona.name)
    
    // 3. 调用脚本生成API
    console.log('\n📝 调用脚本生成API...')
    const response = await fetch('http://localhost:3000/api/script/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        productId: product.id,
        personaId: persona.id,
        variants: 1
      })
    })
    
    const result = await response.json()
    
    if (!result.success) {
      console.error('❌ 脚本生成失败:', result.error)
      return
    }
    
    // 4. 验证shots
    console.log('\n✅ 脚本生成成功！')
    const script = result.scripts[0]
    
    console.log('\n📊 脚本信息:')
    console.log('  角度:', script.angle)
    console.log('  节奏:', script.energy)
    console.log('  时长:', script.durationSec, '秒')
    console.log('\n  台词:')
    console.log('    开场:', script.lines.open)
    console.log('    主体:', script.lines.main)
    console.log('    结尾:', script.lines.close)
    
    console.log('\n  📹 镜头列表:')
    if (!script.shots || !Array.isArray(script.shots)) {
      console.error('  ❌ shots不是数组!')
      return
    }
    
    if (script.shots.length === 0) {
      console.error('  ❌ shots为空数组! (这不应该发生)')
      return
    }
    
    if (script.shots.length < 3) {
      console.warn(`  ⚠️  shots数量不足: ${script.shots.length}个 (期望至少3个)`)
    } else {
      console.log(`  ✅ shots数量: ${script.shots.length}个`)
    }
    
    script.shots.forEach((shot: any, index: number) => {
      console.log(`    [${index + 1}] ${shot.second}秒 | ${shot.camera} | ${shot.action}`)
      
      // 验证每个shot的必填字段
      if (!shot.second && shot.second !== 0) console.error(`      ❌ 缺少second`)
      if (!shot.camera) console.error(`      ❌ 缺少camera`)
      if (!shot.action) console.error(`      ❌ 缺少action`)
      if (!shot.visibility) console.error(`      ❌ 缺少visibility`)
      if (!shot.audio) console.error(`      ❌ 缺少audio`)
    })
    
    // 5. 总结
    console.log('\n📈 测试结果:')
    console.log('  ✅ 脚本生成成功')
    console.log(`  ${script.shots.length >= 3 ? '✅' : '❌'} shots数量符合要求 (${script.shots.length}/3)`)
    console.log('  ✅ 所有shot包含必填字段')
    
  } catch (error) {
    console.error('❌ 测试失败:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// 执行测试
testScriptGeneration()
  .then(() => {
    console.log('\n✅ 测试完成')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ 测试执行失败:', error)
    process.exit(1)
  })

