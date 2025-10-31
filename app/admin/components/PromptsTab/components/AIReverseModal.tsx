// AI反推弹窗组件

import React from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sparkles } from 'lucide-react'
import { AIReverseEngineer } from '@/components/AIReverseEngineer'
import type { AIReverseModalProps } from '../types'

// 业务模块中文名称映射
const moduleLabels: Record<string, string> = {
  'product-analysis': '商品分析',
  'competitor-analysis': '竞品分析',
  'persona.generate': '人设生成',
  'video-script': '脚本生成',
  'video-generation': '视频Prompt生成',
  'ai-reverse-engineer': 'AI反推'
}

export const AIReverseModal: React.FC<AIReverseModalProps> = ({
  visible,
  businessModules,
  selectedBusinessModule,
  onBusinessModuleChange,
  onSuccess,
  onCancel
}) => {
  if (!visible) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl max-h-[90vh] overflow-y-auto w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            AI反推新建提示词
          </h3>
          <Button variant="ghost" onClick={onCancel}>
            ✕
          </Button>
        </div>

        <div className="mb-4">
          <Label htmlFor="business-module-select">选择业务模块</Label>
          <Select 
            value={selectedBusinessModule} 
            onValueChange={onBusinessModuleChange}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {businessModules.map((module) => (
                <SelectItem key={module} value={module}>
                  {moduleLabels[module] || module}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <AIReverseEngineer 
          businessModule={selectedBusinessModule}
          onSuccess={onSuccess}
        />
      </div>
    </div>
  )
}
