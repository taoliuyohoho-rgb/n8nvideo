'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Brain, 
  Wand2, 
  Video, 
  Settings, 
  TestTube,
  Save,
  RefreshCw
} from 'lucide-react'

interface AIConfig {
  videoAnalysisAI: {
    provider: string
    model: string
    apiKey: string
    isActive: boolean
  }
  promptGenerationAI: {
    provider: string
    model: string
    apiKey: string
    isActive: boolean
  }
  videoGenerationAI: {
    provider: string
    model: string
    apiKey: string
    isActive: boolean
  }
}

interface TemplateAIConfig {
  templateId: string
  templateName: string
  videoAnalysisAI: string
  promptGenerationAI: string
  videoGenerationAI: string
  performance: {
    avgCTR: number
    avgCVR: number
    totalVideos: number
  }
}

export default function AIConfigPage() {
  const [globalConfig, setGlobalConfig] = useState<AIConfig>({
    videoAnalysisAI: {
      provider: 'gemini',
      model: 'gemini-1.5-pro',
      apiKey: '',
      isActive: true
    },
    promptGenerationAI: {
      provider: 'gemini',
      model: 'gemini-1.5-pro',
      apiKey: '',
      isActive: true
    },
    videoGenerationAI: {
      provider: 'sora',
      model: 'sora-1.0',
      apiKey: '',
      isActive: true
    }
  })

  const [templateConfigs, setTemplateConfigs] = useState<TemplateAIConfig[]>([
    {
      templateId: 'TMP001',
      templateName: 'Pain-contrast type',
      videoAnalysisAI: 'gemini',
      promptGenerationAI: 'gemini',
      videoGenerationAI: 'sora',
      performance: {
        avgCTR: 5.2,
        avgCVR: 2.1,
        totalVideos: 45
      }
    },
    {
      templateId: 'TMP002',
      templateName: 'Story-twist type',
      videoAnalysisAI: 'gpt4',
      promptGenerationAI: 'gpt4',
      videoGenerationAI: 'veo',
      performance: {
        avgCTR: 4.8,
        avgCVR: 1.9,
        totalVideos: 32
      }
    },
    {
      templateId: 'TMP003',
      templateName: 'Review-demo type',
      videoAnalysisAI: 'claude',
      promptGenerationAI: 'claude',
      videoGenerationAI: 'doubao',
      performance: {
        avgCTR: 5.8,
        avgCVR: 2.5,
        totalVideos: 28
      }
    }
  ])

  const [activeTab, setActiveTab] = useState('global')
  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)

  const handleSaveGlobalConfig = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/admin/ai-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(globalConfig)
      })
      
      const result = await response.json()
      if (result.success) {
        alert('配置保存成功！')
      } else {
        alert(`保存失败：${result.error}`)
      }
    } catch (error) {
      console.error('保存失败:', error)
      alert('保存失败，请重试')
    } finally {
      setIsSaving(false)
    }
  }

  const handleTestAI = async (type: string) => {
    setIsTesting(true)
    try {
      // 这里应该调用API测试AI配置
      console.log('测试AI:', type)
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 2000))
    } catch (error) {
      console.error('测试失败:', error)
    } finally {
      setIsTesting(false)
    }
  }

  const handleUpdateTemplateConfig = (templateId: string, field: string, value: string) => {
    setTemplateConfigs(prev => prev.map(config => 
      config.templateId === templateId 
        ? { ...config, [field]: value }
        : config
    ))
  }

  const getAIProviderBadge = (provider: string) => {
    const colors = {
      gemini: 'bg-blue-100 text-blue-800',
      gpt4: 'bg-green-100 text-green-800',
      claude: 'bg-purple-100 text-purple-800',
      sora: 'bg-red-100 text-red-800',
      veo: 'bg-orange-100 text-orange-800',
      doubao: 'bg-yellow-100 text-yellow-800'
    }
    return <Badge className={colors[provider as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>{provider}</Badge>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">AI配置管理</h1>
          <p className="text-gray-600">管理视频分析、Prompt生成和视频生成的AI配置</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="global" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            全局配置
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            模板配置
          </TabsTrigger>
        </TabsList>

        <TabsContent value="global" className="space-y-6">
          <div className="grid gap-6">
            {/* 视频分析AI配置 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5" />
                  视频分析AI
                </CardTitle>
                <CardDescription>
                  用于分析上传视频的脚本结构、剪辑节奏等特征
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="videoAnalysisProvider">提供商</Label>
                    <Select 
                      value={globalConfig.videoAnalysisAI.provider} 
                      onValueChange={(value) => setGlobalConfig(prev => ({
                        ...prev,
                        videoAnalysisAI: { ...prev.videoAnalysisAI, provider: value }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gemini">Google Gemini</SelectItem>
                        <SelectItem value="gpt4">OpenAI GPT-4</SelectItem>
                        <SelectItem value="claude">Anthropic Claude</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="videoAnalysisModel">模型</Label>
                    <Select 
                      value={globalConfig.videoAnalysisAI.model} 
                      onValueChange={(value) => setGlobalConfig(prev => ({
                        ...prev,
                        videoAnalysisAI: { ...prev.videoAnalysisAI, model: value }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gemini-1.5-pro">Gemini 1.5 Pro</SelectItem>
                        <SelectItem value="gpt-4-vision">GPT-4 Vision</SelectItem>
                        <SelectItem value="claude-3-opus">Claude 3 Opus</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="videoAnalysisApiKey">API Key</Label>
                  <Input
                    id="videoAnalysisApiKey"
                    type="password"
                    value={globalConfig.videoAnalysisAI.apiKey}
                    onChange={(e) => setGlobalConfig(prev => ({
                      ...prev,
                      videoAnalysisAI: { ...prev.videoAnalysisAI, apiKey: e.target.value }
                    }))}
                    placeholder="输入API密钥"
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => handleTestAI('videoAnalysis')}
                    disabled={isTesting}
                    variant="outline"
                  >
                    {isTesting ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        测试中...
                      </>
                    ) : (
                      <>
                        <TestTube className="h-4 w-4 mr-2" />
                        测试连接
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Prompt生成AI配置 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wand2 className="h-5 w-5" />
                  Prompt生成AI
                </CardTitle>
                <CardDescription>
                  用于生成Sora、Veo等视频生成工具的提示词
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="promptGenerationProvider">提供商</Label>
                    <Select 
                      value={globalConfig.promptGenerationAI.provider} 
                      onValueChange={(value) => setGlobalConfig(prev => ({
                        ...prev,
                        promptGenerationAI: { ...prev.promptGenerationAI, provider: value }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gemini">Google Gemini</SelectItem>
                        <SelectItem value="gpt4">OpenAI GPT-4</SelectItem>
                        <SelectItem value="claude">Anthropic Claude</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="promptGenerationModel">模型</Label>
                    <Select 
                      value={globalConfig.promptGenerationAI.model} 
                      onValueChange={(value) => setGlobalConfig(prev => ({
                        ...prev,
                        promptGenerationAI: { ...prev.promptGenerationAI, model: value }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gemini-1.5-pro">Gemini 1.5 Pro</SelectItem>
                        <SelectItem value="gpt-4">GPT-4</SelectItem>
                        <SelectItem value="claude-3-opus">Claude 3 Opus</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="promptGenerationApiKey">API Key</Label>
                  <Input
                    id="promptGenerationApiKey"
                    type="password"
                    value={globalConfig.promptGenerationAI.apiKey}
                    onChange={(e) => setGlobalConfig(prev => ({
                      ...prev,
                      promptGenerationAI: { ...prev.promptGenerationAI, apiKey: e.target.value }
                    }))}
                    placeholder="输入API密钥"
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => handleTestAI('promptGeneration')}
                    disabled={isTesting}
                    variant="outline"
                  >
                    {isTesting ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        测试中...
                      </>
                    ) : (
                      <>
                        <TestTube className="h-4 w-4 mr-2" />
                        测试连接
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* 视频生成AI配置 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5" />
                  视频生成AI
                </CardTitle>
                <CardDescription>
                  用于实际生成视频的AI服务
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="videoGenerationProvider">提供商</Label>
                    <Select 
                      value={globalConfig.videoGenerationAI.provider} 
                      onValueChange={(value) => setGlobalConfig(prev => ({
                        ...prev,
                        videoGenerationAI: { ...prev.videoGenerationAI, provider: value }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sora">OpenAI Sora</SelectItem>
                        <SelectItem value="veo">Google Veo</SelectItem>
                        <SelectItem value="doubao">字节豆包</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="videoGenerationModel">模型</Label>
                    <Select 
                      value={globalConfig.videoGenerationAI.model} 
                      onValueChange={(value) => setGlobalConfig(prev => ({
                        ...prev,
                        videoGenerationAI: { ...prev.videoGenerationAI, model: value }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sora-1.0">Sora 1.0</SelectItem>
                        <SelectItem value="veo-1.0">Veo 1.0</SelectItem>
                        <SelectItem value="doubao-video">豆包视频</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="videoGenerationApiKey">API Key</Label>
                  <Input
                    id="videoGenerationApiKey"
                    type="password"
                    value={globalConfig.videoGenerationAI.apiKey}
                    onChange={(e) => setGlobalConfig(prev => ({
                      ...prev,
                      videoGenerationAI: { ...prev.videoGenerationAI, apiKey: e.target.value }
                    }))}
                    placeholder="输入API密钥"
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => handleTestAI('videoGeneration')}
                    disabled={isTesting}
                    variant="outline"
                  >
                    {isTesting ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        测试中...
                      </>
                    ) : (
                      <>
                        <TestTube className="h-4 w-4 mr-2" />
                        测试连接
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button 
                onClick={handleSaveGlobalConfig}
                disabled={isSaving}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSaving ? (
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
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">模板AI配置</h2>
              <p className="text-sm text-gray-600">为不同模板配置最适合的AI组合</p>
            </div>

            {templateConfigs.map((config) => (
              <Card key={config.templateId}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">{config.templateName}</h3>
                      <p className="text-sm text-gray-600">Template ID: {config.templateId}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">平均CTR: {config.performance.avgCTR.toFixed(1)}%</p>
                      <p className="text-sm text-gray-600">平均CVR: {config.performance.avgCVR.toFixed(1)}%</p>
                      <p className="text-sm text-gray-600">视频数: {config.performance.totalVideos}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-sm font-medium">视频分析AI</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Select 
                          value={config.videoAnalysisAI} 
                          onValueChange={(value) => handleUpdateTemplateConfig(config.templateId, 'videoAnalysisAI', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="gemini">Gemini</SelectItem>
                            <SelectItem value="gpt4">GPT-4</SelectItem>
                            <SelectItem value="claude">Claude</SelectItem>
                          </SelectContent>
                        </Select>
                        {getAIProviderBadge(config.videoAnalysisAI)}
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Prompt生成AI</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Select 
                          value={config.promptGenerationAI} 
                          onValueChange={(value) => handleUpdateTemplateConfig(config.templateId, 'promptGenerationAI', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="gemini">Gemini</SelectItem>
                            <SelectItem value="gpt4">GPT-4</SelectItem>
                            <SelectItem value="claude">Claude</SelectItem>
                          </SelectContent>
                        </Select>
                        {getAIProviderBadge(config.promptGenerationAI)}
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">视频生成AI</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Select 
                          value={config.videoGenerationAI} 
                          onValueChange={(value) => handleUpdateTemplateConfig(config.templateId, 'videoGenerationAI', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sora">Sora</SelectItem>
                            <SelectItem value="veo">Veo</SelectItem>
                            <SelectItem value="doubao">豆包</SelectItem>
                          </SelectContent>
                        </Select>
                        {getAIProviderBadge(config.videoGenerationAI)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
