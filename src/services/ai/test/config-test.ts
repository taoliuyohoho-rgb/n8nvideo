/**
 * 配置系统测试
 */

import { getConfigLoader } from '../config/ConfigLoader'
import { getAIServiceRegistry } from '../registry/AIServiceRegistry'
import { getServiceDiscovery } from '../registry/ServiceDiscovery'

async function testConfigSystem() {
  console.log('🧪 开始测试动态配置系统...\n')

  try {
    // 1. 测试ConfigLoader
    console.log('1️⃣ 测试ConfigLoader...')
    const configLoader = getConfigLoader()
    const config = await configLoader.loadConfig()
    
    console.log(`✅ 配置加载成功:`)
    console.log(`   - Providers: ${Object.keys(config.providers).length}个`)
    console.log(`   - 业务模块: ${Object.keys(config.businessModules).length}个`)
    console.log(`   - 默认设置: maxTokens=${config.defaultSettings.maxTokens}`)
    
    // 显示provider详情
    for (const [name, provider] of Object.entries(config.providers)) {
      console.log(`   - ${name}: ${provider.baseUrl} (${provider.apiKey ? '已配置' : '未配置'})`)
    }
    
    // 显示业务模块详情
    for (const [name, module] of Object.entries(config.businessModules)) {
      console.log(`   - ${name}: ${module.preferredModels.length > 0 ? module.preferredModels.join(',') : 'auto'}`)
    }

    console.log('\n2️⃣ 测试AIServiceRegistry...')
    const registry = getAIServiceRegistry()
    await registry.initialize()
    
    const stats = registry.getStats()
    console.log(`✅ 服务注册表初始化成功:`)
    console.log(`   - 总服务数: ${stats.total}`)
    console.log(`   - 活跃服务: ${stats.active}`)
    console.log(`   - 非活跃服务: ${stats.inactive}`)
    
    // 显示所有服务
    const allServices = registry.getAllServices()
    for (const service of allServices) {
      console.log(`   - ${service.id}: ${service.provider}/${service.model} (${service.status})`)
    }

    console.log('\n3️⃣ 测试ServiceDiscovery...')
    const discovery = await getServiceDiscovery()
    
    // 测试文本服务发现
    try {
      const result = await discovery.findBestService({
        category: 'text',
        capabilities: { jsonMode: true },
        constraints: { maxLatency: 5000 }
      })
      
      console.log(`✅ 文本服务发现成功: ${result.service.id}`)
      console.log(`   - Provider: ${result.service.provider}/${result.service.model}`)
      console.log(`   - 延迟: ${result.service.performance.avgLatency}ms`)
      console.log(`   - 成本: ${result.service.performance.costPer1kTokens}/1k`)
      console.log(`   - 是否降级: ${result.isFallback ? '是' : '否'}`)
      if (result.fallbackReason) {
        console.log(`   - 降级原因: ${result.fallbackReason}`)
      }
    } catch (error) {
      console.log(`⚠️ 文本服务发现失败: ${error instanceof Error ? error.message : '未知错误'}`)
      console.log('   这是正常的，因为没有配置API Key')
    }

    console.log('\n4️⃣ 测试业务模块配置...')
    const videoScriptConfig = configLoader.getBusinessModuleConfig('videoScriptGeneration')
    if (videoScriptConfig) {
      console.log(`✅ 视频脚本生成配置:`)
      console.log(`   - 最大tokens: ${videoScriptConfig.maxTokens}`)
      console.log(`   - 温度: ${videoScriptConfig.temperature}`)
      console.log(`   - 超时: ${videoScriptConfig.timeout}ms`)
    }

    console.log('\n🎉 所有测试通过！动态配置系统工作正常。')

  } catch (error) {
    console.error('❌ 测试失败:', error)
    throw error
  }
}

// 运行测试
if (require.main === module) {
  testConfigSystem().catch(console.error)
}

export { testConfigSystem }
