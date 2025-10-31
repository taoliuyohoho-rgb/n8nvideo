// 提示词卡片组件

import React, { memo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Edit, Copy, Trash2 } from 'lucide-react'
import type { PromptCardProps } from '../types'

export const PromptCard: React.FC<PromptCardProps> = memo(function PromptCard({
  prompt,
  onEdit,
  onCopy,
  onDelete
}) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg">{prompt.name}</CardTitle>
            <CardDescription className="mt-1">
              {prompt.businessModule}
            </CardDescription>
          </div>
          <div className="flex space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(prompt)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onCopy(prompt)}
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(prompt.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Badge variant={prompt.isActive ? "default" : "secondary"}>
              {prompt.isActive ? '启用' : '禁用'}
            </Badge>
            {prompt.isDefault && (
              <Badge variant="outline">默认</Badge>
            )}
            <Badge variant="outline">
              使用 {prompt.usageCount} 次
            </Badge>
          </div>

          <div className="text-sm text-gray-600 line-clamp-3">
            {prompt.content}
          </div>

          {Array.isArray(prompt.variables) && prompt.variables.length > 0 && (
            <div className="text-xs text-gray-500">
              变量: {prompt.variables.join(', ')}
            </div>
          )}

          <div className="text-xs text-gray-400">
            创建于 {new Date(prompt.createdAt).toLocaleDateString()}
          </div>
        </div>
      </CardContent>
    </Card>
  )
})
