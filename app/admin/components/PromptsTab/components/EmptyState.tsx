// 空状态组件

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Plus, Sparkles } from 'lucide-react'
import type { EmptyStateProps } from '../types'

export const EmptyState: React.FC<EmptyStateProps> = ({
  onAIReverseClick,
  onManualCreateClick
}) => {
  return (
    <Card>
      <CardContent className="text-center py-12">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">暂无提示词</h3>
        <p className="text-gray-500 mb-4">没有找到符合条件的提示词</p>
        <div className="space-y-2">
          <Button onClick={onAIReverseClick}>
            <Sparkles className="h-4 w-4 mr-2" />
            AI反推创建
          </Button>
          <Button 
            onClick={onManualCreateClick}
            variant="outline"
          >
            <Plus className="h-4 w-4 mr-2" />
            手动创建
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
