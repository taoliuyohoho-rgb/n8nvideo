'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  BarChart3, 
  Video, 
  Package, 
  Settings, 
  LogOut, 
  User,
  TrendingUp,
  Clock,
  CheckCircle,
  Shield,
  Users,
  Database,
  Home,
  History,
  Upload,
  Search,
  Bell,
  ChevronDown,
  Plus,
  Eye,
  Download,
  Trash2,
  Play,
  FileText,
  Image,
  Link,
  Brain
} from 'lucide-react'
import { DateRangePicker } from '@/components/ui/date-picker'

interface User {
  id: string
  email: string
  name: string
  role: string
  isActive: boolean
  createdAt: string
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('home')
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined
  })
  const [users, setUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<string>('all')
  const [products, setProducts] = useState<any[]>([])
  const [productCategories, setProductCategories] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [filteredProducts, setFilteredProducts] = useState<any[]>([])
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const router = useRouter()

  useEffect(() => {
    // 检查用户登录状态
    const userData = localStorage.getItem('user')
    if (!userData) {
      router.push('/login')
      return
    }

    const userInfo = JSON.parse(userData)
    setUser(userInfo)
    setLoading(false)
  }, [router])

  // 获取用户列表
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/admin/users')
        const result = await response.json()
        if (result.success) {
          setUsers(result.data)
        }
      } catch (error) {
        console.error('获取用户列表失败:', error)
      }
    }

    fetchUsers()
  }, [])

  // 获取商品数据
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products')
        const result = await response.json()
        if (result.success) {
          setProducts(result.data.products)
          setProductCategories(result.data.categories)
          setFilteredProducts(result.data.products)
        }
      } catch (error) {
        console.error('获取商品列表失败:', error)
      }
    }

    fetchProducts()
  }, [])

  // 根据类目筛选商品
  useEffect(() => {
    if (selectedCategory === 'all') {
      setFilteredProducts(products)
    } else {
      const filtered = products.filter(product => product.category === selectedCategory)
      setFilteredProducts(filtered)
    }
  }, [selectedCategory, products])

  const handleLogout = () => {
    localStorage.removeItem('user')
    router.push('/login')
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

  // 首页内容组件
  const HomeContent = () => (
    <div className="space-y-6">
      {/* 欢迎区域 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">欢迎回来，{user.name}！</h1>
          <p className="text-gray-600 mt-1">首页</p>
        </div>
        <Button 
          className="bg-blue-600 hover:bg-blue-700 text-white"
          onClick={() => window.open('/admin', '_blank')}
        >
          <Settings className="h-4 w-4 mr-2" />
          管理后台
        </Button>
      </div>

      {/* 数据大盘 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-white rounded-lg shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">已制作视频</p>
                <p className="text-2xl font-bold text-gray-900">128</p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">+12% 本月</span>
                </div>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Video className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white rounded-lg shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">素材总数</p>
                <p className="text-2xl font-bold text-gray-900">456</p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">+8% 本月</span>
                </div>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Image className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white rounded-lg shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">使用天数</p>
                <p className="text-2xl font-bold text-gray-900">30</p>
                <p className="text-sm text-gray-500">连续使用</p>
              </div>
              <div className="p-3 bg-teal-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-teal-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white rounded-lg shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">制作效率</p>
                <p className="text-2xl font-bold text-gray-900">95%</p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">+3% 本月</span>
                </div>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>


      {/* 系统使用情况统计 */}
      {user.role === 'admin' && (
        <div className="space-y-6">
          {/* 筛选器 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                系统使用情况
              </CardTitle>
              <CardDescription>
                查看系统内人员使用情况、视频生成统计和商品/风格分析
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 日期筛选器 */}
                <div>
                  <Label htmlFor="date-filter">日期筛选</Label>
                  <DateRangePicker
                    dateRange={dateRange}
                    onDateRangeChange={setDateRange}
                    placeholder="选择日期范围"
                    className="w-full"
                  />
                </div>

                {/* 用户筛选 */}
                <div>
                  <Label htmlFor="user-filter">用户</Label>
                  <Select value={selectedUser} onValueChange={setSelectedUser}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部用户</SelectItem>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name} ({user.role === 'admin' ? '管理员' : '运营'})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 商品筛选 */}
                <div>
                  <Label htmlFor="product-filter">商品</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部商品</SelectItem>
                      {productCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {/* 商品多选列表 */}
                  <div className="mt-2 max-h-32 overflow-y-auto border rounded p-2">
                    {filteredProducts.map((product) => (
                      <label key={product.id} className="flex items-center space-x-2 py-1">
                        <input 
                          type="checkbox" 
                          className="rounded"
                          checked={selectedProducts.includes(product.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedProducts([...selectedProducts, product.id])
                            } else {
                              setSelectedProducts(selectedProducts.filter(id => id !== product.id))
                            }
                          }}
                        />
                        <span className="text-sm">{product.name}</span>
                      </label>
                    ))}
                  </div>
                  
                  {/* 全选/清空按钮 */}
                  <div className="flex gap-2 mt-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedProducts(filteredProducts.map(p => p.id))}
                    >
                      全选
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedProducts([])}
                    >
                      清空
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 人员使用情况 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  人员使用情况
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">活跃用户</span>
                    <span className="font-semibold">12人</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">新增用户</span>
                    <span className="font-semibold">3人</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">管理员</span>
                    <span className="font-semibold">2人</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">普通用户</span>
                    <span className="font-semibold">10人</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Video className="h-5 w-5 mr-2" />
                  视频生成统计
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">总生成数</span>
                    <span className="font-semibold">128个</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">本月生成</span>
                    <span className="font-semibold">45个</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">成功率</span>
                    <span className="font-semibold text-green-600">95%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">平均时长</span>
                    <span className="font-semibold">32秒</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 商品/风格分析 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="h-5 w-5 mr-2" />
                  热门商品类别
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">电子产品</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{width: '75%'}}></div>
                      </div>
                      <span className="text-sm font-medium">45个</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">服装配饰</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div className="bg-green-600 h-2 rounded-full" style={{width: '60%'}}></div>
                      </div>
                      <span className="text-sm font-medium">32个</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">生活用品</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div className="bg-purple-600 h-2 rounded-full" style={{width: '40%'}}></div>
                      </div>
                      <span className="text-sm font-medium">28个</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">美妆护肤</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div className="bg-pink-600 h-2 rounded-full" style={{width: '25%'}}></div>
                      </div>
                      <span className="text-sm font-medium">15个</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  热门视频风格
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">科技感</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{width: '80%'}}></div>
                      </div>
                      <span className="text-sm font-medium">38个</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">时尚潮流</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div className="bg-green-600 h-2 rounded-full" style={{width: '65%'}}></div>
                      </div>
                      <span className="text-sm font-medium">28个</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">温馨生活</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div className="bg-purple-600 h-2 rounded-full" style={{width: '45%'}}></div>
                      </div>
                      <span className="text-sm font-medium">22个</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">简约商务</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div className="bg-gray-600 h-2 rounded-full" style={{width: '30%'}}></div>
                      </div>
                      <span className="text-sm font-medium">18个</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* 普通用户功能入口 */}
      {user.role !== 'admin' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-white rounded-lg shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Upload className="h-5 w-5 mr-2" />
                完善风格库
              </CardTitle>
              <CardDescription>
                上传视频链接或视频文件，解析后充实风格库
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button 
                  className="w-full"
                  onClick={() => {
                    const url = prompt('请输入视频链接：')
                    if (url) {
                      alert(`正在解析视频链接：${url}`)
                      // 这里可以添加实际的视频解析逻辑
                    }
                  }}
                >
                  <Link className="h-4 w-4 mr-2" />
                  上传视频链接
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    const input = document.createElement('input')
                    input.type = 'file'
                    input.accept = 'video/*'
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0]
                      if (file) {
                        alert(`正在上传视频文件：${file.name}`)
                        // 这里可以添加实际的文件上传逻辑
                      }
                    }
                    input.click()
                  }}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  上传视频文件
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white rounded-lg shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="h-5 w-5 mr-2" />
                完善商品库
              </CardTitle>
              <CardDescription>
                上传竞品信息，解析后充实商品卖点等信息
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button 
                  className="w-full"
                  onClick={() => {
                    const info = prompt('请输入竞品信息（产品名称、价格、特点等）：')
                    if (info) {
                      alert(`正在分析竞品信息：${info}`)
                      // 这里可以添加实际的竞品分析逻辑
                    }
                  }}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  上传竞品信息
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    const keyword = prompt('请输入搜索关键词：')
                    if (keyword) {
                      alert(`正在搜索竞品：${keyword}`)
                      // 这里可以添加实际的搜索逻辑
                    }
                  }}
                >
                  <Search className="h-4 w-4 mr-2" />
                  搜索竞品
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )

  // 视频生成内容组件
  const VideoGenerationContent = () => {
    const [productName, setProductName] = useState('')
    const [productInfo, setProductInfo] = useState({
      sellingPoints: '',
      painPoints: '',
      marketingInfo: '',
      targetCountry: '',
      targetAudience: ''
    })
    const [competitorUrl, setCompetitorUrl] = useState('')
    const [referenceVideo, setReferenceVideo] = useState('')
    const [selectedStyle, setSelectedStyle] = useState<any>(null)
    const [generatedPrompt, setGeneratedPrompt] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [productValidation, setProductValidation] = useState({
      exists: false,
      exactMatch: null as any,
      fuzzyMatches: [] as any[]
    })
    const [showProductSuggestions, setShowProductSuggestions] = useState(false)
    const [selectedProduct, setSelectedProduct] = useState<any>(null)
    const [categories, setCategories] = useState<string[]>([])
    const [selectedCategory, setSelectedCategory] = useState('all')
    const [allProducts, setAllProducts] = useState<any[]>([])
    const [showAllProducts, setShowAllProducts] = useState(false)

    // 获取商品列表和类目
    useEffect(() => {
      const fetchProducts = async () => {
        try {
          const response = await fetch('/api/products')
          const result = await response.json()
          if (result.success) {
            setCategories(result.data.categories)
            setAllProducts(result.data.products)
          }
        } catch (error) {
          console.error('获取商品列表失败:', error)
        }
      }
      fetchProducts()
    }, [])

    const handleProductValidation = async () => {
      if (!productName) {
        alert('请输入商品名称')
        return
      }
      
      setIsLoading(true)
      try {
        const response = await fetch('/api/products/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productName })
        })
        
        const result = await response.json()
        if (result.success) {
          setProductValidation(result.data)
          if (result.data.exists) {
            setSelectedProduct(result.data.exactMatch)
            setProductName(result.data.exactMatch.name)
          } else {
            setShowProductSuggestions(true)
          }
        }
      } catch (error) {
        alert('商品验证失败，请重试')
      } finally {
        setIsLoading(false)
      }
    }

    const handleProductSelect = (product: any) => {
      setSelectedProduct(product)
      setProductName(product.name)
      setShowProductSuggestions(false)
      setShowAllProducts(false)
    }

    const handleCategoryFilter = (category: string) => {
      setSelectedCategory(category)
    }

    const filteredProducts = allProducts.filter(product => 
      selectedCategory === 'all' || product.category === selectedCategory
    )

    const handleCompetitorAnalysis = async () => {
      if (!competitorUrl) {
        alert('请输入竞品链接')
        return
      }
      
      setIsLoading(true)
      try {
        // 分析竞品信息
        const response = await fetch('/api/competitor/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: competitorUrl })
        })
        
        const result = await response.json()
        if (result.success) {
          // 自动填充商品信息
          setProductInfo({
            sellingPoints: result.sellingPoints || '',
            painPoints: result.painPoints || '',
            marketingInfo: result.marketingInfo || '',
            targetCountry: result.targetCountry || '',
            targetAudience: result.targetAudience || ''
          })
          alert('竞品分析完成，信息已自动填充')
        }
      } catch (error) {
        alert('竞品分析失败，请重试')
      } finally {
        setIsLoading(false)
      }
    }

    const handleStyleMatching = async () => {
      setIsLoading(true)
      try {
        // AI匹配风格库
        const response = await fetch('/api/ai/match-style', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productName,
            ...productInfo
          })
        })
        
        const result = await response.json()
        if (result.success) {
          setSelectedStyle(result.selectedStyle)
        }
      } catch (error) {
        alert('风格匹配失败，请重试')
      } finally {
        setIsLoading(false)
      }
    }

    const handleGeneratePrompt = async () => {
      setIsLoading(true)
      try {
        // 生成最终prompt
        const response = await fetch('/api/ai/generate-prompt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productName,
            ...productInfo,
            selectedStyleId: selectedStyle?.id
          })
        })
        
        const result = await response.json()
        if (result.success) {
          setGeneratedPrompt(result.soraPrompt)
        }
      } catch (error) {
        alert('Prompt生成失败，请重试')
      } finally {
        setIsLoading(false)
      }
    }

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">视频生成</h1>
          <p className="text-gray-600 mt-1">输入商品信息，AI智能匹配风格，生成专业视频prompt</p>
        </div>

        {/* 商品信息输入 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="h-5 w-5 mr-2" />
              商品信息输入
            </CardTitle>
            <CardDescription>
              请输入商品名称（必填），系统会验证商品是否在商品库中，支持模糊匹配和手动选择
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="product-name">商品名称 *</Label>
                <div className="relative">
                  <Input 
                    id="product-name"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="iPhone 15 Pro 手机壳"
                    className="mt-2"
                  />
                  <Button 
                    size="sm"
                    className="absolute right-2 top-3"
                    onClick={() => setShowAllProducts(!showAllProducts)}
                  >
                    {showAllProducts ? '隐藏' : '选择商品'}
                  </Button>
                </div>
                
                {/* 商品选择面板 */}
                {showAllProducts && (
                  <div className="mt-4 p-4 border rounded-lg bg-gray-50">
                    <div className="flex items-center space-x-4 mb-4">
                      <Label>类目筛选：</Label>
                      <Select value={selectedCategory} onValueChange={handleCategoryFilter}>
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">全部类目</SelectItem>
                          {categories.map(category => (
                            <SelectItem key={category} value={category}>{category}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                      <div className="grid grid-cols-1 gap-2">
                        {filteredProducts.map(product => (
                          <div 
                            key={product.id}
                            className="p-2 border rounded cursor-pointer hover:bg-blue-50"
                            onClick={() => handleProductSelect(product)}
                          >
                            <div className="font-medium">{product.name}</div>
                            <div className="text-sm text-gray-500">{product.category}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 模糊匹配建议 */}
                {showProductSuggestions && productValidation.fuzzyMatches.length > 0 && (
                  <div className="mt-4 p-4 border rounded-lg bg-yellow-50">
                    <p className="text-sm text-yellow-800 mb-2">未找到精确匹配，以下为相似商品：</p>
                    <div className="space-y-2">
                      {productValidation.fuzzyMatches.map(product => (
                        <div 
                          key={product.id}
                          className="p-2 border rounded cursor-pointer hover:bg-yellow-100"
                          onClick={() => handleProductSelect(product)}
                        >
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-gray-500">{product.category}</div>
                        </div>
                      ))}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2"
                      onClick={() => setShowProductSuggestions(false)}
                    >
                      关闭建议
                    </Button>
                  </div>
                )}
              </div>
              
              <div className="flex space-x-2">
                <Button 
                  onClick={handleProductValidation}
                  disabled={isLoading}
                >
                  {isLoading ? '验证中...' : '验证商品'}
                </Button>
                {selectedProduct && (
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setSelectedProduct(null)
                      setProductName('')
                    }}
                  >
                    重新选择
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 竞品分析 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Search className="h-5 w-5 mr-2" />
              竞品分析（可选）
            </CardTitle>
            <CardDescription>
              输入竞品链接，AI会解析商品信息并自动填充下方表单
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="competitor-url">竞品链接</Label>
                <Input 
                  id="competitor-url"
                  value={competitorUrl}
                  onChange={(e) => setCompetitorUrl(e.target.value)}
                  placeholder="https://www.amazon.com/product-url"
                  className="mt-2"
                />
              </div>
              <Button 
                variant="outline"
                className="w-full"
                onClick={handleCompetitorAnalysis}
                disabled={isLoading}
              >
                <Search className="h-4 w-4 mr-2" />
                分析竞品
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 商品详细信息 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              商品详细信息
            </CardTitle>
            <CardDescription>
              AI会整合三个来源的信息：用户填写、商品库原有、AI分析
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="selling-points">商品卖点</Label>
                <Input 
                  id="selling-points"
                  value={productInfo.sellingPoints}
                  onChange={(e) => setProductInfo({...productInfo, sellingPoints: e.target.value})}
                  placeholder="防摔保护、透明设计、轻薄便携"
                  className="mt-2"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="pain-points">用户痛点</Label>
                <Input 
                  id="pain-points"
                  value={productInfo.painPoints}
                  onChange={(e) => setProductInfo({...productInfo, painPoints: e.target.value})}
                  placeholder="手机容易摔坏、保护壳太厚重、缺乏时尚感"
                  className="mt-2"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="marketing-info">营销信息</Label>
                <Input 
                  id="marketing-info"
                  value={productInfo.marketingInfo}
                  onChange={(e) => setProductInfo({...productInfo, marketingInfo: e.target.value})}
                  placeholder="适合追求时尚和保护的年轻用户"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="target-country">目标国家</Label>
                <Input 
                  id="target-country"
                  value={productInfo.targetCountry}
                  onChange={(e) => setProductInfo({...productInfo, targetCountry: e.target.value})}
                  placeholder="美国"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="target-audience">目标受众</Label>
                <Input 
                  id="target-audience"
                  value={productInfo.targetAudience}
                  onChange={(e) => setProductInfo({...productInfo, targetAudience: e.target.value})}
                  placeholder="18-35岁年轻用户"
                  className="mt-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI风格匹配和生成 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Brain className="h-5 w-5 mr-2" />
              AI风格匹配和生成
            </CardTitle>
            <CardDescription>
              AI会为您匹配最适合的视频风格，并生成专业的视频prompt
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* 风格匹配结果 */}
              {selectedStyle && (
                <div className="p-4 border rounded-lg bg-blue-50">
                  <h3 className="font-medium text-blue-900">{selectedStyle.name}</h3>
                  <p className="text-sm text-blue-700 mt-1">{selectedStyle.description}</p>
                  <div className="mt-2">
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      匹配度: {selectedStyle.matchScore}%
                    </span>
                  </div>
                </div>
              )}

              {/* 操作按钮 */}
              <div className="flex gap-2">
                <Button 
                  onClick={handleStyleMatching}
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? 'AI分析中...' : 'AI风格匹配'}
                </Button>
                {selectedStyle && (
                  <Button 
                    onClick={handleGeneratePrompt}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    {isLoading ? '生成中...' : '生成Prompt'}
                  </Button>
                )}
              </div>

              {/* 生成的Prompt */}
              {generatedPrompt && (
                <div className="mt-4">
                  <Label className="text-sm font-medium">生成的视频Prompt：</Label>
                  <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                      {generatedPrompt}
                    </pre>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button 
                      variant="outline"
                      onClick={() => navigator.clipboard.writeText(generatedPrompt)}
                    >
                      复制Prompt
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setProductName('')
                        setProductInfo({
                          sellingPoints: '',
                          painPoints: '',
                          marketingInfo: '',
                          targetCountry: '',
                          targetAudience: ''
                        })
                        setSelectedStyle(null)
                        setGeneratedPrompt('')
                        setSelectedProduct(null)
                        setProductValidation({
                          exists: false,
                          exactMatch: null,
                          fuzzyMatches: []
                        })
                      }}
                    >
                      重新生成
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 历史记录内容组件
  const HistoryContent = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">历史记录</h1>
        <p className="text-gray-600 mt-1">查看和管理您的生成记录</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>生成历史</CardTitle>
          <CardDescription>所有生成任务的记录和prompt</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-medium">iPhone 15 Pro 手机壳推广视频</h3>
                  <p className="text-sm text-gray-500">电子产品 • 2024-01-15 14:30</p>
                  <div className="flex items-center space-x-4 mt-2">
                    <Badge variant="outline">已完成</Badge>
                    <span className="text-sm text-gray-500">30秒</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      alert('查看详情：\n\n输入内容：iPhone 15 Pro 手机壳\n系统prompt：生成一个30秒的产品推广视频\n输出prompt：创建展示手机壳保护功能的视频')
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      if (confirm('确定要删除这个记录吗？')) {
                        alert('记录已删除')
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded text-sm">
                <p className="font-medium text-gray-700 mb-2">输入内容：</p>
                <p className="text-gray-600 mb-3">iPhone 15 Pro 手机壳，防摔保护，透明设计</p>
                
                <p className="font-medium text-gray-700 mb-2">系统使用的prompt：</p>
                <p className="text-gray-600 mb-3">生成一个30秒的产品推广视频，突出手机壳的保护功能和透明设计</p>
                
                <p className="font-medium text-gray-700 mb-2">最终输出的prompt：</p>
                <p className="text-gray-600">创建一个展示iPhone 15 Pro手机壳的视频，包含：1. 手机壳外观展示 2. 防摔测试场景 3. 透明材质特写 4. 产品特点介绍</p>
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-medium">Nike Air Max 运动鞋展示视频</h3>
                  <p className="text-sm text-gray-500">服装配饰 • 2024-01-15 11:20</p>
                  <div className="flex items-center space-x-4 mt-2">
                    <Badge variant="outline">已完成</Badge>
                    <span className="text-sm text-gray-500">45秒</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      alert('查看详情：\n\n输入内容：Nike Air Max 运动鞋\n系统prompt：生成一个45秒的运动鞋展示视频\n输出prompt：创建展示运动鞋舒适性和时尚性的视频')
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      if (confirm('确定要删除这个记录吗？')) {
                        alert('记录已删除')
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded text-sm">
                <p className="font-medium text-gray-700 mb-2">输入内容：</p>
                <p className="text-gray-600 mb-3">Nike Air Max 运动鞋，舒适透气，时尚设计</p>
                
                <p className="font-medium text-gray-700 mb-2">系统使用的prompt：</p>
                <p className="text-gray-600 mb-3">生成一个45秒的运动鞋展示视频，突出舒适性和时尚性</p>
                
                <p className="font-medium text-gray-700 mb-2">最终输出的prompt：</p>
                <p className="text-gray-600">创建一个展示Nike Air Max运动鞋的视频，包含：1. 鞋子外观360度展示 2. 透气材质特写 3. 运动场景演示 4. 舒适性介绍</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex items-center space-x-4">
                <Search className="h-5 w-5 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="搜索作品、素材..." 
                  className="border-0 outline-none text-gray-900 placeholder-gray-500"
                />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
              </Button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-gray-600" />
                </div>
                <span className="text-sm text-gray-700">{user.name}</span>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    // 这里可以添加个人设置的下拉菜单或跳转到设置页面
                    alert('个人设置功能')
                  }}
                >
                  <Settings className="h-4 w-4 mr-1" />
                  个人设置
                  <ChevronDown className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* 主要内容区域 - 左侧tab + 右侧内容 */}
      <div className="flex h-[calc(100vh-64px)]">
        {/* 左侧导航栏 */}
        <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4">
            <h2 className="text-lg font-semibold text-gray-900">工作台</h2>
          </div>
          
          {/* 导航菜单 */}
          <nav className="flex-1 px-4 pb-4">
            <div className="space-y-2">
              <button
                onClick={() => setActiveTab('home')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  activeTab === 'home' 
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Home className="h-5 w-5" />
                <span>首页</span>
              </button>
              
              <button
                onClick={() => setActiveTab('video')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  activeTab === 'video' 
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Video className="h-5 w-5" />
                <span>视频生成</span>
              </button>
              
              <button
                onClick={() => setActiveTab('history')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  activeTab === 'history' 
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <History className="h-5 w-5" />
                <span>历史记录</span>
              </button>
              
              {/* 未来可扩展的模块 */}
              <div className="pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500 px-3 py-2">即将推出</p>
                <button
                  disabled
                  className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left text-gray-400 cursor-not-allowed"
                >
                  <Package className="h-5 w-5" />
                  <span>商品信息管理</span>
                </button>
                <button
                  disabled
                  className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left text-gray-400 cursor-not-allowed"
                >
                  <Database className="h-5 w-5" />
                  <span>订单管理</span>
                </button>
                <button
                  disabled
                  className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left text-gray-400 cursor-not-allowed"
                >
                  <TrendingUp className="h-5 w-5" />
                  <span>进货管理</span>
                </button>
              </div>
            </div>
          </nav>
        </div>

        {/* 右侧内容区域 */}
        <div className="flex-1 overflow-auto">
          <div className="p-6">
            {activeTab === 'home' && <HomeContent />}
            {activeTab === 'video' && <VideoGenerationContent />}
            {activeTab === 'history' && <HistoryContent />}
          </div>
        </div>
      </div>
    </div>
  )
}
