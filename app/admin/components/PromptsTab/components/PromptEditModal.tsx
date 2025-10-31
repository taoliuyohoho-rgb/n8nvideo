// 编辑弹窗组件

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Save, RefreshCw } from 'lucide-react'
import type { PromptEditModalProps } from '../types'
import type { CompatiblePrompt } from '@/types/compat'

// 业务模块中文名称映射
const moduleLabels: Record<string, string> = {
  'product-analysis': '商品分析',
  'competitor-analysis': '竞品分析',
  'persona.generate': '人设生成',
  'video-script': '脚本生成',
  'video-generation': '视频Prompt生成',
  'ai-reverse-engineer': 'AI反推'
}

export const PromptEditModal: React.FC<PromptEditModalProps> = ({
  prompt,
  businessModules,
  saving,
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState<CompatiblePrompt | null>(null)

  useEffect(() => {
    if (prompt) {
      setFormData(prompt)
    }
  }, [prompt])

  if (!prompt || !formData) return null

  const handleSave = () => {
    onSave(formData)
  }

  const handleInputChange = (field: keyof CompatiblePrompt, value: string | boolean | string[]) => {
    setFormData(prev => prev ? { ...prev, [field]: value } : null)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl max-h-[80vh] overflow-y-auto w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">
            {formData.id ? '编辑提示词' : '新建提示词'}
          </h3>
          <Button variant="ghost" onClick={onCancel}>
            ✕
          </Button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">提示词名称</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessModule">业务模块</Label>
              <Select 
                value={formData.businessModule} 
                onValueChange={(value) => handleInputChange('businessModule', value)}
              >
                <SelectTrigger>
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">提示词内容</Label>
            <Textarea
              id="content"
              rows={8}
              value={formData.content}
              onChange={(e) => handleInputChange('content', e.target.value)}
              placeholder="输入提示词内容..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="variables">变量列表 (用逗号分隔)</Label>
            <Input
              id="variables"
              value={Array.isArray(formData.variables) ? formData.variables.join(', ') : ''}
              onChange={(e) => {
                const variables = e.target.value.split(',').map(v => v.trim()).filter(v => v)
                handleInputChange('variables', variables)
              }}
              placeholder="例如: productName, category, targetAudience"
            />
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => handleInputChange('isActive', e.target.checked)}
                className="w-4 h-4"
              />
              <Label>启用</Label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.isDefault}
                onChange={(e) => handleInputChange('isDefault', e.target.checked)}
                className="w-4 h-4"
              />
              <Label>设为默认</Label>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onCancel}>
              取消
            </Button>
            <Button 
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  保存中...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  保存
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
