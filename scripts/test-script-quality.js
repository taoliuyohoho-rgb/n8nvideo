/**
 * 测试脚本质量改进效果
 */

const testScripts = [
  {
    name: "低质量脚本（原始问题）",
    content: "大家好,今天给大家分享一个好东西 这个产品真的很不错,推荐给大家 喜欢的话记得点赞关注哦",
    productInfo: {
      name: "智能手环",
      category: "智能穿戴",
      sellingPoints: ["健康监测", "运动追踪", "长续航"]
    },
    targetAudience: "健身爱好者"
  },
  {
    name: "中等质量脚本",
    content: "还在为每天的运动数据不准确而烦恼吗？这款智能手环采用专业传感器，24小时监测心率，运动轨迹精确到米，让你科学健身，告别盲目运动！",
    productInfo: {
      name: "智能手环",
      category: "智能穿戴", 
      sellingPoints: ["心率监测", "GPS定位", "科学分析"]
    },
    targetAudience: "健身爱好者"
  }
]

async function testScriptQuality() {
  console.log('🧪 开始测试脚本质量改进效果...\n')
  
  for (const testCase of testScripts) {
    console.log(`📝 测试案例: ${testCase.name}`)
    console.log(`脚本内容: ${testCase.content}`)
    console.log('---')
    
    try {
      const response = await fetch('http://localhost:3000/api/ai/script/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scriptContent: testCase.content,
          productInfo: testCase.productInfo,
          targetAudience: testCase.targetAudience
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        const evaluation = result.evaluation
        
        console.log(`📊 质量评分: ${evaluation.overallScore}/100`)
        console.log(`📈 各维度得分:`)
        console.log(`   - 内容质量: ${evaluation.scores.content}/25`)
        console.log(`   - 结构逻辑: ${evaluation.scores.structure}/25`)
        console.log(`   - 情感共鸣: ${evaluation.scores.emotion}/25`)
        console.log(`   - 转化效果: ${evaluation.scores.conversion}/25`)
        
        if (evaluation.strengths?.length > 0) {
          console.log(`✅ 优势: ${evaluation.strengths.join(', ')}`)
        }
        
        if (evaluation.weaknesses?.length > 0) {
          console.log(`❌ 不足: ${evaluation.weaknesses.join(', ')}`)
        }
        
        if (evaluation.suggestions?.length > 0) {
          console.log(`💡 建议: ${evaluation.suggestions.join(', ')}`)
        }
        
        if (evaluation.improvedScript && evaluation.improvedScript !== testCase.content) {
          console.log(`🔄 优化后脚本:`)
          console.log(`   ${evaluation.improvedScript}`)
        }
        
      } else {
        console.log(`❌ 测试失败: ${response.status}`)
      }
      
    } catch (error) {
      console.log(`❌ 请求错误: ${error.message}`)
    }
    
    console.log('\n' + '='.repeat(50) + '\n')
  }
}

// 运行测试
testScriptQuality().catch(console.error)
