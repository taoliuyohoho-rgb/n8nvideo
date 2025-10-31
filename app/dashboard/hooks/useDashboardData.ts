// Dashboard 数据管理 Hook

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { User, DashboardStats, Product, HistoryItem } from '../types'

export function useDashboardData() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [productCategories, setProductCategories] = useState<string[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [history, setHistory] = useState<HistoryItem[]>([])

  // 获取用户信息
  useEffect(() => {
    // 检查是否在浏览器环境中
    if (typeof window === 'undefined') {
      setLoading(false)
      return
    }

    const userData = localStorage.getItem('user')
    if (!userData) {
      setLoading(false) // 先设置loading为false
      router.push('/login')
      return
    }
    
    try {
      const userInfo = JSON.parse(userData)
      setUser(userInfo)
    } catch (error) {
      console.error('解析用户信息失败:', error)
      setLoading(false) // 先设置loading为false
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }, []) // 移除router依赖，避免无限循环

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

  // 获取统计数据
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/admin/simple-stats')
        const result = await response.json()
        if (result.success) {
          setDashboardStats(result.data)
        }
      } catch (error) {
        console.error('获取统计数据失败:', error)
      }
    }

    fetchStats()
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
        console.error('获取商品数据失败:', error)
      }
    }

    fetchProducts()
  }, [])

  // 获取历史记录
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch('/api/admin/history')
        const result = await response.json()
        if (result.success) {
          setHistory(result.data)
        }
      } catch (error) {
        console.error('获取历史记录失败:', error)
      }
    }

    fetchHistory()
  }, [])

  return {
    user,
    loading,
    dashboardStats,
    products,
    productCategories,
    filteredProducts,
    setFilteredProducts,
    users,
    history
  }
}
