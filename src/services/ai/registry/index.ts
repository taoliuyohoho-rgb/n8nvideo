/**
 * AI服务注册表入口文件
 * 
 * 导出所有注册表相关的类和函数
 */

export * from './AIServiceRegistry'
export * from './ServiceDiscovery'
export * from '../adapters/AIServiceAdapter'
export * from '../adapters/UniversalAPICaller'
export * from '../config/ConfigLoader'
export * from '../monitoring/PerformanceMonitor'

// 重新导出单例函数
export {
  getAIServiceRegistry,
  resetAIServiceRegistry
} from './AIServiceRegistry'

export {
  getServiceDiscovery,
  resetServiceDiscovery
} from './ServiceDiscovery'

export {
  getConfigLoader,
  resetConfigLoader
} from '../config/ConfigLoader'

export {
  getUniversalAPICaller,
  resetUniversalAPICaller
} from '../adapters/UniversalAPICaller'

export {
  getPerformanceMonitor,
  resetPerformanceMonitor
} from '../monitoring/PerformanceMonitor'
