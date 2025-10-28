'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Plus, Edit, Trash2, Package, Palette, BarChart3, RefreshCw, Database, Brain, Upload, Settings, Users, Search, MessageSquare, FileText, Video, ChevronDown } from 'lucide-react'
import { RecommendationSelector } from '@/components/RecommendationSelector'
import { CompetitorAnalysis } from '@/components/CompetitorAnalysis'
import { ProductAnalysis } from '@/components/ProductAnalysis'
import { AIReverseEngineer } from '@/components/AIReverseEngineer'
import { BusinessModuleOverview } from '@/components/BusinessModuleOverview'
import { UserManagement } from './features/users/UserManagement'
import { PersonaManagement } from './features/personas/PersonaManagement'
import { TaskManagement } from './features/tasks/TaskManagement'

interface Product {
  id: string
  name: string
  description: string
  category: string
  subcategory: string
  sellingPoints: string[]
  skuImages: string[]
  targetCountries: string[]
  createdAt: string
}

interface Style {
  id: string
  name: string
  description: string
  category: string
  subcategory: string
  tone: string
  scriptStructure: any
  visualStyle: any
  targetAudience: any
  productId: string | null
  productName?: string
  templatePerformance?: number
  hookPool?: string
  targetCountries?: string
  isActive: boolean
  createdAt: string
  product?: {
    id: string
    name: string
  }
}

interface User {
  id: string
  email: string
  name: string
  role: string
  isActive: boolean
  createdAt: string
  password?: string
  _count: {
    videos: number
  }
}

interface PainPoint {
  id: string
  productId: string
  platform: string
  productName: string
  painPoints: string[]
  severity: string
  frequency: number
  sentiment: string
  createdAt: string
  product: {
    id: string
    name: string
    category: string
  }
  _count: {
    comments: number
  }
}

interface Persona {
  id: string
  productId: string
  version: number
  coreIdentity: {
    name: string
    age: number
    gender: string
    location: string
    occupation: string
  }
  look: {
    generalAppearance: string
    hair: string
    clothingAesthetic: string
    signatureDetails: string
  }
  vibe: {
    traits: string[]
    demeanor: string
    communicationStyle: string
  }
  context: {
    hobbies: string
    values: string
    frustrations: string
    homeEnvironment: string
  }
  why: string
  createdBy: string | null
  createdAt: string
  updatedAt: string
  modelUsed: any
  product?: {
    id: string
    name: string
    category: string
  }
}

// 推荐系统监控组件
function RecommendationMonitor() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedScenario, setSelectedScenario] = useState<string>('all')
  const [days, setDays] = useState(7)

  const loadStats = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/admin/recommendation/stats?days=${days}`)
      const data = await res.json()
      if (data.success) {
        setStats(data.data)
      }
    } catch (error) {
      console.error('加载推荐统计失败:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStats()
  }, [days])

  if (loading) {
    return <div className="text-center py-8">加载中...</div>
  }

  if (!stats) {
    return <div className="text-center py-8 text-gray-500">暂无数据</div>
  }

  return (
    <div className="space-y-4">
      {/* 时间范围选择 */}
      <div className="flex gap-4 items-center">
        <Label>时间范围:</Label>
        <Select value={days.toString()} onValueChange={(val) => setDays(parseInt(val))}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">最近1天</SelectItem>
            <SelectItem value="7">最近7天</SelectItem>
            <SelectItem value="30">最近30天</SelectItem>
            <SelectItem value="90">最近90天</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={loadStats}>
          <RefreshCw className="h-4 w-4 mr-2" />
          刷新
        </Button>
      </div>

      {/* 总览卡片 */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">总决策数</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.summary.totalDecisions}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">反馈率</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.summary.feedbackRate}%</p>
            <p className="text-xs text-gray-500">{stats.summary.totalFeedback} 条反馈</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">平均质量分</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{(stats.summary.avgQualityScore * 100).toFixed(1)}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">平均延迟</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.summary.avgLatencyMs.toFixed(0)}ms</p>
          </CardContent>
        </Card>
      </div>

      {/* 按场景统计 */}
      <Card>
        <CardHeader>
          <CardTitle>各场景使用情况</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.byScenario && stats.byScenario.length > 0 ? (
            <div className="space-y-2">
              {stats.byScenario.map((item: any) => (
                <div key={item.scenario} className="flex justify-between items-center p-2 border rounded">
                  <span className="font-medium">{item.scenario}</span>
                  <Badge>{item.count} 次</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">暂无数据</p>
          )}
        </CardContent>
      </Card>

      {/* 最近决策 */}
      <Card>
        <CardHeader>
          <CardTitle>最近决策记录</CardTitle>
          <CardDescription>最新的20条推荐决策</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.recentDecisions && stats.recentDecisions.length > 0 ? (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {stats.recentDecisions.map((decision: any) => (
                <div key={decision.id} className="flex justify-between items-center p-3 border rounded hover:bg-gray-50">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{decision.scenario}</Badge>
                      <span className="text-sm text-gray-600">{decision.id.substring(0, 8)}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      选择: {decision.chosenId.substring(0, 12)}...
                    </p>
                  </div>
                  <div className="text-right">
                    {decision.hasFeedback ? (
                      <Badge variant="default">已反馈</Badge>
                    ) : (
                      <Badge variant="secondary">待反馈</Badge>
                    )}
                    {decision.qualityScore !== null && (
                      <p className="text-xs text-gray-600 mt-1">
                        质量: {(decision.qualityScore * 100).toFixed(0)}%
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(decision.createdAt).toLocaleString('zh-CN')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">暂无决策记录</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function AdminPage() {
  // 从localStorage恢复上次的tab状态
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('adminActiveTab') || 'products'
    }
    return 'products'
  })
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  
  // 保存tab状态到localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('adminActiveTab', activeTab)
    }
  }, [activeTab])
  const [products, setProducts] = useState<Product[]>([])
  const [personas, setPersonas] = useState<Persona[]>([])
  const [selectedProductId, setSelectedProductId] = useState<string>('')
  const [users, setUsers] = useState<User[]>([])
  const [painPoints, setPainPoints] = useState<PainPoint[]>([])
  const [showProductForm, setShowProductForm] = useState(false)
  const [showPersonaForm, setShowPersonaForm] = useState(false)
  const [editingPersona, setEditingPersona] = useState<Persona | null>(null)
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]) // 选中的商品ID列表
  const [showUserForm, setShowUserForm] = useState(false)
  const [showPainPointForm, setShowPainPointForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [newTargetAudience, setNewTargetAudience] = useState('')
  const [newSellingPoint, setNewSellingPoint] = useState('')
  const [newPainPoint, setNewPainPoint] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [showProductDetail, setShowProductDetail] = useState(false)
  const [showBulkUpload, setShowBulkUpload] = useState(false)
  const [bulkUploadFile, setBulkUploadFile] = useState<File | null>(null)
  const [bulkUploading, setBulkUploading] = useState(false)
  const [showScrapingModal, setShowScrapingModal] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [scrapingConfig, setScrapingConfig] = useState({
    analysisMode: 'text' as 'text' | 'scrape' | 'competitor', // 默认为文本输入模式
    inputText: '', // 用户输入的文本内容
    platforms: [] as string[], // 保留但仅在爬取模式使用
    keywords: '',
    maxComments: 0,
    dateRange: '',
    customPrompt: '', // 自定义prompt
    aiModel: '', // 推荐的AI模型
    decisionId: '', // 推荐系统决策ID
    competitorImages: [] as string[] // 竞品分析图片
  })
  const [showPromptEditor, setShowPromptEditor] = useState(false) // 是否显示prompt编辑器
  
  // 风格模板相关状态
  const [editingStyle, setEditingStyle] = useState<Style | null>(null)
  const [showStyleForm, setShowStyleForm] = useState(false)
  const [styleCategories, setStyleCategories] = useState<string[]>([])
  
  // 功能模块开关状态
  const [showRankingTuning, setShowRankingTuning] = useState(false)
  const [showDocumentReference, setShowDocumentReference] = useState(false)
  const [showVideoAnalysis, setShowVideoAnalysis] = useState(false)
  
  // 调参状态
  const [tuningConfig, setTuningConfig] = useState({
    coarseRanking: {
      relevance: 30,
      quality: 25,
      diversity: 25,
      recency: 20
    },
    fineRanking: {
      userPreference: 30,
      businessValue: 30,
      technicalQuality: 25,
      marketTrend: 15
    }
  })
  
  // 筛选器状态
  const [filters, setFilters] = useState({
    dateRange: '7d',
    product: 'all',
    platform: 'all',
    template: 'all'
  })
  
  // AI配置状态管理
  const [aiConfigs, setAiConfigs] = useState({
    videoScriptGeneration: 'gemini-2.5-flash',
    promptGeneration: 'gemini-2.5-flash', 
    videoRanking: 'gemini-2.5-flash',
    productAnalysis: 'gemini-2.5-flash',
    videoAnalysis: 'gemini-2.5-flash',
    providers: {},
    videoGeneration: {
      provider: '',
      modelName: '',
      baseUrl: '',
      apiKey: '',
      defaults: {
        aspectRatio: '9:16',
        fps: 30,
        webhookUrl: ''
      }
    }
  })

  const verifyVideoConfig = async () => {
    try {
      const provider = aiConfigs.videoGeneration?.provider || ''
      const model = aiConfigs.videoGeneration?.modelName || ''
      const baseUrl = aiConfigs.videoGeneration?.baseUrl || ''
      if (!provider || !model) {
        alert('请先选择 Provider 与 Model Name')
        return
      }
      // 直接沿用已有的 test 接口做连通性校验（若需基于 provider 定制可扩展）
      const apiKeyInput = document.querySelector('[data-testid="api-key-input"]') as HTMLInputElement | null
      const apiKey = apiKeyInput?.value || ''
      const resp = await fetch('/api/admin/ai-config/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, model, apiKey })
      })
      const result = await resp.json()
      if (result.success) {
        alert('视频生成配置验证成功')
        // 将已验证模型追加到 providers map 中，便于自动回填
        setAiConfigs(prev => ({
          ...prev,
          providers: {
            ...(prev.providers || {}),
            [provider]: {
              ...(prev.providers as any)?.[provider],
              baseUrl,
              verified: true,
            }
          }
        }))
      } else {
        alert(`验证失败：${result.error || result.message || '未知错误'}`)
      }
    } catch (e: any) {
      alert(`验证失败：${e?.message || e}`)
    }
  }
  
  // Prompt模板管理状态
  const [showPromptModal, setShowPromptModal] = useState(false)
  const [currentBusinessModule, setCurrentBusinessModule] = useState<string>('all')
  const [promptTemplates, setPromptTemplates] = useState<any[]>([])
  const [selectedBusinessModule, setSelectedBusinessModule] = useState<string>('product-analysis')
  const [showAIReverseEngineer, setShowAIReverseEngineer] = useState(false)
  const [expandedPromptId, setExpandedPromptId] = useState<string | null>(null)
  const [selectedPrompt, setSelectedPrompt] = useState<any>(null)
  const [moduleTemplateCounts, setModuleTemplateCounts] = useState<{module: string, count: number}[]>([])
  const [showAIChat, setShowAIChat] = useState(false)
  const [aiChatMessages, setAIChatMessages] = useState<{role: string, content: string}[]>([])
  const [aiChatInput, setAIChatInput] = useState('')
  
  // 三段式结构编辑状态
  const [showThreeStageEditor, setShowThreeStageEditor] = useState(false)
  const [threeStageConfig, setThreeStageConfig] = useState({
    inputRequirements: '',
    outputRequirements: '',
    outputRules: ''
  })
  const [selectedInputFields, setSelectedInputFields] = useState<string[]>(['name', 'category', 'description', 'targetCountries'])
  
  // Prompt调优状态
  const [showPromptTuningModal, setShowPromptTuningModal] = useState(false)
  const [tuningBusinessModule, setTuningBusinessModule] = useState<string>('productAnalysis')
  const [tuningContext, setTuningContext] = useState<string>('')
  const [tuningExpectedOutput, setTuningExpectedOutput] = useState<string>('')
  const [tuningCandidates, setTuningCandidates] = useState<string[]>([])
  const [tuningBestPrompt, setTuningBestPrompt] = useState<string>('')
  
  const [tuningInProgress, setTuningInProgress] = useState(false)
  // 批量任务进度
  const [showTaskProgress, setShowTaskProgress] = useState(false)
  const [taskProgress, setTaskProgress] = useState({ total: 0, completed: 0, failed: 0 })
  
  // 已验证的AI模型列表（初始全部未验证，实际以服务器返回为准）
  const [verifiedModels, setVerifiedModels] = useState([
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'Google', verified: false, status: 'unverified' },
    { id: 'gpt-4', name: 'GPT-4', provider: 'OpenAI', verified: false, status: 'unverified' },
    { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', provider: 'Anthropic', verified: false, status: 'unverified' },
    { id: 'doubao-seed-1-6-lite', name: '豆包 Seed 1.6 Lite', provider: '字节跳动', verified: false, status: 'unverified' },
    { id: 'deepseek-chat', name: 'DeepSeek Chat', provider: 'DeepSeek', verified: false, status: 'unverified' }
  ])

  // 监听verifiedModels变化并保存到localStorage (但跳过初始化时的保存)
  const [isInitialized, setIsInitialized] = useState(false)
  
  useEffect(() => {
    if (isInitialized) {
      // 保存到localStorage
      localStorage.setItem('verifiedModels', JSON.stringify(verifiedModels))
      console.log('已验证的模型状态已保存到localStorage:', verifiedModels)
      
      // 同时保存到服务器
      fetch('/api/admin/verified-models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ models: verifiedModels })
      }).then(res => res.json()).then(result => {
        if (result.success) {
          console.log('已验证的模型状态已同步到服务器')
        }
      }).catch(error => {
        console.error('同步到服务器失败:', error)
      })
    }
  }, [verifiedModels, isInitialized])

  // 检查用户登录状态和权限
  useEffect(() => {
    const initPage = async () => {
      try {
        const userData = localStorage.getItem('user')
        console.log('Admin页面初始化，用户数据:', userData)
        
        if (!userData) {
          console.log('没有用户数据，设置临时管理员用户进行测试')
          // 临时设置管理员用户用于测试
          const tempUser = {
            id: 'admin-1',
            email: 'admin@example.com',
            name: 'Admin User',
            role: 'admin'
          }
          localStorage.setItem('user', JSON.stringify(tempUser))
          setUser(tempUser)
          // 继续执行而不是重定向
        } else {
          const userInfo = JSON.parse(userData)
          console.log('解析用户信息:', userInfo)
          
          if (userInfo.role !== 'admin') {
            console.log('非管理员用户，重定向到dashboard')
            // 非管理员用户重定向到dashboard
            router.push('/dashboard')
            return
          }

          setUser(userInfo)
        }
        
        // 优先从服务器加载当前AI配置
        await loadCurrentAIConfigs().catch(err => {
          console.error('加载AI配置失败:', err)
        })
        
        // 优先从服务器获取verified models，避免被localStorage脏数据覆盖
        try {
          const remote = await fetch('/api/admin/verified-models').then(r => r.json())
          if (remote?.success && Array.isArray(remote.data)) {
            setVerifiedModels(remote.data)
            console.log('从服务器加载已验证模型状态:', remote.data)
          }
        } catch (err) {
          console.warn('从服务器获取已验证模型失败，降级使用localStorage:', err)
          const savedVerifiedModels = localStorage.getItem('verifiedModels')
          if (savedVerifiedModels) {
            try {
              const models = JSON.parse(savedVerifiedModels)
              setVerifiedModels(models)
              console.log('加载已验证的模型状态(本地):', models)
            } catch (error) {
              console.error('加载已验证的模型状态失败:', error)
            }
          }
        }
        
        // 从localStorage加载自定义prompt（兼容旧版本，自动迁移到"搜索并分析"新版）
        const savedPrompt = localStorage.getItem('productAnalysisPrompt')
        const newDefaultPrompt = `角色：你是跨境电商的高级用户研究员。
任务：先\u3010实时搜索\u3011关于"{productName}"在{platform}平台的\u3010最新\u3011用户评价/测评/论坛/售后问题；基于检索结果输出\u3010痛点清单\u3011。

必须严格按以下要求输出：
1) 仅输出JSON数组（UTF-8，application/json），数组元素为字符串，每个元素是一条痛点；
2) 不要输出任何解释、标题、key、对象或多余字段；
3) 每条10-30字，按重要性与频次排序；
4) 如检索为空，也要基于同类商品常见问题生成合理痛点；

