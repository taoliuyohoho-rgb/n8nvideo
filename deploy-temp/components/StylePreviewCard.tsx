'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { 
  Edit3, 
  Trash2, 
  Save, 
  X, 
  Eye,
  Clock,
  Target,
  Palette
} from 'lucide-react'

interface GeneratedStyle {
  id: string
  name: string
  description: string
  structure: string
  hookPool: string
  videoStylePool: string
  tonePool: string
  suggestedLength: string
  recommendedCategories: string
  targetCountries: string
  templatePrompt: string
  confidence: number
  videoAnalysis?: {
    duration: number
    scenes: string[]
    editingRhythm: string
    visualStyle: string
    audioStyle: string
  }
}

interface StylePreviewCardProps {
  style: GeneratedStyle
  isSelected: boolean
  onSelect: (id: string) => void
  onEdit: (id: string, updatedStyle: Partial<GeneratedStyle>) => void
  onDelete: (id: string) => void
  onToggleSelect: (id: string) => void
}

export default function StylePreviewCard({
  style,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onToggleSelect
}: StylePreviewCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedStyle, setEditedStyle] = useState<Partial<GeneratedStyle>>({})

  const handleEdit = () => {
    setEditedStyle({
      name: style.name,
      description: style.description,
      structure: style.structure,
      hookPool: style.hookPool,
      videoStylePool: style.videoStylePool,
      tonePool: style.tonePool,
      suggestedLength: style.suggestedLength,
      recommendedCategories: style.recommendedCategories,
      targetCountries: style.targetCountries,
      templatePrompt: style.templatePrompt
    })
    setIsEditing(true)
  }

  const handleSave = () => {
    onEdit(style.id, editedStyle)
    setIsEditing(false)
    setEditedStyle({})
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditedStyle({})
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-100 text-green-800'
    if (confidence >= 0.6) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  return (
    <Card className={`transition-all duration-200 ${
      isSelected 
        ? 'ring-2 ring-blue-500 bg-blue-50' 
        : 'hover:shadow-md'
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {isEditing ? (
              <Input
                value={editedStyle.name || ''}
                onChange={(e) => setEditedStyle(prev => ({ ...prev, name: e.target.value }))}
                className="font-semibold text-lg"
                placeholder="风格名称"
              />
            ) : (
              <CardTitle className="text-lg">{style.name}</CardTitle>
            )}
            <div className="flex items-center gap-2 mt-1">
              <Badge className={getConfidenceColor(style.confidence)}>
                置信度: {(style.confidence * 100).toFixed(0)}%
              </Badge>
              {style.videoAnalysis && (
                <Badge variant="outline">
                  视频解析
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onToggleSelect(style.id)}
              className={isSelected ? 'bg-blue-100' : ''}
            >
              {isSelected ? '已选择' : '选择'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleEdit}
            >
              <Edit3 className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(style.id)}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 描述 */}
        <div>
          <Label className="text-sm font-medium text-gray-600">描述</Label>
          {isEditing ? (
            <Textarea
              value={editedStyle.description || ''}
              onChange={(e) => setEditedStyle(prev => ({ ...prev, description: e.target.value }))}
              className="mt-1"
              rows={2}
              placeholder="风格描述"
            />
          ) : (
            <p className="text-sm text-gray-700 mt-1">{style.description}</p>
          )}
        </div>

        {/* 结构 */}
        <div>
          <Label className="text-sm font-medium text-gray-600">视频结构</Label>
          {isEditing ? (
            <Textarea
              value={editedStyle.structure || ''}
              onChange={(e) => setEditedStyle(prev => ({ ...prev, structure: e.target.value }))}
              className="mt-1"
              rows={2}
              placeholder="视频结构"
            />
          ) : (
            <p className="text-sm text-gray-700 mt-1">{style.structure}</p>
          )}
        </div>

        {/* 关键信息 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium text-gray-600">建议时长</Label>
            {isEditing ? (
              <Input
                value={editedStyle.suggestedLength || ''}
                onChange={(e) => setEditedStyle(prev => ({ ...prev, suggestedLength: e.target.value }))}
                className="mt-1"
                placeholder="建议时长"
              />
            ) : (
              <div className="flex items-center gap-1 mt-1">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-700">{style.suggestedLength}</span>
              </div>
            )}
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-600">目标类目</Label>
            {isEditing ? (
              <Input
                value={editedStyle.recommendedCategories || ''}
                onChange={(e) => setEditedStyle(prev => ({ ...prev, recommendedCategories: e.target.value }))}
                className="mt-1"
                placeholder="推荐类目"
              />
            ) : (
              <div className="flex items-center gap-1 mt-1">
                <Target className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-700">{style.recommendedCategories}</span>
              </div>
            )}
          </div>
        </div>

        {/* 风格池 */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-600">风格池</Label>
          <div className="grid grid-cols-1 gap-2">
            <div>
              <span className="text-xs text-gray-500">Hook池:</span>
              {isEditing ? (
                <Input
                  value={editedStyle.hookPool || ''}
                  onChange={(e) => setEditedStyle(prev => ({ ...prev, hookPool: e.target.value }))}
                  className="mt-1"
                  placeholder="Hook池"
                />
              ) : (
                <p className="text-sm text-gray-700">{style.hookPool}</p>
              )}
            </div>
            <div>
              <span className="text-xs text-gray-500">视频风格池:</span>
              {isEditing ? (
                <Input
                  value={editedStyle.videoStylePool || ''}
                  onChange={(e) => setEditedStyle(prev => ({ ...prev, videoStylePool: e.target.value }))}
                  className="mt-1"
                  placeholder="视频风格池"
                />
              ) : (
                <p className="text-sm text-gray-700">{style.videoStylePool}</p>
              )}
            </div>
            <div>
              <span className="text-xs text-gray-500">语调池:</span>
              {isEditing ? (
                <Input
                  value={editedStyle.tonePool || ''}
                  onChange={(e) => setEditedStyle(prev => ({ ...prev, tonePool: e.target.value }))}
                  className="mt-1"
                  placeholder="语调池"
                />
              ) : (
                <p className="text-sm text-gray-700">{style.tonePool}</p>
              )}
            </div>
          </div>
        </div>

        {/* 视频分析信息（如果有） */}
        {style.videoAnalysis && (
          <div className="bg-gray-50 p-3 rounded-lg">
            <Label className="text-sm font-medium text-gray-600">视频分析</Label>
            <div className="mt-2 space-y-1">
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3 text-gray-500" />
                <span className="text-xs text-gray-600">时长: {style.videoAnalysis.duration}s</span>
              </div>
              <div className="flex items-center gap-2">
                <Palette className="h-3 w-3 text-gray-500" />
                <span className="text-xs text-gray-600">视觉风格: {style.videoAnalysis.visualStyle}</span>
              </div>
              <div className="text-xs text-gray-600">
                剪辑节奏: {style.videoAnalysis.editingRhythm}
              </div>
            </div>
          </div>
        )}

        {/* 编辑操作按钮 */}
        {isEditing && (
          <div className="flex gap-2 pt-2 border-t">
            <Button size="sm" onClick={handleSave}>
              <Save className="h-4 w-4 mr-1" />
              保存
            </Button>
            <Button size="sm" variant="outline" onClick={handleCancel}>
              <X className="h-4 w-4 mr-1" />
              取消
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
