'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  TrendingUp, 
  DollarSign, 
  Eye, 
  MousePointer, 
  ShoppingCart, 
  Users,
  BarChart3,
  Filter,
  Download,
  ChevronRight,
  Home,
  ArrowLeft,
  Settings,
  Monitor
} from 'lucide-react'

interface DashboardData {
  overview: {
    totalSpend: number
    totalGMV: number
    totalViews: number
    totalClicks: number
    totalOrders: number
    avgCTR: number
    avgCVR: number
  }
  byProduct: Array<{
    productId: string
    productName: string
    spend: number
    gmv: number
    views: number
    ctr: number
    cvr: number
  }>
  byCountry: Array<{
    country: string
    spend: number
    gmv: number
    views: number
    ctr: number
    cvr: number
  }>
  byPlatform: Array<{
    platform: string
    spend: number
    gmv: number
    views: number
    ctr: number
    cvr: number
  }>
  byShop: Array<{
    shopId: string
    shopName: string
    spend: number
    gmv: number
    views: number
    ctr: number
    cvr: number
  }>
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30d')
  
  // 下钻状态管理
  const [drillLevel, setDrillLevel] = useState<'overview' | 'product' | 'platform' | 'template' | 'shop'>('overview')
  const [selectedProduct, setSelectedProduct] = useState<string | undefined>(undefined)
  const [selectedPlatform, setSelectedPlatform] = useState<string | undefined>(undefined)
  const [selectedTemplate, setSelectedTemplate] = useState<string | undefined>(undefined)
  const [selectedShop, setSelectedShop] = useState<string | undefined>(undefined)
  const [selectedCountry, setSelectedCountry] = useState<string | undefined>(undefined)

  useEffect(() => {
    fetchDashboardData()
  }, [timeRange, selectedProduct, selectedPlatform, selectedTemplate, selectedShop, selectedCountry])

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      // 模拟数据，实际应该从API获取
      const mockData: DashboardData = {
        overview: {
          totalSpend: 125000,
          totalGMV: 450000,
          totalViews: 2500000,
          totalClicks: 125000,
          totalOrders: 2500,
          avgCTR: 5.2,
          avgCVR: 2.1
        },
        byProduct: [
          { productId: '1', productName: '无线蓝牙耳机', spend: 25000, gmv: 90000, views: 500000, ctr: 5.5, cvr: 2.3 },
          { productId: '2', productName: '智能手表', spend: 30000, gmv: 120000, views: 600000, ctr: 4.8, cvr: 2.0 },
          { productId: '3', productName: '护肤精华液', spend: 20000, gmv: 80000, views: 400000, ctr: 5.8, cvr: 2.5 }
        ],
        byCountry: [
          { country: 'US', spend: 50000, gmv: 180000, views: 1000000, ctr: 5.0, cvr: 2.0 },
          { country: 'UK', spend: 30000, gmv: 120000, views: 600000, ctr: 5.5, cvr: 2.2 },
          { country: 'DE', spend: 25000, gmv: 90000, views: 500000, ctr: 4.8, cvr: 1.8 }
        ],
        byPlatform: [
          { platform: 'TikTok', spend: 60000, gmv: 240000, views: 1200000, ctr: 5.2, cvr: 2.1 },
          { platform: 'Facebook', spend: 35000, gmv: 120000, views: 700000, ctr: 5.0, cvr: 1.9 },
          { platform: 'Google', spend: 30000, gmv: 90000, views: 600000, ctr: 5.5, cvr: 2.3 }
        ],
        byShop: [
          { shopId: 'shop1', shopName: '主店铺', spend: 80000, gmv: 300000, views: 1500000, ctr: 5.3, cvr: 2.2 },
          { shopId: 'shop2', shopName: '测试店铺', spend: 45000, gmv: 150000, views: 1000000, ctr: 5.0, cvr: 1.9 }
        ]
      }
      
