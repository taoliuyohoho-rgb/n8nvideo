'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminSimplePage() {
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState([])
  const router = useRouter()

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (!userData) {
      router.push('/login')
      return
    }

    const userInfo = JSON.parse(userData)
    if (userInfo.role !== 'admin') {
      router.push('/dashboard')
      return
    }

    // 测试API调用
    fetchProducts()
  }, [router])

  const fetchProducts = async () => {
    try {
      console.log('开始加载商品数据...')
      const response = await fetch('/api/products')
      const result = await response.json()
      console.log('API响应:', result)
      
      if (result.success) {
        setProducts(result.data.products || [])
        console.log('商品数据加载成功:', result.data.products?.length || 0, '个商品')
      } else {
        console.error('API返回错误:', result.error)
      }
    } catch (error) {
      console.error('加载商品数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">加载中...</span>
      </div>
    )
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">简化管理页面</h1>
      <div className="mb-4">
        <p>商品数量: {products.length}</p>
      </div>
      <div className="space-y-2">
        {products.slice(0, 5).map((product: any) => (
          <div key={product.id} className="p-2 border rounded">
            <h3 className="font-semibold">{product.name}</h3>
            <p className="text-sm text-gray-600">{product.category}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
