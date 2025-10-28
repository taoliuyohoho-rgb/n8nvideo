'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // 检查是否已登录
    const userData = localStorage.getItem('user')
    if (userData) {
      // 所有用户都跳转到dashboard，管理员在dashboard中可以看到管理入口
      router.push('/dashboard')
    } else {
      router.push('/login')
    }
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">跳转中...</p>
      </div>
    </div>
  )
}