      setData(mockData)
    } catch (error) {
      console.error('获取数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
  }

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(num)
  }

  // 下钻导航函数
  const handleDrillDown = (level: string, id: string, name: string) => {
    switch (level) {
      case 'product':
        setSelectedProduct(id)
        setDrillLevel('product')
        break
      case 'platform':
        setSelectedPlatform(id)
        setDrillLevel('platform')
        break
      case 'template':
        setSelectedTemplate(id)
        setDrillLevel('template')
        break
      case 'shop':
        setSelectedShop(id)
        setDrillLevel('shop')
        break
    }
  }

  const handleDrillUp = () => {
    switch (drillLevel) {
      case 'product':
        setDrillLevel('overview')
        setSelectedProduct(undefined)
        break
      case 'platform':
        setDrillLevel('product')
        setSelectedPlatform(undefined)
        break
      case 'template':
        setDrillLevel('platform')
        setSelectedTemplate(undefined)
        break
      case 'shop':
        setDrillLevel('platform')
        setSelectedShop(undefined)
        break
    }
  }

  const getBreadcrumb = () => {
    const breadcrumbs = ['总览']
    
    if (selectedProduct) {
      const product = data?.byProduct.find(p => p.productId === selectedProduct)
      breadcrumbs.push(product?.productName || '商品')
    }
    
    if (selectedPlatform) {
      breadcrumbs.push(selectedPlatform)
    }
    
    if (selectedTemplate) {
      breadcrumbs.push('模板')
    }
    
    if (selectedShop) {
      breadcrumbs.push('店铺')
    }
    
    return breadcrumbs
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!data) {
    return <div>暂无数据</div>
  }

  return (
    <div className="space-y-6">
      {/* 头部导航 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">数据看板</h1>
          <p className="text-gray-600">广告表现数据分析和洞察</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => window.open('/admin', '_blank')}>
            <Settings className="h-4 w-4 mr-2" />
            风格库调参
          </Button>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">最近7天</SelectItem>
              <SelectItem value="30d">最近30天</SelectItem>
              <SelectItem value="90d">最近90天</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            导出数据
          </Button>
        </div>
      </div>

      {/* 面包屑导航 */}
      <div className="flex items-center space-x-2 text-sm">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => {
            setDrillLevel('overview')
            setSelectedProduct(undefined)
            setSelectedPlatform(undefined)
            setSelectedTemplate(undefined)
            setSelectedShop(undefined)
          }}
          className="p-0 h-auto"
        >
          <Home className="h-4 w-4 mr-1" />
          总览
        </Button>
        
        {getBreadcrumb().slice(1).map((crumb, index) => (
          <div key={index} className="flex items-center">
            <ChevronRight className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">{crumb}</span>
          </div>
        ))}
        
        {drillLevel !== 'overview' && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleDrillUp}
            className="ml-4 p-0 h-auto"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            返回上级
          </Button>
        )}
      </div>

      {/* 概览指标 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">总花费</p>
                <p className="text-2xl font-bold">{formatCurrency(data.overview.totalSpend)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">总GMV</p>
                <p className="text-2xl font-bold">{formatCurrency(data.overview.totalGMV)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">总观看</p>
                <p className="text-2xl font-bold">{formatNumber(data.overview.totalViews)}</p>
              </div>
              <Eye className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">总点击</p>
                <p className="text-2xl font-bold">{formatNumber(data.overview.totalClicks)}</p>
              </div>
              <MousePointer className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 详细分析 */}
      <Tabs defaultValue="products" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="products">商品维度</TabsTrigger>
          <TabsTrigger value="countries">国家维度</TabsTrigger>
          <TabsTrigger value="platforms">平台维度</TabsTrigger>
          <TabsTrigger value="shops">店铺维度</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">商品表现分析</h2>
            <Select value={selectedProduct} onValueChange={setSelectedProduct}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="选择商品" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部商品</SelectItem>
                <SelectItem value="1">无线蓝牙耳机</SelectItem>
                <SelectItem value="2">智能手表</SelectItem>
                <SelectItem value="3">护肤精华液</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4">
            {data.byProduct.map((product) => (
              <Card key={product.productId}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold">{product.productName}</h3>
                    <Badge variant="outline">ROI: {((product.gmv - product.spend) / product.spend * 100).toFixed(1)}%</Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">花费</p>
                      <p className="text-lg font-semibold">{formatCurrency(product.spend)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">GMV</p>
                      <p className="text-lg font-semibold">{formatCurrency(product.gmv)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">CTR</p>
                      <p className="text-lg font-semibold">{product.ctr.toFixed(1)}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">CVR</p>
                      <p className="text-lg font-semibold">{product.cvr.toFixed(1)}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="countries" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">国家表现分析</h2>
            <Select value={selectedCountry} onValueChange={setSelectedCountry}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="选择国家" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部国家</SelectItem>
                <SelectItem value="US">美国</SelectItem>
                <SelectItem value="UK">英国</SelectItem>
                <SelectItem value="DE">德国</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4">
            {data.byCountry.map((country) => (
              <Card key={country.country}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold">{country.country}</h3>
                    <Badge variant="outline">ROI: {((country.gmv - country.spend) / country.spend * 100).toFixed(1)}%</Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">花费</p>
                      <p className="text-lg font-semibold">{formatCurrency(country.spend)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">GMV</p>
                      <p className="text-lg font-semibold">{formatCurrency(country.gmv)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">CTR</p>
                      <p className="text-lg font-semibold">{country.ctr.toFixed(1)}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">CVR</p>
                      <p className="text-lg font-semibold">{country.cvr.toFixed(1)}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="platforms" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">平台表现分析</h2>
            <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="选择平台" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部平台</SelectItem>
                <SelectItem value="TikTok">TikTok</SelectItem>
                <SelectItem value="Facebook">Facebook</SelectItem>
                <SelectItem value="Google">Google</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4">
            {data.byPlatform.map((platform) => (
              <Card key={platform.platform}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold">{platform.platform}</h3>
                    <Badge variant="outline">ROI: {((platform.gmv - platform.spend) / platform.spend * 100).toFixed(1)}%</Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">花费</p>
                      <p className="text-lg font-semibold">{formatCurrency(platform.spend)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">GMV</p>
                      <p className="text-lg font-semibold">{formatCurrency(platform.gmv)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">CTR</p>
                      <p className="text-lg font-semibold">{platform.ctr.toFixed(1)}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">CVR</p>
                      <p className="text-lg font-semibold">{platform.cvr.toFixed(1)}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="shops" className="space-y-4">
          <h2 className="text-xl font-semibold">店铺表现分析</h2>
          <div className="grid gap-4">
            {data.byShop.map((shop) => (
              <Card key={shop.shopId}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold">{shop.shopName}</h3>
                    <Badge variant="outline">ROI: {((shop.gmv - shop.spend) / shop.spend * 100).toFixed(1)}%</Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">花费</p>
                      <p className="text-lg font-semibold">{formatCurrency(shop.spend)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">GMV</p>
                      <p className="text-lg font-semibold">{formatCurrency(shop.gmv)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">CTR</p>
                      <p className="text-lg font-semibold">{shop.ctr.toFixed(1)}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">CVR</p>
                      <p className="text-lg font-semibold">{shop.cvr.toFixed(1)}%</p>
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
