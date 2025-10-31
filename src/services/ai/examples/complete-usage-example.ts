/**
 * AI服务架构完整使用示例
 * 
 * 展示如何使用新的动态配置系统和服务发现机制
 */

import { getConfigLoader } from '../config/ConfigLoader'
import { getAIServiceRegistry } from '../registry/AIServiceRegistry'
import { getServiceDiscovery } from '../registry/ServiceDiscovery'
import { AIServiceAdapter } from '../adapters/AIServiceAdapter'

/**
 * 示例1: 基础配置加载
 */
async function example1_BasicConfigLoading() {
  console.log('📋 示例1: 基础配置加载')
  
  const configLoader = getConfigLoader()
  const config = await configLoader.loadConfig()
  
  console.log('✅ 配置加载完成:')
  console.log(`   - 业务模块: ${Object.keys(config.businessModules).join(', ')}`)
  console.log(`   - 可用Providers: ${Object.keys(config.providers).join(', ')}`)
  console.log(`   - 默认设置: ${JSON.stringify(config.defaultSettings)}`)
  
  return config
}

/**
 * 示例2: 服务注册和发现
 */
async function example2_ServiceRegistrationAndDiscovery() {
  console.log('\n🔍 示例2: 服务注册和发现')
  
  const registry = getAIServiceRegistry()
  await registry.initialize()
  
  const stats = registry.getStats()
  console.log('✅ 服务注册表状态:')
  console.log(`   - 总服务数: ${stats.total}`)
  console.log(`   - 活跃服务: ${stats.active}`)
  console.log(`   - 非活跃服务: ${stats.inactive}`)
  
  // 显示所有服务
  const allServices = registry.getAllServices()
  if (allServices.length > 0) {
    console.log('📋 已注册的服务:')
    allServices.forEach(service => {
      console.log(`   - ${service.id}: ${service.provider}/${service.model} (${service.status})`)
    })
  } else {
    console.log('⚠️ 没有已注册的服务（可能因为没有配置API Key）')
  }
  
  return registry
}

/**
 * 示例3: 智能服务发现
 */
async function example3_IntelligentServiceDiscovery() {
  console.log('\n🎯 示例3: 智能服务发现')
  
  const discovery = await getServiceDiscovery()
  
  // 尝试发现文本服务
  try {
    const result = await discovery.findBestService({
      category: 'text',
      capabilities: { jsonMode: true },
      constraints: { 
        maxLatency: 5000,
        maxCost: 0.01
      }
    })
    
    console.log('✅ 发现最佳文本服务:')
    console.log(`   - 服务ID: ${result.service.id}`)
    console.log(`   - Provider: ${result.service.provider}`)
    console.log(`   - 模型: ${result.service.model}`)
    console.log(`   - 延迟: ${result.service.performance.avgLatency}ms`)
    console.log(`   - 成本: ${result.service.performance.costPer1kTokens}/1k tokens`)
    console.log(`   - 成功率: ${(result.service.performance.successRate * 100).toFixed(1)}%`)
    console.log(`   - 是否降级: ${result.isFallback ? '是' : '否'}`)
    
    return result.service
  } catch (error) {
    console.log('⚠️ 服务发现失败:', error instanceof Error ? error.message : '未知错误')
    console.log('   这通常是因为没有配置API Key或没有可用的服务')
    return null
  }
}

/**
 * 示例4: 使用服务适配器调用AI
 */
async function example4_UsingServiceAdapter() {
  console.log('\n🤖 示例4: 使用服务适配器调用AI')
  
  const registry = getAIServiceRegistry()
  const services = registry.getAllServices()
  
  if (services.length === 0) {
    console.log('⚠️ 没有可用的服务，跳过AI调用示例')
    return null
  }
  
  // 使用第一个可用服务
  const service = services[0]
  const adapter = new AIServiceAdapter(service)
  
  try {
    console.log(`📞 使用服务 ${service.id} 调用AI...`)
    
    const result = await adapter.call('请用一句话介绍人工智能', {
      temperature: 0.7,
      maxTokens: 100
    })
    
    if (result.success) {
      console.log('✅ AI调用成功:')
      console.log(`   - 响应: ${result.data}`)
      console.log(`   - 延迟: ${result.latency}ms`)
      console.log(`   - Token数: ${result.tokens?.total || '未知'}`)
      console.log(`   - 成本: $${result.cost?.toFixed(6) || '未知'}`)
    } else {
      console.log('❌ AI调用失败:', result.error)
    }
    
    return result
  } catch (error) {
    console.log('❌ AI调用异常:', error instanceof Error ? error.message : '未知错误')
    return null
  }
}

/**
 * 示例5: 业务模块配置使用
 */
