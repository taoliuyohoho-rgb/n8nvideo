/**
 * React Query Provider 配置
 * 为应用提供统一的数据获取和缓存管理
 */

'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'

interface QueryProviderProps {
  children: React.ReactNode
}

export function QueryProvider({ children }: QueryProviderProps) {
  // 创建 QueryClient 实例，避免在每次渲染时重新创建
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // 默认配置
            staleTime: 60_000, // 1分钟内认为数据是新鲜的
            gcTime: 5 * 60_000, // 5分钟后清理缓存
            retry: 2, // 失败时重试2次
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // 指数退避
            refetchOnWindowFocus: false, // 窗口聚焦时不重新请求
            refetchOnMount: true, // 组件挂载时重新请求
            refetchOnReconnect: true, // 网络重连时重新请求
          },
          mutations: {
            retry: 1, // 变更操作只重试1次
            retryDelay: 1000,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* 开发环境下显示 React Query DevTools */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  )
}
