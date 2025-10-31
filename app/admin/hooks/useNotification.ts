/**
 * 通知管理 Hook
 * 
 * 功能：
 * - 统一管理通知状态
 * - 提供便捷的通知方法
 * - 自动隐藏通知
 */

import { useState, useCallback } from 'react'
import type { NotificationState, NotificationActions } from '@/types/admin-management'

export function useNotification(): [NotificationState | null, NotificationActions] {
  const [notification, setNotification] = useState<NotificationState | null>(null)

  const showSuccess = useCallback((message: string) => {
    setNotification({ type: 'success', message })
    setTimeout(() => setNotification(null), 3000)
  }, [])

  const showError = useCallback((message: string) => {
    setNotification({ type: 'error', message })
    setTimeout(() => setNotification(null), 3000)
  }, [])

  const showInfo = useCallback((message: string) => {
    setNotification({ type: 'info', message })
    setTimeout(() => setNotification(null), 3000)
  }, [])

  const hide = useCallback(() => {
    setNotification(null)
  }, [])

  return [notification, { showSuccess, showError, showInfo, hide }]
}