示例输出：
["物流速度慢，配送时间过长","价格偏高，性价比不足","电池续航时间短"]
`

        if (savedPrompt) {
          const isLegacy = savedPrompt.includes('{comments}') ||
                           savedPrompt.includes('User Reviews') ||
                           savedPrompt.includes('用户评论') ||
                           savedPrompt.includes('评论（可能包含')

          if (isLegacy) {
            // 自动迁移到新版"搜索并分析"prompt
            setScrapingConfig(prev => ({ ...prev, customPrompt: newDefaultPrompt }))
            localStorage.setItem('productAnalysisPrompt', newDefaultPrompt)
            console.log('检测到旧版痛点分析prompt，已自动迁移到新版（实时搜索）')
          } else {
            setScrapingConfig(prev => ({ ...prev, customPrompt: savedPrompt }))
            console.log('加载自定义痛点分析prompt')
          }
        } else {
          // 设置新版默认prompt（实时搜索）
          setScrapingConfig(prev => ({ ...prev, customPrompt: newDefaultPrompt }))
        }
        
        // 标记初始化完成，之后的verifiedModels变化才会保存
        setIsInitialized(true)
        
        // 加载数据
        await Promise.all([
          loadProducts().catch(err => console.error('加载商品失败:', err)),
          loadPersonas().catch(err => console.error('加载人设失败:', err)),
          loadUsers().catch(err => console.error('加载用户失败:', err)),
          loadPainPoints().catch(err => console.error('加载痛点失败:', err)),
          loadPromptTemplates().catch(err => console.error('加载Prompt模板失败:', err)),
          loadModuleTemplateCounts().catch(err => console.error('加载模块模版数量失败:', err))
        ])
        
      } catch (error) {
        console.error('页面初始化失败:', error)
      } finally {
        // 无论如何都要设置loading为false
        setLoading(false)
      }
    }
    
    initPage()
  }, [router])

  const loadProducts = async () => {
    // 从API获取真实商品数据
    await fetchProducts()
  }

  const loadPromptTemplates = async (businessModule?: string) => {
    try {
      const url = (businessModule && businessModule !== 'all')
        ? `/api/admin/prompts?businessModule=${businessModule}` 
        : '/api/admin/prompts';
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && data.data) {
        setPromptTemplates(data.data);
      }
    } catch (e) {
      console.error('加载Prompt模板失败', e);
    }
  }

  // 加载各模块模版数量
  const loadModuleTemplateCounts = async () => {
    try {
      const modules = ['product-analysis', 'video-script', 'ai-reverse-engineer']
      const counts = await Promise.all(
        modules.map(async (module) => {
          const res = await fetch(`/api/admin/prompts?businessModule=${module}`)
          const data = await res.json()
          return {
            module,
            count: data.success ? data.data.length : 0
          }
        })
      )
      setModuleTemplateCounts(counts)
    } catch (error) {
      console.error('加载模块模版数量失败:', error)
    }
  }

  // 获取业务模块的输入字段
  const getInputFieldsForModule = (businessModule: string) => {
    const fieldConfigs = {
      'product-analysis': [
        { key: 'name', label: '商品名称', required: true },
        { key: 'category', label: '商品类目', required: true },
        { key: 'subcategory', label: '子类目', required: false },
        { key: 'description', label: '商品描述', required: true },
        { key: 'targetCountries', label: '目标市场', required: true },
        { key: 'sellingPoints', label: '现有卖点', required: false },
        { key: 'painPoints', label: '现有痛点', required: false },
        { key: 'targetAudience', label: '现有目标受众', required: false },
        { key: 'skuImages', label: '商品图片', required: false },
        { key: 'competitorContent', label: '竞品内容（用户输入）', required: false }
      ],
      'persona.generate': [
        { key: 'productName', label: '产品名称', required: true },
        { key: 'productDescription', label: '产品描述', required: true },
        { key: 'sellingPoints', label: '产品卖点', required: true },
        { key: 'painPoints', label: '产品痛点', required: true },
        { key: 'targetAudience', label: '目标受众', required: true },
        { key: 'country', label: '目标国家', required: true }
      ],
      'video-script': [
        { key: 'name', label: '商品名称', required: true },
        { key: 'category', label: '商品类目', required: true },
        { key: 'targetAudiences', label: '目标受众', required: true },
        { key: 'country', label: '目标市场', required: true },
        { key: 'description', label: '商品描述', required: true },
        { key: 'personaId', label: '人设', required: true },
        { key: 'subcategory', label: '子类目', required: false },
        { key: 'sellingPointsTop5', label: 'Top5卖点', required: false },
        { key: 'painPointsTop5', label: 'Top5痛点', required: false },
        { key: 'images', label: '商品图片', required: false },
        { key: 'videoDuration', label: '视频时长', required: false },
        { key: 'stylePreference', label: '风格要求', required: false },
        { key: 'keyPoints', label: '关键信息点', required: false },
        { key: 'competitorContent', label: '竞品参考', required: false },
        { key: 'brandTone', label: '品牌调性', required: false }
      ],
      'ai-reverse-engineer': [
        { key: 'referenceExample', label: '参考实例', required: true },
        { key: 'exampleType', label: '实例类型', required: true },
        { key: 'targetBusinessModule', label: '目标业务模块', required: true },
        { key: 'inputType', label: '输入类型', required: false },
        { key: 'outputType', label: '输出类型', required: false },
        { key: 'stylePreference', label: '风格偏好', required: false },
        { key: 'complexityLevel', label: '复杂度级别', required: false },
        { key: 'useCase', label: '使用场景', required: false }
      ]
    }
    
    return fieldConfigs[businessModule as keyof typeof fieldConfigs] || []
  }

  // 加载三段式结构配置
  const loadThreeStageConfig = (businessModule: string) => {
    const defaultConfigs = {
      'product-analysis': {
        inputRequirements: '商品名称、类目、描述、目标市场、竞品内容（可选）',
        outputRequirements: 'JSON格式，卖点/痛点各8-12字最多5个，目标受众8-12字',
        outputRules: '作为商品分析专家，重点关注用户痛点和产品优势，输出简洁明了'
      },
      'video-script': {
        inputRequirements: '视频主题、目标受众、视频时长、风格要求、关键信息点',
        outputRequirements: 'JSON格式，包含hook、主体内容、CTA，每部分字数限制',
        outputRules: '作为视频脚本专家，注重吸引力和转化效果，语言生动有趣'
      },
      'ai-reverse-engineer': {
        inputRequirements: '参考实例、目标业务模块、实例类型',
        outputRequirements: 'JSON格式，包含inputRequirements、outputRequirements、outputRules、suggestedTemplate',
        outputRules: '作为Prompt工程专家，根据实例特点生成符合业务模块要求的三段式结构'
      }
    }
    
    const config = defaultConfigs[businessModule as keyof typeof defaultConfigs] || {
      inputRequirements: '',
      outputRequirements: '',
      outputRules: ''
    }
    
    setThreeStageConfig(config)
    
    // 设置默认选中的字段
    const defaultFields = {
      'product-analysis': ['name', 'category', 'description', 'targetCountries'],
      'video-script': ['name', 'category', 'targetAudiences', 'country', 'description', 'personaId'],
      'ai-reverse-engineer': ['referenceExample', 'exampleType', 'targetBusinessModule']
    }
    
    setSelectedInputFields(defaultFields[businessModule as keyof typeof defaultFields] || [])
  }

  const loadPersonas = async () => {
    try {
      console.log('开始加载人设数据...')
      const response = await fetch('/api/admin/personas')
      const result = await response.json()
      console.log('API响应:', result)
      
      if (result.success && result.data) {
        const personas = result.data.map((persona: any) => ({
          id: persona.id,
          productId: persona.productId,
          version: persona.version,
          coreIdentity: persona.coreIdentity,
          look: persona.look,
          vibe: persona.vibe,
          context: persona.context,
          why: persona.why,
          createdBy: persona.createdBy,
          createdAt: persona.createdAt,
          updatedAt: persona.updatedAt,
          modelUsed: persona.modelUsed,
          product: persona.product
        }))
        console.log('转换后的人设数据:', personas)
        setPersonas(personas)
      } else {
        console.error('获取人设列表失败:', result.error || '数据格式错误')
        setPersonas([])
      }
    } catch (error) {
      console.error('获取人设列表失败:', error)
      setPersonas([])
    }
  }

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/admin/users')
      const result = await response.json()
      if (result.success) {
        setUsers(result.data)
      }
    } catch (error) {
      console.error('加载用户数据失败:', error)
      // 模拟用户数据
      setUsers([
        {
          id: '1',
          email: 'admin@example.com',
          name: '管理员',
          role: 'admin',
          isActive: true,
          createdAt: '2024-01-01',
          _count: { videos: 0 }
        },
        {
          id: '2',
          email: 'user@example.com',
          name: '普通用户',
          role: 'viewer',
          isActive: true,
          createdAt: '2024-01-02',
          _count: { videos: 5 }
        }
      ])
    }
  }

  const loadPainPoints = async () => {
    try {
      const response = await fetch('/api/admin/pain-points')
      const result = await response.json()
      if (result.success) {
        setPainPoints(result.data.painPoints)
      }
    } catch (error) {
      console.error('加载痛点数据失败:', error)
      // 模拟痛点数据
      setPainPoints([
        {
          id: '1',
          productId: '1',
          platform: 'shopee',
          productName: '无线蓝牙耳机',
          painPoints: ['音质不够清晰', '电池续航短', '连接不稳定'],
          severity: 'high',
          frequency: 15,
          sentiment: 'negative',
          createdAt: '2024-01-01',
          product: {
            id: '1',
            name: '无线蓝牙耳机',
            category: '电子产品'
          },
          _count: { comments: 25 }
        },
        {
          id: '2',
          productId: '2',
          platform: 'tiktok',
          productName: '智能手表',
          painPoints: ['表带容易断裂', '屏幕容易刮花', '充电速度慢'],
          severity: 'medium',
          frequency: 8,
          sentiment: 'negative',
          createdAt: '2024-01-02',
          product: {
            id: '2',
            name: '智能手表',
            category: '电子产品'
          },
          _count: { comments: 12 }
        }
      ])
    }
  }

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product)
    setShowProductForm(true)
  }

  const handleSaveProduct = async () => {
    if (!editingProduct) return

    try {
      const url = '/api/products'
      const method = editingProduct.id ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingProduct)
      })

      const result = await response.json()
      if (result.success) {
        alert(editingProduct.id ? '商品更新成功！' : '商品添加成功！')
        setShowProductForm(false)
        setEditingProduct(null)
        // 重新加载商品列表
        fetchProducts()
      } else {
        alert(`操作失败：${result.error}`)
      }
    } catch (error) {
      console.error('保存商品失败:', error)
      alert('保存失败，请重试')
    }
  }

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products')
      const result = await response.json()
      if (result.success) {
        // 转换数据格式，将JSON字符串转换为数组
        const products = result.data.products.map((product: any) => ({
          ...product,
          sellingPoints: typeof product.sellingPoints === 'string' 
            ? JSON.parse(product.sellingPoints) 
            : product.sellingPoints || [],
          targetCountries: typeof product.targetCountries === 'string' 
            ? JSON.parse(product.targetCountries) 
            : product.targetCountries || [],
          skuImages: typeof product.skuImages === 'string' 
            ? JSON.parse(product.skuImages) 
            : product.skuImages || [],
          painPoints: product.painPoints && typeof product.painPoints === 'string'
            ? JSON.parse(product.painPoints)
            : product.painPoints || null,
          painPointsLastUpdate: product.painPointsLastUpdate,
          painPointsSource: product.painPointsSource,
          targetAudience: product.targetAudience && typeof product.targetAudience === 'string'
            ? JSON.parse(product.targetAudience)
            : product.targetAudience || []
        }))
        setProducts(products)
      } else {
        // 如果API失败，使用模拟数据
        setProducts([
          {
            id: '1',
            name: '无线蓝牙耳机',
            description: '高品质无线蓝牙耳机，降噪功能强大',
            category: '电子产品',
            subcategory: '音频设备',
            sellingPoints: ['主动降噪技术', '30小时续航', '快速充电', '防水设计'],
            skuImages: ['https://example.com/earphone1.jpg', 'https://example.com/earphone2.jpg'],
            targetCountries: ['US', 'UK', 'DE', 'JP'],
            createdAt: '2024-01-01'
          },
          {
            id: '2',
            name: '智能手表',
            description: '多功能智能手表，健康监测专家',
            category: '电子产品',
            subcategory: '可穿戴设备',
            sellingPoints: ['24小时心率监测', '睡眠质量分析', '运动模式追踪', '防水设计'],
            skuImages: ['https://example.com/watch1.jpg', 'https://example.com/watch2.jpg'],
            targetCountries: ['US', 'CA', 'AU'],
            createdAt: '2024-01-02'
          }
        ])
      }
    } catch (error) {
      console.error('获取商品列表失败:', error)
      // 使用模拟数据作为fallback
      setProducts([
        {
          id: '1',
          name: '无线蓝牙耳机',
          description: '高品质无线蓝牙耳机，降噪功能强大',
          category: '电子产品',
          subcategory: '音频设备',
          sellingPoints: ['主动降噪技术', '30小时续航', '快速充电', '防水设计'],
          skuImages: ['https://example.com/earphone1.jpg', 'https://example.com/earphone2.jpg'],
          targetCountries: ['US', 'UK', 'DE', 'JP'],
          createdAt: '2024-01-01'
        },
        {
          id: '2',
          name: '智能手表',
          description: '多功能智能手表，健康监测专家',
          category: '电子产品',
          subcategory: '可穿戴设备',
          sellingPoints: ['24小时心率监测', '睡眠质量分析', '运动模式追踪', '防水设计'],
          skuImages: ['https://example.com/watch1.jpg', 'https://example.com/watch2.jpg'],
          targetCountries: ['US', 'CA', 'AU'],
          createdAt: '2024-01-02'
        }
      ])
    }
  }

  const handleDeleteProduct = async (id: string) => {
    try {
      const resp = await fetch(`/api/products/${id}`, { method: 'DELETE' })
      const json = await resp.json()
      if (json?.success) {
        setProducts(products.filter(p => p.id !== id))
      } else {
        alert(`删除失败：${json?.error || '未知错误'}`)
      }
    } catch (e: any) {
      console.error('删除商品失败:', e)
      alert(`删除失败：${e?.message || '网络错误'}`)
    }
  }

  const handleDeletePersona = async (id: string) => {
    if (!confirm('确定要删除这个人设吗？')) return
    
    try {
      const response = await fetch(`/api/admin/personas/${id}`, {
        method: 'DELETE'
      })
      const result = await response.json()
      if (result.success) {
        setPersonas(personas.filter(p => p.id !== id))
        alert('人设删除成功')
      } else {
        alert(`删除失败：${result.error}`)
      }
    } catch (error) {
      console.error('删除人设失败:', error)
      alert('删除失败，请重试')
    }
  }

  const handleEditPersona = (persona: Persona) => {
    setEditingPersona(persona)
    setShowPersonaForm(true)
  }

  const handleSavePersona = async (personaData: any) => {
    try {
      const url = editingPersona
        ? `/api/admin/personas/${editingPersona.id}`
        : '/api/admin/personas'
      
      const response = await fetch(url, {
        method: editingPersona ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(personaData)
      })
      
      const result = await response.json()
      if (result.success) {
        alert(editingPersona ? '人设更新成功！' : '人设添加成功！')
        setShowPersonaForm(false)
        setEditingPersona(null)
        loadPersonas()
      } else {
        alert(`操作失败：${result.error}`)
      }
    } catch (error) {
      console.error('保存人设失败:', error)
      alert('保存失败，请重试')
    }
  }

  const handleSaveStyle = async () => {
    if (!editingStyle) return

    try {
      const url = editingStyle.id 
        ? `/api/styles/${editingStyle.id}`
        : '/api/styles'
      
      const response = await fetch(url, {
        method: editingStyle.id ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editingStyle)
      })
      
      const result = await response.json()
      if (result.success) {
        alert(editingStyle.id ? '风格模板更新成功！' : '风格模板添加成功！')
        setShowStyleForm(false)
        setEditingStyle(null)
        // 重新加载风格列表（如果有的话）
        // loadStyles()
      } else {
        alert(`操作失败：${result.error}`)
      }
    } catch (error) {
      console.error('保存风格模板失败:', error)
      alert('保存失败，请重试')
    }
  }

  const handleEditUser = (user: User) => {
    setEditingUser(user)
    setShowUserForm(true)
  }

  const handleDeleteUser = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE'
      })
      const result = await response.json()
      if (result.success) {
        setUsers(users.filter(u => u.id !== id))
        alert('用户删除成功')
      } else {
        alert(`删除失败：${result.error}`)
      }
    } catch (error) {
      console.error('删除用户失败:', error)
      alert('删除用户失败')
    }
  }

  const handleCreateUser = async (userData: any) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
      })
      const result = await response.json()
      if (result.success) {
        setUsers([result.data, ...users])
        setShowUserForm(false)
        alert('用户创建成功')
      } else {
        alert(`创建失败：${result.error}`)
      }
    } catch (error) {
      console.error('创建用户失败:', error)
      alert('创建用户失败')
    }
  }

  const handleStartScraping = async () => {
    if (selectedProducts.length === 0) {
      alert('请选择商品')
      return
    }

    if (scrapingConfig.analysisMode === 'scrape' && scrapingConfig.platforms.length === 0) {
      alert('请选择平台')
      return
    }

    if (scrapingConfig.analysisMode === 'text' && !scrapingConfig.inputText.trim()) {
      alert('请输入分析文本')
      return
    }
    
    // 保存自定义prompt到localStorage
    if (scrapingConfig.customPrompt) {
      localStorage.setItem('productAnalysisPrompt', scrapingConfig.customPrompt)
      console.log('保存自定义痛点分析prompt到localStorage')
    }
    
    try {
      if (scrapingConfig.analysisMode === 'scrape') {
        // 爬取模式：调用批量爬取API
        const response = await fetch('/api/admin/scraping/batch', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            productIds: selectedProducts,
            platforms: scrapingConfig.platforms,
            maxComments: scrapingConfig.maxComments,
            dateRange: scrapingConfig.dateRange,
            customPrompt: scrapingConfig.customPrompt
          })
        })
        const result = await response.json()
        if (result.success) {
          const productNames = products.filter(p => selectedProducts.includes(p.id)).map(p => p.name).join('、')
          const message = `✅ 批量商品分析任务已启动！\n\n商品 (${selectedProducts.length}个):\n${productNames}\n\n平台: ${scrapingConfig.platforms.join(', ')}\n\n系统会自动跟踪任务状态并提示结果。`
          alert(message)
          setShowScrapingModal(false)
          setSelectedProducts([])
          const savedPrompt = scrapingConfig.customPrompt
          setScrapingConfig({ 
            analysisMode: 'text', 
            inputText: '', 
            platforms: [], 
            keywords: '', 
            maxComments: 0, 
            dateRange: '', 
            customPrompt: savedPrompt, 
            aiModel: '', 
            decisionId: '',
            competitorImages: []
          })

          // 跟踪任务状态（最多30秒）
          const createdTasks: { taskId: string; productId: string; platform: string }[] = result.tasks || []
          setShowTaskProgress(true)
          setTaskProgress({ total: createdTasks.length, completed: 0, failed: 0 })
          const deadline = Date.now() + 30000
          let failedMessages: string[] = []
        let completedCount = 0

        while (Date.now() < deadline) {
          await new Promise(res => setTimeout(res, 3000))
          let allDone = true
          let failedCount = 0
          for (const t of createdTasks) {
            try {
              const resp = await fetch(`/api/admin/scraping?productId=${t.productId}&limit=5`)
              const data = await resp.json()
              if (data?.success && Array.isArray(data.data?.tasks)) {
                const task = data.data.tasks.find((x: any) => x.id === t.taskId)
                if (!task) { allDone = false; continue }
                if (task.status === 'failed') {
                  failedMessages.push(`商品: ${t.productId} / 平台: ${t.platform} → ${task.errorLog || '未知错误'}`)
                  failedCount += 1
                } else if (task.status === 'completed') {
                  completedCount += 1
                } else {
                  allDone = false
                }
              } else {
                allDone = false
              }
            } catch (e) {
              allDone = false
            }
          }
          setTaskProgress({ total: createdTasks.length, completed: completedCount, failed: failedCount })

          if (failedMessages.length > 0) break
          if (allDone) break
        }

        if (failedMessages.length > 0) {
          setShowTaskProgress(false)
          alert(`❌ 痛点分析失败：\n\n${failedMessages.join('\n')}`)
          return
        }

        if (completedCount > 0) {
          await loadProducts()
          setShowTaskProgress(false)
          alert('✅ 商品分析已完成，数据已更新！')
        } else {
          alert('⏳ 任务仍在处理中，请稍后在商品库查看结果。')
        }
      } else {
        alert(`创建爬取任务失败：${result.error}`)
      }
      } else {
        // 文本分析模式：为每个商品单独调用分析API
        const productNames = products.filter(p => selectedProducts.includes(p.id)).map(p => p.name).join('、')
        let successCount = 0
        let failedCount = 0
        const failedMessages: string[] = []

        // 显示进度
        setShowTaskProgress(true)
        setTaskProgress({ total: selectedProducts.length, completed: 0, failed: 0 })

        // 添加延迟避免并发过多
        const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
        
        for (let i = 0; i < selectedProducts.length; i++) {
          const productId = selectedProducts[i]
          const productName = products.find(p => p.id === productId)?.name || productId
          
          // 添加延迟，避免并发请求过多
          if (i > 0) {
            await delay(2000) // 每个请求间隔2秒
          }
          
          let retryCount = 0
          const maxRetries = 2
          let success = false
          
          while (retryCount <= maxRetries && !success) {
            try {
              console.log(`正在分析商品 ${i + 1}/${selectedProducts.length}: ${productName}`)
              
              const response = await fetch('/api/product/analyze', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  productId,
                  competitorContent: scrapingConfig.inputText,
                  isUrl: false,
                  chosenModelId: scrapingConfig.aiModel,
                  chosenPromptId: scrapingConfig.decisionId,
                }),
                // 增加超时时间
                signal: AbortSignal.timeout(60000) // 60秒超时
              })
              
              if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`)
              }
              
              const result = await response.json()
              if (result.success) {
                successCount++
                success = true
                console.log(`✅ ${productName} 分析成功`)
              } else {
                throw new Error(result.error || '分析失败')
              }
            } catch (error: any) {
              retryCount++
              console.error(`❌ ${productName} 分析失败 (尝试 ${retryCount}/${maxRetries + 1}):`, error.message)
              
              if (retryCount > maxRetries) {
                failedCount++
                let errorMessage = '网络错误'
                
                if (error.name === 'TimeoutError') {
                  errorMessage = '请求超时（60秒）'
                } else if (error.message.includes('HTTP')) {
                  errorMessage = `服务器错误: ${error.message}`
                } else if (error.message.includes('Failed to fetch')) {
                  errorMessage = '网络连接失败'
                } else if (error.message) {
                  errorMessage = error.message
                }
                
                failedMessages.push(`${productName}: ${errorMessage}`)
              } else {
                // 重试前等待
                console.log(`⏳ ${productName} 将在3秒后重试...`)
                await delay(3000)
              }
            }
          }
          
          // 更新进度
          setTaskProgress({ 
            total: selectedProducts.length, 
            completed: successCount, 
            failed: failedCount 
          })
        }

        setShowTaskProgress(false)
        setShowScrapingModal(false)
        setSelectedProducts([])
        
        // 重置配置
        const savedPrompt = scrapingConfig.customPrompt
        setScrapingConfig({ 
          analysisMode: 'text', 
          inputText: '', 
          platforms: [], 
          keywords: '', 
          maxComments: 0, 
          dateRange: '', 
          customPrompt: savedPrompt, 
          aiModel: '', 
          decisionId: '',
          competitorImages: []
        })

        // 刷新商品列表
        await loadProducts()

        // 显示结果
        if (failedMessages.length > 0) {
          alert(`⚠️ 部分商品分析失败：\n\n${failedMessages.join('\n')}\n\n成功: ${successCount}个，失败: ${failedCount}个`)
        } else {
          alert(`✅ 商品分析完成！\n\n商品 (${selectedProducts.length}个):\n${productNames}\n\n分析模式: 文本输入\n\n成功: ${successCount}个`)
        }
      }
    } catch (error) {
      console.error('商品分析失败:', error)
      alert('商品分析失败')
      setShowTaskProgress(false)
    }
  }



  const handleAIAnalyze = async (painPointId: string) => {
    try {
      const response = await fetch('/api/admin/ai-analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          painPointId,
          comments: [] // 这里应该传入实际的评论数据
        })
      })
      const result = await response.json()
      if (result.success) {
        alert('AI分析完成')
        loadPainPoints() // 重新加载痛点数据
      } else {
        alert(`AI分析失败：${result.error}`)
      }
    } catch (error) {
      console.error('AI分析失败:', error)
      alert('AI分析失败')
    }
  }

  const handleFilterChange = (filterType: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }))
  }

  const handleViewProductDetail = (productName: string) => {
    // 模拟获取商品详细数据
    const mockProductDetail = {
      name: productName,
      category: '电子产品',
      performance: {
        totalSpend: 2345,
        totalGMV: 8765,
        totalViews: 456,
        ctr: 3.2,
        roi: 3.7,
        conversionRate: 2.1,
        avgOrderValue: 89.5
      },
      campaigns: [
        {
          id: '1',
          name: '科技感产品展示',
          platform: 'TikTok',
          status: 'active',
          spend: 1200,
          gmv: 4500,
          views: 230,
          ctr: 3.5,
          roi: 3.8,
          startDate: '2024-01-01',
          endDate: '2024-01-31'
        }
      ],
      videos: [
        {
          id: '1',
          title: '科技感产品展示',
          platform: 'TikTok',
          duration: '30s',
          views: 230,
          likes: 45,
          shares: 12,
          comments: 8,
          ctr: 3.5,
          conversionRate: 2.1,
          createdAt: '2024-01-01'
        }
      ],
      trends: {
        dailySpend: [120, 135, 110, 145, 130, 140, 125],
        dailyGMV: [450, 520, 380, 580, 490, 560, 480],
        dailyViews: [25, 30, 22, 35, 28, 32, 26]
      }
    }
    
    setSelectedProduct(mockProductDetail)
    setShowProductDetail(true)
  }


  const handleBulkUpload = async () => {
    if (!bulkUploadFile) return

    setBulkUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', bulkUploadFile)
      formData.append('type', 'products') // 指定上传类型

      const response = await fetch('/api/admin/bulk-upload', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()
      if (result.success) {
        alert(`批量上传成功！处理了 ${result.processed} 条记录`)
        setShowBulkUpload(false)
        setBulkUploadFile(null)
        // 重新加载数据
        // TODO: 实现数据重新加载逻辑
      } else {
        alert(`批量上传失败：${result.error}`)
      }
    } catch (error) {
      console.error('批量上传失败:', error)
      alert('批量上传失败，请重试')
    } finally {
      setBulkUploading(false)
    }
  }

  const handleAITuning = async () => {
    try {
      const response = await fetch('/api/ranking/ai-tuning', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetLevel: 'global',
          optimizationGoal: 'ctr'
        })
      })

      const result = await response.json()
      if (result.success) {
        alert('AI调参完成！预期CTR提升' + result.data.expectedImprovement.ctrImprovement.toFixed(1) + '%')
        setShowRankingTuning(false)
        setActiveTab('products')
      } else {
        alert(`AI调参失败：${result.error}`)
      }
    } catch (error) {
      console.error('AI调参失败:', error)
      alert('AI调参失败，请重试')
    }
  }

  const handleSaveConfig = async () => {
    try {
      const response = await fetch('/api/ranking/tuning', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          level: 'global',
          levelId: 'global',
          coarseRanking: {
            weightFactors: {
              relevance: tuningConfig.coarseRanking.relevance / 100,
              quality: tuningConfig.coarseRanking.quality / 100,
              diversity: tuningConfig.coarseRanking.diversity / 100,
              recency: tuningConfig.coarseRanking.recency / 100
            }
          },
          fineRanking: {
            weightFactors: {
              userPreference: tuningConfig.fineRanking.userPreference / 100,
              businessValue: tuningConfig.fineRanking.businessValue / 100,
              technicalQuality: tuningConfig.fineRanking.technicalQuality / 100,
              marketTrend: tuningConfig.fineRanking.marketTrend / 100
            }
          }
        })
      })

      const result = await response.json()
      if (result.success) {
        alert('配置保存成功！')
      } else {
        alert(`保存失败：${result.error}`)
      }
    } catch (error) {
      console.error('保存配置失败:', error)
      alert('保存配置失败，请重试')
    }
  }

  const handleSaveAIConfig = async (configType: string, config: any) => {
    try {
      const response = await fetch('/api/admin/ai-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          [configType]: config
        })
      })

      const result = await response.json()
      if (result.success) {
        alert(`${configType}配置保存成功！`)
      } else {
        alert(`保存失败：${result.error}`)
      }
    } catch (error) {
      console.error('保存AI配置失败:', error)
      alert('保存失败，请重试')
    }
  }

  // 从服务器加载当前AI配置
  const loadCurrentAIConfigs = async () => {
    try {
      console.log('开始从服务器加载AI配置...')
      const response = await fetch('/api/admin/ai-config')
      const result = await response.json()
      console.log('服务器返回的配置:', result)
      
      if (result.success && result.data) {
        // 直接使用服务器返回的配置
        setAiConfigs(result.data)
        console.log('AI配置已更新:', result.data)
        
        // 同时更新本地存储
        localStorage.setItem('aiConfigs', JSON.stringify(result.data))
        console.log('AI配置已保存到本地存储')
        
        // 强制重新渲染
        setTimeout(() => {
          console.log('强制重新渲染后的AI配置:', result.data)
        }, 100)
      } else {
        console.error('服务器返回错误:', result.error)
      }
    } catch (error) {
      console.error('从服务器加载AI配置失败:', error)
    }
  }

  const handleSaveAllAIConfig = async () => {
    try {
      console.log('准备保存的AI配置:', aiConfigs)
      
      // 直接保存用户选择的配置，不做任何处理
      const response = await fetch('/api/admin/ai-config/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          configs: aiConfigs
        })
      })

      const result = await response.json()
      if (result.success) {
        alert('所有业务模块AI配置保存成功！')
        console.log('保存成功的AI配置:', result.data)
        // 更新本地存储
        localStorage.setItem('aiConfigs', JSON.stringify(result.data))
        // 重新加载配置以确保同步
        await loadCurrentAIConfigs()
      } else {
        alert(`配置保存失败：${result.message}`)
      }
    } catch (error) {
      console.error('批量保存AI配置失败:', error)
      alert('批量保存AI配置失败，请重试')
    }
  }

  const testApiKey = async (provider: string) => {
    try {
      // 获取API Key输入框的值 - 使用明确的选择器
      const apiKeyInput = document.querySelector('[data-testid="api-key-input"]') as HTMLInputElement
      
      if (!apiKeyInput || !apiKeyInput.value) {
        alert('请先输入API Key')
        return
      }

      const response = await fetch('/api/admin/providers/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey: apiKeyInput.value,
          provider: provider,
          modelId: getModelByProvider(provider)
        })
      })

      const result = await response.json()
      if (result.success) {
        alert(`${provider} API Key验证成功！`)
        // 更新已验证的模型列表（本地立即更新）
        setVerifiedModels(prev => prev.map(model => {
          if (model.provider.toLowerCase() === provider.toLowerCase() || 
              (provider === 'doubao' && model.provider === '字节跳动') ||
              (provider === 'deepseek' && model.provider === 'DeepSeek') ||
              (provider === 'openai' && model.provider === 'OpenAI') ||
              (provider === 'claude' && model.provider === 'Anthropic') ||
              (provider === 'gemini' && model.provider === 'Google')) {
            return { ...model, verified: true, status: 'verified' }
          }
          return model
        }))
        // 再以服务器为准刷新一次，确保与后端文件/环境同步
        try {
          const remote = await fetch('/api/admin/verified-models').then(r => r.json())
          if (remote?.success && Array.isArray(remote.data)) {
            setVerifiedModels(remote.data)
          }
        } catch {}
      } else {
        // 检查是否是余额不足的情况
        const isPaymentRequired = result.message.includes('余额不足') || result.message.includes('Payment Required')
        
        if (isPaymentRequired) {
          alert(`${provider} API Key有效，但${result.message}`)
          // 余额不足时标记为余额不足状态
          setVerifiedModels(prev => prev.map(model => {
            if (model.provider.toLowerCase() === provider.toLowerCase() || 
                (provider === 'doubao' && model.provider === '字节跳动') ||
                (provider === 'deepseek' && model.provider === 'DeepSeek') ||
                (provider === 'openai' && model.provider === 'OpenAI') ||
                (provider === 'claude' && model.provider === 'Anthropic') ||
                (provider === 'gemini' && model.provider === 'Google')) {
              return { ...model, verified: false, status: 'insufficient_balance' }
            }
            return model
          }))
        } else {
          alert(`${provider} API Key验证失败：${result.message}`)
          // 更新已验证的模型列表
          setVerifiedModels(prev => prev.map(model => {
            if (model.provider.toLowerCase() === provider.toLowerCase() || 
                (provider === 'doubao' && model.provider === '字节跳动') ||
                (provider === 'deepseek' && model.provider === 'DeepSeek') ||
                (provider === 'openai' && model.provider === 'OpenAI') ||
                (provider === 'claude' && model.provider === 'Anthropic') ||
                (provider === 'gemini' && model.provider === 'Google')) {
              return { ...model, verified: false, status: 'unverified' }
            }
            return model
          }))
        }
      }
    } catch (error) {
      console.error('API Key测试失败:', error)
      alert('API Key测试失败，请检查网络连接')
      updateProviderStatus(provider, false)
    }
  }

  const getPlaceholderByProvider = (provider: string) => {
    switch (provider) {
      case 'openai': return 'sk-...'
      case 'claude': return 'sk-ant-...'
      case 'gemini': return 'AI...'
      case 'deepseek': return 'sk-...'
      case 'doubao': return '33453103-f2e9-4409-b9d9-3c5ba12d8bb6'
      default: return 'API密钥'
    }
  }

  const getModelByProvider = (provider: string) => {
    switch (provider) {
      case 'openai': return 'gpt-4'
      case 'claude': return 'claude-3-sonnet-20240229'
      case 'gemini': return 'gemini-2.5-flash'
      case 'deepseek': return 'deepseek-chat'
      case 'doubao': return 'doubao-seed-1-6-lite-251015'
      default: return 'gpt-4'
    }
  }

  const updateProviderStatus = (provider: string, isValid: boolean) => {
    // 这里可以更新UI状态，显示验证结果
    console.log(`${provider} 验证状态: ${isValid ? '成功' : '失败'}`)
  }

  // Google Sheets 已废弃

  const getProviderByType = (configType: string) => {
    switch (configType) {
      case 'scriptGenerationAI': return 'claude'
      case 'promptGenerationAI': return 'openai'
      case 'rankingAI': return 'claude'
      case 'productAnalysisAI': return 'claude'
      case 'videoAnalysisAI': return 'gemini'
      default: return 'openai'
    }
  }

  const getModelByType = (configType: string) => {
    switch (configType) {
      case 'scriptGenerationAI': return 'claude-3-sonnet-20240229'
      case 'promptGenerationAI': return 'gpt-4'
      case 'rankingAI': return 'claude-3-sonnet-20240229'
      case 'productAnalysisAI': return 'claude-3-sonnet-20240229'
      case 'videoAnalysisAI': return 'gemini-1.5-pro'
      default: return 'gpt-4'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">加载中...</p>
            </div>
    </div>
  )
  }

  if (!user) {
    return null
  }

  const handleLogout = () => {
    localStorage.removeItem('user')
    router.push('/login')
  }

  const handleBackToDashboard = () => {
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
            管理员控制台
          </h1>
          <p className="text-xl text-gray-600">
              管理商品库、人设表、用户和痛点分析
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">欢迎，{user.name}</span>
            <Button variant="outline" onClick={handleBackToDashboard}>
              返回工作台
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              退出登录
            </Button>
          </div>
        </div>

        {showTaskProgress && (
          <div className="fixed bottom-6 right-6 bg-white/90 border rounded-lg shadow-lg p-4 w-80 z-50">
            <div className="text-sm font-medium mb-2">批量分析进行中</div>
            <div className="w-full bg-gray-200 rounded h-2 overflow-hidden">
              <div
                className="bg-blue-600 h-2 transition-all"
                style={{ width: `${Math.min(100, Math.round((taskProgress.completed + taskProgress.failed) / Math.max(1, taskProgress.total) * 100))}%` }}
              />
            </div>
            <div className="mt-2 text-xs text-gray-600">
              已完成 {taskProgress.completed} / {taskProgress.total}，失败 {taskProgress.failed}
            </div>
          </div>
        )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="products" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                商品库
              </TabsTrigger>
              <TabsTrigger value="personas" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                人设表
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                用户管理
            </TabsTrigger>
              <TabsTrigger value="ai-config" className="flex items-center gap-2">
                <Brain className="h-4 w-4" />
                AI配置
              </TabsTrigger>
              <TabsTrigger value="tasks" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                监控
              </TabsTrigger>
              <TabsTrigger value="prompts" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Prompt管理
              </TabsTrigger>
            </TabsList>

            <TabsContent value="products" className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold">商品库管理</h2>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={async () => {
                      console.log('🔄 手动刷新商品数据...')
                      try {
                        await loadProducts()
                        // 强制重新渲染
                        setProducts(prev => [...prev])
                        console.log('✅ 商品数据已刷新，当前商品数:', products.length)
                        alert(`刷新成功！\n当前共有 ${products.length} 个商品`)
                      } catch (error) {
                        console.error('刷新失败:', error)
                        alert('刷新失败，请重试')
                      }
                    }}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    刷新
                  </Button>
                  <Button variant="outline" onClick={() => setShowBulkUpload(true)}>
                    <Upload className="h-4 w-4 mr-2" />
                    批量上传
                  </Button>
                  <Button onClick={() => setShowProductForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    添加商品
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      if (selectedProducts.length === 0) {
                        alert('请先选择商品')
                        return
                      }
                      setShowScrapingModal(true)
                    }}
                    disabled={selectedProducts.length === 0}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    商品分析 {selectedProducts.length > 0 && `(${selectedProducts.length})`}
                  </Button>
                </div>
              </div>

              <div className="border rounded-lg">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedProducts.length === products.length && products.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedProducts(products.map(p => p.id))
                            } else {
                              setSelectedProducts([])
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">商品名称</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">类目</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">卖点</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">痛点</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">目标国家</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">目标受众</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {products.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedProducts.includes(product.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedProducts([...selectedProducts, product.id])
                              } else {
                                setSelectedProducts(selectedProducts.filter(id => id !== product.id))
                              }
                            }}
                            className="rounded border-gray-300"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <div className="font-medium text-gray-900">{product.name}</div>
                            <div className="text-sm text-gray-500">{product.description}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <Badge variant="outline" className="text-xs">{product.category}</Badge>
                            {product.subcategory && (
                              <Badge variant="secondary" className="text-xs">{product.subcategory}</Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-600">
                            {Array.isArray(product.sellingPoints) && product.sellingPoints.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {product.sellingPoints.slice(0, 3).map((sp: string, index: number) => (
                                  <Badge key={index} variant="outline" className="text-xs" title={sp}>
                                    {sp.length > 10 ? sp.substring(0, 10) + '...' : sp}
                                  </Badge>
                                ))}
                                {product.sellingPoints.length > 3 && (
                                  <Badge variant="secondary" className="text-xs">
                                    +{product.sellingPoints.length - 3}
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              '未设置'
                            )}
                          </div>
                        </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-600">
                          {Array.isArray((product as any).painPoints) && (product as any).painPoints.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {(product as any).painPoints.slice(0, 3).map((point: any, index: number) => {
                                const pointText = typeof point === 'string' ? point : (point.text || point.painPoint || JSON.stringify(point))
                                return (
                                  <Badge key={index} variant="outline" className="text-xs" title={pointText}>
                                    {pointText.length > 10 ? pointText.substring(0, 10) + '...' : pointText}
                                  </Badge>
                                )
                              })}
                              {(product as any).painPoints.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{(product as any).painPoints.length - 3}
                                </Badge>
                              )}
                            </div>
                          ) : (
                            '未设置'
                          )}
                        </div>
                      </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {product.targetCountries.map((country) => (
                              <Badge key={country} variant="outline" className="text-xs">{country}</Badge>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-600">
                            {Array.isArray((product as any).targetAudience) && (product as any).targetAudience.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {(product as any).targetAudience.slice(0, 3).map((audience: string, index: number) => (
                                  <Badge key={index} variant="outline" className="text-xs" title={audience}>
                                    {audience.length > 10 ? audience.substring(0, 10) + '...' : audience}
                                  </Badge>
                                ))}
                                {(product as any).targetAudience.length > 3 && (
                                  <Badge variant="secondary" className="text-xs">
                                    +{(product as any).targetAudience.length - 3}
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              '未设置'
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleEditProduct(product)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleDeleteProduct(product.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            {/* 监控页签：包含 任务监控 / 预估模型监控 / 预估模型测试 */}
            <TabsContent value="tasks">
              <TaskManagement RecommendationMonitorComponent={RecommendationMonitor} />
            </TabsContent>

            <TabsContent value="personas">
              <PersonaManagement
                personas={personas}
                onAdd={() => {
                  setEditingPersona(null)
                  setShowPersonaForm(true)
                }}
                onEdit={handleEditPersona}
                onDelete={handleDeletePersona}
                onRefresh={loadPersonas}
              />
            </TabsContent>

          <TabsContent value="users">
            <UserManagement
              users={users}
              onAdd={() => {
                setEditingUser(null)
                setShowUserForm(true)
              }}
              onEdit={handleEditUser}
              onDelete={handleDeleteUser}
            />
          </TabsContent>




            <TabsContent value="ai-config" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold">AI配置管理</h2>
                <div className="flex items-center gap-4">
                  <p className="text-sm text-gray-600">管理AI服务API Key，并在各业务模块中选择使用</p>
                  {/* Prompt调优功能已迁移到"Prompt管理" Tab */}
                  {/* <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowPromptTuningModal(true)}
                    className="flex items-center gap-2"
                  >
                    <Settings className="h-4 w-4" />
                    Prompt调优
                  </Button> */}
                </div>
              </div>

              {/* AI API Key管理 */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-6 bg-green-500 rounded"></div>
                  <h3 className="text-lg font-semibold">🔑 AI API Key管理</h3>
                </div>
                
                {/* 添加新的AI服务 */}
                <Card className="ml-4">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">添加AI服务</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* 旧业务模块AI选择（恢复可见，便于添加AI服务） */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">AI服务类型</Label>
                        <Select defaultValue="" onValueChange={(value) => {
                          // 存储选择的值到全局变量
                          (window as any).selectedAIService = value
                        }}>
                          <SelectTrigger className="h-8 text-xs" data-testid="ai-service-select">
                            <SelectValue placeholder="选择AI服务商" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="openai">OpenAI (GPT-4, GPT-3.5)</SelectItem>
                            <SelectItem value="claude">Anthropic Claude</SelectItem>
                            <SelectItem value="gemini">Google Gemini</SelectItem>
                            <SelectItem value="deepseek">DeepSeek</SelectItem>
                            <SelectItem value="doubao">豆包 (字节跳动)</SelectItem>
                            <SelectItem value="qwen">通义千问 (阿里云)</SelectItem>
                            <SelectItem value="baichuan">百川智能</SelectItem>
                            <SelectItem value="zhipu">智谱AI (GLM)</SelectItem>
                            <SelectItem value="custom">自定义服务</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">模型名称</Label>
                        <Input
                          placeholder="如: gpt-4, claude-3-sonnet"
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">API Key</Label>
                        <Input
                          type="password"
                          placeholder="输入API密钥"
                          className="h-8 text-xs"
                          data-testid="api-key-input"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Base URL (可选)</Label>
                        <Input
                          placeholder="https://api.openai.com/v1"
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        className="h-8 text-xs"
                        onClick={() => {
                          // 从全局变量获取选择的服务
                          const selectedService = (window as any).selectedAIService
                          if (selectedService) {
                            testApiKey(selectedService)
                          } else {
                            alert('请先选择AI服务类型')
                          }
                        }}
                      >
                        验证API Key
                      </Button>
                      
                    </div>
                  </CardContent>
                </Card>

                {/* Google Sheets OAuth配置 - 已移除 */}
                {false && (
                <Card className="ml-4">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Google Sheets OAuth 2.0 配置</CardTitle>
                    <p className="text-xs text-gray-500">配置Google Sheets API的OAuth 2.0认证</p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 hidden">
                      <div>
                        <Label className="text-xs">Client ID</Label>
                        <Input
                          placeholder="your-client-id.googleusercontent.com"
                          className="h-8 text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Client Secret</Label>
                        <Input
                          type="password"
                          placeholder="GOCSPX-..."
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Redirect URI (复制到Google Console)</Label>
                        <div className="flex gap-1 mt-1">
                          <Input
                            value={typeof window !== 'undefined' ? `${window.location.origin}/api/auth/google/callback` : ''}
                            readOnly
                            className="h-8 text-xs bg-gray-50"
                          />
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-8 text-xs px-2"
                            onClick={() => {
                              const uri = typeof window !== 'undefined' ? `${window.location.origin}/api/auth/google/callback` : ''
                              if (uri) navigator.clipboard.writeText(uri)
                              alert('Redirect URI已复制到剪贴板')
                            }}
                          >
                            复制
                          </Button>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs">Sheets ID</Label>
                        <Input
                          placeholder="1q_ZqVw4DVRbcAA78ZVndXq4XcFEySNmRoLHiFkllFls"
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">授权范围 (Scopes)</Label>
                      <Input
                        placeholder="https://www.googleapis.com/auth/spreadsheets.readonly"
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="flex gap-2"></div>
                    <div className="text-xs text-gray-500">
                      <p>配置步骤：</p>
                      <ol className="list-decimal list-inside space-y-1 mt-1">
                        <li>在Google Cloud Console创建项目</li>
                        <li>启用Google Sheets API</li>
                        <li>创建OAuth 2.0客户端ID</li>
                        <li>在"授权重定向URI"中添加：<code className="bg-gray-100 px-1 rounded">{typeof window !== 'undefined' ? `${window.location.origin}/api/auth/google/callback` : '/api/auth/google/callback (请在实际域名下复制上方值)'}</code></li>
                        <li>获取Client ID和Client Secret填入上方表单</li>
                        <li>点击"启动OAuth授权"完成认证</li>
                      </ol>
                    </div>
                  </CardContent>
                </Card>
                )}

                {/* 已验证的AI模型列表 */}
                <div className="ml-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium">AI模型状态</h4>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="h-7 text-xs"
                      onClick={async () => {
                        try {
                          // 默认仅同步已验证的provider
                          const res = await fetch('/api/admin/ai-config/sync', { 
                            method: 'POST', 
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({})
                          })
                          const data = await res.json()
                          if (data.success) {
                            alert('已从已验证的Provider同步模型到候选库')
                          } else {
                            alert(`同步失败: ${data.error || '未知错误'}`)
                          }
                        } catch (e: any) {
                          alert(`同步失败: ${e?.message || e}`)
                        }
                      }}
                    >
                      同步模型到候选库
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {verifiedModels.map(model => {
                      const getStatusInfo = (status: string) => {
                        switch (status) {
                          case 'verified':
                            return { text: '已验证', variant: 'default', color: 'bg-green-500', bg: 'bg-green-50' }
                          case 'insufficient_balance':
                            return { text: '余额不足', variant: 'destructive', color: 'bg-orange-500', bg: 'bg-orange-50' }
                          case 'unverified':
                          default:
                            return { text: '未验证', variant: 'secondary', color: 'bg-gray-500', bg: 'bg-gray-50' }
                        }
                      }
                      
                      const statusInfo = getStatusInfo(model.status)
                      
                      return (
                        <div key={model.id} className={`flex items-center justify-between p-2 rounded border ${statusInfo.bg}`}>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant={statusInfo.variant as any} 
                              className={`text-xs ${statusInfo.color}`}
                            >
                              {statusInfo.text}
                            </Badge>
                            <span className="text-sm">{model.name}</span>
                            <span className="text-xs text-gray-500">{model.provider}</span>
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-6 text-xs"
                            onClick={() => {
                              if (!confirm(`确定删除 ${model.name} (${model.provider}) 吗？`)) return
                              setVerifiedModels(prev => prev.filter(m => m.id !== model.id))
                            }}
                          >
                            删除
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* 独立的视频生成配置（从业务模块中拆出，始终显示） */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-6 bg-blue-500 rounded"></div>
                  <h3 className="text-lg font-semibold">🎬 视频生成配置</h3>
                </div>
                
                <Card className="ml-4">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">视频生成配置</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* 视频生成配置 */}
                    <div className="border rounded p-3 bg-gray-50">
                      <div className="flex items-center gap-2 mb-2">
                        <Video className="h-4 w-4 text-red-500" />
                        <Label className="text-xs font-medium">视频生成配置（Provider / Model / Base URL）</Label>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Provider</Label>
                          <Input
                            placeholder="sora / doubao / veo"
                            value={aiConfigs.videoGeneration?.provider || ''}
                            onChange={(e) => setAiConfigs(prev => ({
                              ...prev,
                              videoGeneration: { ...(prev.videoGeneration || {}), provider: e.target.value }
                            }))}
                            className="h-8 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Model Name</Label>
                          <Select
                            value={aiConfigs.videoGeneration?.modelName || ''}
                            onValueChange={(value) => {
                              const matched = verifiedModels.find(m => m.id === value)
                              const providerFromModel = matched ? (matched.provider.toLowerCase().includes('字节') ? 'doubao' : matched.provider.toLowerCase()) : ''
                              setAiConfigs(prev => {
                                const existingProviderCfg = (prev.providers as any)?.[providerFromModel] || {}
                                return {
                                  ...prev,
                                  videoGeneration: {
                                    ...(prev.videoGeneration || {}),
                                    modelName: value,
                                    provider: providerFromModel,
                                    baseUrl: existingProviderCfg.baseUrl ?? prev.videoGeneration?.baseUrl ?? '',
                                  }
                                }
                              })
                              if (!matched || matched.status !== 'verified') {
                                alert('该模型尚未验证，请先在模型列表或提供商配置中完成验证')
                              }
                            }}
                          >
                            <SelectTrigger className="h-8 text-xs mt-1">
                              <SelectValue placeholder="选择一个已接入的视频模型或使用自定义" />
                            </SelectTrigger>
                            <SelectContent>
                              {verifiedModels.map(model => (
                                <SelectItem key={model.id} value={model.id} disabled={model.status !== 'verified'}>
                                  {model.name} ({model.provider}) {model.status !== 'verified' ? ' - 未验证' : ''}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <p className="text-[10px] text-gray-500 mt-1">提示：模型列表来自“AI模型状态”。未验证模型会置灰，请先验证。</p>
                        </div>
                        <div>
                          <Label className="text-xs">Base URL</Label>
                          <Input
                            placeholder="https://api.provider.example.com"
                            value={aiConfigs.videoGeneration?.baseUrl || ''}
                            onChange={(e) => setAiConfigs(prev => ({
                              ...prev,
                              videoGeneration: { ...(prev.videoGeneration || {}), baseUrl: e.target.value }
                            }))}
                            className="h-8 text-xs"
                          />
                          <p className="text-[10px] text-gray-500 mt-1">到供应商控制台/API文档查找“视频生成”专用 Base URL。</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                        <div>
                          <Label className="text-xs">默认宽高比</Label>
                          <Input
                            placeholder="9:16"
                            value={aiConfigs.videoGeneration?.defaults?.aspectRatio || ''}
                            onChange={(e) => setAiConfigs(prev => ({
                              ...prev,
                              videoGeneration: { ...(prev.videoGeneration || {}), defaults: { ...(prev.videoGeneration?.defaults || {}), aspectRatio: e.target.value } }
                            }))}
                            className="h-8 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">默认 FPS</Label>
                          <Input
                            placeholder="30"
                            value={aiConfigs.videoGeneration?.defaults?.fps?.toString() || ''}
                            onChange={(e) => setAiConfigs(prev => ({
                              ...prev,
                              videoGeneration: { ...(prev.videoGeneration || {}), defaults: { ...(prev.videoGeneration?.defaults || {}), fps: Number(e.target.value || 0) } }
                            }))}
                            className="h-8 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Webhook 回调URL</Label>
                          <Input
                            placeholder="https://yourapp.com/api/webhooks/video"
                            value={aiConfigs.videoGeneration?.defaults?.webhookUrl || ''}
                            onChange={(e) => setAiConfigs(prev => ({
                              ...prev,
                              videoGeneration: { ...(prev.videoGeneration || {}), defaults: { ...(prev.videoGeneration?.defaults || {}), webhookUrl: e.target.value } }
                            }))}
                            className="h-8 text-xs"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end mt-2">
                        <Button size="sm" className="h-7 text-xs px-4" onClick={verifyVideoConfig}>
                          验证视频配置
                        </Button>
                      </div>
                    </div>
                    {/* 已验证视频模型列表（从 providers 中读取） */}
                    <div className="mt-2">
                      <Label className="text-xs">已验证模型</Label>
                      <div className="mt-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                        {Object.entries((aiConfigs.providers || {}) as Record<string, any>)
                          .filter(([_, v]) => v?.verified)
                          .map(([prov, v]) => (
                            <div key={prov} className="text-xs p-2 border rounded bg-white flex items-center justify-between">
                              <span>{prov} {v?.modelName ? `- ${v.modelName}` : ''}</span>
                              <span className="text-gray-500">{v?.baseUrl || ''}</span>
                            </div>
                          ))}
                        {(!aiConfigs.providers || Object.values(aiConfigs.providers).filter((v: any) => v?.verified).length === 0) && (
                          <div className="text-xs text-gray-500">暂无</div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 业务模块AI配置（已由推荐引擎接管，不再展示旧选择项） */}
              {false && (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-6 bg-blue-500 rounded"></div>
                  <h3 className="text-lg font-semibold">🎬 业务模块AI配置</h3>
                </div>
                
                <Card className="ml-4">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">视频生成配置</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* 视频生成配置 */}
                    <div className="border rounded p-3 bg-gray-50">
                      <div className="flex items-center gap-2 mb-2">
                        <Video className="h-4 w-4 text-red-500" />
                        <Label className="text-xs font-medium">视频生成配置（Provider / Model / Base URL / API Key）</Label>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Provider</Label>
                          <Input
                            placeholder="sora / doubao / veo"
                            value={aiConfigs.videoGeneration?.provider || ''}
                            onChange={(e) => setAiConfigs(prev => ({
                              ...prev,
                              videoGeneration: { ...(prev.videoGeneration || {}), provider: e.target.value }
                            }))}
                            className="h-8 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Model Name</Label>
                          <Select
                            value={aiConfigs.videoGeneration?.modelName || ''}
                            onValueChange={(value) => {
                              const matched = verifiedModels.find(m => m.id === value)
                              const providerFromModel = matched ? (matched.provider.toLowerCase().includes('字节') ? 'doubao' : matched.provider.toLowerCase()) : ''
                              setAiConfigs(prev => {
                                const existingProviderCfg = (prev.providers as any)?.[providerFromModel] || {}
                                return {
                                  ...prev,
                                  videoGeneration: {
                                    ...(prev.videoGeneration || {}),
                                    modelName: value,
                                    // 始终用模型推断的 provider 覆盖，确保联动
                                    provider: providerFromModel,
                                    // 若该 provider 有已保存配置，自动填充 baseUrl/apiKey
                                    baseUrl: existingProviderCfg.baseUrl ?? prev.videoGeneration?.baseUrl ?? '',
                                    apiKey: existingProviderCfg.apiKey ?? prev.videoGeneration?.apiKey ?? '',
                                  }
                                }
                              })
                              if (!matched || matched.status !== 'verified') {
                                alert('该模型尚未验证，请先在模型列表或提供商配置中完成验证')
                              }
                            }}
                          >
                            <SelectTrigger className="h-8 text-xs mt-1">
                              <SelectValue placeholder="选择一个已接入的视频模型或使用自定义" />
                            </SelectTrigger>
                            <SelectContent>
                              {verifiedModels.map(model => (
                                <SelectItem key={model.id} value={model.id} disabled={model.status !== 'verified'}>
                                  {model.name} ({model.provider}) {model.status !== 'verified' ? ' - 未验证' : ''}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <p className="text-[10px] text-gray-500 mt-1">提示：模型列表来自“AI模型状态”。未验证模型会置灰，请先验证 API Key/余额。</p>
                        </div>
                        <div>
                          <Label className="text-xs">Base URL</Label>
                          <Input
                            placeholder="https://api.provider.example.com"
                            value={aiConfigs.videoGeneration?.baseUrl || ''}
                            onChange={(e) => setAiConfigs(prev => ({
                              ...prev,
                              videoGeneration: { ...(prev.videoGeneration || {}), baseUrl: e.target.value }
                            }))}
                            className="h-8 text-xs"
                          />
                          <p className="text-[10px] text-gray-500 mt-1">到供应商控制台/API文档查找“视频生成”专用 Base URL（通常与聊天/文本不同）。</p>
                        </div>
                        {/* API Key 不再在此处填写；使用已验证的供应商配置/环境变量 */}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                        <div>
                          <Label className="text-xs">默认宽高比</Label>
                          <Input
                            placeholder="9:16"
                            value={aiConfigs.videoGeneration?.defaults?.aspectRatio || ''}
                            onChange={(e) => setAiConfigs(prev => ({
                              ...prev,
                              videoGeneration: { ...(prev.videoGeneration || {}), defaults: { ...(prev.videoGeneration?.defaults || {}), aspectRatio: e.target.value } }
                            }))}
                            className="h-8 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">默认 FPS</Label>
                          <Input
                            placeholder="30"
                            value={aiConfigs.videoGeneration?.defaults?.fps?.toString() || ''}
                            onChange={(e) => setAiConfigs(prev => ({
                              ...prev,
                              videoGeneration: { ...(prev.videoGeneration || {}), defaults: { ...(prev.videoGeneration?.defaults || {}), fps: Number(e.target.value || 0) } }
                            }))}
                            className="h-8 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Webhook 回调URL</Label>
                          <Input
                            placeholder="https://yourapp.com/api/webhooks/video"
                            value={aiConfigs.videoGeneration?.defaults?.webhookUrl || ''}
                            onChange={(e) => setAiConfigs(prev => ({
                              ...prev,
                              videoGeneration: { ...(prev.videoGeneration || {}), defaults: { ...(prev.videoGeneration?.defaults || {}), webhookUrl: e.target.value } }
                            }))}
                            className="h-8 text-xs"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* 视频脚本生成 */}
                      <div className="flex items-center gap-3">
                        <MessageSquare className="h-4 w-4 text-blue-500" />
                        <div className="flex-1">
                          <Label className="text-xs font-medium">视频脚本生成</Label>
                          <Select 
                            value={aiConfigs.videoScriptGeneration}
                            onValueChange={(value) => setAiConfigs(prev => ({ ...prev, videoScriptGeneration: value }))}
                          >
                            <SelectTrigger className="h-7 text-xs mt-1">
                              <SelectValue placeholder="选择AI服务" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="auto">🤖 自动选择 (基于历史表现)</SelectItem>
                              {verifiedModels
                                .filter(model => model.status === 'verified')
                                .map(model => (
                                  <SelectItem 
                                    key={model.id} 
                                    value={model.id}
                                  >
                                    {model.name} ({model.provider}) (已验证)
                                  </SelectItem>
                                ))}
                              {verifiedModels
                                .filter(model => model.status === 'insufficient_balance')
                                .map(model => (
                                  <SelectItem 
                                    key={model.id} 
                                    value={model.id}
                                    disabled={true}
                                  >
                                    {model.name} ({model.provider}) (余额不足)
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Prompt生成 */}
                      <div className="flex items-center gap-3">
                        <Brain className="h-4 w-4 text-purple-500" />
                        <div className="flex-1">
                          <Label className="text-xs font-medium">Prompt生成</Label>
                          <Select 
                            value={aiConfigs.promptGeneration}
                            onValueChange={(value) => setAiConfigs(prev => ({ ...prev, promptGeneration: value }))}
                          >
                            <SelectTrigger className="h-7 text-xs mt-1">
                              <SelectValue placeholder="选择AI服务" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="auto">🤖 自动选择 (基于历史表现)</SelectItem>
                              {verifiedModels
                                .filter(model => model.status === 'verified')
                                .map(model => (
                                  <SelectItem 
                                    key={model.id} 
                                    value={model.id}
                                  >
                                    {model.name} ({model.provider}) (已验证)
                                  </SelectItem>
                                ))}
                              {verifiedModels
                                .filter(model => model.status === 'insufficient_balance')
                                .map(model => (
                                  <SelectItem 
                                    key={model.id} 
                                    value={model.id}
                                    disabled={true}
                                  >
                                    {model.name} ({model.provider}) (余额不足)
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* 视频排序算法 */}
                      <div className="flex items-center gap-3">
                        <BarChart3 className="h-4 w-4 text-green-500" />
                        <div className="flex-1">
                          <Label className="text-xs font-medium">视频排序算法</Label>
                          <Select 
                            value={aiConfigs.videoRanking}
                            onValueChange={(value) => setAiConfigs(prev => ({ ...prev, videoRanking: value }))}
                          >
                            <SelectTrigger className="h-7 text-xs mt-1">
                              <SelectValue placeholder="选择AI服务" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="auto">🤖 自动选择 (基于历史表现)</SelectItem>
                              {verifiedModels
                                .filter(model => model.status === 'verified')
                                .map(model => (
                                  <SelectItem 
                                    key={model.id} 
                                    value={model.id}
                                  >
                                    {model.name} ({model.provider}) (已验证)
                                  </SelectItem>
                                ))}
                              {verifiedModels
                                .filter(model => model.status === 'insufficient_balance')
                                .map(model => (
                                  <SelectItem 
                                    key={model.id} 
                                    value={model.id}
                                    disabled={true}
                                  >
                                    {model.name} ({model.provider}) (余额不足)
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* 竞品分析 */}
                      <div className="flex items-center gap-3">
                        <Search className="h-4 w-4 text-orange-500" />
                        <div className="flex-1">
                          <Label className="text-xs font-medium">商品分析</Label>
                          <Select 
                            value={aiConfigs.productAnalysis}
                            onValueChange={(value) => setAiConfigs(prev => ({ ...prev, productAnalysis: value }))}
                          >
                            <SelectTrigger className="h-7 text-xs mt-1">
                              <SelectValue placeholder="选择AI服务" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="auto">🤖 自动选择 (基于历史表现)</SelectItem>
                              {verifiedModels
                                .filter(model => model.status === 'verified')
                                .map(model => (
                                  <SelectItem 
                                    key={model.id} 
                                    value={model.id}
                                  >
                                    {model.name} ({model.provider}) (已验证)
                                  </SelectItem>
                                ))}
                              {verifiedModels
                                .filter(model => model.status === 'insufficient_balance')
                                .map(model => (
                                  <SelectItem 
                                    key={model.id} 
                                    value={model.id}
                                    disabled={true}
                                  >
                                    {model.name} ({model.provider}) (余额不足)
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* 视频内容分析 */}
                      <div className="flex items-center gap-3">
                        <Video className="h-4 w-4 text-red-500" />
                        <div className="flex-1">
                          <Label className="text-xs font-medium">视频内容分析</Label>
                          <Select 
                            value={aiConfigs.videoAnalysis}
                            onValueChange={(value) => setAiConfigs(prev => ({ ...prev, videoAnalysis: value }))}
                          >
                            <SelectTrigger className="h-7 text-xs mt-1">
                              <SelectValue placeholder="选择AI服务" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="auto">🤖 自动选择 (基于历史表现)</SelectItem>
                              {verifiedModels
                                .filter(model => model.status === 'verified')
                                .map(model => (
                                  <SelectItem 
                                    key={model.id} 
                                    value={model.id}
                                  >
                                    {model.name} ({model.provider}) (已验证)
                                  </SelectItem>
                                ))}
                              {verifiedModels
                                .filter(model => model.status === 'insufficient_balance')
                                .map(model => (
                                  <SelectItem 
                                    key={model.id} 
                                    value={model.id}
                                    disabled={true}
                                  >
                                    {model.name} ({model.provider}) (余额不足)
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* 用户痛点分析 - 固定使用Gemini（已隐藏） */}
                      <div className="flex items-center gap-3 hidden">
                        <FileText className="h-4 w-4 text-indigo-500" />
                        <div className="flex-1">
                          <Label className="text-xs font-medium">
                            用户痛点分析 
                            <span className="ml-2 text-xs text-gray-500">(固定使用Gemini + Google Search)</span>
                          </Label>
                          <div className="mt-1 p-2 bg-blue-50 border border-blue-200 rounded-md">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-blue-700">🌐 Gemini 2.5 Flash (Google)</span>
                              <span className="text-xs text-blue-600">内置实时搜索</span>
                            </div>
                            <p className="text-xs text-gray-600 mt-1">
                              💡 痛点分析需要实时搜索功能，只有Gemini内置了免费的Google Search，因此固定使用此模型。
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-end pt-2 border-t">
                      <Button 
                        size="sm" 
                        className="h-7 text-xs px-4"
                        onClick={handleSaveAllAIConfig}
                      >
                        保存所有配置
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
              )}
            </TabsContent>


            {/* Prompt管理 Tab */}
            <TabsContent value="prompts" className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold">Prompt模板管理</h2>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={async () => {
                      try {
                        const res = await fetch('/api/admin/prompts/init-defaults', {
                          method: 'POST'
                        });
                        const result = await res.json();
                        if (result.success) {
                          alert(`成功初始化 ${result.data.filter((r: any) => r.status === 'created').length} 个默认模板`);
                          loadPromptTemplates();
                        } else {
                          alert(`初始化失败: ${result.error}`);
                        }
                      } catch (error: any) {
                        alert(`初始化失败: ${error.message}`);
                      }
                    }}
                  >
                    <Database className="h-4 w-4 mr-2" />
                    初始化默认模板
                  </Button>
                  <Button onClick={() => {
                    setSelectedPrompt(null);
                    setShowPromptModal(true);
                  }}>
                    <Plus className="h-4 w-4 mr-2" />
                    新建Prompt
                  </Button>
                </div>
              </div>

              {/* 业务模块筛选 */}
              <div className="flex gap-4 items-center mb-6">
                <Label>业务模块:</Label>
                <Select 
                  value={currentBusinessModule} 
                  onValueChange={(val) => {
                    setCurrentBusinessModule(val);
                    loadPromptTemplates(val);
                    if (val !== 'all') {
                      loadThreeStageConfig(val);
                    }
                  }}
                >
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="全部模块" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部模块</SelectItem>
                    <SelectItem value="product-analysis">商品分析</SelectItem>
                    <SelectItem value="persona.generate">人设生成</SelectItem>
                    <SelectItem value="video-script">视频脚本生成</SelectItem>
                    <SelectItem value="ai-reverse-engineer">AI反推</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 业务模块概览 - 当选择全选时显示 */}
              {currentBusinessModule === 'all' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">业务模块概览</h3>
                    <p className="text-sm text-gray-600">点击模块卡片查看具体模版</p>
                  </div>
                  <BusinessModuleOverview 
                    moduleTemplateCounts={moduleTemplateCounts}
                    onModuleSelect={(module) => {
                      setCurrentBusinessModule(module);
                      loadPromptTemplates(module);
                      loadThreeStageConfig(module);
                    }}
                  />
                </div>
              )}

              {/* Prompt三段式结构展示和AI反推 */}
              {currentBusinessModule !== 'all' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                  {/* 左侧：三段式结构 */}
                  <div className="lg:col-span-2">
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle>Prompt三段式结构</CardTitle>
                            <CardDescription>当前业务模块: {currentBusinessModule}</CardDescription>
                          </div>
                          <Button 
                            size="sm"
                            variant={showThreeStageEditor ? "default" : "outline"}
                            onClick={() => setShowThreeStageEditor(!showThreeStageEditor)}
                          >
                            {showThreeStageEditor ? '保存' : '编辑'}
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-3 gap-4">
                          {/* 输入要求 */}
                          <div className="space-y-2">
                            <h4 className="font-medium text-sm">输入要求</h4>
                            {showThreeStageEditor ? (
                              <div className="space-y-2">
                                <div className="space-y-2">
                                  <Label className="text-xs text-gray-600">选择输入字段：</Label>
                                  <div className="grid grid-cols-2 gap-2">
                                    {getInputFieldsForModule(currentBusinessModule).map(field => (
                                      <label key={field.key} className="flex items-center space-x-2 text-xs">
                                        <input
                                          type="checkbox"
                                          checked={selectedInputFields.includes(field.key)}
                                          onChange={(e) => {
                                            if (e.target.checked) {
                                              setSelectedInputFields([...selectedInputFields, field.key])
                                            } else {
                                              setSelectedInputFields(selectedInputFields.filter(f => f !== field.key))
                                            }
                                          }}
                                          className="rounded"
                                        />
                                        <span className={field.required ? 'font-medium' : ''}>
                                          {field.label}
                                          {field.required && <span className="text-red-500 ml-1">*</span>}
                                        </span>
                                      </label>
                                    ))}
                                  </div>
                                </div>
                                <Textarea
                                  value={threeStageConfig.inputRequirements}
                                  onChange={(e) => setThreeStageConfig({
                                    ...threeStageConfig,
                                    inputRequirements: e.target.value
                                  })}
                                  rows={3}
                                  className="text-sm"
                                  placeholder="输入要求描述..."
                                />
                                <div className="text-xs text-gray-500">
                                  定义输入变量，必须符合目标业务模块的标准
                                </div>
                              </div>
                            ) : (
                              <div className="p-3 bg-gray-50 rounded-lg text-sm">
                                <div className="whitespace-pre-line">{threeStageConfig.inputRequirements}</div>
                              </div>
                            )}
                          </div>

                          {/* 输出要求 */}
                          <div className="space-y-2">
                            <h4 className="font-medium text-sm">输出要求</h4>
                            {showThreeStageEditor ? (
                              <div className="space-y-2">
                                <Textarea
                                  value={threeStageConfig.outputRequirements}
                                  onChange={(e) => setThreeStageConfig({
                                    ...threeStageConfig,
                                    outputRequirements: e.target.value
                                  })}
                                  rows={4}
                                  className="text-sm"
                                  placeholder="输出要求描述..."
                                />
                                <div className="text-xs text-gray-500">
                                  定义输出格式，必须符合目标业务模块的标准
                                </div>
                              </div>
                            ) : (
                              <div className="p-3 bg-gray-50 rounded-lg text-sm">
                                <div className="whitespace-pre-line">{threeStageConfig.outputRequirements}</div>
                              </div>
                            )}
                          </div>

                          {/* 输出规则 */}
                          <div className="space-y-2">
                            <h4 className="font-medium text-sm">输出规则</h4>
                            {showThreeStageEditor ? (
                              <div className="space-y-2">
                                <Textarea
                                  value={threeStageConfig.outputRules}
                                  onChange={(e) => setThreeStageConfig({
                                    ...threeStageConfig,
                                    outputRules: e.target.value
                                  })}
                                  rows={4}
                                  className="text-sm"
                                  placeholder="输出规则描述..."
                                />
                                <div className="text-xs text-gray-500">
                                  定义AI角色和风格，这是模板的主要区别点
                                </div>
                              </div>
                            ) : (
                              <div className="p-3 bg-gray-50 rounded-lg text-sm">
                                <div className="whitespace-pre-line">{threeStageConfig.outputRules}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* 右侧：AI反推 */}
                  <div className="lg:col-span-1">
                    <Card className="h-full">
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span>AI反推</span>
                          <Button 
                            size="sm"
                            variant={showAIReverseEngineer ? "default" : "outline"}
                            onClick={() => setShowAIReverseEngineer(!showAIReverseEngineer)}
                          >
                            {showAIReverseEngineer ? '收起' : '展开'}
                          </Button>
                        </CardTitle>
                        <CardDescription>根据参考实例生成Prompt模板</CardDescription>
                      </CardHeader>
                      {showAIReverseEngineer && (
                        <CardContent>
                          <AIReverseEngineer 
                            businessModule={currentBusinessModule}
                            onSuccess={(result) => {
                              console.log('AI反推成功:', result);
                              loadPromptTemplates(currentBusinessModule);
                            }}
                          />
                        </CardContent>
                      )}
                    </Card>
                  </div>
                </div>
              )}

              {/* Prompt列表 - 紧凑表格样式 - 只在非全选时显示 */}
              {currentBusinessModule !== 'all' && (
              <Card>
                <CardContent className="p-0">
                  {promptTemplates.length === 0 ? (
                    <div className="py-8 text-center text-gray-500">
                      <p>暂无Prompt模板，请先初始化默认模板或手动创建</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {promptTemplates.map((prompt: any) => {
                        const isExpanded = expandedPromptId === prompt.id;
                        
                        return (
                          <div key={prompt.id} className={`${!prompt.isActive ? 'opacity-50 bg-gray-50' : ''}`}>
                            {/* 一行显示主要信息 */}
                            <div 
                              className="flex items-center gap-4 p-4 hover:bg-gray-50 cursor-pointer"
                              onClick={() => setExpandedPromptId(isExpanded ? null : prompt.id)}
                            >
                              {/* 展开/收起图标 */}
                              <div className="flex-shrink-0">
                                <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                              </div>
                              
                              {/* 名称和标签 */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm truncate">{prompt.name}</span>
                                  {prompt.isDefault && <Badge variant="default" className="text-xs">默认</Badge>}
                                  {!prompt.isActive && <Badge variant="secondary" className="text-xs">已禁用</Badge>}
                                </div>
                                <p className="text-xs text-gray-500 truncate mt-0.5">{prompt.description || '暂无描述'}</p>
                              </div>

                              {/* 性能指标 */}
                              <div className="hidden md:flex items-center gap-6 text-xs text-gray-600">
                                <div className="text-center">
                                  <div className="text-gray-400">性能</div>
                                  <div className="font-medium">
                                    {prompt.performance !== null && prompt.performance !== undefined ? (prompt.performance * 100).toFixed(0) + '%' : '-'}
                                  </div>
                                </div>
                                <div className="text-center">
                                  <div className="text-gray-400">使用</div>
                                  <div className="font-medium">{prompt.usageCount || 0}</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-gray-400">成功率</div>
                                  <div className="font-medium">
                                    {prompt.successRate !== null && prompt.successRate !== undefined ? (prompt.successRate * 100).toFixed(0) + '%' : '-'}
                                  </div>
                                </div>
                              </div>

                              {/* 操作按钮 */}
                              <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() => {
                                    setSelectedPrompt(prompt);
                                    setShowPromptModal(true);
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                  onClick={async () => {
                                    if (!confirm('确定要删除这个Prompt模板吗？')) return;
                                    try {
                                      const res = await fetch(`/api/admin/prompts?id=${prompt.id}`, {
                                        method: 'DELETE'
                                      });
                                      const result = await res.json();
                                      if (result.success) {
                                        alert('删除成功');
                                        loadPromptTemplates(currentBusinessModule);
                                      } else {
                                        alert(`删除失败: ${result.error}`);
                                      }
                                    } catch (error: any) {
                                      alert(`删除失败: ${error.message}`);
                                    }
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>

                            {/* 展开后显示详细内容 */}
                            {isExpanded && (
                              <div className="px-4 pb-4 space-y-3 bg-gray-50 border-t">
                                {/* 变量列表 */}
                                {prompt.variables && (
                                  <div>
                                    <Label className="text-xs text-gray-500">变量:</Label>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {(typeof prompt.variables === 'string' ? JSON.parse(prompt.variables) : prompt.variables).map((v: string) => (
                                        <Badge key={v} variant="outline" className="text-xs">{v}</Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* 完整模板内容 */}
                                <div>
                                  <Label className="text-xs text-gray-500">Prompt内容:</Label>
                                  <pre className="text-xs bg-white p-3 rounded mt-1 whitespace-pre-wrap max-h-96 overflow-y-auto border">
                                    {prompt.content}
                                  </pre>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
              )}
            </TabsContent>
        </Tabs>

        {/* 用户表单弹窗 */}
        {showUserForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-lg">
                  <CardHeader>
                <CardTitle>{editingUser ? '编辑用户' : '添加用户'}</CardTitle>
                <CardDescription>
                  {editingUser ? '修改用户信息' : '创建新的用户账号'}
                </CardDescription>
                  </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>邮箱地址 *</Label>
                  <Input 
                    placeholder="user@example.com"
                    value={editingUser?.email || ''}
                    onChange={(e) => setEditingUser({...(editingUser || {}), email: e.target.value} as User)}
                  />
                </div>
                <div>
                  <Label>姓名 *</Label>
                  <Input 
                    placeholder="用户姓名"
                    value={editingUser?.name || ''}
                    onChange={(e) => setEditingUser({...(editingUser || {}), name: e.target.value} as User)}
                  />
                </div>
                <div>
                  <Label>密码 *</Label>
                  <Input 
                    type="password"
                    placeholder="设置密码"
                    onChange={(e) => setEditingUser({...(editingUser || {}), password: e.target.value} as User)}
                  />
                </div>
                <div>
                  <Label>角色 *</Label>
                  <Select 
                    value={editingUser?.role || 'operator'}
                    onValueChange={(value) => setEditingUser({...(editingUser || {}), role: value} as User)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择用户角色" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">管理员</SelectItem>
                      <SelectItem value="operator">运营</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-900">
                    <strong>角色说明：</strong>
                    <br />• 管理员：最高权限，可管理所有功能，包括用户管理、商品管理、人设管理等
                    <br />• 运营：操作权限，可执行具体任务，包括视频生成、数据分析等
                  </p>
                    </div>
                  </CardContent>
              <div className="flex justify-end gap-2 p-6 pt-0">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowUserForm(false)
                    setEditingUser(null)
                  }}
                >
                  取消
                </Button>
                <Button 
                  onClick={async () => {
                    if (!editingUser?.email || !editingUser?.name) {
                      alert('请填写邮箱和姓名')
                      return
                    }
                    
                    if (editingUser.id) {
                      // 编辑用户逻辑
                      try {
                        const response = await fetch(`/api/admin/users/${editingUser.id}`, {
                          method: 'PUT',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({
                            name: editingUser.name,
                            email: editingUser.email,
                            role: editingUser.role,
                            password: editingUser.password || undefined
                          })
                        })
                        const result = await response.json()
                        console.log('用户更新结果:', result)
                        if (result.success) {
                          setUsers(users.map(u => u.id === editingUser.id ? result.data : u))
                          setShowUserForm(false)
                          setEditingUser(null)
                          alert('用户更新成功')
                        } else {
                          alert(`更新失败：${result.error}`)
                        }
                      } catch (error) {
                        console.error('更新用户失败:', error)
                        alert('更新用户失败')
                      }
                    } else {
                      // 创建用户
                      if (!editingUser.password) {
                        alert('请设置密码')
                        return
                      }
                      await handleCreateUser(editingUser)
                    }
                  }}
                >
                  {editingUser?.id ? '保存修改' : '创建用户'}
                </Button>
                    </div>
                </Card>
              </div>
        )}

        {/* 商品分析配置弹窗 */}
        {showScrapingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
                <CardTitle>商品分析配置</CardTitle>
              <CardDescription>
                  已选择 <strong>{selectedProducts.length}</strong> 个商品进行商品分析（包含竞品分析功能）
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>选中的商品</Label>
                <div className="mt-2 max-h-32 overflow-y-auto border rounded-lg p-3 bg-gray-50">
                  <div className="flex flex-wrap gap-2">
                    {products.filter(p => selectedProducts.includes(p.id)).map(p => (
                      <Badge key={p.id} variant="secondary">{p.name}</Badge>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* 分析模式选择 */}
              <div>
                <Label>分析模式</Label>
                <div className="mt-2 space-y-2">
                  <label className="flex items-center space-x-2 p-3 border rounded hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name="analysisMode"
                      value="scrape"
                      checked={scrapingConfig.analysisMode === 'scrape'}
                      onChange={(e) => setScrapingConfig({...scrapingConfig, analysisMode: e.target.value as 'scrape' | 'text' | 'competitor'})}
                      className="rounded"
                    />
                    <div>
                      <div className="font-medium">爬取平台评论分析</div>
                      <div className="text-sm text-gray-500">自动爬取指定平台的用户评论，然后AI分析</div>
                    </div>
                  </label>
                  <label className="flex items-center space-x-2 p-3 border rounded hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name="analysisMode"
                      value="text"
                      checked={scrapingConfig.analysisMode === 'text'}
                      onChange={(e) => setScrapingConfig({...scrapingConfig, analysisMode: e.target.value as 'scrape' | 'text' | 'competitor'})}
                      className="rounded"
                    />
                    <div>
                      <div className="font-medium">直接输入文本分析</div>
                      <div className="text-sm text-gray-500">手动输入竞品信息、用户评论等文本，然后AI分析</div>
                    </div>
                  </label>
                  <label className="flex items-center space-x-2 p-3 border rounded hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name="analysisMode"
                      value="competitor"
                      checked={scrapingConfig.analysisMode === 'competitor'}
                      onChange={(e) => setScrapingConfig({...scrapingConfig, analysisMode: e.target.value as 'scrape' | 'text' | 'competitor'})}
                      className="rounded"
                    />
                    <div>
                      <div className="font-medium">竞品分析模式</div>
                      <div className="text-sm text-gray-500">输入竞品链接或上传竞品图片，AI分析竞品卖点和痛点</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* 平台选择 - 仅在爬取模式时显示 */}
              {scrapingConfig.analysisMode === 'scrape' && (
                <div>
                  <Label>选择平台（可多选）</Label>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {['shopee', 'tiktok', 'amazon', 'facebook', 'lazada'].map(platform => {
                      const platformNames: {[key: string]: string} = {
                        shopee: 'Shopee (虾皮)',
                        tiktok: 'TikTok',
                        amazon: 'Amazon',
                        facebook: 'Facebook',
                        lazada: 'Lazada'
                      }
                      return (
                        <label key={platform} className="flex items-center space-x-2 p-2 border rounded hover:bg-gray-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={scrapingConfig.platforms.includes(platform)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setScrapingConfig({...scrapingConfig, platforms: [...scrapingConfig.platforms, platform]})
                              } else {
                                setScrapingConfig({...scrapingConfig, platforms: scrapingConfig.platforms.filter(p => p !== platform)})
                              }
                            }}
                            className="rounded"
                          />
                          <span className="text-sm">{platformNames[platform]}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* 文本输入 - 仅在文本模式时显示 */}
              {scrapingConfig.analysisMode === 'text' && (
                <div>
                  <Label>输入分析文本</Label>
                  <Textarea
                    value={scrapingConfig.inputText}
                    onChange={(e) => setScrapingConfig({...scrapingConfig, inputText: e.target.value})}
                    placeholder="输入竞品信息、用户评论、产品描述等文本内容..."
                    rows={6}
                    className="mt-2"
                  />
                  <div className="text-sm text-gray-500 mt-1">
                    支持输入竞品信息、用户评论、产品描述等任何相关文本内容
                  </div>
                </div>
              )}

              {/* 竞品分析输入 - 仅在竞品分析模式时显示 */}
              {scrapingConfig.analysisMode === 'competitor' && (
                <div className="space-y-4">
                  <div>
                    <Label>竞品链接或文本</Label>
                    <Textarea
                      value={scrapingConfig.inputText}
                      onChange={(e) => setScrapingConfig({...scrapingConfig, inputText: e.target.value})}
                      placeholder="输入竞品链接（如：https://shopee.sg/product/123456）或竞品描述文本..."
                      rows={4}
                      className="mt-2"
                    />
                    <div className="text-sm text-gray-500 mt-1">
                      支持输入竞品链接（自动解析）或竞品描述文本
                    </div>
                  </div>
                  
                  <div>
                    <Label>上传竞品图片（可选）</Label>
                    <Input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => {
                        const files = e.target.files
                        if (files) {
                          const imageUrls = Array.from(files).map(file => URL.createObjectURL(file))
                          setScrapingConfig({...scrapingConfig, competitorImages: imageUrls})
                        }
                      }}
                      className="mt-2"
                    />
                    <div className="text-sm text-gray-500 mt-1">
                      支持上传竞品图片，AI将分析图片中的商品信息
                    </div>
                  </div>
                </div>
              )}
              
                {/* 已移除最大评论数限制：改为0表示不限制，且不再展示该输入 */}

                {/* AI模型选择（推荐系统） */}
                <div className="border-t pt-4">
                  <Label className="text-base font-semibold mb-2 block">🤖 AI模型选择</Label>
                  <RecommendationSelector
                    scenario="task->model"
                    task={{
                      taskType: 'product-analysis',
                      contentType: 'text',
                      category: products.find(p => selectedProducts.includes(p.id))?.category,
                      region: products.find(p => selectedProducts.includes(p.id))?.targetCountries?.[0] || 'CN',
                      jsonRequirement: true,
                      budgetTier: 'low'
                    }}
                    context={{
                      audience: 'ecommerce',
                      channel: scrapingConfig.platforms[0] || 'shopee'
                    }}
                    constraints={{
                      maxCostUSD: 0.01,
                      requireJsonMode: true
                    }}
                    onSelect={(modelId, decisionId, isUserOverride) => {
                      console.log('Selected AI model:', modelId, 'Decision:', decisionId, 'User override:', isUserOverride)
                      setScrapingConfig({...scrapingConfig, aiModel: modelId, decisionId})
                    }}
                  />
                </div>

                {/* AI Prompt选择（推荐系统） */}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-base font-semibold">📝 Prompt模板</Label>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setShowPromptEditor(!showPromptEditor)}
                      className="h-8"
                    >
                      {showPromptEditor ? '收起编辑器' : '展开编辑器'}
                    </Button>
                  </div>
                  <RecommendationSelector
                    scenario="task->prompt"
                    task={{
                      taskType: 'product-painpoint',
                      contentType: 'text',
                      category: products.find(p => selectedProducts.includes(p.id))?.category
                    }}
                    context={{
                      channel: scrapingConfig.platforms[0] || 'shopee',
                      audience: 'ecommerce'
                    }}
                    constraints={{
                      maxLatencyMs: 5000
                    }}
                    onSelect={async (promptId, decisionId, isUserOverride) => {
                      console.log('Selected Prompt:', promptId, 'Decision:', decisionId)
                      try {
                        const res = await fetch(`/api/admin/prompts?id=${promptId}`)
                        const data = await res.json()
                        if (data.template?.content) {
                          setScrapingConfig({...scrapingConfig, customPrompt: data.template.content})
                        }
                      } catch (e) {
                        console.error('加载Prompt失败', e)
                      }
                    }}
                  />
                  <div className="text-xs text-gray-500 mt-2">
                    系统已推荐最优Prompt模板。如需自定义，请点击"展开编辑器"修改。
                  </div>
                  {showPromptEditor && (
                    <div className="space-y-2">
                      <Textarea
                        value={scrapingConfig.customPrompt}
                        onChange={(e) => setScrapingConfig({...scrapingConfig, customPrompt: e.target.value})}
                        rows={12}
                        className="font-mono text-sm"
                        placeholder="输入AI分析prompt..."
                      />
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-500">
                          💡 提示：使用 {"{platform}"}, {"{productName}"} 作为占位符（已弃用 {"{comments}"}）。输出必须是字符串数组JSON。
                        </p>
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            const defaultPrompt = `角色：你是跨境电商的高级用户研究员。\n任务：先实时搜索关于"{productName}"在{platform}平台的最新用户评价/测评/论坛/售后问题；基于检索结果输出痛点清单。\n\n必须严格按以下要求输出：\n1) 仅输出JSON数组（UTF-8，application/json），数组元素为字符串，每个元素是一条痛点；\n2) 不要输出任何解释、标题、key、对象或多余字段；\n3) 每条10-30字，按重要性与频次排序；\n4) 如检索为空，也要基于同类商品常见问题生成合理痛点；\n\n示例输出：\n["物流速度慢，配送时间过长","价格偏高，性价比不足","电池续航时间短"]`
                            setScrapingConfig({...scrapingConfig, customPrompt: defaultPrompt})
                          }}
                        >
                          恢复默认
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-900">
                    <strong>💡 分析说明：</strong>
                    <br />• <strong>每个商品独立分析</strong>：系统会为每个商品单独爬取评论
                    <br />• <strong>自动使用商品名称</strong>：每个商品使用自己的名称作为搜索关键词
                    <br />• <strong>智能语言匹配</strong>：根据商品的目标国家自动选择评论语言
                    <br />  - 马来西亚(MY)：混合英语和马来语评论
                    <br />  - 其他市场：根据市场特点选择相应语言
                    <br />• <strong>AI智能分析</strong>：使用上方自定义的Prompt进行分析
                    <br />• <strong>自动去重合并</strong>：相似痛点会自动合并，每个商品保留最重要的10个
                  </p>
                </div>
              </CardContent>
              <div className="flex justify-end gap-2 p-6 pt-0">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowScrapingModal(false)
                    const savedPrompt = scrapingConfig.customPrompt
                    setScrapingConfig({ 
                      analysisMode: 'text', 
                      inputText: '', 
                      platforms: [], 
                      keywords: '', 
                      maxComments: 0, 
                      dateRange: '', 
                      customPrompt: savedPrompt, 
                      aiModel: '', 
                      decisionId: '',
                      competitorImages: []
                    })
                  }}
                >
                  取消
                </Button>
                <Button 
                  onClick={handleStartScraping}
                  disabled={
                    (scrapingConfig.analysisMode === 'scrape' && scrapingConfig.platforms.length === 0) ||
                    (scrapingConfig.analysisMode === 'text' && !scrapingConfig.inputText.trim()) ||
                    (scrapingConfig.analysisMode === 'competitor' && !scrapingConfig.inputText.trim() && scrapingConfig.competitorImages.length === 0)
                  }
                >
                  开始分析
                </Button>
              </div>
          </Card>
        </div>
      )}

      {/* 商品表单对话框 */}
      {showProductForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>{editingProduct ? '编辑商品' : '添加商品'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveProduct} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="productName">商品名称</Label>
                    <Input
                      id="productName"
                      value={editingProduct?.name || ''}
                      onChange={(e) => setEditingProduct({...(editingProduct || {}), name: e.target.value} as Product)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="productCategory">类目</Label>
                    <Select 
                      value={editingProduct?.category || ''}
                      onValueChange={(value) => setEditingProduct({...(editingProduct || {}), category: value} as Product)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="选择或输入类目" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="电子产品">电子产品</SelectItem>
                        <SelectItem value="美妆护肤">美妆护肤</SelectItem>
                        <SelectItem value="服装配饰">服装配饰</SelectItem>
                        <SelectItem value="家居用品">家居用品</SelectItem>
                        <SelectItem value="运动户外">运动户外</SelectItem>
                        <SelectItem value="食品饮料">食品饮料</SelectItem>
                        <SelectItem value="母婴用品">母婴用品</SelectItem>
                        <SelectItem value="汽车用品">汽车用品</SelectItem>
                        <SelectItem value="custom">自定义...</SelectItem>
                      </SelectContent>
                    </Select>
                    {editingProduct?.category === 'custom' && (
                      <Input
                        className="mt-2"
                        placeholder="请输入自定义类目"
                        onChange={(e) => setEditingProduct({...(editingProduct || {}), category: e.target.value} as Product)}
                      />
                    )}
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="productDescription">商品描述</Label>
                  <Textarea
                    id="productDescription"
                    value={editingProduct?.description || ''}
                    onChange={(e) => setEditingProduct({...(editingProduct || {}), description: e.target.value} as Product)}
                    rows={3}
                  />
                </div>
                
                <div>
                  <Label htmlFor="productSellingPoints">卖点</Label>
                  <div className="mt-2 space-y-2">
                    {/* 卖点标签列表 */}
                    {Array.isArray(editingProduct?.sellingPoints) && editingProduct.sellingPoints.length > 0 && (
                      <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-gray-50">
                        {editingProduct.sellingPoints.map((sp: string, index: number) => (
                          <Badge key={index} variant="secondary" className="text-sm py-1 px-3">
                            {sp}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                const updated = editingProduct.sellingPoints.filter((_: any, i: number) => i !== index)
                                setEditingProduct({...(editingProduct || {}), sellingPoints: updated} as Product)
                              }}
                              className="ml-2 text-gray-500 hover:text-red-600"
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    {/* 添加新卖点 */}
                    <div className="flex gap-2">
                      <Input
                        id="productSellingPoints"
                        value={newSellingPoint}
                        onChange={(e) => setNewSellingPoint(e.target.value)}
                        placeholder="输入卖点，回车添加"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && newSellingPoint.trim()) {
                            const current = editingProduct?.sellingPoints || []
                            setEditingProduct({...(editingProduct || {}), sellingPoints: [...current, newSellingPoint.trim()]} as Product)
                            setNewSellingPoint('')
                          }
                        }}
                      />
                      <Button
                        size="sm"
                        onClick={() => {
                          if (newSellingPoint.trim()) {
                            const current = editingProduct?.sellingPoints || []
                            setEditingProduct({...(editingProduct || {}), sellingPoints: [...current, newSellingPoint.trim()]} as Product)
                            setNewSellingPoint('')
                          }
                        }}
                      >
                        添加
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="productPainPoints">
                    用户痛点
                    <span className="text-xs text-gray-500 ml-2">(可选，也可通过批量分析自动获取)</span>
                  </Label>
                  <div className="mt-2 space-y-2">
                    {/* 痛点标签列表 */}
                    {Array.isArray((editingProduct as any)?.painPoints) && (editingProduct as any).painPoints.length > 0 && (
                      <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-gray-50">
                        {(editingProduct as any).painPoints.map((point: any, index: number) => {
                          const pointText = typeof point === 'string' ? point : (point.text || point.painPoint || JSON.stringify(point))
                          return (
                            <Badge key={index} variant="secondary" className="text-sm py-1 px-3">
                              {pointText}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  const updated = (editingProduct as any).painPoints.filter((_: any, i: number) => i !== index)
                                  setEditingProduct({...(editingProduct || {} as any), painPoints: updated} as Product)
                                }}
                                className="ml-2 text-gray-500 hover:text-red-600"
                              >
                                ×
                              </button>
                            </Badge>
                          )
                        })}
                      </div>
                    )}
                    
                    {/* 添加新痛点 */}
                    <div className="flex gap-2">
                      <Input
                        id="productPainPoints"
                        value={newPainPoint}
                        onChange={(e) => setNewPainPoint(e.target.value)}
                        placeholder="输入痛点，回车添加"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && newPainPoint.trim()) {
                            const current = (editingProduct as any)?.painPoints || []
                            setEditingProduct({...(editingProduct || {} as any), painPoints: [...current, newPainPoint.trim()]} as Product)
                            setNewPainPoint('')
                          }
                        }}
                      />
                      <Button
                        size="sm"
                        onClick={() => {
                          if (newPainPoint.trim()) {
                            const current = (editingProduct as any)?.painPoints || []
                            setEditingProduct({...(editingProduct || {} as any), painPoints: [...current, newPainPoint.trim()]} as Product)
                            setNewPainPoint('')
                          }
                        }}
                      >
                        添加
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="productTargetCountries">目标国家</Label>
                  <Input
                    id="productTargetCountries"
                    value={Array.isArray(editingProduct?.targetCountries) ? editingProduct.targetCountries.join(',') : (editingProduct?.targetCountries || '')}
                    onChange={(e) => setEditingProduct({...(editingProduct || {}), targetCountries: e.target.value.split(',').map(s => s.trim()).filter(s => s)} as Product)}
                    placeholder="US,UK,DE"
                  />
                </div>
                
                <div>
                  <Label htmlFor="productTargetAudience">目标受众</Label>
                  <div className="mt-2 space-y-2">
                    {/* 目标受众标签列表 */}
                    {Array.isArray((editingProduct as any)?.targetAudience) && (editingProduct as any).targetAudience.length > 0 && (
                      <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-gray-50">
                        {(editingProduct as any).targetAudience.map((audience: string, index: number) => (
                          <Badge key={index} variant="secondary" className="text-sm py-1 px-3">
                            {audience}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                const updated = (editingProduct as any).targetAudience.filter((_: any, i: number) => i !== index)
                                setEditingProduct({...(editingProduct || {} as any), targetAudience: updated} as Product)
                              }}
                              className="ml-2 text-gray-500 hover:text-red-600"
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    {/* 添加新目标受众 */}
                    <div className="flex gap-2">
                      <Input
                        id="productTargetAudience"
                        value={newTargetAudience}
                        onChange={(e) => setNewTargetAudience(e.target.value)}
                        placeholder="输入目标受众，回车添加"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && newTargetAudience.trim()) {
                            const current = (editingProduct as any)?.targetAudience || []
                            setEditingProduct({...(editingProduct || {} as any), targetAudience: [...current, newTargetAudience.trim()]} as Product)
                            setNewTargetAudience('')
                          }
                        }}
                      />
                      <Button
                        size="sm"
                        onClick={() => {
                          if (newTargetAudience.trim()) {
                            const current = (editingProduct as any)?.targetAudience || []
                            setEditingProduct({...(editingProduct || {} as any), targetAudience: [...current, newTargetAudience.trim()]} as Product)
                            setNewTargetAudience('')
                          }
                        }}
                      >
                        添加
                      </Button>
                    </div>
                  </div>
                </div>
              </form>
            </CardContent>
            <div className="flex justify-end gap-2 p-6 pt-0">
              <Button variant="outline" onClick={() => {
                setShowProductForm(false)
                setEditingProduct(null)
              }}>
                取消
              </Button>
              <Button onClick={handleSaveProduct}>
                {editingProduct ? '更新' : '添加'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* 批量上传对话框 */}
      {showBulkUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>批量上传商品</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="bulkFile">选择文件</Label>
                  <Input
                    id="bulkFile"
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={(e) => setBulkUploadFile(e.target.files?.[0] || null)}
                  />
                </div>
                <div className="text-sm text-gray-600">
                  <p>支持格式：CSV, Excel</p>
                  <p>请确保文件包含以下列：商品名称、类目、描述、卖点、目标国家</p>
                </div>
              </div>
            </CardContent>
            <div className="flex justify-end gap-2 p-6 pt-0">
              <Button variant="outline" onClick={() => {
                setShowBulkUpload(false)
                setBulkUploadFile(null)
              }}>
                取消
              </Button>
              <Button onClick={handleBulkUpload} disabled={!bulkUploadFile || bulkUploading}>
                {bulkUploading ? '上传中...' : '开始上传'}
              </Button>
            </div>
          </Card>
        </div>
      )}


      {/* 调参优化弹窗 */}
      {false && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>待删除</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="styleName">风格名称</Label>
                    <Input
                      id="styleName"
                      value={editingStyle?.name || ''}
                      onChange={(e) => setEditingStyle({...(editingStyle || {}), name: e.target.value} as Style)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="styleCategory">类目</Label>
                    {editingStyle?.productId ? (
                      // 如果已选择商品，类目自动从商品库拉取，不允许修改
                      <div className="flex items-center space-x-2">
                        <Input 
                          value={editingStyle?.category || '未设置'} 
                          disabled 
                          className="bg-gray-50"
                        />
                        <span className="text-sm text-gray-500">
                          (已关联商品，类目自动同步)
                        </span>
                        {/* 调试信息 */}
                        {process.env.NODE_ENV === 'development' && (
                          <span className="text-xs text-red-500">
                            DEBUG: productId={editingStyle?.productId}
                          </span>
                        )}
                      </div>
                    ) : (
                      // 如果没有选择商品，可以从所有类目中选择
                      <Select 
                        value={editingStyle?.category || ''}
                        onValueChange={(value) => setEditingStyle({...(editingStyle || {}), category: value} as Style)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="选择类目" />
                        </SelectTrigger>
                        <SelectContent>
                          {styleCategories.length > 0 ? (
                            styleCategories.map((category) => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="" disabled>
                              请先创建商品以获取类目
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="styleDescription">风格描述</Label>
                  <Textarea
                    id="styleDescription"
                    value={editingStyle?.description || ''}
                    onChange={(e) => setEditingStyle({...(editingStyle || {}), description: e.target.value} as Style)}
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="styleProduct">关联商品</Label>
                  <Select 
                    value={editingStyle?.productId || ''}
                    onValueChange={(value) => {
                      const selectedProduct = products.find(p => p.id === value)
                      setEditingStyle({...(editingStyle || {}), productId: value, productName: selectedProduct?.name, category: selectedProduct?.category} as Style)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择关联商品" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="styleTone">语调</Label>
                    <Select 
                      value={editingStyle?.tone || ''}
                      onValueChange={(value) => setEditingStyle({...(editingStyle || {}), tone: value} as Style)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="选择语调" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="professional">专业</SelectItem>
                        <SelectItem value="casual">随意</SelectItem>
                        <SelectItem value="elegant">优雅</SelectItem>
                        <SelectItem value="energetic">活力</SelectItem>
                        <SelectItem value="friendly">友好</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="styleSubcategory">子类目</Label>
                    <Input
                      id="styleSubcategory"
                      value={editingStyle?.subcategory || ''}
                      onChange={(e) => setEditingStyle({...(editingStyle || {}), subcategory: e.target.value} as Style)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="styleTargetCountries">目标国家</Label>
                    <Input
                      id="styleTargetCountries"
                      value={editingStyle?.targetCountries || ''}
                      onChange={(e) => setEditingStyle({...(editingStyle || {}), targetCountries: e.target.value} as Style)}
                      placeholder="如：美国、中国、全球"
                    />
                  </div>
                  <div>
                    <Label htmlFor="styleIsActive">状态</Label>
                    <Select 
                      value={editingStyle?.isActive ? 'true' : 'false'}
                      onValueChange={(value) => setEditingStyle({...(editingStyle || {}), isActive: value === 'true'} as Style)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="选择状态" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">启用</SelectItem>
                        <SelectItem value="false">禁用</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </form>
            </CardContent>
            <div className="flex justify-end gap-2 p-6 pt-0">
              <Button variant="outline" onClick={() => {
                setShowStyleForm(false)
                setEditingStyle(null)
              }}>
                取消
              </Button>
              <Button onClick={handleSaveStyle}>
                {editingStyle ? '更新' : '添加'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* 调参优化弹窗 */}
      {showRankingTuning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-6xl mx-4 max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>调参优化</CardTitle>
                  <CardDescription>优化模版的粗排和精排算法参数，让预估值和实际表现数据越来越准</CardDescription>
                </div>
                <Button variant="outline" onClick={() => setShowRankingTuning(false)}>
                  ✕ 关闭
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 当前配置概览 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-xl font-bold text-blue-600">粗排-类目-{tuningConfig.coarseRanking.relevance}%</div>
                      <div className="text-sm text-gray-600">相关性权重</div>
                      <div className="text-xs text-red-600 mt-1">⚠️ 权重过高</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-xl font-bold text-green-600">精排-质量-{tuningConfig.coarseRanking.quality}%</div>
                      <div className="text-sm text-gray-600">质量权重</div>
                      <div className="text-xs text-green-600 mt-1">✓ 表现良好</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-xl font-bold text-purple-600">CTR: 2.1%</div>
                      <div className="text-sm text-gray-600">当前点击率</div>
                      <div className="text-xs text-red-600 mt-1">↓ 低于预期</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-xl font-bold text-orange-600">CVR: 1.8%</div>
                      <div className="text-sm text-gray-600">当前转化率</div>
                      <div className="text-xs text-red-600 mt-1">↓ 低于预期</div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* AI一键调参按钮 */}
              <div className="flex justify-center gap-4">
                <Button onClick={handleAITuning} className="bg-blue-600 hover:bg-blue-700">
                  <Brain className="h-4 w-4 mr-2" />
                  AI一键调参
                </Button>
              </div>

              {/* 参数配置 */}
              <Card>
                <CardHeader>
                  <CardTitle>粗排和精排参数配置</CardTitle>
                  <CardDescription>展示当前各层级参数配置，支持手工调整大盘参数</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* 大盘配置 */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4">大盘配置（用户可调）</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base">粗排参数</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="space-y-3">
                              <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm">相关性权重</span>
                                  <span className="text-sm font-medium">{tuningConfig.coarseRanking.relevance}%</span>
                                </div>
                                <input
                                  type="range"
                                  min="0"
                                  max="100"
                                  value={tuningConfig.coarseRanking.relevance}
                                  onChange={(e) => setTuningConfig(prev => ({
                                    ...prev,
                                    coarseRanking: { ...prev.coarseRanking, relevance: parseInt(e.target.value) }
                                  }))}
                                  className="w-full"
                                />
                              </div>
                              <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm">质量权重</span>
                                  <span className="text-sm font-medium">{tuningConfig.coarseRanking.quality}%</span>
                                </div>
                                <input
                                  type="range"
                                  min="0"
                                  max="100"
                                  value={tuningConfig.coarseRanking.quality}
                                  onChange={(e) => setTuningConfig(prev => ({
                                    ...prev,
                                    coarseRanking: { ...prev.coarseRanking, quality: parseInt(e.target.value) }
                                  }))}
                                  className="w-full"
                                />
                              </div>
                              <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm">多样性权重</span>
                                  <span className="text-sm font-medium">{tuningConfig.coarseRanking.diversity}%</span>
                                </div>
                                <input
                                  type="range"
                                  min="0"
                                  max="100"
                                  value={tuningConfig.coarseRanking.diversity}
                                  onChange={(e) => setTuningConfig(prev => ({
                                    ...prev,
                                    coarseRanking: { ...prev.coarseRanking, diversity: parseInt(e.target.value) }
                                  }))}
                                  className="w-full"
                                />
                              </div>
                              <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm">时效性权重</span>
                                  <span className="text-sm font-medium">{tuningConfig.coarseRanking.recency}%</span>
                                </div>
                                <input
                                  type="range"
                                  min="0"
                                  max="100"
                                  value={tuningConfig.coarseRanking.recency}
                                  onChange={(e) => setTuningConfig(prev => ({
                                    ...prev,
                                    coarseRanking: { ...prev.coarseRanking, recency: parseInt(e.target.value) }
                                  }))}
                                  className="w-full"
                                />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base">精排参数</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="space-y-3">
                              <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm">用户偏好权重</span>
                                  <span className="text-sm font-medium">{tuningConfig.fineRanking.userPreference}%</span>
                                </div>
                                <input
                                  type="range"
                                  min="0"
                                  max="100"
                                  value={tuningConfig.fineRanking.userPreference}
                                  onChange={(e) => setTuningConfig(prev => ({
                                    ...prev,
                                    fineRanking: { ...prev.fineRanking, userPreference: parseInt(e.target.value) }
                                  }))}
                                  className="w-full"
                                />
                              </div>
                              <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm">商业价值权重</span>
                                  <span className="text-sm font-medium">{tuningConfig.fineRanking.businessValue}%</span>
                                </div>
                                <input
                                  type="range"
                                  min="0"
                                  max="100"
                                  value={tuningConfig.fineRanking.businessValue}
                                  onChange={(e) => setTuningConfig(prev => ({
                                    ...prev,
                                    fineRanking: { ...prev.fineRanking, businessValue: parseInt(e.target.value) }
                                  }))}
                                  className="w-full"
                                />
                              </div>
                              <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm">技术质量权重</span>
                                  <span className="text-sm font-medium">{tuningConfig.fineRanking.technicalQuality}%</span>
                                </div>
                                <input
                                  type="range"
                                  min="0"
                                  max="100"
                                  value={tuningConfig.fineRanking.technicalQuality}
                                  onChange={(e) => setTuningConfig(prev => ({
                                    ...prev,
                                    fineRanking: { ...prev.fineRanking, technicalQuality: parseInt(e.target.value) }
                                  }))}
                                  className="w-full"
                                />
                              </div>
                              <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm">市场趋势权重</span>
                                  <span className="text-sm font-medium">{tuningConfig.fineRanking.marketTrend}%</span>
                                </div>
                                <input
                                  type="range"
                                  min="0"
                                  max="100"
                                  value={tuningConfig.fineRanking.marketTrend}
                                  onChange={(e) => setTuningConfig(prev => ({
                                    ...prev,
                                    fineRanking: { ...prev.fineRanking, marketTrend: parseInt(e.target.value) }
                                  }))}
                                  className="w-full"
                                />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 操作按钮 */}
              <div className="flex justify-end gap-4">
                <Button variant="outline" onClick={() => setShowRankingTuning(false)}>
                  取消
                </Button>
                <Button onClick={handleSaveConfig}>
                  保存配置
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 文档解析弹窗 */}
      {showDocumentReference && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>文档解析</CardTitle>
                  <CardDescription>粘贴文档内容或输入URL，AI根据内容生成风格</CardDescription>
                </div>
                <Button variant="outline" onClick={() => setShowDocumentReference(false)}>
                  ✕ 关闭
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 文档内容输入区域 */}
              <Card>
                <CardHeader>
                  <CardTitle>粘贴文档内容</CardTitle>
                  <CardDescription>支持直接粘贴文档内容，系统将保持原有格式进行分析</CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="请粘贴文档内容，支持保持原有格式..."
                    rows={12}
                    className="font-mono text-sm border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors"
                    style={{ whiteSpace: 'pre-wrap' }}
                  />
                </CardContent>
              </Card>

              {/* 文档URL输入 */}
              <Card>
                <CardHeader>
                  <CardTitle>或输入文档链接</CardTitle>
                  <CardDescription>支持在线文档链接，AI将自动抓取内容</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="documentUrl">文档链接</Label>
                    <Input
                      id="documentUrl"
                      placeholder="https://example.com/document.pdf"
                      className="mt-1"
                    />
                  </div>
                  <Button className="w-full">
                    <FileText className="h-4 w-4 mr-2" />
                    开始解析文档
                  </Button>
                </CardContent>
              </Card>

              {/* AI生成结果 */}
              <Card>
                <CardHeader>
                  <CardTitle>AI生成的风格</CardTitle>
                  <CardDescription>基于文档内容AI分析生成的风格建议</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>请先粘贴文档内容或输入文档链接</p>
                  </div>
                </CardContent>
              </Card>

              {/* 操作按钮 */}
              <div className="flex justify-end gap-4">
                <Button variant="outline" onClick={() => setShowDocumentReference(false)}>
                  取消
                </Button>
                <Button>
                  确认添加到风格库
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 视频解析弹窗 */}
      {showVideoAnalysis && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>视频解析</CardTitle>
                  <CardDescription>上传视频自动分析风格特征，提取风格元素</CardDescription>
                </div>
                <Button variant="outline" onClick={() => setShowVideoAnalysis(false)}>
                  ✕ 关闭
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 视频上传区域 */}
              <Card>
                <CardHeader>
                  <CardTitle>上传视频文件</CardTitle>
                  <CardDescription>支持 MP4, MOV, AVI, MKV, WebM 格式，最大 500MB</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <Video className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-lg font-medium mb-2">拖拽视频文件到此处或点击选择</p>
                    <p className="text-sm text-gray-500 mb-4">支持格式：MP4, MOV, AVI, MKV, WebM</p>
                    <Button variant="outline">
                      选择视频文件
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* 视频URL输入 */}
              <Card>
                <CardHeader>
                  <CardTitle>或输入视频链接</CardTitle>
                  <CardDescription>支持 YouTube, TikTok, Instagram 等平台链接</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="videoUrl">视频链接</Label>
                    <Input
                      id="videoUrl"
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="mt-1"
                    />
                  </div>
                  <Button className="w-full">
                    <Video className="h-4 w-4 mr-2" />
                    开始解析视频
                  </Button>
                </CardContent>
              </Card>

              {/* 解析结果展示 */}
              <Card>
                <CardHeader>
                  <CardTitle>解析结果</CardTitle>
                  <CardDescription>AI分析视频风格特征</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center py-8 text-gray-500">
                    <Video className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>请先上传视频或输入视频链接</p>
                  </div>
                </CardContent>
              </Card>

              {/* 操作按钮 */}
              <div className="flex justify-end gap-4">
                <Button variant="outline" onClick={() => setShowVideoAnalysis(false)}>
                  取消
                </Button>
                <Button>
                  保存到风格库
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Prompt调优弹窗 */}
      {showPromptTuningModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Prompt调优</CardTitle>
                  <CardDescription>通过AI生成候选提示词，并基于样本评估，找出最优版本</CardDescription>
                </div>
                <Button variant="outline" onClick={() => setShowPromptTuningModal(false)}>
                  ✕ 关闭
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 业务场景选择 */}
              <div>
                <Label>业务场景</Label>
                <Select value={tuningBusinessModule} onValueChange={setTuningBusinessModule}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="productAnalysis">商品分析</SelectItem>
                    <SelectItem value="videoScriptGeneration">视频脚本生成</SelectItem>
                    <SelectItem value="promptGeneration">Prompt生成</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 上下文输入 */}
              <div>
                <Label>业务上下文（必填字段、目标受众等）</Label>
                <Textarea
                  value={tuningContext}
                  onChange={(e) => setTuningContext(e.target.value)}
                  placeholder="例如：商品名称={productName}，类目={category}，目标市场=欧美，目标受众=25-45岁女性"
                  rows={3}
                />
              </div>

              {/* 期望输出 */}
              <div>
                <Label>期望输出（1-3条参考样例）</Label>
                <Textarea
                  value={tuningExpectedOutput}
                  onChange={(e) => setTuningExpectedOutput(e.target.value)}
                  placeholder="例如：描述: 草本私处护理湿巾&#10;卖点: 99%抑菌、温和不刺激、便携装"
                  rows={4}
                />
              </div>

              {/* 生成候选 */}
              <div className="flex gap-2">
                <Button 
                  onClick={async () => {
                    if (!tuningContext || !tuningExpectedOutput) {
                      alert('请填写上下文和期望输出')
                      return
                    }
                    setTuningInProgress(true)
                    try {
                      const res = await fetch('/api/admin/prompts/tune', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          businessModule: tuningBusinessModule,
                          context: tuningContext,
                          expectedOutput: tuningExpectedOutput
                        })
                      })
                      const data = await res.json()
                      if (data.candidates && data.candidates.length > 0) {
                        setTuningCandidates(data.candidates)
                        setTuningBestPrompt(data.bestPrompt || data.candidates[0])
                        alert('已生成候选提示词并完成小样本回测')
                      } else {
                        alert('生成失败：' + (data.error || '未知错误'))
                      }
                    } catch (e: any) {
                      alert('生成失败：' + e.message)
                    } finally {
                      setTuningInProgress(false)
                    }
                  }}
                  disabled={tuningInProgress}
                >
                  {tuningInProgress ? '生成中...' : '生成候选Prompt'}
                </Button>
                {tuningBestPrompt && (
                  <Button 
                    variant="outline"
                    onClick={async () => {
                      try {
                        const res = await fetch('/api/admin/prompts', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            name: `${tuningBusinessModule}_优化版_${new Date().toLocaleDateString()}`,
                            businessModule: tuningBusinessModule,
                            content: tuningBestPrompt,
                            context: tuningContext
                          })
                        })
                        if (res.ok) {
                          alert('已保存为模板，可在业务模块中一键使用')
                          setShowPromptTuningModal(false)
                        } else {
                          alert('保存失败')
                        }
                      } catch (e: any) {
                        alert('保存失败：' + e.message)
                      }
                    }}
                  >
                    保存为模板
                  </Button>
                )}
              </div>

              {/* 候选展示 */}
              {tuningCandidates.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-6 bg-blue-500 rounded"></div>
                    <h3 className="text-lg font-semibold">候选Prompt（按评分排序）</h3>
                  </div>
                  {tuningCandidates.map((candidate, idx) => (
                    <Card key={idx} className={idx === 0 ? 'border-2 border-green-500' : ''}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          候选 {idx + 1}
                          {idx === 0 && <Badge variant="default">推荐</Badge>}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <pre className="text-xs bg-gray-50 p-3 rounded whitespace-pre-wrap">{candidate}</pre>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* 操作按钮 */}
              <div className="flex justify-end gap-4">
                <Button variant="outline" onClick={() => setShowPromptTuningModal(false)}>
                  取消
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Prompt模板编辑/创建模态框 */}
      {showPromptModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <Card className="w-full max-w-3xl my-8">
            <CardHeader>
              <CardTitle>{selectedPrompt ? '编辑Prompt模板' : '创建Prompt模板'}</CardTitle>
              <CardDescription>
                {selectedPrompt ? '修改现有Prompt模板' : '创建新的Prompt模板'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 基本信息 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>模板名称 *</Label>
                  <Input
                    id="prompt-name"
                    defaultValue={selectedPrompt?.name || ''}
                    placeholder="例如：商品痛点分析模板v2"
                  />
                </div>
                <div>
                  <Label>业务模块 *</Label>
                  <Select defaultValue={selectedPrompt?.businessModule || 'product-painpoint'}>
                    <SelectTrigger id="prompt-business-module">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="product-painpoint">商品库-痛点管理</SelectItem>
                      <SelectItem value="product-competitor">商品库-竞品分析</SelectItem>
                      <SelectItem value="video-script">视频生成-脚本生成</SelectItem>
                      <SelectItem value="style-matching">视频生成-风格匹配</SelectItem>
                      <SelectItem value="video-quality">视频生成-质量评估</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>描述</Label>
                <Textarea
                  id="prompt-description"
                  defaultValue={selectedPrompt?.description || ''}
                  placeholder="简要描述这个模板的用途和特点"
                  rows={2}
                />
              </div>

              {/* Prompt内容 */}
              <div>
                <Label>Prompt内容 *</Label>
                <Textarea
                  id="prompt-content"
                  defaultValue={selectedPrompt?.content || ''}
                  placeholder={`请输入完整的Prompt内容，使用 {{variableName}} 格式标注变量。

例如：
请分析以下商品的用户痛点：
商品名称：{{productName}}
商品类目：{{category}}
...`}
                  rows={12}
                  className="font-mono text-sm"
                />
              </div>

              {/* 变量列表 */}
              <div>
                <Label>使用的变量（逗号分隔）</Label>
                <Input
                  id="prompt-variables"
                  defaultValue={
                    selectedPrompt?.variables 
                      ? (typeof selectedPrompt.variables === 'string' 
                          ? JSON.parse(selectedPrompt.variables).join(', ')
                          : selectedPrompt.variables.join(', '))
                      : ''
                  }
                  placeholder="例如：productName, category, description"
                />
                <p className="text-xs text-gray-500 mt-1">
                  这些变量将在调用时被实际值替换
                </p>
              </div>

              {/* 选项 */}
              <div className="flex gap-4 items-center">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    id="prompt-is-default"
                    defaultChecked={selectedPrompt?.isDefault || false}
                    className="rounded"
                  />
                  <span className="text-sm">设为默认模板</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    id="prompt-is-active"
                    defaultChecked={selectedPrompt?.isActive !== false}
                    className="rounded"
                  />
                  <span className="text-sm">启用模板</span>
                </label>
              </div>

              {/* AI生成助手 */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-2">
                  <Label className="text-base font-semibold">AI生成助手</Label>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowAIChat(!showAIChat)}
                  >
                    {showAIChat ? '隐藏' : '显示'}AI助手
                  </Button>
                </div>
                
                {showAIChat && (
                  <div className="space-y-4 bg-gray-50 p-4 rounded">
                    <p className="text-sm text-gray-600">
                      提供参考例子，AI将帮你生成多个候选Prompt模板
                    </p>
                    <div>
                      <Label className="text-sm">业务场景描述</Label>
                      <Textarea
                        id="ai-context"
                        placeholder="描述这个Prompt要解决的业务场景和目标"
                        rows={2}
                      />
                    </div>
                    <div>
                      <Label className="text-sm">参考例子（JSON格式）</Label>
                      <Textarea
                        id="ai-examples"
                        placeholder={`[
  {
    "input": "商品: iPhone 15, 类目: 电子产品",
    "expectedOutput": "痛点: 价格高、电池续航..."
  }
]`}
                        rows={6}
                        className="font-mono text-xs"
                      />
                    </div>
                    <Button
                      onClick={async () => {
                        try {
                          const context = (document.getElementById('ai-context') as HTMLTextAreaElement).value;
                          const examplesStr = (document.getElementById('ai-examples') as HTMLTextAreaElement).value;
                          const businessModule = (document.getElementById('prompt-business-module') as HTMLSelectElement).value;
                          const variablesStr = (document.getElementById('prompt-variables') as HTMLInputElement).value;
                          
                          if (!examplesStr) {
                            alert('请提供参考例子');
                            return;
                          }

                          let examples;
                          try {
                            examples = JSON.parse(examplesStr);
                          } catch {
                            alert('参考例子格式错误，请使用JSON数组格式');
                            return;
                          }

                          const variables = variablesStr.split(',').map(v => v.trim()).filter(v => v);

                          const res = await fetch('/api/admin/prompts/generate', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              businessModule,
                              referenceExamples: examples,
                              context,
                              variables
                            })
                          });

                          const result = await res.json();
                          if (result.success && result.data.candidates) {
                            // 显示候选结果
                            const candidatesText = result.data.candidates.map((c: any, i: number) => 
                              `【候选${i + 1}】${c.name}\n风格: ${c.style}\n\n${c.content}\n\n---\n`
                            ).join('\n');
                            
                            setAIChatMessages([
                              { role: 'assistant', content: `成功生成 ${result.data.candidates.length} 个候选模板：\n\n${candidatesText}` }
                            ]);

                            // 可以让用户选择其中一个填入
                            if (confirm('是否使用第一个候选模板？')) {
                              const firstCandidate = result.data.candidates[0];
                              (document.getElementById('prompt-name') as HTMLInputElement).value = firstCandidate.name;
                              (document.getElementById('prompt-content') as HTMLTextAreaElement).value = firstCandidate.content;
                              if (firstCandidate.variables) {
                                (document.getElementById('prompt-variables') as HTMLInputElement).value = firstCandidate.variables.join(', ');
                              }
                            }
                          } else {
                            alert(`生成失败: ${result.error || '未知错误'}`);
                          }
                        } catch (error: any) {
                          alert(`生成失败: ${error.message}`);
                        }
                      }}
                    >
                      生成候选模板
                    </Button>

                    {/* AI返回的消息 */}
                    {aiChatMessages.length > 0 && (
                      <div className="mt-4 space-y-2 max-h-64 overflow-y-auto">
                        {aiChatMessages.map((msg, i) => (
                          <div key={i} className="text-sm bg-white p-3 rounded">
                            <pre className="whitespace-pre-wrap">{msg.content}</pre>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 操作按钮 */}
              <div className="flex justify-end gap-4 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowPromptModal(false);
                    setSelectedPrompt(null);
                    setShowAIChat(false);
                    setAIChatMessages([]);
                  }}
                >
                  取消
                </Button>
                <Button
                  onClick={async () => {
                    try {
                      const name = (document.getElementById('prompt-name') as HTMLInputElement).value;
                      const businessModule = (document.getElementById('prompt-business-module') as HTMLSelectElement).value;
                      const description = (document.getElementById('prompt-description') as HTMLTextAreaElement).value;
                      const content = (document.getElementById('prompt-content') as HTMLTextAreaElement).value;
                      const variablesStr = (document.getElementById('prompt-variables') as HTMLInputElement).value;
                      const isDefault = (document.getElementById('prompt-is-default') as HTMLInputElement).checked;
                      const isActive = (document.getElementById('prompt-is-active') as HTMLInputElement).checked;

                      if (!name || !businessModule || !content) {
                        alert('请填写必填项：模板名称、业务模块、Prompt内容');
                        return;
                      }

                      const variables = variablesStr.split(',').map(v => v.trim()).filter(v => v);

                      const payload = {
                        name,
                        businessModule,
                        description,
                        content,
                        variables,
                        isDefault,
                        isActive,
                        createdBy: user?.email || 'admin'
                      };

                      let res;
                      if (selectedPrompt) {
                        // 更新
                        res = await fetch('/api/admin/prompts', {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ ...payload, id: selectedPrompt.id })
                        });
                      } else {
                        // 创建
                        res = await fetch('/api/admin/prompts', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(payload)
                        });
                      }

                      const result = await res.json();
                      if (result.success) {
                        alert(selectedPrompt ? '更新成功' : '创建成功');
                        setShowPromptModal(false);
                        setSelectedPrompt(null);
                        setShowAIChat(false);
                        setAIChatMessages([]);
                        loadPromptTemplates(currentBusinessModule);
                      } else {
                        alert(`操作失败: ${result.error}`);
                      }
                    } catch (error: any) {
                      alert(`操作失败: ${error.message}`);
                    }
                  }}
                >
                  {selectedPrompt ? '保存' : '创建'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      </div>
    </div>
  )
}