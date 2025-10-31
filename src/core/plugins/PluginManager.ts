import type { Plugin, PluginConfig } from '../types'

export class PluginManager {
  private plugins: Map<string, Plugin> = new Map()
  private configs: Map<string, PluginConfig> = new Map()

  async registerPlugin(plugin: Plugin): Promise<void> {
    try {
      // 检查依赖
      if (plugin.dependencies) {
        for (const dep of plugin.dependencies) {
          if (!this.plugins.has(dep)) {
            throw new Error(`Dependency ${dep} not found for plugin ${plugin.name}`)
          }
        }
      }

      // 安装插件
      await plugin.install()
      
      // 注册插件
      this.plugins.set(plugin.name, plugin)
      
      // 设置默认配置
      this.configs.set(plugin.name, {
        enabled: true,
        settings: {}
      })

      console.log(`Plugin ${plugin.name} registered successfully`)
    } catch (error) {
      console.error(`Failed to register plugin ${plugin.name}:`, error)
      throw error
    }
  }

  async unregisterPlugin(name: string): Promise<void> {
    const plugin = this.plugins.get(name)
    if (!plugin) {
      throw new Error(`Plugin ${name} not found`)
    }

    try {
      await plugin.uninstall()
      this.plugins.delete(name)
      this.configs.delete(name)
      console.log(`Plugin ${name} unregistered successfully`)
    } catch (error) {
      console.error(`Failed to unregister plugin ${name}:`, error)
      throw error
    }
  }

  getPlugin(name: string): Plugin | undefined {
    return this.plugins.get(name)
  }

  getAllPlugins(): Plugin[] {
    return Array.from(this.plugins.values())
  }

  getEnabledPlugins(): Plugin[] {
    return Array.from(this.plugins.values()).filter(plugin => {
      const config = this.configs.get(plugin.name)
      return config?.enabled === true
    })
  }

  updatePluginConfig(name: string, config: Partial<PluginConfig>): void {
    const existingConfig = this.configs.get(name)
    if (!existingConfig) {
      throw new Error(`Plugin ${name} not found`)
    }

    this.configs.set(name, {
      ...existingConfig,
      ...config
    })
  }

  getPluginConfig(name: string): PluginConfig | undefined {
    return this.configs.get(name)
  }

  async enablePlugin(name: string): Promise<void> {
    const plugin = this.plugins.get(name)
    if (!plugin) {
      throw new Error(`Plugin ${name} not found`)
    }

    this.updatePluginConfig(name, { enabled: true })
    console.log(`Plugin ${name} enabled`)
  }

  async disablePlugin(name: string): Promise<void> {
    const plugin = this.plugins.get(name)
    if (!plugin) {
      throw new Error(`Plugin ${name} not found`)
    }

    this.updatePluginConfig(name, { enabled: false })
    console.log(`Plugin ${name} disabled`)
  }
}
