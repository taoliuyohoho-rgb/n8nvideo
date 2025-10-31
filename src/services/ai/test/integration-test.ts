/**
 * AI服务集成测试
 * 
 * 测试服务发现机制的完整流程
 */

import {
  getAIServiceRegistry,
  getServiceDiscovery,
  getConfigLoader,
  getPerformanceMonitor,
  AIServiceAdapter
} from '../registry'

export async function runIntegrationTest(): Promise<void> {
  console.log('🚀 开始AI服务集成测试...')

  try {
    // 1. 初始化AI服务
    console.log('📋 步骤1: 初始化AI服务')
    const registry = getAIServiceRegistry()
    await registry.initialize()
    
    const stats = registry.getStats()
    console.log('✅ 初始化状态:', stats)

    // 2. 测试服务注册表
    console.log('📋 步骤2: 测试服务注册表')
    const allServices = registry.getAllServices()
    console.log(`✅ 已注册 ${allServices.length} 个服务:`)
    allServices.forEach(service => {
      console.log(`   - ${service.id} (${service.provider}/${service.model}) - ${service.status}`)
    })

    // 3. 测试服务发现
    console.log('📋 步骤3: 测试服务发现')
    const discovery = getServiceDiscovery()
    
    // 测试文本生成服务发现
    const discoveryInstance = await discovery
    const textService = await discoveryInstance.findBestService({
      category: 'text',
      capabilities: { jsonMode: true },
      constraints: { maxLatency: 10000 },
      context: { region: 'zh', budgetTier: 'mid' }
    })
    console.log('✅ 文本服务发现结果:', {
      serviceId: textService.service.id,
      provider: textService.service.provider,
      model: textService.service.model,
      isFallback: textService.isFallback
    })

    // 4. 测试服务适配器
    console.log('📋 步骤4: 测试服务适配器')
    const adapter = new AIServiceAdapter(textService.service)
    
    // 测试健康检查
    const isHealthy = await adapter.healthCheck()
    console.log(`✅ 服务健康检查: ${isHealthy ? '健康' : '不健康'}`)

    // 5. 测试性能监控
    console.log('📋 步骤5: 测试性能监控')
    const monitor = getPerformanceMonitor()
    
    // 模拟一个请求
    const requestId = monitor.startRequest(
      'test-request-001',
      textService.service.id,
      textService.service.provider,
      textService.service.model,
      'test-scenario'
    )
    
    // 模拟请求成功
    setTimeout(() => {
      monitor.recordSuccess(requestId, {
        latency: 1500,
        tokens: { input: 100, output: 200, total: 300 },
        cost: 0.001
      })
      
      // 获取性能指标
      const metrics = monitor.getServiceMetrics(textService.service.id)
      console.log('✅ 性能指标:', metrics)
    }, 100)

    // 6. 测试配置管理
    console.log('📋 步骤6: 测试配置管理')
    const configLoader = getConfigLoader()
    const config = await configLoader.loadConfig()
    console.log('✅ 配置管理:', {
      providersCount: Object.keys(config.providers).length,
      businessModulesCount: Object.keys(config.businessModules).length
    })

    // 7. 测试服务统计
    console.log('📋 步骤7: 测试服务统计')
    const finalStats = registry.getStats()
    console.log('✅ 服务统计:', finalStats)

    console.log('🎉 AI服务集成测试完成！')

  } catch (error) {
    console.error('❌ 集成测试失败:', error)
    throw error
  }
}

// 如果直接运行此文件，执行测试
if (require.main === module) {
  runIntegrationTest()
    .then(() => {
      console.log('✅ 所有测试通过')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ 测试失败:', error)
      process.exit(1)
    })
}
