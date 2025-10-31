// 首页内容组件

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Video, 
  Image, 
  CheckCircle, 
  TrendingUp, 
  Settings 
} from 'lucide-react'
import { UsageStatsTable } from './UsageStatsTable'
import type { User, DashboardStats } from '../types'

interface HomeContentProps {
  user: User
  dashboardStats: DashboardStats | null
}

export function HomeContent({ user, dashboardStats }: HomeContentProps) {
  return (
    <div className="space-y-6">
      {/* 欢迎区域 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">欢迎回来，{user.name}！</h1>
          <p className="text-gray-600 mt-1">首页</p>
        </div>
        {user.role === 'super_admin' && (
          <Button 
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => window.open('/admin', '_blank')}
          >
            <Settings className="h-4 w-4 mr-2" />
            管理后台
          </Button>
        )}
      </div>

      {/* 数据大盘 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-white rounded-lg shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">已制作视频</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardStats?.dashboard?.totalVideos || 0}
                </p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">
                    本月新增 {dashboardStats?.videos?.monthlyVideos || 0}
                  </span>
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
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardStats?.dashboard?.totalProducts || 0}
                </p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">商品库总数</span>
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
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardStats?.dashboard?.usageDays || 0}
                </p>
                <p className="text-sm text-gray-500">系统运行天数</p>
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
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardStats?.dashboard?.efficiency || 0}%
                </p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600" title={dashboardStats?.dashboard?.efficiencyNote}>
                    平均制作效率
                  </span>
                </div>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 快速操作 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-500 rounded-lg">
                <Video className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-blue-900">开始制作视频</h3>
                <p className="text-blue-700 text-sm">使用AI快速生成UGC视频</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-purple-500 rounded-lg">
                <Image className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-purple-900">管理商品库</h3>
                <p className="text-purple-700 text-sm">查看和管理商品素材</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-500 rounded-lg">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-green-900">查看历史</h3>
                <p className="text-green-700 text-sm">查看操作历史和记录</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 组织人员使用情况统计（仅管理员和超管可见） */}
      {(user.role === 'admin' || user.role === 'super_admin') && (
        <div className="mt-8">
          <UsageStatsTable currentUserRole={user.role} />
        </div>
      )}
    </div>
  )
}