async function example5_BusinessModuleConfig() {
  console.log('\n🏢 示例5: 业务模块配置使用')
  
  const configLoader = getConfigLoader()
  
  // 获取不同业务模块的配置
  const modules = ['videoScriptGeneration', 'promptGeneration', 'competitorAnalysis']
  
  for (const moduleName of modules) {
    const config = configLoader.getBusinessModuleConfig(moduleName)
    if (config) {
      console.log(`📋 ${moduleName} 配置:`)
      console.log(`   - 最大tokens: ${config.maxTokens}`)
      console.log(`   - 温度: ${config.temperature}`)
      console.log(`   - 超时: ${config.timeout}ms`)
      console.log(`   - 首选模型: ${config.preferredModels.length > 0 ? config.preferredModels.join(', ') : 'auto'}`)
    }
  }
}

/**
 * 示例6: 健康检查和监控
 */
async function example6_HealthCheckAndMonitoring() {
  console.log('\n💓 示例6: 健康检查和监控')
  
  const discovery = await getServiceDiscovery()
  const registry = getAIServiceRegistry()
  
  // 获取健康检查统计
  const healthStats = discovery.getHealthCheckStats()
  console.log('📊 健康检查统计:')
  console.log(`   - 总服务数: ${healthStats.total}`)
  console.log(`   - 健康服务: ${healthStats.healthy}`)
  console.log(`   - 不健康服务: ${healthStats.unhealthy}`)
  console.log(`   - 缓存命中率: ${(healthStats.cacheHitRate * 100).toFixed(1)}%`)
  
  // 获取服务统计
  const serviceStats = registry.getStats()
  console.log('📈 服务统计:')
  console.log(`   - 总服务: ${serviceStats.total}`)
  console.log(`   - 活跃: ${serviceStats.active}`)
  console.log(`   - 非活跃: ${serviceStats.inactive}`)
  console.log(`   - 配额超限: ${serviceStats.quotaExceeded}`)
  console.log(`   - 错误状态: ${serviceStats.error}`)
}

/**
 * 示例7: 错误处理和降级
 */
async function example7_ErrorHandlingAndFallback() {
  console.log('\n🛡️ 示例7: 错误处理和降级')
  
  const discovery = await getServiceDiscovery()
  
  try {
    // 尝试发现服务，启用降级
    const result = await discovery.findBestService({
      category: 'text',
      capabilities: { jsonMode: true }
    }, {
      enableFallback: true,
      maxFallbackAttempts: 3,
      healthCheckTimeout: 5000
    })
    
    console.log('✅ 服务发现成功（带降级）:')
    console.log(`   - 选择的服务: ${result.service.id}`)
    console.log(`   - 是否降级: ${result.isFallback ? '是' : '否'}`)
    if (result.fallbackReason) {
      console.log(`   - 降级原因: ${result.fallbackReason}`)
    }
    console.log(`   - 发现耗时: ${result.discoveryTime}ms`)
    
  } catch (error) {
    console.log('❌ 服务发现失败（所有服务都不可用）:', error instanceof Error ? error.message : '未知错误')
  }
}

/**
 * 运行所有示例
 */
async function runAllExamples() {
  console.log('🚀 开始运行AI服务架构完整示例\n')
  
  try {
    // 示例1: 基础配置加载
    await example1_BasicConfigLoading()
    
    // 示例2: 服务注册和发现
    await example2_ServiceRegistrationAndDiscovery()
    
    // 示例3: 智能服务发现
    await example3_IntelligentServiceDiscovery()
    
    // 示例4: 使用服务适配器调用AI
    await example4_UsingServiceAdapter()
    
    // 示例5: 业务模块配置使用
    await example5_BusinessModuleConfig()
    
    // 示例6: 健康检查和监控
    await example6_HealthCheckAndMonitoring()
    
    // 示例7: 错误处理和降级
    await example7_ErrorHandlingAndFallback()
    
    console.log('\n🎉 所有示例运行完成！')
    console.log('\n📝 总结:')
    console.log('   - ✅ 动态配置加载正常工作')
    console.log('   - ✅ 服务注册和发现机制正常')
    console.log('   - ✅ 业务模块配置可以正确读取')
    console.log('   - ⚠️ AI调用需要配置API Key才能正常工作')
    console.log('   - ✅ 错误处理和降级机制已就绪')
    
  } catch (error) {
    console.error('❌ 示例运行失败:', error)
  }
}

// 如果直接运行此文件，执行所有示例
if (require.main === module) {
  runAllExamples().catch(console.error)
}

export {
  example1_BasicConfigLoading,
  example2_ServiceRegistrationAndDiscovery,
  example3_IntelligentServiceDiscovery,
  example4_UsingServiceAdapter,
  example5_BusinessModuleConfig,
  example6_HealthCheckAndMonitoring,
  example7_ErrorHandlingAndFallback,
  runAllExamples
}
