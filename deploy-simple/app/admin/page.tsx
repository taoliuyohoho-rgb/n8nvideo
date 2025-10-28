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

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('styles')
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
  const [styleCategories, setStyleCategories] = useState<string[]>([]) // 从商品库获取的类目
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [showProductDetail, setShowProductDetail] = useState(false)
  const [showBulkUpload, setShowBulkUpload] = useState(false)
  const [bulkUploadFile, setBulkUploadFile] = useState<File | null>(null)
  const [bulkUploading, setBulkUploading] = useState(false)
  const [showRankingTuning, setShowRankingTuning] = useState(false)
  const [showDocumentReference, setShowDocumentReference] = useState(false)
  const [showVideoAnalysis, setShowVideoAnalysis] = useState(false)
  const [showScrapingModal, setShowScrapingModal] = useState(false)
  const [showCompetitorAnalysis, setShowCompetitorAnalysis] = useState(false)
  const [competitorUrl, setCompetitorUrl] = useState('')
  const [competitorAnalysis, setCompetitorAnalysis] = useState<any>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
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
    // 从API获取真实商品数据
    await fetchProducts()
  }

  const loadStyles = async () => {
    try {
      console.log('开始加载风格数据...')
      const response = await fetch('/api/styles')
      const result = await response.json()
      console.log('API响应:', result)
      
      if (result.success && result.data && result.data.styles) {
        // 使用新的Style表结构
        const styles = result.data.styles.map((style: any) => {
          console.log('处理风格:', style.name, style)
          
          // 安全解析JSON字段
          let scriptStructure = {}
          let visualStyle = {}
          let targetAudience = {}
          let hookPool = []
          let targetCountries = []
          
          try {
            if (style.scriptStructure && style.scriptStructure !== '') {
              scriptStructure = JSON.parse(style.scriptStructure)
            }
          } catch (e) {
            console.warn('解析scriptStructure失败:', style.scriptStructure, e)
          }
          
          try {
            if (style.visualStyle && style.visualStyle !== '') {
              visualStyle = JSON.parse(style.visualStyle)
            }
          } catch (e) {
            console.warn('解析visualStyle失败:', style.visualStyle, e)
          }
          
          try {
            if (style.targetAudience && style.targetAudience !== '') {
              targetAudience = JSON.parse(style.targetAudience)
            }
          } catch (e) {
            console.warn('解析targetAudience失败:', style.targetAudience, e)
          }
          
          try {
            if (style.hookPool && style.hookPool !== '') {
              hookPool = JSON.parse(style.hookPool)
            }
          } catch (e) {
            console.warn('解析hookPool失败:', style.hookPool, e)
          }
          
          try {
            if (style.targetCountries && style.targetCountries !== '') {
              targetCountries = JSON.parse(style.targetCountries)
            }
          } catch (e) {
            console.warn('解析targetCountries失败:', style.targetCountries, e)
          }
          
          return {
            id: style.id,
            name: style.name || '',
            description: style.description || '',
            category: style.category || '未分类',
            subcategory: style.subcategory || '',
            tone: style.tone || 'professional',
            scriptStructure,
            visualStyle,
            targetAudience,
            productId: style.productId,
            productName: style.product?.name || '',
            templatePerformance: style.templatePerformance || 0,
            hookPool: hookPool,
            targetCountries: targetCountries,
            isActive: style.isActive !== false,
            createdAt: style.createdAt,
            product: style.product
          }
        })
        console.log('转换后的风格数据:', styles)
        console.log('设置风格数据，数量:', styles.length)
        setStyles(styles)
        
        // 设置从商品库获取的类目
        if (result.data.categories) {
          console.log('设置风格类目:', result.data.categories)
          setStyleCategories(result.data.categories)
        } else {
          console.warn('API没有返回类目数据')
        }
      } else {
        console.error('获取风格列表失败:', result.error || '数据格式错误')
        setStyles([])
      }
    } catch (error) {
      console.error('获取风格列表失败:', error)
      setStyles([])
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

  const handleEditStyle = (style: Style) => {
    setEditingStyle(style)
    setShowStyleForm(true)
  }

  const handleSaveStyle = async () => {
    if (!editingStyle) return

    try {
      const url = editingStyle.id ? `/api/styles/${editingStyle.id}` : '/api/styles'
      const method = editingStyle.id ? 'PUT' : 'POST'
      
      // 转换数据格式以匹配API期望的格式
      const apiData = {
        name: editingStyle.name,
        description: editingStyle.description || '',
        productId: editingStyle.productId || null,
        category: editingStyle.category || '',
        tone: editingStyle.tone || 'professional',
        subcategory: editingStyle.subcategory || '',
        scriptStructure: editingStyle.scriptStructure ? JSON.stringify(editingStyle.scriptStructure) : null,
        visualStyle: editingStyle.visualStyle ? JSON.stringify(editingStyle.visualStyle) : null,
        targetAudience: editingStyle.targetAudience ? JSON.stringify(editingStyle.targetAudience) : null,
        templatePerformance: editingStyle.templatePerformance || null,
        hookPool: editingStyle.hookPool ? JSON.stringify(editingStyle.hookPool) : null,
        targetCountries: editingStyle.targetCountries ? JSON.stringify(editingStyle.targetCountries) : null,
        isActive: editingStyle.isActive !== undefined ? editingStyle.isActive : true
      }
      
      console.log('保存风格数据:', apiData)
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData)
      })

      const result = await response.json()
      console.log('保存风格结果:', result)
      
      if (result.success) {
        alert(editingStyle.id ? '风格更新成功！' : '风格添加成功！')
        setShowStyleForm(false)
        setEditingStyle(null)
        // 重新加载风格列表
        loadStyles()
      } else {
        alert(`操作失败：${result.error}`)
      }
    } catch (error) {
      console.error('保存风格失败:', error)
      alert('保存失败，请重试')
    }
  }

  const handleUpdateStyleField = async (styleId: string, field: string, value: any) => {
    try {
      // 映射字段名到API期望的字段名
      const apiFieldMap: { [key: string]: string } = {
        'productId': 'productId',
        'category': 'recommendedCategories'
      }
      
      const apiField = apiFieldMap[field] || field
      
      console.log('更新风格字段:', { styleId, field, apiField, value })
      
      const response = await fetch(`/api/styles/${styleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          [apiField]: value
        })
      })

      const result = await response.json()
      console.log('更新风格字段结果:', result)
      
      if (result.success) {
        console.log('风格字段更新成功')
        // 重新加载风格数据
        loadStyles()
      } else {
        console.error('更新风格字段失败:', result.error)
        alert(`更新失败: ${result.error}`)
      }
    } catch (error) {
      console.error('更新风格字段失败:', error)
      // 如果保存失败，恢复原值
      loadStyles()
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
            : product.skuImages || []
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

  const handleCompetitorAnalysis = async () => {
    if (!competitorUrl.trim()) {
      alert('请输入竞品链接')
      return
    }

    setIsAnalyzing(true)
    try {
      const response = await fetch('/api/competitor/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: competitorUrl
        })
      })

      const result = await response.json()
      if (result.success) {
        setCompetitorAnalysis(result.data)
        alert('竞品分析完成！')
      } else {
        alert(`分析失败：${result.error}`)
      }
    } catch (error) {
      console.error('竞品分析失败:', error)
      alert('竞品分析失败，请重试')
    } finally {
      setIsAnalyzing(false)
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
          <TabsList className="grid w-full grid-cols-4">
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
                  <Button variant="outline" onClick={() => setShowCompetitorAnalysis(true)}>
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
                  <Button variant="outline" onClick={() => {
                    console.log('手动刷新风格数据...')
                    loadStyles()
                  }}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    刷新数据
                  </Button>
                  <Button variant="outline" onClick={() => setShowRankingTuning(true)}>
                    <Settings className="h-4 w-4 mr-2" />
                    调参优化
                  </Button>
                  <Button variant="outline" onClick={() => setShowDocumentReference(true)}>
                    <FileText className="h-4 w-4 mr-2" />
                    文档解析
                  </Button>
                  <Button variant="outline" onClick={() => setShowVideoAnalysis(true)}>
                    <Video className="h-4 w-4 mr-2" />
                    视频解析
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
                          <Select 
                            value={style.productId || 'none'}
                            onValueChange={async (value) => {
                              const actualValue = value === 'none' ? '' : value
                              const selectedProduct = products.find(p => p.id === actualValue)
                              const updatedStyle = {
                                ...style,
                                productId: actualValue,
                                productName: selectedProduct?.name || ''
                              }
                              console.log('更新关联商品:', { styleId: style.id, productId: actualValue, productName: selectedProduct?.name })
                              setStyles(styles.map(s => s.id === style.id ? updatedStyle : s))
                              // 保存到后端
                              await handleUpdateStyleField(style.id, 'productId', actualValue)
                            }}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="选择商品" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">未关联</SelectItem>
                              {products.map((product) => (
                                <SelectItem key={product.id} value={product.id}>
                                  {product.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-4 py-3">
                          {style.productId ? (
                            // 如果已关联商品，类目只读
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium">{style.category || '未设置'}</span>
                              <span className="text-xs text-gray-500">(已关联商品)</span>
                            </div>
                          ) : (
                            // 如果没有关联商品，可以修改类目
                            <Select 
                              value={style.category || 'none'}
                              onValueChange={async (value) => {
                                const actualValue = value === 'none' ? '' : value
                                const updatedStyle = {
                                  ...style,
                                  category: actualValue
                                }
                                console.log('更新类目:', { styleId: style.id, category: actualValue })
                                setStyles(styles.map(s => s.id === style.id ? updatedStyle : s))
                                // 保存到后端
                                await handleUpdateStyleField(style.id, 'category', actualValue)
                              }}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="选择类目" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">全部类目</SelectItem>
                                {products.map(product => product.category).filter((category, index, self) => 
                                  self.indexOf(category) === index
                                ).map(category => (
                                  <SelectItem key={category} value={category}>{category}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="text-xs">{style.tone}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-600">
                            {style.targetAudience?.age ? `${style.targetAudience.age}岁` : '未设置'}, {style.targetAudience?.gender || '未设置'}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-medium">
                              {style.templatePerformance || 'N/A'}
                            </div>
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
                          {user.role === 'admin' ? '管理员' : '运营'}
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




            <TabsContent value="ai-config" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold">AI配置管理</h2>
                <p className="text-sm text-gray-600">按业务模块配置AI服务，每个模块独立管理</p>
              </div>

              {/* AI配置表格 - 更紧凑的布局 */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-6 bg-blue-500 rounded"></div>
                  <h3 className="text-lg font-semibold">🎬 视频生成模块</h3>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 ml-4">
                  {/* 脚本生成AI */}
                  <Card className="h-fit">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <MessageSquare className="h-3 w-3" />
                        脚本生成
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="grid grid-cols-2 gap-1">
                        <div>
                          <Label className="text-xs">提供商</Label>
                          <Select defaultValue="claude">
                            <SelectTrigger className="h-6 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="claude">Claude</SelectItem>
                              <SelectItem value="gpt4">GPT-4</SelectItem>
                              <SelectItem value="gemini">Gemini</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs">模型</Label>
                          <Select defaultValue="claude-3-opus">
                            <SelectTrigger className="h-6 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="claude-3-opus">Claude 3 Opus</SelectItem>
                              <SelectItem value="gpt-4">GPT-4</SelectItem>
                              <SelectItem value="gemini-1.5-pro">Gemini 1.5 Pro</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs">API Key</Label>
                        <Input
                          type="password"
                          placeholder="API密钥"
                          className="h-6 text-xs"
                        />
                      </div>
                      <Button size="sm" className="w-full h-6 text-xs" onClick={() => handleSaveAIConfig('scriptGenerationAI', {})}>
                        保存
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Prompt生成AI */}
                  <Card className="h-fit">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <Brain className="h-3 w-3" />
                        Prompt生成
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="grid grid-cols-2 gap-1">
                        <div>
                          <Label className="text-xs">提供商</Label>
                          <Select defaultValue="gemini">
                            <SelectTrigger className="h-6 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="gemini">Gemini</SelectItem>
                              <SelectItem value="gpt4">GPT-4</SelectItem>
                              <SelectItem value="claude">Claude</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs">模型</Label>
                          <Select defaultValue="gemini-1.5-pro">
                            <SelectTrigger className="h-6 text-xs">
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
                        <Label className="text-xs">API Key</Label>
                        <Input
                          type="password"
                          placeholder="API密钥"
                          className="h-6 text-xs"
                        />
                      </div>
                      <Button size="sm" className="w-full h-6 text-xs" onClick={() => handleSaveAIConfig('promptGenerationAI', {})}>
                        保存
                      </Button>
                    </CardContent>
                  </Card>

                  {/* 粗排精排AI */}
                  <Card className="h-fit">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <BarChart3 className="h-3 w-3" />
                        粗排精排
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="grid grid-cols-2 gap-1">
                        <div>
                          <Label className="text-xs">提供商</Label>
                          <Select defaultValue="claude">
                            <SelectTrigger className="h-6 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="claude">Claude</SelectItem>
                              <SelectItem value="gpt4">GPT-4</SelectItem>
                              <SelectItem value="gemini">Gemini</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs">模型</Label>
                          <Select defaultValue="claude-3-opus">
                            <SelectTrigger className="h-6 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="claude-3-opus">Claude 3 Opus</SelectItem>
                              <SelectItem value="gpt-4">GPT-4</SelectItem>
                              <SelectItem value="gemini-1.5-pro">Gemini 1.5 Pro</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs">API Key</Label>
                        <Input
                          type="password"
                          placeholder="API密钥"
                          className="h-6 text-xs"
                        />
                      </div>
                      <Button size="sm" className="w-full h-6 text-xs" onClick={() => handleSaveAIConfig('rankingAI', {})}>
                        保存
                      </Button>
                    </CardContent>
                  </Card>

                  {/* 竞品分析AI */}
                  <Card className="h-fit">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <Search className="h-3 w-3" />
                        竞品分析
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="grid grid-cols-2 gap-1">
                        <div>
                          <Label className="text-xs">提供商</Label>
                          <Select defaultValue="claude">
                            <SelectTrigger className="h-6 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="claude">Claude</SelectItem>
                              <SelectItem value="gpt4">GPT-4</SelectItem>
                              <SelectItem value="gemini">Gemini</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs">模型</Label>
                          <Select defaultValue="claude-3-opus">
                            <SelectTrigger className="h-6 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="claude-3-opus">Claude 3 Opus</SelectItem>
                              <SelectItem value="gpt-4">GPT-4</SelectItem>
                              <SelectItem value="gemini-1.5-pro">Gemini 1.5 Pro</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs">API Key</Label>
                        <Input
                          type="password"
                          placeholder="API密钥"
                          className="h-6 text-xs"
                        />
                      </div>
                      <Button size="sm" className="w-full h-6 text-xs" onClick={() => handleSaveAIConfig('competitorAnalysisAI', {})}>
                        保存
                      </Button>
                    </CardContent>
                  </Card>

                  {/* 视频解析AI */}
                  <Card className="h-fit">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <Video className="h-3 w-3" />
                        视频解析
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="grid grid-cols-2 gap-1">
                        <div>
                          <Label className="text-xs">提供商</Label>
                          <Select defaultValue="gemini">
                            <SelectTrigger className="h-6 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="gemini">Gemini</SelectItem>
                              <SelectItem value="gpt4">GPT-4</SelectItem>
                              <SelectItem value="claude">Claude</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs">模型</Label>
                          <Select defaultValue="gemini-1.5-pro">
                            <SelectTrigger className="h-6 text-xs">
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
                        <Label className="text-xs">API Key</Label>
                        <Input
                          type="password"
                          placeholder="API密钥"
                          className="h-6 text-xs"
                        />
                      </div>
                      <Button size="sm" className="w-full h-6 text-xs" onClick={() => handleSaveAIConfig('videoAnalysisAI', {})}>
                        保存
                      </Button>
                    </CardContent>
                  </Card>
                </div>
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

      {/* 竞品分析弹窗 */}
      {showCompetitorAnalysis && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>竞品分析</CardTitle>
              <CardDescription>
                输入竞品链接，系统将自动解析商品信息并补充到商品库
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="competitorUrl">竞品链接</Label>
                <Input
                  id="competitorUrl"
                  value={competitorUrl}
                  onChange={(e) => setCompetitorUrl(e.target.value)}
                  placeholder="请输入竞品链接，如：https://shopee.sg/product/123456"
                />
              </div>
              
              {competitorAnalysis && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">分析结果：</h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>商品名称：</strong>{competitorAnalysis.productName}</p>
                    <p><strong>类目：</strong>{competitorAnalysis.category}</p>
                    <p><strong>价格：</strong>{competitorAnalysis.price}</p>
                    <p><strong>卖点：</strong>{competitorAnalysis.sellingPoints?.join(', ')}</p>
                    <p><strong>目标国家：</strong>{competitorAnalysis.targetCountries?.join(', ')}</p>
                  </div>
                </div>
              )}
            </CardContent>
            <div className="flex justify-end gap-2 p-6 pt-0">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowCompetitorAnalysis(false)
                  setCompetitorUrl('')
                  setCompetitorAnalysis(null)
                }}
              >
                取消
              </Button>
              <Button 
                onClick={handleCompetitorAnalysis}
                disabled={isAnalyzing || !competitorUrl.trim()}
              >
                {isAnalyzing ? '分析中...' : '开始分析'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* 风格表单对话框 */}
      {showStyleForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>{editingStyle ? '编辑风格' : '添加风格'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => { e.preventDefault(); handleSaveStyle(); }} className="space-y-4">
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
                          value={editingStyle.category || '未设置'} 
                          disabled 
                          className="bg-gray-50"
                        />
                        <span className="text-sm text-gray-500">
                          (已关联商品，类目自动同步)
                        </span>
                        {/* 调试信息 */}
                        {process.env.NODE_ENV === 'development' && (
                          <span className="text-xs text-red-500">
                            DEBUG: productId={editingStyle.productId}
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
      </div>
    </div>
  )
}