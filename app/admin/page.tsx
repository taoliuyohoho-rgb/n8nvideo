'use client'

import { useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { UserManagement } from './features/users/UserManagement'
import { PersonaManagement } from './features/personas/PersonaManagement'
import { TaskManagement } from './features/tasks/TaskManagement'
import { ProductManagement } from './features/products/ProductManagement'
import { AIConfigTab } from './components/AIConfigTab'
import { PromptsTab } from './components/PromptsTab'
import { UserFormModal } from './components/UserFormModal'
import { useAdminData } from './hooks/useAdminData'
import { useNotification } from './hooks/useNotification'
import { useProductManagement } from './hooks/useProductManagement'
import { useUserManagement } from './hooks/useUserManagement'
import { usePersonaManagement } from './hooks/usePersonaManagement'
import { 
  Package, 
  Users, 
  Brain, 
  FileText, 
  Settings,
  BarChart3,
  ArrowLeft,
  LineChart,
  Video,
  Link as LinkIcon
} from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function AdminPage() {
  const router = useRouter()
  const {
    user,
    loading,
    activeTab,
    setActiveTab,
    products,
    setProducts,
    categories,
    setCategories,
    styles,
    setStyles,
    painPoints,
    setPainPoints,
    personas,
    setPersonas,
    users,
    setUsers,
    aiConfig,
    setAiConfig,
    prompts,
    setPrompts,
    promptRules,
    setPromptRules,
    tasks,
    setTasks,
    verifiedModels,
    setVerifiedModels,
    deleteProduct,
    addPersona,
    editPersona,
    deletePersona,
    refreshPersonas,
    addUser,
    editUser,
    deleteUser,
    saveCategoriesConfig,
    deleteCategory
  } = useAdminData()

  // 通知管理
  const [notification, notificationActions] = useNotification()

  // 商品管理
  const productManagement = useProductManagement({
    products,
    setProducts,
    showSuccess: notificationActions.showSuccess,
    showError: notificationActions.showError,
    deleteProduct
  })

  // 刷新用户列表函数
  const refreshUsers = async () => {
    try {
      const response = await fetch('/api/admin/users')
      const result = await response.json()
      if (result.success) {
        setUsers(result.data)
      }
    } catch (error) {
      console.error('刷新用户列表失败:', error)
    }
  }

  // 用户管理
  const userManagement = useUserManagement({
    users,
    setUsers,
    showSuccess: notificationActions.showSuccess,
    showError: notificationActions.showError,
    handleRefresh: refreshUsers
  })

  // 人设管理
  const personaManagement = usePersonaManagement({
    personas,
    showSuccess: notificationActions.showSuccess,
    showError: notificationActions.showError,
    deletePersona,
    refreshPersonas
  })

  // 返回工作台
  const handleBackToDashboard = () => {
    router.push('/dashboard')
  }

  // 开发环境下仅在关键状态变化时输出一次调试信息
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.debug('AdminPage state:', { loading, user: !!user, activeTab })
    }
  }, [loading, user, activeTab])

  // 检查用户权限 - admin 和 super_admin 可以访问
  useEffect(() => {
    if (!loading && user && user.role !== 'admin' && user.role !== 'super_admin') {
      console.log('用户权限不足，重定向到首页')
      router.push('/')
    }
  }, [loading, user, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">加载中...</p>
          <p className="text-sm text-gray-500 mt-2">调试: loading={loading.toString()}, user={user ? 'exists' : 'null'}</p>
        </div>
      </div>
    )
  }

  // 如果用户不是管理员，显示无权限页面
  if (user && user.role !== 'admin' && user.role !== 'super_admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">无权限访问</h1>
          <p className="text-gray-600 mb-4">只有管理员才能访问管理后台</p>
          <button 
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            返回首页
          </button>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg">
          <p className="text-gray-600 text-lg mb-4">用户未登录</p>
          <p className="text-sm text-gray-500 mb-4">正在重定向到登录页面...</p>
          <button 
            onClick={() => router.push('/login')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            前往登录
          </button>
        </div>
      </div>
    )
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
              onClick={notificationActions.hide}
              className="ml-4 text-lg font-bold hover:opacity-70"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* 顶部导航栏 */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">管理后台</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBackToDashboard}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors duration-200"
              >
                <ArrowLeft className="h-4 w-4" />
                返回工作台
              </button>
              <div className="text-sm text-gray-500">
                欢迎，{user.name}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="products" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              商品管理
            </TabsTrigger>
            <TabsTrigger value="tasks" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              任务管理
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <LineChart className="h-4 w-4" />
              数据分析
            </TabsTrigger>
            <TabsTrigger value="personas" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              人设管理
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              用户管理
            </TabsTrigger>
            <TabsTrigger value="ai-config" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              AI配置
            </TabsTrigger>
            <TabsTrigger value="prompts" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              提示词管理
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products">
            <ProductManagement 
              products={products}
              selectedProducts={productManagement.selectedProducts}
              onSelectProduct={productManagement.handleSelectProduct}
              onSelectAll={productManagement.handleSelectAll}
              onRefresh={productManagement.handleRefresh}
              onBulkUpload={() => {}} // 现在由组件内部处理
              onAdd={() => {}} // 现在由组件内部处理
              onAnalyze={() => {}} // 商品分析由ProductManagement组件内部处理，这里传递空函数即可
              onEdit={(product) => {}} // 现在由组件内部处理，但需要传递product参数
              onDelete={productManagement.handleDeleteProduct}
              onProductSave={productManagement.handleProductSave}
              onProductUpdate={productManagement.handleProductUpdate}
              onBulkUploadFile={productManagement.handleBulkUploadFile}
              categories={productManagement.managedCategories}
              subcategories={productManagement.managedSubcategories}
              countries={productManagement.managedCountries}
              onCategoriesChange={productManagement.setManagedCategories}
              onSubcategoriesChange={productManagement.setManagedSubcategories}
              onCountriesChange={productManagement.setManagedCountries}
              userRole={user.role}
              onSaveCategoriesConfig={saveCategoriesConfig}
              onRefreshCategoriesConfig={productManagement.refreshCategoriesConfig}
            />
          </TabsContent>

          <TabsContent value="tasks">
            <TaskManagement 
              RecommendationMonitorComponent={() => (
                <div className="border rounded-lg overflow-hidden" style={{ height: '60vh' }}>
                  <iframe
                    src="/admin/recommend/monitor"
                    style={{ width: '100%', height: '100%' }}
                    title="推荐系统监控"
                  />
                </div>
              )}
            />
          </TabsContent>

          <TabsContent value="personas">
            <PersonaManagement 
              personas={personas}
              onDelete={personaManagement.handleDeletePersona}
              onRefresh={personaManagement.handleRefreshPersonas}
            />
          </TabsContent>

          <TabsContent value="users">
            <UserManagement 
              users={users}
              onAdd={userManagement.handleAddUser}
              onEdit={userManagement.handleEditUser}
              onDelete={userManagement.handleDeleteUser}
            />
          </TabsContent>

          <TabsContent value="ai-config">
            <AIConfigTab 
              aiConfig={aiConfig}
              verifiedModels={verifiedModels}
              onConfigUpdate={(config) => setAiConfig(config)}
              onVerifiedModelsUpdate={(models: string[]) => {
                // 将 string[] 转换为 VerifiedProvider[] 格式
                // 这里需要根据实际需求来实现转换逻辑
                console.log('Verified models update requested:', models)
              }}
            />
          </TabsContent>

          <TabsContent value="prompts">
            <PromptsTab 
              prompts={prompts}
              onPromptsUpdate={(prompts) => setPrompts(prompts)}
            />
          </TabsContent>

          <TabsContent value="analytics">
            <div className="space-y-6">
              {/* 数据看板 */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h2 className="text-2xl font-semibold">数据看板</h2>
                    <p className="text-sm text-gray-600 mt-1">广告表现数据分析和洞察</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => window.open('/admin/dashboard', '_blank')}>
                      在新窗口打开
                    </Button>
                  </div>
                </div>
                <div className="border rounded-lg overflow-hidden" style={{ height: '70vh' }}>
                  <iframe
                    src="/admin/dashboard"
                    style={{ width: '100%', height: '100%' }}
                    title="数据看板"
                  />
                </div>
              </div>

              {/* 视频分析中心 */}
              <div>
                <div className="flex justify-between items-center mb-4 pt-2">
                  <div>
                    <h2 className="text-2xl font-semibold flex items-center gap-2">
                      <Video className="h-6 w-6" />
                      视频分析中心
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">视频上传分析、URL分析、竞品分析</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => window.open('/admin/video-analysis', '_blank')}>
                      在新窗口打开
                    </Button>
                  </div>
                </div>
                <div className="border rounded-lg overflow-hidden" style={{ height: '70vh' }}>
                  <iframe
                    src="/admin/video-analysis"
                    style={{ width: '100%', height: '100%' }}
                    title="视频分析中心"
                  />
                </div>
              </div>

              {/* 商品映射管理 */}
              <div>
                <div className="flex justify-between items-center mb-4 pt-2">
                  <div>
                    <h2 className="text-2xl font-semibold flex items-center gap-2">
                      <LinkIcon className="h-6 w-6" />
                      商品映射管理
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">管理商品与广告平台的映射关系</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => window.open('/admin/mapping', '_blank')}>
                      在新窗口打开
                    </Button>
                  </div>
                </div>
                <div className="border rounded-lg overflow-hidden" style={{ height: '70vh' }}>
                  <iframe
                    src="/admin/mapping"
                    style={{ width: '100%', height: '100%' }}
                    title="商品映射管理"
                  />
                </div>
              </div>
            </div>
          </TabsContent>

        </Tabs>
      </div>

      {/* 用户表单模态框 */}
      <UserFormModal
        isOpen={userManagement.isAddModalOpen}
        onClose={() => userManagement.setIsAddModalOpen(false)}
        onSubmit={userManagement.handleAddUserSubmit}
        title="添加用户"
      />

      <UserFormModal
        isOpen={userManagement.isEditModalOpen}
        onClose={() => {
          userManagement.setIsEditModalOpen(false)
          userManagement.setEditingUser(null)
        }}
        onSubmit={userManagement.handleEditUserSubmit}
        user={userManagement.editingUser}
        title="编辑用户"
      />
    </div>
  )
}