// 侧边栏导航组件

import { 
  Home, 
  Video, 
  Package, 
  History, 
  Settings,
  User,
  LogOut
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { User as UserType, ActiveTab } from '../types'

interface SidebarProps {
  user: UserType
  activeTab: ActiveTab
  onTabChange: (tab: ActiveTab) => void
  onLogout: () => void
}

export function Sidebar({ user, activeTab, onTabChange, onLogout }: SidebarProps) {
  const menuItems = [
    { id: 'home' as ActiveTab, label: '首页', icon: Home },
    { id: 'video' as ActiveTab, label: '视频生成', icon: Video },
    { id: 'products' as ActiveTab, label: '商品管理', icon: Package },
    { id: 'history' as ActiveTab, label: '历史记录', icon: History },
    { id: 'settings' as ActiveTab, label: '个人设置', icon: Settings },
  ]

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* 用户信息 */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user.name}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {user.email}
            </p>
          </div>
        </div>
      </div>

      {/* 导航菜单 */}
      <nav className="flex-1 px-4 py-4">
        <div className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  activeTab === item.id 
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </button>
            )
          })}
        </div>
      </nav>

      {/* 底部操作 */}
      <div className="p-4 border-t border-gray-200">
        <Button
          variant="ghost"
          className="w-full justify-start text-gray-700 hover:text-red-700 hover:bg-red-50"
          onClick={onLogout}
        >
          <LogOut className="h-4 w-4 mr-2" />
          退出登录
        </Button>
      </div>
    </div>
  )
}
