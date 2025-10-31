'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { HomeContent } from './components/HomeContent'
import { ProductManagement } from '@/app/admin/features/products/ProductManagement'
import { HistoryContent } from './components/HistoryContent'
import { Sidebar } from './components/Sidebar'
import { VideoGenerationWorkflow } from '@/components/video-generation'
import { useDashboardData } from './hooks/useDashboardData'
import { useCategoryConfig } from '@/app/admin/hooks/useCategoryConfig'
import type { ActiveTab } from './types'
import type { BusinessProduct } from '@/types/business'

export default function DashboardPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<ActiveTab>('home')
  const [isClient, setIsClient] = useState(false)
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null)
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  
  // 使用统一的类目配置 Hook
  const {
    categories: managedCategories,
    subcategories: managedSubcategories,
    countries: managedCountries,
    loading: categoriesLoading,
    error: categoriesError,
    refreshConfig: refreshCategoriesConfig,
    updateCategories,
    updateSubcategories,
    updateCountries
  } = useCategoryConfig()
  
  const {
    user,
    loading,
    dashboardStats,
    products,
    productCategories,
    filteredProducts,
    setFilteredProducts,
    users,
    history
  } = useDashboardData()

  // 初始化客户端状态并恢复上次选中的标签页
  useEffect(() => {
    setIsClient(true)
    // 从 localStorage 恢复上次选中的标签页
    const savedTab = localStorage.getItem('dashboard-active-tab')
    if (savedTab && ['home', 'video', 'products', 'history', 'settings'].includes(savedTab)) {
      setActiveTab(savedTab as ActiveTab)
    }
  }, [])

  // 当标签页改变时，保存到 localStorage
  useEffect(() => {
    if (isClient) {
      localStorage.setItem('dashboard-active-tab', activeTab)
    }
  }, [activeTab, isClient])

  // 通知管理
  const showSuccess = (message: string) => {
    setNotification({ type: 'success', message })
    setTimeout(() => setNotification(null), 3000)
  }

  const showError = (message: string) => {
    setNotification({ type: 'error', message })
    setTimeout(() => setNotification(null), 3000)
  }

  // 商品操作
  const handleSelectProduct = (productId: string, selected: boolean) => {
    if (selected) {
      setSelectedProducts(prev => [...prev, productId])
    } else {
      setSelectedProducts(prev => prev.filter(id => id !== productId))
    }
  }

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedProducts(products.map(p => p.id))
    } else {
      setSelectedProducts([])
    }
  }

  const handleRefresh = async () => {
    try {
      const response = await fetch('/api/products')
      const result = await response.json()
      if (result.success) {
        window.location.reload() // 刷新页面以重新加载商品数据
        showSuccess('商品数据已刷新')
      }
    } catch (error) {
      showError('刷新失败')
    }
  }

  const handleProductSave = async (productData: Omit<BusinessProduct, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      })
      const result = await response.json()
      
      if (result.success) {
        showSuccess('商品添加成功')
        await handleRefresh()
      } else {
        showError(result.error || '添加失败')
      }
    } catch (error) {
      showError('添加失败，请重试')
    }
  }

  const handleProductUpdate = async (productId: string, productData: Partial<Omit<BusinessProduct, 'id' | 'createdAt' | 'updatedAt'>>) => {
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      })
      const result = await response.json()
      
      if (result.success) {
        showSuccess('商品更新成功')
        await handleRefresh()
      } else {
        showError(result.error || '更新失败')
      }
    } catch (error) {
      showError('更新失败，请重试')
    }
  }

  const handleDeleteProduct = async (productId: string) => {
    const product = products.find(p => p.id === productId)
    if (!product) return

    const confirmed = window.confirm(`确定要删除商品"${product.name}"吗？此操作不可撤销。`)
    if (!confirmed) return

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE'
      })
      const result = await response.json()
      
      if (result.success) {
        showSuccess('删除成功')
        setSelectedProducts(prev => prev.filter(id => id !== productId))
        await handleRefresh()
      } else {
        showError(result.error || '删除失败')
      }
    } catch (error) {
      showError('删除失败，请重试')
    }
  }

  const handleBulkUploadFile = async (file: File) => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'products')

      const response = await fetch('/api/admin/bulk-upload', {
        method: 'POST',
        body: formData
      })
      const result = await response.json()
      
      if (result.success) {
        showSuccess(`批量上传成功，处理了 ${result.processed} 条记录`)
        await handleRefresh()
      } else {
        showError(result.error || '批量上传失败')
      }
    } catch (error) {
      showError('批量上传失败，请重试')
    }
  }

  // 退出登录
  const handleLogout = () => {
    localStorage.removeItem('user')
    router.push('/login')
  }

  // 如果不在客户端或者正在加载，显示加载状态
  if (!isClient || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">加载中...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    // 如果没有用户数据，显示提示信息并跳转到登录页面
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">请先登录</h2>
          <p className="text-gray-600 mb-6">您需要登录才能访问此页面</p>
          <button 
            onClick={() => router.push('/login')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            前往登录
          </button>
        </div>
      </div>
    )
  }

  // 渲染内容区域
  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <HomeContent user={user} dashboardStats={dashboardStats} />
      case 'video':
        return (
          <VideoGenerationWorkflow
            onComplete={(result) => {
              console.log('视频生成完成:', result)
              showSuccess('视频生成完成！')
            }}
            onError={(error) => {
              console.error('视频生成错误:', error)
              showError(error)
            }}
          />
        )
      case 'products':
        return (
          <ProductManagement
            products={products}
            selectedProducts={selectedProducts}
            onSelectProduct={handleSelectProduct}
            onSelectAll={handleSelectAll}
            onRefresh={handleRefresh}
            onBulkUpload={() => {}}
            onAdd={() => {}}
            onAnalyze={() => {}}
            onEdit={(product) => {}}
            onDelete={handleDeleteProduct}
            onProductSave={handleProductSave}
            onProductUpdate={handleProductUpdate}
            onBulkUploadFile={handleBulkUploadFile}
            categories={managedCategories}
            subcategories={managedSubcategories}
            countries={managedCountries}
            onCategoriesChange={updateCategories}
            onSubcategoriesChange={updateSubcategories}
            onCountriesChange={updateCountries}
            userRole={user.role}
          />
        )
      case 'history':
        return <HistoryContent history={history} />
      case 'settings':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">个人设置</h2>
              <p className="text-gray-600">管理您的账户设置和偏好</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">账户信息</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">用户名</label>
                  <p className="mt-1 text-sm text-gray-900">{user.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">邮箱</label>
                  <p className="mt-1 text-sm text-gray-900">{user.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">角色</label>
                  <p className="mt-1 text-sm text-gray-900">{user.role}</p>
                </div>
              </div>
            </div>
          </div>
        )
      default:
        return <HomeContent user={user} dashboardStats={dashboardStats} />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* 通知组件 */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
          notification.type === 'success' 
            ? 'bg-green-100 border border-green-400 text-green-700' 
            : notification.type === 'error'
            ? 'bg-red-100 border border-red-400 text-red-700'
            : 'bg-blue-100 border border-blue-400 text-blue-700'
        }`}>
          <div className="flex items-center">
            <span className="font-medium">{notification.message}</span>
            <button
              onClick={() => setNotification(null)}
              className="ml-4 text-lg font-bold hover:opacity-70"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* 顶部导航栏 */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">AI Video Generator</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                欢迎，{user.name}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* 主要内容区域 */}
      <div className="flex h-[calc(100vh-64px)]">
        {/* 左侧导航栏 */}
        <Sidebar
          user={user}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onLogout={handleLogout}
        />

        {/* 右侧内容区域 */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  )
}