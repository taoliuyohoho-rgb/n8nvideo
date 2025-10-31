'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    // 确保在客户端环境中执行
    if (typeof window === 'undefined') {
      return
    }

    const checkAuth = () => {
      try {
        const userData = localStorage.getItem('user')
        if (userData) {
        const user = JSON.parse(userData)
        
        // 只有超管可以跳转到admin页面
        if (user.role === 'super_admin') {
          router.push('/admin')
        } else {
          // 其他用户（包括admin）跳转到dashboard
          router.push('/dashboard')
        }
        } else {
          router.push('/login')
        }
      } catch (error) {
        console.error('解析用户数据失败:', error)
        // 清除可能损坏的数据
        localStorage.removeItem('user')
        router.push('/login')
      } finally {
        setIsChecking(false)
      }
    }

    // 使用setTimeout确保在下一个事件循环中执行
    setTimeout(checkAuth, 100)
  }, [router])

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">检查登录状态...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">跳转中...</p>
      </div>
    </div>
  )
}