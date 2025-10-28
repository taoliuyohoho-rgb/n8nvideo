'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CheckCircle, XCircle, Clock, Search, Filter } from 'lucide-react'

interface ProductMapping {
  id: string
  productId: string
  platform: string
  platformProductId: string
  platformName: string
  confidence: number
  status: 'pending' | 'confirmed' | 'rejected'
  suggestedBy: 'ai' | 'manual'
  createdAt: string
  confirmedAt?: string
  confirmedBy?: string
  product: {
    id: string
    name: string
    category: string
  }
}

export default function ProductMappingPage() {
  const [mappings, setMappings] = useState<ProductMapping[]>([])
  const [filteredMappings, setFilteredMappings] = useState<ProductMapping[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [platformFilter, setPlatformFilter] = useState('all')

  useEffect(() => {
    fetchMappings()
  }, [])

  useEffect(() => {
    filterMappings()
  }, [mappings, searchTerm, statusFilter, platformFilter])

  const fetchMappings = async () => {
    try {
      const response = await fetch('/api/admin/product-mapping')
      const data = await response.json()
      if (data.success) {
        setMappings(data.data)
      }
    } catch (error) {
      console.error('获取映射失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterMappings = () => {
    let filtered = mappings

    // 搜索过滤
    if (searchTerm) {
      filtered = filtered.filter(mapping =>
        mapping.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mapping.platformName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mapping.platformProductId.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // 状态过滤
    if (statusFilter !== 'all') {
      filtered = filtered.filter(mapping => mapping.status === statusFilter)
    }

    // 平台过滤
    if (platformFilter !== 'all') {
      filtered = filtered.filter(mapping => mapping.platform === platformFilter)
    }

    setFilteredMappings(filtered)
  }

  const handleConfirmMapping = async (id: string, status: 'confirmed' | 'rejected') => {
    try {
      const response = await fetch('/api/admin/product-mapping', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          status,
          confirmedBy: 'admin' // 实际应用中应该从认证获取
        }),
      })

      const data = await response.json()
      if (data.success) {
        // 更新本地状态
        setMappings(prev => prev.map(mapping =>
          mapping.id === id
            ? { ...mapping, status, confirmedAt: new Date().toISOString(), confirmedBy: 'admin' }
            : mapping
        ))
      }
    } catch (error) {
      console.error('更新映射失败:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />已确认</Badge>
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />已拒绝</Badge>
      default:
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />待确认</Badge>
    }
  }

  const getPlatformBadge = (platform: string) => {
    const colors = {
      facebook: 'bg-blue-100 text-blue-800',
      tiktok: 'bg-black text-white',
      google: 'bg-red-100 text-red-800',
      shopee: 'bg-orange-100 text-orange-800'
    }
    return <Badge className={colors[platform as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>{platform}</Badge>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">商品映射管理</h1>
          <p className="text-gray-600">管理商品与广告平台的映射关系</p>
        </div>
      </div>

      {/* 搜索和过滤 */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">搜索</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="搜索商品名称或平台产品..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="status">状态</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="选择状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="pending">待确认</SelectItem>
                  <SelectItem value="confirmed">已确认</SelectItem>
                  <SelectItem value="rejected">已拒绝</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="platform">平台</Label>
              <Select value={platformFilter} onValueChange={setPlatformFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="选择平台" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="google">Google</SelectItem>
                  <SelectItem value="shopee">Shopee</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={() => {
                setSearchTerm('')
                setStatusFilter('all')
                setPlatformFilter('all')
              }}>
                <Filter className="h-4 w-4 mr-2" />
                重置过滤
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 映射列表 */}
      <div className="space-y-4">
        {filteredMappings.map((mapping) => (
          <Card key={mapping.id}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold">{mapping.product.name}</h3>
                    {getStatusBadge(mapping.status)}
                    {getPlatformBadge(mapping.platform)}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-500">商品信息</Label>
                      <p className="text-sm">{mapping.product.category}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">平台产品</Label>
                      <p className="text-sm">{mapping.platformName}</p>
                      <p className="text-xs text-gray-400">ID: {mapping.platformProductId}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>AI置信度: {Math.round(mapping.confidence * 100)}%</span>
                    <span>建议来源: {mapping.suggestedBy === 'ai' ? 'AI推荐' : '手动添加'}</span>
                    <span>创建时间: {new Date(mapping.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {mapping.status === 'pending' && (
                  <div className="flex gap-2 ml-4">
                    <Button
                      size="sm"
                      onClick={() => handleConfirmMapping(mapping.id, 'confirmed')}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      确认
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleConfirmMapping(mapping.id, 'rejected')}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      拒绝
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredMappings.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-gray-500">没有找到匹配的映射记录</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
