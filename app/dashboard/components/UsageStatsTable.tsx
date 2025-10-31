'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Users, Video, FileText, Package, TrendingUp, Search } from 'lucide-react'
import type { UserUsageStats } from '../types'

interface UsageStatsTableProps {
  currentUserRole: string
}

export function UsageStatsTable({ currentUserRole }: UsageStatsTableProps) {
  const [loading, setLoading] = useState(true)
  const [usageStats, setUsageStats] = useState<UserUsageStats[]>([])
  const [summary, setSummary] = useState({
    totalUsers: 0,
    totalVideos: 0,
    totalPersonas: 0,
    totalScripts: 0,
    totalProducts: 0,
    activeUsers: 0,
  })
  const [nameFilter, setNameFilter] = useState('')
  const [debouncedNameFilter, setDebouncedNameFilter] = useState('')

  // 防抖搜索
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedNameFilter(nameFilter)
    }, 300)

    return () => clearTimeout(timer)
  }, [nameFilter])

  // 获取使用统计数据
  useEffect(() => {
    const fetchUsageStats = async () => {
      setLoading(true)
      try {
        // 从 localStorage 获取用户信息并传递给 API
        const userStr = localStorage.getItem('user')
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        }
        
        if (userStr) {
          headers['x-user-info'] = userStr
        }

        const url = new URL('/api/admin/users/usage-stats', window.location.origin)
        if (debouncedNameFilter) {
          url.searchParams.set('name', debouncedNameFilter)
        }

        const response = await fetch(url.toString(), { headers })
        const result = await response.json()

        if (result.success) {
          setUsageStats(result.data.users)
          setSummary(result.data.summary)
        } else {
          console.error('获取使用统计失败:', result.error)
        }
      } catch (error) {
        console.error('获取使用统计失败:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUsageStats()
  }, [debouncedNameFilter])

  // 格式化日期
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '无活动'
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days === 0) return '今天'
    if (days === 1) return '昨天'
    if (days < 7) return `${days}天前`
    if (days < 30) return `${Math.floor(days / 7)}周前`
    return date.toLocaleDateString('zh-CN')
  }

  // 获取角色显示名称
  const getRoleDisplay = (role: string) => {
    const roleMap: Record<string, string> = {
      super_admin: '超级管理员',
      admin: '管理员',
      operator: '运营',
    }
    return roleMap[role] || role
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="bg-white rounded-lg shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-center h-32">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 汇总统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-blue-700">总用户数</p>
                <p className="text-xl font-bold text-blue-900">{summary.totalUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-500 rounded-lg">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-green-700">活跃用户</p>
                <p className="text-xl font-bold text-green-900">{summary.activeUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-500 rounded-lg">
                <Video className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-purple-700">总视频数</p>
                <p className="text-xl font-bold text-purple-900">{summary.totalVideos}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-500 rounded-lg">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-orange-700">总人设数</p>
                <p className="text-xl font-bold text-orange-900">{summary.totalPersonas}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-teal-50 to-teal-100 border-teal-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-teal-500 rounded-lg">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-teal-700">总脚本数</p>
                <p className="text-xl font-bold text-teal-900">{summary.totalScripts}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-pink-50 to-pink-100 border-pink-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-pink-500 rounded-lg">
                <Package className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-pink-700">总商品数</p>
                <p className="text-xl font-bold text-pink-900">{summary.totalProducts}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 用户使用情况表格 */}
      <Card className="bg-white rounded-lg shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900">
              人员使用情况统计
            </CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="搜索用户名..."
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    用户名
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    邮箱
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    角色
                  </th>
                  {currentUserRole === 'super_admin' && (
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      组织
                    </th>
                  )}
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    视频数
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    人设数
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    脚本数
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    商品数
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    总操作数
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    最近活跃
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {usageStats.length === 0 ? (
                  <tr>
                    <td
                      colSpan={currentUserRole === 'super_admin' ? 10 : 9}
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      暂无数据
                    </td>
                  </tr>
                ) : (
                  usageStats.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.email}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.role === 'super_admin'
                              ? 'bg-red-100 text-red-800'
                              : user.role === 'admin'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {getRoleDisplay(user.role)}
                        </span>
                      </td>
                      {currentUserRole === 'super_admin' && (
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{user.organizationName}</div>
                        </td>
                      )}
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        <span className="text-sm font-medium text-purple-600">{user.videoCount}</span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        <span className="text-sm font-medium text-orange-600">{user.personaCount}</span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        <span className="text-sm font-medium text-teal-600">{user.scriptCount}</span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        <span className="text-sm font-medium text-pink-600">{user.productCount}</span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        <span className="text-sm font-bold text-blue-600">{user.totalActions}</span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{formatDate(user.lastActivity)}</div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

