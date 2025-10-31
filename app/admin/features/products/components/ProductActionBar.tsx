'use client'

import { Button } from '@/components/ui/button'
import { Plus, Upload, RefreshCw, MessageSquare, Settings } from 'lucide-react'

interface ProductActionBarProps {
  selectedCount: number
  onRefresh: () => Promise<void>
  onAdd: () => void
  onBulkUpload: () => void
  onAnalyze: () => void
  onConfig: () => void
  userRole?: string // 用户角色
}

export function ProductActionBar({
  selectedCount,
  onRefresh,
  onAdd,
  onBulkUpload,
  onAnalyze,
  onConfig,
  userRole
}: ProductActionBarProps) {
  const canCreate = userRole !== 'operator' // operator 不能添加商品
  const canBulkUpload = userRole !== 'operator' // operator 不能批量上传
  const canConfig = userRole === 'super_admin' || userRole === 'admin' // 只有 admin 和 super_admin 可以配置

  return (
    <div className="flex justify-between items-center">
      <h2 className="text-2xl font-semibold">商品库管理</h2>
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          onClick={onRefresh}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          刷新
        </Button>
        {canBulkUpload && (
          <Button variant="outline" onClick={onBulkUpload}>
            <Upload className="h-4 w-4 mr-2" />
            批量上传
          </Button>
        )}
        {canCreate && (
          <Button onClick={onAdd}>
            <Plus className="h-4 w-4 mr-2" />
            添加商品
          </Button>
        )}
        <Button 
          variant="outline" 
          onClick={() => {
            console.log('[ProductActionBar] Analyze button clicked, selectedCount:', selectedCount)
            onAnalyze()
          }}
          disabled={selectedCount === 0}
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          商品分析 {selectedCount > 0 && `(${selectedCount})`}
        </Button>
        {canConfig && (
          <Button 
            variant="outline" 
            onClick={onConfig}
          >
            <Settings className="h-4 w-4 mr-2" />
            配置管理
          </Button>
        )}
      </div>
    </div>
  )
}
