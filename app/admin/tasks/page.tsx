'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RefreshCw, CheckCircle, XCircle, Clock, Play, Loader2, Eye, X } from 'lucide-react'

interface Task {
  id: string
  type: string
  status: string
  priority: number
  payload: any
  result: any
  error: string | null
  progress: number
  traceId: string | null
  ownerId: string | null
  workerName: string | null
  retryCount: number
  maxRetries: number
  createdAt: string
  startedAt: string | null
  completedAt: string | null
}

interface TaskLog {
  id: string
  level: string
  message: string
  data: any
  timestamp: string
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [taskLogs, setTaskLogs] = useState<TaskLog[]>([])
  const [filterType, setFilterType] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [autoRefresh, setAutoRefresh] = useState(false)

  // 获取任务列表
  const fetchTasks = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterType !== 'all') params.append('type', filterType)
      if (filterStatus !== 'all') params.append('status', filterStatus)
      params.append('limit', '100')

      console.log('[TasksPage] Fetching tasks with params:', params.toString())
      const response = await fetch(`/api/tasks?${params}`)
      
      if (!response.ok) {
        console.error('[TasksPage] HTTP error:', response.status, response.statusText)
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const result = await response.json()
      
      console.log('[TasksPage] Tasks API response:', result)
      
      if (result.success) {
        setTasks(result.data.tasks)
        console.log('[TasksPage] Tasks set successfully:', result.data.tasks.length)
      } else {
        console.error('[TasksPage] API returned error:', result.error)
        alert(`获取任务失败: ${result.error}`)
      }
    } catch (error) {
      console.error('[TasksPage] Failed to fetch tasks:', error)
      alert(`获取任务失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setLoading(false)
    }
  }

  // 获取任务日志
  const fetchTaskLogs = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/logs`)
      const result = await response.json()
      
      if (result.success) {
        setTaskLogs(result.data.logs)
      }
    } catch (error) {
      console.error('Failed to fetch task logs:', error)
    }
  }

  // 查看任务详情
  const viewTaskDetails = async (task: Task) => {
    setSelectedTask(task)
    await fetchTaskLogs(task.id)
  }

  // 取消任务
  const cancelTask = async (taskId: string) => {
    if (!confirm('确定要取消这个任务吗？')) return

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      })
      const result = await response.json()
      
      if (result.success) {
        alert('任务已取消')
        fetchTasks()
      }
    } catch (error) {
      console.error('Failed to cancel task:', error)
      alert('取消任务失败')
    }
  }

  // 初始加载
  useEffect(() => {
    console.log('[TasksPage] Component mounted, fetching tasks...')
    fetchTasks()
  }, [filterType, filterStatus])

  // 自动刷新
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      fetchTasks()
      if (selectedTask) {
        fetchTaskLogs(selectedTask.id)
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [autoRefresh, selectedTask])

  // 状态徽章
  const StatusBadge = ({ status }: { status: string }) => {
    const variants: Record<string, { color: string; icon: any }> = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      running: { color: 'bg-blue-100 text-blue-800', icon: Loader2 },
      succeeded: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      failed: { color: 'bg-red-100 text-red-800', icon: XCircle },
      canceled: { color: 'bg-gray-100 text-gray-800', icon: X },
    }

    const variant = variants[status] || variants.pending
    const Icon = variant.icon

    return (
      <Badge className={`${variant.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 页头 */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">任务监控</h1>
          <p className="text-gray-600 mt-1">查看和管理所有异步任务</p>
        </div>

        {/* 筛选器 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>筛选器</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-center">
              <div className="flex-1">
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger>
                    <SelectValue placeholder="任务类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">所有类型</SelectItem>
                    <SelectItem value="video_generation">视频生成</SelectItem>
                    <SelectItem value="product_analysis">商品分析</SelectItem>
                    <SelectItem value="comment_scraping">评论爬取</SelectItem>
                    <SelectItem value="style_parsing">风格解析</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="任务状态" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">所有状态</SelectItem>
                    <SelectItem value="pending">待处理</SelectItem>
                    <SelectItem value="running">进行中</SelectItem>
                    <SelectItem value="succeeded">已完成</SelectItem>
                    <SelectItem value="failed">失败</SelectItem>
                    <SelectItem value="canceled">已取消</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={fetchTasks} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                刷新
              </Button>

              <Button
                variant={autoRefresh ? 'default' : 'outline'}
                onClick={() => setAutoRefresh(!autoRefresh)}
              >
                {autoRefresh ? '停止' : '启动'}自动刷新
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 任务列表 */}
        <Card>
          <CardHeader>
            <CardTitle>任务列表</CardTitle>
            <CardDescription>共 {tasks.length} 个任务</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                <div className="text-center text-gray-500 py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                  <p>加载中...</p>
                </div>
              ) : tasks.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <p className="text-lg mb-2">暂无任务</p>
                  <p className="text-sm">当前筛选条件: 类型={filterType}, 状态={filterStatus}</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => {
                      setFilterType('all')
                      setFilterStatus('all')
                    }}
                  >
                    重置筛选条件
                  </Button>
                </div>
              ) : (
                tasks.map((task) => (
                  <div
                    key={task.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium">{task.type}</h3>
                          <StatusBadge status={task.status} />
                          {task.priority > 0 && (
                            <Badge variant="outline">优先级: {task.priority}</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">
                          任务ID: {task.id}
                        </p>
                        {task.traceId && (
                          <p className="text-xs text-gray-500">
                            TraceID: {task.traceId}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => viewTaskDetails(task)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {(task.status === 'pending' || task.status === 'running') && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => cancelTask(task.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* 进度条 */}
                    {task.status === 'running' && (
                      <div className="mb-3">
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                          <span>进度</span>
                          <span>{task.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${task.progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* 时间信息 */}
                    <div className="flex gap-4 text-xs text-gray-500">
                      <span>创建: {new Date(task.createdAt).toLocaleString()}</span>
                      {task.startedAt && (
                        <span>开始: {new Date(task.startedAt).toLocaleString()}</span>
                      )}
                      {task.completedAt && (
                        <span>完成: {new Date(task.completedAt).toLocaleString()}</span>
                      )}
                    </div>

                    {/* 错误信息 */}
                    {task.error && (
                      <div className="mt-2 p-2 bg-red-50 rounded text-sm text-red-800">
                        <strong>错误:</strong> {task.error}
                        {task.retryCount > 0 && (
                          <span className="ml-2">
                            (重试 {task.retryCount}/{task.maxRetries})
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* 任务详情弹窗 */}
        {selectedTask && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="max-w-4xl w-full max-h-[90vh] overflow-auto">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>任务详情</CardTitle>
                    <CardDescription>任务 ID: {selectedTask.id}</CardDescription>
                  </div>
                  <Button variant="ghost" onClick={() => setSelectedTask(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* 基本信息 */}
                  <div>
                    <h3 className="font-medium mb-2">基本信息</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">类型:</span> {selectedTask.type}
                      </div>
                      <div>
                        <span className="text-gray-600">状态:</span>{' '}
                        <StatusBadge status={selectedTask.status} />
                      </div>
                      <div>
                        <span className="text-gray-600">优先级:</span> {selectedTask.priority}
                      </div>
                      <div>
                        <span className="text-gray-600">进度:</span> {selectedTask.progress}%
                      </div>
                      {selectedTask.workerName && (
                        <div>
                          <span className="text-gray-600">执行Worker:</span>{' '}
                          {selectedTask.workerName}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 输入参数 */}
                  <div>
                    <h3 className="font-medium mb-2">输入参数</h3>
                    <pre className="bg-gray-50 p-3 rounded text-xs overflow-auto">
                      {JSON.stringify(selectedTask.payload, null, 2)}
                    </pre>
                  </div>

                  {/* 执行结果 */}
                  {selectedTask.result && (
                    <div>
                      <h3 className="font-medium mb-2">执行结果</h3>
                      <pre className="bg-gray-50 p-3 rounded text-xs overflow-auto">
                        {JSON.stringify(selectedTask.result, null, 2)}
                      </pre>
                    </div>
                  )}

                  {/* 执行日志 */}
                  <div>
                    <h3 className="font-medium mb-2">执行日志</h3>
                    <div className="space-y-2 max-h-64 overflow-auto">
                      {taskLogs.length === 0 ? (
                        <p className="text-sm text-gray-500">暂无日志</p>
                      ) : (
                        taskLogs.map((log) => (
                          <div
                            key={log.id}
                            className={`text-xs p-2 rounded ${
                              log.level === 'error'
                                ? 'bg-red-50 text-red-800'
                                : log.level === 'warn'
                                ? 'bg-yellow-50 text-yellow-800'
                                : 'bg-gray-50 text-gray-800'
                            }`}
                          >
                            <div className="flex justify-between mb-1">
                              <span className="font-medium">{log.level.toUpperCase()}</span>
                              <span className="text-gray-500">
                                {new Date(log.timestamp).toLocaleString()}
                              </span>
                            </div>
                            <div>{log.message}</div>
                            {log.data && (
                              <pre className="mt-1 text-xs">
                                {JSON.stringify(log.data, null, 2)}
                              </pre>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}




