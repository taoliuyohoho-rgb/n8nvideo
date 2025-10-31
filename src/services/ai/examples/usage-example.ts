/**
 * AI服务使用示例
 * 
 * 展示如何使用新的服务发现机制
 */

import {
  getAIServiceRegistry,
  getServiceDiscovery,
  AIServiceAdapter
} from '../registry'

/**
 * 示例1: 基础AI服务调用
 */
export async function basicAICall(): Promise<void> {
  console.log('📝 示例1: 基础AI服务调用')

  try {
    // 1. 初始化服务
    const registry = getAIServiceRegistry()
    await registry.initialize()

    // 2. 获取服务发现器
    const discovery = getServiceDiscovery()

    // 3. 查找最适合的服务
    const discoveryInstance = await discovery
    const result = await discoveryInstance.findBestService({
      category: 'text',
      capabilities: { jsonMode: true },
      constraints: { maxLatency: 10000 },
      context: { region: 'zh', budgetTier: 'mid' }
    })

    // 4. 创建服务适配器
    const adapter = new AIServiceAdapter(result.service)

    // 5. 调用AI服务
    const response = await adapter.call('请生成一个产品分析的JSON格式结果', {
      temperature: 0.3,
      maxTokens: 1000
    })

    if (response.success) {
      console.log('✅ AI调用成功:', {
        data: response.data,
        latency: response.latency,
        tokens: response.tokens,
        cost: response.cost
      })
    } else {
      console.log('❌ AI调用失败:', response.error)
    }

  } catch (error) {
    console.error('❌ 示例1失败:', error)
  }
}

/**
 * 示例2: 带降级的AI服务调用
 */
export async function fallbackAICall(): Promise<void> {
  console.log('📝 示例2: 带降级的AI服务调用')

  try {
    const discovery = getServiceDiscovery()

    // 查找服务，启用降级
    const discoveryInstance = await discovery
    const result = await discoveryInstance.findBestService({
      category: 'text',
      capabilities: { jsonMode: true },
      constraints: { maxLatency: 5000 }
    }, {
      enableFallback: true,
      maxFallbackAttempts: 3
    })

    const adapter = new AIServiceAdapter(result.service)
    
    console.log('✅ 选择的服务:', {
      serviceId: result.service.id,
      provider: result.service.provider,
      model: result.service.model,
      isFallback: result.isFallback,
      fallbackReason: result.fallbackReason
    })

    const response = await adapter.call('请分析这个产品的卖点', {
      temperature: 0.2,
      maxTokens: 500
    })

    console.log('✅ 降级调用结果:', response.success ? '成功' : '失败')

  } catch (error) {
    console.error('❌ 示例2失败:', error)
  }
}

/**
 * 示例3: 多场景服务调用
 */
export async function multiScenarioCall(): Promise<void> {
  console.log('📝 示例3: 多场景服务调用')

  const scenarios = [
    {
      name: 'AI反推',
      criteria: {
        category: 'text' as const,
        capabilities: { jsonMode: true },
        constraints: { maxLatency: 10000 }
      }
    },
    {
      name: '商品分析',
      criteria: {
        category: 'text' as const,
        capabilities: { jsonMode: true },
        constraints: { maxLatency: 8000 }
      }
    },
    {
      name: '视频脚本',
      criteria: {
        category: 'text' as const,
        capabilities: { jsonMode: false },
        constraints: { maxLatency: 12000 }
      }
    }
  ]

  try {
    const discovery = getServiceDiscovery()

    for (const scenario of scenarios) {
      console.log(`\n🔍 测试场景: ${scenario.name}`)
      
      const discoveryInstance = await discovery
      const result = await discoveryInstance.findBestService(scenario.criteria)
      const adapter = new AIServiceAdapter(result.service)
      
      console.log(`✅ 选择的服务: ${result.service.id} (${result.service.provider})`)
      
      // 这里可以添加具体的调用逻辑
      // const response = await adapter.call(prompt, options)
    }

  } catch (error) {
    console.error('❌ 示例3失败:', error)
  }
}

/**
 * 示例4: 服务监控和统计
 */
export async function monitoringExample(): Promise<void> {
  console.log('📝 示例4: 服务监控和统计')

  try {
    const { getAIServiceRegistry, getPerformanceMonitor } = await import('../registry')
    
    const registry = getAIServiceRegistry()
    const monitor = getPerformanceMonitor()

    // 获取服务统计
    const stats = registry.getStats()
    console.log('📊 服务统计:', stats)

    // 获取性能指标
    const globalMetrics = monitor.getGlobalMetrics()
    console.log('📈 全局性能指标:', {
      avgLatency: globalMetrics.latency.avg,
      successRate: globalMetrics.availability.successRate,
      requestsPerSecond: globalMetrics.throughput.requestsPerSecond
    })

    // 获取服务排名
    const ranking = monitor.getServiceRanking('latency')
    console.log('🏆 服务延迟排名:', ranking.slice(0, 3))

  } catch (error) {
    console.error('❌ 示例4失败:', error)
  }
}

/**
 * 运行所有示例
 */
export async function runAllExamples(): Promise<void> {
  console.log('🚀 开始运行AI服务使用示例...\n')

  try {
    await basicAICall()
    console.log('\n' + '='.repeat(50) + '\n')
    
    await fallbackAICall()
    console.log('\n' + '='.repeat(50) + '\n')
    
    await multiScenarioCall()
    console.log('\n' + '='.repeat(50) + '\n')
    
    await monitoringExample()
    
    console.log('\n🎉 所有示例运行完成！')

  } catch (error) {
    console.error('❌ 示例运行失败:', error)
  }
}

// 如果直接运行此文件，执行所有示例
if (require.main === module) {
  runAllExamples()
    .then(() => {
      console.log('✅ 示例执行完成')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ 示例执行失败:', error)
      process.exit(1)
    })
}
