// AI配置标签页组件

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
// import { Switch } from '@/components/ui/switch' // 组件不存在，暂时注释
import { 
  Settings, 
  Save, 
  RefreshCw, 
  CheckCircle,
  Key,
  Brain
} from 'lucide-react'
import type { CompatibleAIConfig } from '@/types/compat'

const normalizeConfig = (config: CompatibleAIConfig | null): CompatibleAIConfig => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
  return {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    providers: config?.providers || {},
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    defaultModel: config?.defaultModel || 'deepseek-chat',
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    fallbackModel: config?.fallbackModel || 'doubao-seed-1-6-lite',
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    maxTokens: config?.maxTokens || 4000,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    temperature: config?.temperature || 0.7,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    timeout: config?.timeout || 30000
  }
}

interface VerifiedModel {
  modelName: string
  name: string
  langs: string[]
  maxContext: number
  pricePer1kTokens: number
  toolUseSupport: boolean
  jsonModeSupport: boolean
}

interface VerifiedProvider {
  provider: string
  status: string
  models: VerifiedModel[]
  verified: boolean
  quotaError?: string
  lastQuotaCheck?: string
}

interface AIConfigTabProps {
  aiConfig: CompatibleAIConfig | null
  verifiedModels: VerifiedProvider[]
  onConfigUpdate: (config: CompatibleAIConfig) => void
  onVerifiedModelsUpdate: (models: string[]) => void
}

