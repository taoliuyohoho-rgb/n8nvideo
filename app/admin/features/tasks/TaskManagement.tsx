/**
 * 任务监控模块
 * 
 * 功能：
 * - 任务监控面板（iframe）
 * - 预估模型监控（iframe）
 * - 预估模型测试（iframe）
 * - 推荐系统监控（组件）
 */

import { Button } from '@/components/ui/button'

// 推荐系统监控组件需要从主文件导入
// 这里先使用 any 类型，后续可以进一步拆分
interface TaskManagementProps {
  RecommendationMonitorComponent: React.ComponentType
}

export function TaskManagement({ RecommendationMonitorComponent }: TaskManagementProps) {
  return (
    <div className="space-y-6">
      {/* 任务监控 */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">任务监控</h2>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => window.open('/admin/tasks', '_blank')}>
              在新窗口打开
            </Button>
          </div>
        </div>
        <div className="border rounded-lg overflow-hidden" style={{ height: '60vh' }}>
          <iframe
            src="/admin/tasks"
            style={{ width: '100%', height: '100%' }}
            title="任务监控"
          />
        </div>
      </div>

      {/* 预估模型监控 */}
      <div>
        <div className="flex justify-between items-center mb-4 pt-2">
          <h2 className="text-2xl font-semibold">预估模型监控</h2>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => window.open('/admin/estimation-monitor', '_blank')}>
              在新窗口打开
            </Button>
          </div>
        </div>
        <div className="border rounded-lg overflow-hidden" style={{ height: '60vh' }}>
          <iframe
            src="/admin/estimation-monitor"
            style={{ width: '100%', height: '100%' }}
            title="预估模型监控"
          />
        </div>
      </div>

      {/* 预估模型测试 */}
      <div>
        <div className="flex justify-between items-center mb-4 pt-2">
          <h2 className="text-2xl font-semibold">预估模型测试</h2>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => window.open('/admin/estimation-test', '_blank')}>
              在新窗口打开
            </Button>
          </div>
        </div>
        <div className="border rounded-lg overflow-hidden" style={{ height: '60vh' }}>
          <iframe
            src="/admin/estimation-test"
            style={{ width: '100%', height: '100%' }}
            title="预估模型测试"
          />
        </div>
      </div>

      {/* 推荐系统监控 */}
      <div>
        <div className="flex justify-between items-center mb-4 pt-2">
          <h2 className="text-2xl font-semibold">推荐系统监控</h2>
        </div>
        <RecommendationMonitorComponent />
      </div>
    </div>
  )
}

