'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/simple-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const result = await response.json()

      if (result.success) {
        // 保存用户信息到localStorage
        const userData = JSON.stringify(result.data)
        localStorage.setItem('user', userData)
        console.log('登录成功，用户信息已保存:', result.data)
        console.log('localStorage 中的用户信息:', localStorage.getItem('user'))
        
        // 根据用户角色跳转
        if (result.data.role === 'admin' || result.data.role === 'super_admin') {
          console.log('跳转到 admin 页面')
          router.push('/admin')
        } else {
          console.log('跳转到 dashboard 页面')
          router.push('/dashboard')
        }
      } else {
        setError(result.error || '登录失败')
      }
    } catch (error) {
      console.error('登录错误:', error)
      setError('登录失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">用户登录</CardTitle>
          <CardDescription>
            请输入您的邮箱和密码登录系统
          </CardDescription>
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md text-left">
            <p className="text-sm text-blue-800 font-medium mb-1">默认管理员账号：</p>
            <p className="text-xs text-blue-700">邮箱: admin@126.com</p>
            <p className="text-xs text-blue-700">密码: dongnanyaqifei</p>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">邮箱</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="请输入邮箱"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                required
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? '登录中...' : '登录'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}