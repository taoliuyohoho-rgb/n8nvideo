// Admin 数据管理 Hook

import { useState, useEffect } from 'react'
import type { CompatibleUser, CompatibleAIConfig, CompatiblePrompt, CompatibleTask, CompatiblePersonaFormData, CompatibleUserFormData, CompatiblePersona, CompatibleStyle, CompatibleProduct, CompatiblePainPoint } from '@/types/compat'
import type { PromptRule } from '@/types/prompt-rule'
import type { Product } from '../shared/types/product'

interface VerifiedModel {
  modelName: string
  name: string
  langs: string[]
  maxContext: number
  pricePer1kTokens: number
  toolUseSupport: boolean
  jsonModeSupport: boolean
}

interface VerifiedProvider {
  provider: string
  status: string
  models: VerifiedModel[]
  verified: boolean
  quotaError?: string
  lastQuotaCheck?: string
}

const createMockAdminUser = (): CompatibleUser => ({
  id: 'mock-admin',
  email: 'admin@example.com',
  name: '管理员',
  role: 'admin',
  isActive: true,
  createdAt: new Date().toISOString(),
  _count: { videos: 0 }
})

export function useAdminData() {
  const [user, setUser] = useState<CompatibleUser | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  
  // 从 localStorage 恢复上次的 tab 状态，默认为 'products'
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('admin_active_tab') || 'products'
    }
    return 'products'
  })
  
  // 数据状态
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [styles, setStyles] = useState<CompatibleStyle[]>([])
  const [painPoints, setPainPoints] = useState<CompatiblePainPoint[]>([])
  const [personas, setPersonas] = useState<CompatiblePersona[]>([])
  const [users, setUsers] = useState<CompatibleUser[]>([])
  const [aiConfig, setAiConfig] = useState<CompatibleAIConfig | null>(null)
  const [prompts, setPrompts] = useState<CompatiblePrompt[]>([])
  const [promptRules, setPromptRules] = useState<PromptRule[]>([])
  const [tasks, setTasks] = useState<CompatibleTask[]>([])
  const [verifiedModels, setVerifiedModels] = useState<VerifiedProvider[]>([])

  // 获取用户信息
  useEffect(() => {
    // 只在客户端执行
    if (typeof window === 'undefined') {
      return
    }

    console.log('useAdminData: 开始检查用户信息')
    const storedUser = localStorage.getItem('user')
    
    if (!storedUser) {
      console.log('useAdminData: 没有存储的用户信息，重定向到登录页')
      setLoading(false)
      window.location.href = '/login'
      return
    }

    try {
      const parsedUser = JSON.parse(storedUser)
      console.log('useAdminData: 成功解析用户信息', parsedUser)
      
      // 检查用户角色
      if (parsedUser.role !== 'admin' && parsedUser.role !== 'super_admin') {
        console.log('useAdminData: 用户不是管理员，重定向到首页')
        setLoading(false)
        window.location.href = '/'
        return
      }
      
      setUser(parsedUser)
      setLoading(false)
    } catch (error) {
      console.error('useAdminData: 解析用户信息失败:', error)
      // 清除可能损坏的数据
      localStorage.removeItem('user')
      setLoading(false)
      window.location.href = '/login'
    }
  }, [])

  // 保存 activeTab 状态到 localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin_active_tab', activeTab)
    }
  }, [activeTab])

  // 获取商品数据
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products')
        const result = await response.json()
        if (result.success) {
          setProducts(result.data.products)
          setCategories(result.data.categories || [])
        } else {
          console.error('获取商品数据失败:', result.error)
          // 设置默认数据，避免页面卡住
          setProducts([])
          setCategories([])
        }
      } catch (error) {
        console.error('获取商品数据失败:', error)
        // 设置默认数据，避免页面卡住
        setProducts([])
        setCategories([])
      }
    }

    fetchProducts()
  }, [])

  // 获取类目配置数据
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/admin/categories')
        const result = await response.json()
        if (result.success) {
          // 从API获取的类目数据更新到状态
          const flatCategories = result.data.flatCategories || []
          const categoryNames = flatCategories
            .filter((cat: any) => cat.level === 1) // 只取一级类目
            .map((cat: any) => cat.name)
          setCategories(categoryNames)
        } else {
          console.error('获取类目配置失败:', result.error)
        }
      } catch (error) {
        console.error('获取类目配置失败:', error)
      }
    }

    fetchCategories()
  }, [])

  // 获取风格数据
  useEffect(() => {
    const fetchStyles = async () => {
      try {
        const response = await fetch('/api/admin/styles')
        if (response.status === 404) {
          // API不存在，设置默认值
          setStyles([])
          return
        }
        const result = await response.json()
        if (result.success) {
          setStyles(result.data)
        } else {
          console.error('获取风格数据失败:', result.error)
          setStyles([])
        }
      } catch (error) {
        console.error('获取风格数据失败:', error)
        setStyles([])
      }
    }

    fetchStyles()
  }, [])

  // 获取痛点数据
  useEffect(() => {
    const fetchPainPoints = async () => {
      try {
        const response = await fetch('/api/admin/pain-points')
        const result = await response.json()
        if (result.success) {
          setPainPoints(result.data)
        } else {
          console.error('获取痛点数据失败:', result.error)
        }
      } catch (error) {
        console.error('获取痛点数据失败:', error)
      }
    }

    fetchPainPoints()
  }, [])

  // 获取人设数据
  useEffect(() => {
    const fetchPersonas = async () => {
      try {
        const response = await fetch('/api/admin/personas')
        const result = await response.json()
        if (result.success) {
          setPersonas(result.data)
        } else {
          console.error('获取人设数据失败:', result.error)
        }
      } catch (error) {
        console.error('获取人设数据失败:', error)
      }
    }

    fetchPersonas()
  }, [])

  // 获取用户数据
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/admin/users')
        const result = await response.json()
        if (result.success) {
          setUsers(result.data)
        } else {
          console.error('获取用户数据失败:', result.error)
        }
      } catch (error) {
        console.error('获取用户数据失败:', error)
      }
    }

    fetchUsers()
  }, [])

  // 获取AI配置
  useEffect(() => {
    const fetchAiConfig = async () => {
      try {
        const response = await fetch('/api/admin/ai-config')
        const result = await response.json()
        if (result.success) {
          setAiConfig(result.data)
        } else {
          console.error('获取AI配置失败:', result.error)
        }
      } catch (error) {
        console.error('获取AI配置失败:', error)
      }
    }

    fetchAiConfig()
  }, [])

  // 获取提示词数据
  useEffect(() => {
    const fetchPrompts = async () => {
      try {
        const response = await fetch('/api/admin/prompts')
        const result = await response.json()
        if (result.success) {
          setPrompts(result.data)
        } else {
          console.error('获取提示词数据失败:', result.error)
        }
      } catch (error) {
        console.error('获取提示词数据失败:', error)
      }
    }

    fetchPrompts()
  }, [])

  // 获取提示词规则数据
  useEffect(() => {
    const fetchPromptRules = async () => {
      try {
        const response = await fetch('/api/admin/prompt-rules')
        const result = await response.json()
        if (result.success) {
          setPromptRules(result.data)
        } else {
          console.error('获取提示词规则数据失败:', result.error)
        }
      } catch (error) {
        console.error('获取提示词规则数据失败:', error)
      }
    }

    fetchPromptRules()
  }, [])

  // 获取任务数据
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await fetch('/api/admin/tasks')
        if (response.status === 404) {
          // API不存在，设置默认值
          setTasks([])
          return
        }
        const result = await response.json()
        if (result.success) {
          setTasks(result.data)
        } else {
          console.error('获取任务数据失败:', result.error)
          setTasks([])
        }
      } catch (error) {
        console.error('获取任务数据失败:', error)
        setTasks([])
      }
    }

    fetchTasks()
  }, [])

  // 获取已验证模型
  useEffect(() => {
    const fetchVerifiedModels = async () => {
      try {
        const response = await fetch('/api/admin/verified-models')
        const result = await response.json()
        if (result.success) {
          // API 已经返回按 provider 分组的格式，直接使用
          // result.data 的格式：[{ provider, status, models: [...], verified, quotaError }]
          setVerifiedModels(result.data || [])
        } else {
          console.error('获取已验证模型失败:', result.error)
        }
      } catch (error) {
        console.error('获取已验证模型失败:', error)
      }
    }

    fetchVerifiedModels()
  }, [])

  // 删除商品
  const deleteProduct = async (productId: string) => {
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      })
      const result = await response.json()
      
      if (result.success) {
        // 从本地状态中移除已删除的商品
        setProducts(prevProducts => prevProducts.filter(p => p.id !== productId))
        return { success: true, message: result.message }
      } else {
        return { success: false, error: result.error || '删除失败' }
      }
    } catch (error) {
      console.error('删除商品失败:', error)
      return { success: false, error: '删除商品失败' }
    }
  }

  // 人设管理函数
  const addPersona = async (personaData: CompatiblePersonaFormData) => {
    try {
      const response = await fetch('/api/admin/personas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(personaData)
      })
      const result = await response.json()
      
      if (result.success) {
        // 刷新人设列表
        const refreshResponse = await fetch('/api/admin/personas')
        const refreshResult = await refreshResponse.json()
        if (refreshResult.success) {
          setPersonas(refreshResult.data)
        }
        return { success: true, message: '人设创建成功' }
      } else {
        return { success: false, error: result.error || '创建失败' }
      }
    } catch (error) {
      console.error('创建人设失败:', error)
      return { success: false, error: '创建人设失败' }
    }
  }

  const editPersona = async (personaId: string, personaData: Partial<CompatiblePersonaFormData>) => {
    try {
      const response = await fetch(`/api/admin/personas/${personaId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(personaData)
      })
      const result = await response.json()
      
      if (result.success) {
        // 刷新人设列表
        const refreshResponse = await fetch('/api/admin/personas')
        const refreshResult = await refreshResponse.json()
        if (refreshResult.success) {
          setPersonas(refreshResult.data)
        }
        return { success: true, message: '人设更新成功' }
      } else {
        return { success: false, error: result.error || '更新失败' }
      }
    } catch (error) {
      console.error('更新人设失败:', error)
      return { success: false, error: '更新人设失败' }
    }
  }

  const deletePersona = async (personaId: string) => {
    try {
      const response = await fetch(`/api/admin/personas/${personaId}`, {
        method: 'DELETE',
      })
      const result = await response.json()
      
      if (result.success) {
        // 从本地状态中移除已删除的人设
        setPersonas(prevPersonas => prevPersonas.filter(p => p.id !== personaId))
        return { success: true, message: '人设删除成功' }
      } else {
        return { success: false, error: result.error || '删除失败' }
      }
    } catch (error) {
      console.error('删除人设失败:', error)
      return { success: false, error: '删除人设失败' }
    }
  }

  const refreshPersonas = async () => {
    try {
      const response = await fetch('/api/admin/personas')
      const result = await response.json()
      if (result.success) {
        setPersonas(result.data)
        return { success: true, message: '人设数据已刷新' }
      } else {
        return { success: false, error: '刷新失败' }
      }
    } catch (error) {
      console.error('刷新人设失败:', error)
      return { success: false, error: '刷新人设失败' }
    }
  }

  // 用户管理函数
  const addUser = async (userData: CompatibleUserFormData) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      })
      const result = await response.json()
      
      if (result.success) {
        // 刷新用户列表
        const refreshResponse = await fetch('/api/admin/users')
        const refreshResult = await refreshResponse.json()
        if (refreshResult.success) {
          setUsers(refreshResult.data)
        }
        return { success: true, message: '用户创建成功' }
      } else {
        return { success: false, error: result.error || '创建失败' }
      }
    } catch (error) {
      console.error('创建用户失败:', error)
      return { success: false, error: '创建用户失败' }
    }
  }

  const editUser = async (userId: string, userData: Partial<CompatibleUserFormData>) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      })
      const result = await response.json()
      
      if (result.success) {
        // 刷新用户列表
        const refreshResponse = await fetch('/api/admin/users')
        const refreshResult = await refreshResponse.json()
        if (refreshResult.success) {
          setUsers(refreshResult.data)
        }
        return { success: true, message: '用户更新成功' }
      } else {
        return { success: false, error: result.error || '更新失败' }
      }
    } catch (error) {
      console.error('更新用户失败:', error)
      return { success: false, error: '更新用户失败' }
    }
  }

  const deleteUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      })
      const result = await response.json()
      
      if (result.success) {
        // 从本地状态中移除已删除的用户
        setUsers(prevUsers => prevUsers.filter(u => u.id !== userId))
        return { success: true, message: '用户删除成功' }
      } else {
        return { success: false, error: result.error || '删除失败' }
      }
    } catch (error) {
      console.error('删除用户失败:', error)
      return { success: false, error: '删除用户失败' }
    }
  }

  // 保存类目配置
  const saveCategoriesConfig = async (categories: string[], subcategories: string[], countries: string[]) => {
    console.log('useAdminData: 开始保存类目配置', { categories, subcategories, countries })
    
    try {
      const response = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categories,
          subcategories,
          countries
        })
      })
      
      console.log('useAdminData: API响应状态', response.status)
      const result = await response.json()
      console.log('useAdminData: API响应结果', result)
      
      if (result.success) {
        // 更新本地状态
        setCategories(categories)
        console.log('useAdminData: 本地状态已更新')
        return { success: true, message: '类目配置保存成功' }
      } else {
        console.error('useAdminData: API返回失败', result.error)
        return { success: false, error: result.error || '保存失败' }
      }
    } catch (error) {
      console.error('useAdminData: 保存类目配置失败:', error)
      return { success: false, error: '保存类目配置失败' }
    }
  }

  // 删除类目
  const deleteCategory = async (categoryId: string) => {
    try {
      const response = await fetch(`/api/admin/categories?id=${categoryId}`, {
        method: 'DELETE',
      })
      const result = await response.json()
      
      if (result.success) {
        // 刷新类目列表
        const refreshResponse = await fetch('/api/admin/categories')
        const refreshResult = await refreshResponse.json()
        if (refreshResult.success) {
          const flatCategories = refreshResult.data.flatCategories || []
          const categoryNames = flatCategories
            .filter((cat: any) => cat.level === 1)
            .map((cat: any) => cat.name)
          setCategories(categoryNames)
        }
        return { success: true, message: '类目删除成功' }
      } else {
        return { success: false, error: result.error || '删除失败' }
      }
    } catch (error) {
      console.error('删除类目失败:', error)
      return { success: false, error: '删除类目失败' }
    }
  }

  return {
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
  }
}
