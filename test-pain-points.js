// 测试痛点分析功能
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testPainPointAnalysis() {
  try {
    console.log('🧪 开始测试痛点分析功能...')
    
    // 1. 检查商品数据
    const products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        painPoints: true,
        painPointsLastUpdate: true,
        painPointsSource: true
      }
    })
    
    console.log('📦 当前商品数据:')
    products.forEach(product => {
      console.log(`- ${product.name}:`)
      console.log(`  痛点: ${product.painPoints || '无'}`)
      console.log(`  更新时间: ${product.painPointsLastUpdate || '无'}`)
      console.log(`  来源: ${product.painPointsSource || '无'}`)
    })
    
    // 2. 模拟痛点分析
    console.log('\n🔍 模拟痛点分析...')
    
    for (const product of products.slice(0, 2)) { // 只测试前2个商品
      console.log(`\n分析商品: ${product.name}`)
      
      // 模拟评论数据
      const mockComments = [
        `${product.name}质量很好，但是物流太慢了`,
        `价格有点贵，性价比不高`,
        `包装不够精美，感觉很廉价`,
        `说明书不够详细，使用起来有些困难`
      ]
      
      // 模拟痛点提取
      const painPoints = [
        '物流速度慢，配送时间过长',
        '价格偏高，性价比不高', 
        '包装简陋，影响产品形象',
        '使用说明不够详细'
      ]
      
      // 更新商品痛点
      await prisma.product.update({
        where: { id: product.id },
        data: {
          painPoints: JSON.stringify(painPoints),
          painPointsLastUpdate: new Date(),
          painPointsSource: '测试分析'
        }
      })
      
      console.log(`✅ 已更新 ${product.name} 的痛点:`, painPoints)
    }
    
    // 3. 验证更新结果
    console.log('\n📊 验证更新结果:')
    const updatedProducts = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        painPoints: true,
        painPointsLastUpdate: true,
        painPointsSource: true
      }
    })
    
    updatedProducts.forEach(product => {
      console.log(`- ${product.name}:`)
      if (product.painPoints) {
        const painPoints = JSON.parse(product.painPoints)
        console.log(`  痛点数量: ${painPoints.length}`)
        console.log(`  痛点内容: ${painPoints.join(', ')}`)
      } else {
        console.log(`  痛点: 无`)
      }
      console.log(`  更新时间: ${product.painPointsLastUpdate}`)
      console.log(`  来源: ${product.painPointsSource}`)
    })
    
    console.log('\n✅ 测试完成！')
    
  } catch (error) {
    console.error('❌ 测试失败:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testPainPointAnalysis()