export function AIConfigTab({ 
  aiConfig, 
  verifiedModels, 
  onConfigUpdate, 
  onVerifiedModelsUpdate: _onVerifiedModelsUpdate 
}: AIConfigTabProps) {
  const [config, setConfig] = useState<CompatibleAIConfig>(() => normalizeConfig(aiConfig))
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setConfig(normalizeConfig(aiConfig))
  }, [aiConfig])

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/admin/ai-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })
      
      if (response.ok) {
        onConfigUpdate(config)
        // 显示成功消息
      }
    } catch (error) {
      // console.error('保存AI配置失败:', error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* 基础配置 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            基础配置
          </CardTitle>
          <CardDescription>配置AI模型的基础参数</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="defaultModel">默认模型</Label>
              <Select 
                value={config.defaultModel || 'deepseek-chat'} 
                onValueChange={(value) => setConfig({...config, defaultModel: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {verifiedModels
                    .filter(provider => provider.status === 'verified')
                    .flatMap((provider) => {
                    return provider.models.map((model) => {
                      const modelName = model.name || model.modelName || '未知模型'
                      const modelValue = model.modelName
                      const modelKey = `${provider.provider}-${modelValue}`
                      
                      return (
                        <SelectItem key={modelKey} value={modelValue}>
                          {modelName} ({provider.provider})
                        </SelectItem>
                      )
                    })
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fallbackModel">备用模型</Label>
              <Select 
                value={config.fallbackModel || 'doubao-seed-1-6-lite'} 
                onValueChange={(value) => setConfig({...config, fallbackModel: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {verifiedModels
                    .filter(provider => provider.status === 'verified')
                    .flatMap((provider) => {
                    return provider.models.map((model) => {
                      const modelName = model.name || model.modelName || '未知模型'
                      const modelValue = model.modelName
                      const modelKey = `${provider.provider}-${modelValue}`
                      
                      return (
                        <SelectItem key={modelKey} value={modelValue}>
                          {modelName} ({provider.provider})
                        </SelectItem>
                      )
                    })
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxTokens">最大Token数</Label>
              <Input
                id="maxTokens"
                type="number"
                value={config.maxTokens}
                onChange={(e) => setConfig({...config, maxTokens: parseInt(e.target.value)})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="temperature">温度参数</Label>
              <Input
                id="temperature"
                type="number"
                step="0.1"
                min="0"
                max="2"
                value={config.temperature}
                onChange={(e) => setConfig({...config, temperature: parseFloat(e.target.value)})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="timeout">超时时间(ms)</Label>
              <Input
                id="timeout"
                type="number"
                value={config.timeout}
                onChange={(e) => setConfig({...config, timeout: parseInt(e.target.value)})}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  保存中...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  保存配置
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 已验证模型 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            已验证模型
          </CardTitle>
          <CardDescription>管理可用的AI模型</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {verifiedModels.map((model) => {
              // 处理嵌套的模型数据结构
              let modelName = ''
              let isVerified = false
              let modelKey = ''
              
              if (typeof model === 'string') {
                modelName = model
                isVerified = true
                modelKey = model
              } else if (model && typeof model === 'object') {
                // 这是provider级别的数据，需要展开models
                return model.models.map((subModel: VerifiedModel) => {
                  const subModelName = subModel.name || subModel.modelName || '未知模型'
                  const subModelVerified = model.status === 'verified' && !model.quotaError
                  const subModelKey = `${model.provider}-${subModel.modelName}`
                  
                  return (
                    <div key={subModelKey} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Brain className="h-4 w-4 text-blue-500" />
                        <div className="flex flex-col">
                          <span className="font-medium">{subModelName}</span>
                          <span className="text-xs text-gray-500">{model.provider}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant="secondary" className={subModelVerified ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}>
                          {subModelVerified ? '已验证' : '未验证'}
                        </Badge>
                        {model.quotaError && (
                          <Badge variant="destructive" className="text-xs">
                            余额不足
                          </Badge>
                        )}
                      </div>
                    </div>
                  )
                })
              }
              
              // 如果是扁平结构，直接渲染
              if (modelName) {
                return (
                  <div key={modelKey} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Brain className="h-4 w-4 text-blue-500" />
                      <span className="font-medium">{modelName}</span>
                    </div>
                    <Badge variant="secondary" className={isVerified ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}>
                      {isVerified ? '已验证' : '未验证'}
                    </Badge>
                  </div>
                )
              }
              
              return null
            }).flat()}
          </div>
        </CardContent>
      </Card>

      {/* 提供商配置 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            API密钥配置
          </CardTitle>
          <CardDescription>配置各AI提供商的API密钥</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(config.providers ?? {}).map(([provider, providerConfig]) => {
            if (!providerConfig) {
              return null
            }

            const safeConfig = {
              apiKey: (providerConfig as any)?.apiKey ?? '',
              baseUrl: (providerConfig as any)?.baseUrl ?? '',
              enabled: (providerConfig as any)?.enabled ?? false
            }

            return (
              <div key={provider} className="space-y-3 p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium capitalize">{provider}</h4>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={safeConfig.enabled}
                      onChange={(e) => {
                        setConfig({
                          ...config,
                          providers: {
                            ...config.providers,
                            [provider]: { ...safeConfig, enabled: e.target.checked }
                          }
                        })
                      }}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-gray-500">
                      {safeConfig.enabled ? '启用' : '禁用'}
                    </span>
                  </div>
                </div>
                
                {safeConfig.enabled && (
                <div className="space-y-2">
                  <Label htmlFor={`${provider}-key`}>API密钥</Label>
                  <Input
                    id={`${provider}-key`}
                    type="password"
                    value={safeConfig.apiKey}
                    onChange={(e) => {
                      setConfig({
                        ...config,
                        providers: {
                          ...config.providers,
                          [provider]: { ...safeConfig, apiKey: e.target.value }
                        }
                      })
                    }}
                    placeholder={`输入${provider}的API密钥`}
                  />
                  
                  {safeConfig.baseUrl && (
                    <>
                      <Label htmlFor={`${provider}-url`}>基础URL</Label>
                      <Input
                        id={`${provider}-url`}
                        value={safeConfig.baseUrl}
                        onChange={(e) => {
                          setConfig({
                            ...config,
                            providers: {
                              ...config.providers,
                              [provider]: { ...safeConfig, baseUrl: e.target.value }
                            }
                          })
                        }}
                        placeholder="输入自定义API端点"
                      />
                    </>
                  )}
                </div>
              )}
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
