// 历史记录内容组件

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Video,
  Package,
  User,
  Settings,
  RefreshCw
} from 'lucide-react'
import type { HistoryItem } from '../types'

interface HistoryContentProps {
  history: HistoryItem[]
}

export function HistoryContent({ history }: HistoryContentProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'pending':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="h-4 w-4 text-blue-500" />
      case 'product':
        return <Package className="h-4 w-4 text-purple-500" />
      case 'user':
        return <User className="h-4 w-4 text-green-500" />
      case 'system':
        return <Settings className="h-4 w-4 text-gray-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800">成功</Badge>
      case 'error':
        return <Badge className="bg-red-100 text-red-800">失败</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">进行中</Badge>
      default:
        return <Badge variant="secondary">未知</Badge>
    }
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'video':
        return <Badge className="bg-blue-100 text-blue-800">视频</Badge>
      case 'product':
        return <Badge className="bg-purple-100 text-purple-800">商品</Badge>
      case 'user':
        return <Badge className="bg-green-100 text-green-800">用户</Badge>
      case 'system':
        return <Badge className="bg-gray-100 text-gray-800">系统</Badge>
      default:
        return <Badge variant="outline">其他</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* 标题和操作 */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">操作历史</h2>
          <p className="text-gray-600">查看系统操作记录和状态</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" className="flex items-center space-x-2">
            <RefreshCw className="h-4 w-4" />
            <span>刷新</span>
          </Button>
          <Button variant="outline">
            导出记录
          </Button>
        </div>
      </div>

      {/* 统计概览 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">成功操作</p>
                <p className="text-2xl font-bold text-gray-900">
                  {history.filter(item => item.status === 'success').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">失败操作</p>
                <p className="text-2xl font-bold text-gray-900">
                  {history.filter(item => item.status === 'error').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">进行中</p>
                <p className="text-2xl font-bold text-gray-900">
                  {history.filter(item => item.status === 'pending').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">总操作数</p>
                <p className="text-2xl font-bold text-gray-900">
                  {history.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 历史记录列表 */}
      <Card>
        <CardHeader>
          <CardTitle>操作记录</CardTitle>
          <CardDescription>最近的操作历史和状态</CardDescription>
        </CardHeader>
        <CardContent>
          {history.length > 0 ? (
            <div className="space-y-4">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-shrink-0">
                    {getStatusIcon(item.status)}
                  </div>
                  
                  <div className="flex-shrink-0">
                    {getTypeIcon(item.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {item.action}
                      </h4>
                      {getStatusBadge(item.status)}
                      {getTypeBadge(item.type)}
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {item.description}
                    </p>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      <span>操作人: {item.user}</span>
                      <span>时间: {new Date(item.timestamp).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex-shrink-0">
                    <Button variant="ghost" size="sm">
                      查看详情
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">暂无历史记录</h3>
              <p className="text-gray-500">还没有任何操作记录</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
