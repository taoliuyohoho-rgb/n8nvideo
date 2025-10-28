// 核心类型定义
export interface BaseEntity {
  id: string
  createdAt: Date
  updatedAt: Date
}

export interface User extends BaseEntity {
  email: string
  name: string
  role: UserRole
  permissions: Permission[]
  isActive: boolean
}

export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  OPERATOR = 'operator',
  VIEWER = 'viewer'
}

export interface Permission {
  resource: string
  action: string
  conditions?: Record<string, any>
}

// 插件系统类型
export interface Plugin {
  name: string
  version: string
  description: string
  dependencies?: string[]
  install(): Promise<void>
  uninstall(): Promise<void>
  getConfig(): PluginConfig
}

export interface PluginConfig {
  enabled: boolean
  settings: Record<string, any>
}

// 事件系统类型
export interface DomainEvent {
  type: string
  payload: any
  timestamp: Date
  source: string
  correlationId?: string
}

export interface EventHandler {
  handle(event: DomainEvent): Promise<void>
}

// 服务接口类型
export interface Service {
  name: string
  version: string
  health(): Promise<HealthStatus>
  getMetrics(): Promise<Metrics>
}

export interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded'
  details: Record<string, any>
  timestamp: Date
}

export interface Metrics {
  [key: string]: number | string
}
