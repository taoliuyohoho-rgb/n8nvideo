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
import { Plus, Edit, Trash2, Package, Palette, BarChart3, RefreshCw, Database, Brain, Upload, Settings, Users, Search, MessageSquare, FileText, Video } from 'lucide-react'

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
  productId: string
  productName: string
  templatePerformance?: number
  isActive: boolean
  createdAt: string
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

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('products')
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [styles, setStyles] = useState<Style[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [painPoints, setPainPoints] = useState<PainPoint[]>([])
  const [showProductForm, setShowProductForm] = useState(false)
  const [showStyleForm, setShowStyleForm] = useState(false)
  const [showUserForm, setShowUserForm] = useState(false)
  const [showPainPointForm, setShowPainPointForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [editingStyle, setEditingStyle] = useState<Style | null>(null)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<any>(null)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [showProductDetail, setShowProductDetail] = useState(false)
  const [showBulkUpload, setShowBulkUpload] = useState(false)
  const [bulkUploadFile, setBulkUploadFile] = useState<File | null>(null)
  const [bulkUploading, setBulkUploading] = useState(false)
  const [showRankingTuning, setShowRankingTuning] = useState(false)
  const [showScrapingModal, setShowScrapingModal] = useState(false)
  const [scrapingConfig, setScrapingConfig] = useState({
    platform: '',
    keywords: '',
    maxComments: 100,
    dateRange: ''
  })
  
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

  // 检查用户登录状态和权限
  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (!userData) {
      router.push('/login')
      return
    }

    const userInfo = JSON.parse(userData)
    if (userInfo.role !== 'admin') {
      // 非管理员用户重定向到dashboard
      router.push('/dashboard')
      return
    }

    setUser(userInfo)
    setLoading(false)
    
    // 加载数据
    loadProducts()
    loadStyles()
    loadUsers()
    loadPainPoints()
  }, [router])

  const loadProducts = async () => {
    // 模拟商品数据
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

  const loadStyles = async () => {
    // 模拟风格数据
    setStyles([
      {
        id: '1',
        name: '科技感风格',
        description: '适合电子产品的科技感视频风格',
        category: '电子产品',
        subcategory: '科技',
        tone: 'professional',
        scriptStructure: { opening: '产品特写', middle: '功能演示', ending: '品牌展示' },
        visualStyle: { colorScheme: '蓝色科技风', lighting: '明亮清晰', cameraAngle: '多角度展示' },
        targetAudience: { age: '25-45', gender: 'all', interests: ['科技', '电子产品'] },
        productId: '1',
        productName: '无线蓝牙耳机',
        isActive: true,
        createdAt: '2024-01-01'
      },
      {
        id: '2',
        name: '时尚美妆风格',
        description: '适合美妆护肤产品的时尚风格',
        category: '美妆护肤',
        subcategory: '时尚',
        tone: 'elegant',
        scriptStructure: { opening: '模特展示', middle: '产品使用', ending: '效果对比' },
        visualStyle: { colorScheme: '粉色温柔风', lighting: '柔和自然光', cameraAngle: '特写镜头' },
        targetAudience: { age: '18-35', gender: 'female', interests: ['美妆', '护肤', '时尚'] },
        productId: '2',
        productName: '智能手表',
        isActive: true,
        createdAt: '2024-01-02'
      }
    ])
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
      const url = editingProduct.id ? `/api/products/${editingProduct.id}` : '/api/products'
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

  const handleEditStyle = (style: Style) => {
    setEditingStyle(style)
    setShowStyleForm(true)
  }

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products')
      const result = await response.json()
      if (result.success) {
        setProducts(result.data.products)
      }
    } catch (error) {
      console.error('获取商品列表失败:', error)
    }
  }

  const handleDeleteProduct = (id: string) => {
    setProducts(products.filter(p => p.id !== id))
  }

  const handleDeleteStyle = (id: string) => {
    setStyles(styles.filter(s => s.id !== id))
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
    if (!selectedProduct) return
    
    try {
      const response = await fetch('/api/admin/scraping', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: selectedProduct.id,
          platform: scrapingConfig.platform,
          keywords: scrapingConfig.keywords || selectedProduct.name,
          maxComments: scrapingConfig.maxComments,
          dateRange: scrapingConfig.dateRange
        })
      })
      const result = await response.json()
      if (result.success) {
        alert(`痛点分析任务已启动！\n产品: ${selectedProduct.name}\n平台: ${scrapingConfig.platform}\n预计3-5秒后完成，请刷新页面查看结果`)
        setShowScrapingModal(false)
        setScrapingConfig({ platform: '', keywords: '', maxComments: 100, dateRange: '' })
        // 3秒后重新加载商品数据
        setTimeout(() => {
          loadProducts()
        }, 3000)
      } else {
        alert(`创建爬取任务失败：${result.error}`)
      }
    } catch (error) {
      console.error('创建爬取任务失败:', error)
      alert('创建爬取任务失败')
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

  const handleSyncSheets = async () => {
    setIsSyncing(true)
    try {
      const response = await fetch('/api/admin/sync-sheets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      const result = await response.json()
      if (result.success) {
        setSyncResult(result.data)
        // 重新加载数据
        // 这里可以添加重新加载逻辑
      }
    } catch (error) {
      console.error('同步失败:', error)
    } finally {
      setIsSyncing(false)
    }
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
        // 调参完成后回到风格库
        setShowRankingTuning(false)
        setActiveTab('styles')
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

  const handleSaveGlobalConfig = async () => {
    try {
      const response = await fetch('/api/admin/ai-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // 这里应该包含实际的AI配置数据
        })
      })

      const result = await response.json()
      if (result.success) {
        alert('AI配置保存成功！')
      } else {
        alert(`保存失败：${result.error}`)
      }
    } catch (error) {
      console.error('保存AI配置失败:', error)
      alert('保存失败，请重试')
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
              管理商品库、风格库、用户和痛点分析
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

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="products" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                商品库
              </TabsTrigger>
              <TabsTrigger value="styles" className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                风格库
            </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                用户管理
            </TabsTrigger>
              <TabsTrigger value="sync" className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                数据同步
              </TabsTrigger>
              <TabsTrigger value="ai-config" className="flex items-center gap-2">
                <Brain className="h-4 w-4" />
                AI配置
              </TabsTrigger>
            </TabsList>

            <TabsContent value="products" className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold">商品库管理</h2>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowBulkUpload(true)}>
                    <Upload className="h-4 w-4 mr-2" />
                    批量上传
                  </Button>
                  <Button onClick={() => setShowProductForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    添加商品
                  </Button>
                  <Button variant="outline" onClick={() => {
                    // 复用视频生成的竞品分析功能
                    alert('竞品分析功能开发中...')
                  }}>
                    <Search className="h-4 w-4 mr-2" />
                    竞品分析
                  </Button>
                </div>
              </div>

              <div className="border rounded-lg">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">商品名称</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">类目</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">卖点</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">痛点</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">目标国家</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {products.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50">
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
                          <div className="text-sm text-gray-600 max-w-xs truncate">
                            {product.sellingPoints.join(', ')}
                          </div>
                        </td>
                      <td className="px-4 py-3">
                        <div className="max-w-xs">
                          {(product as any).painPoints ? (
                            <div className="text-sm text-gray-600">
                              {JSON.parse((product as any).painPoints).length} 个痛点
                            </div>
                          ) : (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setSelectedProduct(product)
                                setShowScrapingModal(true)
                              }}
                            >
                              <Search className="h-3 w-3 mr-1" />
                              分析痛点
                            </Button>
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

            <TabsContent value="styles" className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold">风格库管理</h2>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowRankingTuning(true)}>
                    <Settings className="h-4 w-4 mr-2" />
                    调参优化
                  </Button>
                  <Button variant="outline" onClick={() => {
                    alert('文档参考功能开发中...')
                  }}>
                    <FileText className="h-4 w-4 mr-2" />
                    文档参考
                  </Button>
                  <Button variant="outline" onClick={() => {
                    alert('视频解析功能开发中...')
                  }}>
                    <Video className="h-4 w-4 mr-2" />
                    视频解析
                  </Button>
                  <Button variant="outline" onClick={handleSyncSheets}>
                    <Database className="h-4 w-4 mr-2" />
                    数据同步
                  </Button>
                  <Button onClick={() => setShowStyleForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    添加风格
                  </Button>
                </div>
              </div>

              <div className="border rounded-lg">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">风格名称</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">关联商品</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">类目</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">语调</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">目标受众</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">模版表现</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">状态</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {styles.map((style) => (
                      <tr key={style.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div>
                            <div className="font-medium text-gray-900">{style.name}</div>
                            <div className="text-sm text-gray-500">{style.description}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-900">{style.productName}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <Badge variant="outline" className="text-xs">{style.category}</Badge>
                            {style.subcategory && (
                              <Badge variant="secondary" className="text-xs">{style.subcategory}</Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="text-xs">{style.tone}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-600">
                            {style.targetAudience.age}岁, {style.targetAudience.gender}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-medium">
                              {style.templatePerformance || 'N/A'}
                            </div>
                            {style.templatePerformance && (
                              <Badge 
                                variant={style.templatePerformance >= 80 ? "default" : style.templatePerformance >= 60 ? "secondary" : "destructive"}
                                className="text-xs"
                              >
                                {style.templatePerformance >= 80 ? '优秀' : style.templatePerformance >= 60 ? '良好' : '待优化'}
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={style.isActive ? "default" : "secondary"}>
                            {style.isActive ? '启用' : '禁用'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleEditStyle(style)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => {
                              alert('风格优化功能开发中...')
                            }}>
                              <Settings className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleDeleteStyle(style.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 同步数据显示 */}
              {syncResult && (
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle>数据同步结果</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">
                        同步时间: {new Date().toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600">
                        同步状态: {syncResult.success ? '成功' : '失败'}
                      </p>
                      {syncResult.data && (
                        <div className="mt-4">
                          <h4 className="font-medium mb-2">同步数据预览:</h4>
                          <div className="bg-gray-50 p-3 rounded text-sm">
                            <pre>{JSON.stringify(syncResult.data, null, 2)}</pre>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">用户管理</h2>
              <Button onClick={() => {
                setEditingUser(null)
                setShowUserForm(true)
              }}>
                <Plus className="h-4 w-4 mr-2" />
                添加用户
              </Button>
            </div>

            <div className="border rounded-lg">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">用户信息</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">角色</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">状态</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">视频数</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">创建时间</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-xs">
                          {user.role === 'admin' ? '管理员' : 
                           user.role === 'manager' ? '经理' :
                           user.role === 'operator' ? '操作员' : '查看者'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={user.isActive ? "default" : "secondary"}>
                          {user.isActive ? '活跃' : '禁用'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{user._count.videos}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleEditUser(user)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDeleteUser(user.id)}>
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


            <TabsContent value="sync" className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold">数据同步</h2>
                <Button 
                  onClick={handleSyncSheets}
                  disabled={isSyncing}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isSyncing ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      同步中...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      同步Google Sheets
                    </>
                  )}
                </Button>
              </div>

              <div className="grid gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Google Sheets 配置</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Google Sheets 链接</Label>
                      <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                        <a 
                          href="https://docs.google.com/spreadsheets/d/1q_ZqVw4DVRbcAA78ZVndXq4XcFEySNmRoLHiFkllFls" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          https://docs.google.com/spreadsheets/d/1q_ZqVw4DVRbcAA78ZVndXq4XcFEySNmRoLHiFkllFls
                        </a>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {syncResult && (
                  <Card>
                    <CardHeader>
                      <CardTitle>同步结果</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">{syncResult.totalTemplates}</div>
                          <div className="text-sm text-gray-600">总模板数</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">{syncResult.createdCount}</div>
                          <div className="text-sm text-gray-600">新增</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-orange-600">{syncResult.updatedCount}</div>
                          <div className="text-sm text-gray-600">更新</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-red-600">{syncResult.duplicatesFound}</div>
                          <div className="text-sm text-gray-600">重复检测</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>


            <TabsContent value="ai-config" className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold">AI配置管理</h2>
                <Button onClick={handleSaveGlobalConfig}>
                  <Brain className="h-4 w-4 mr-2" />
                  保存配置
                </Button>
              </div>

              <div className="grid gap-4">
                {/* 全局配置 */}
                <Card>
                  <CardHeader>
                    <CardTitle>全局AI配置</CardTitle>
                    <CardDescription>系统默认的AI服务配置</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-sm font-medium">视频分析AI</Label>
                        <Select defaultValue="gemini">
                          <SelectTrigger>
                            <SelectValue placeholder="选择AI服务" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="gemini">Gemini</SelectItem>
                            <SelectItem value="gpt4">GPT-4</SelectItem>
                            <SelectItem value="claude">Claude</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Prompt生成AI</Label>
                        <Select defaultValue="gemini">
                          <SelectTrigger>
                            <SelectValue placeholder="选择AI服务" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="gemini">Gemini</SelectItem>
                            <SelectItem value="gpt4">GPT-4</SelectItem>
                            <SelectItem value="claude">Claude</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">视频生成AI</Label>
                        <Select defaultValue="sora">
                          <SelectTrigger>
                            <SelectValue placeholder="选择AI服务" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sora">Sora</SelectItem>
                            <SelectItem value="veo">Veo</SelectItem>
                            <SelectItem value="doubao">豆包</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
            </div>
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
                    value={editingUser?.role || 'viewer'}
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
                    <br />• 管理员：最高权限，可管理所有功能，包括用户管理、商品管理、风格库管理等
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

        {/* 痛点分析配置弹窗 */}
        {showScrapingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-lg">
            <CardHeader>
                <CardTitle>痛点分析配置</CardTitle>
              <CardDescription>
                  为 <strong>{selectedProduct?.name}</strong> 配置痛点分析任务
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                  <Label>选择平台</Label>
                  <Select 
                    value={scrapingConfig.platform}
                    onValueChange={(value) => setScrapingConfig({...scrapingConfig, platform: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择爬取平台" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="shopee">Shopee (虾皮)</SelectItem>
                      <SelectItem value="tiktok">TikTok</SelectItem>
                      <SelectItem value="amazon">Amazon</SelectItem>
                      <SelectItem value="facebook">Facebook</SelectItem>
                      <SelectItem value="lazada">Lazada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>搜索关键词（可选）</Label>
                <Input
                    placeholder={`默认使用产品名称: ${selectedProduct?.name}`}
                    value={scrapingConfig.keywords}
                    onChange={(e) => setScrapingConfig({...scrapingConfig, keywords: e.target.value})}
                  />
              </div>
                <div>
                  <Label>最大评论数</Label>
                  <Input 
                    type="number"
                    value={scrapingConfig.maxComments}
                    onChange={(e) => setScrapingConfig({...scrapingConfig, maxComments: parseInt(e.target.value)})}
                  />
                  <p className="text-sm text-gray-500 mt-1">建议50-200条评论</p>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-900">
                    <strong>说明：</strong>
                    <br />• 系统将从选定平台爬取评论
                    <br />• AI会自动分析并提取痛点
                    <br />• 新痛点会与现有痛点智能合并去重
                    <br />• 最终保留最重要的10个痛点
                  </p>
                </div>
              </CardContent>
              <div className="flex justify-end gap-2 p-6 pt-0">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowScrapingModal(false)
                    setSelectedProduct(null)
                    setScrapingConfig({ platform: '', keywords: '', maxComments: 100, dateRange: '' })
                  }}
                >
                  取消
                </Button>
                <Button 
                  onClick={handleStartScraping}
                  disabled={!scrapingConfig.platform}
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
                    <Input
                      id="productCategory"
                      value={editingProduct?.category || ''}
                      onChange={(e) => setEditingProduct({...(editingProduct || {}), category: e.target.value} as Product)}
                      required
                    />
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
                  <Textarea
                    id="productSellingPoints"
                    value={Array.isArray(editingProduct?.sellingPoints) ? editingProduct.sellingPoints.join(', ') : (editingProduct?.sellingPoints || '')}
                    onChange={(e) => setEditingProduct({...(editingProduct || {}), sellingPoints: e.target.value.split(',').map(s => s.trim()).filter(s => s)} as Product)}
                    rows={2}
                    placeholder="请输入卖点，用逗号分隔"
                  />
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
      </div>
    </div>
  )
}