// 搜索筛选组件

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Plus, Sparkles } from 'lucide-react'
import type { SearchAndFilterProps } from '../types'

// 业务模块中文名称映射
const moduleLabels: Record<string, string> = {
  'product-analysis': '商品分析',
  'competitor-analysis': '竞品分析',
  'persona.generate': '人设生成',
  'video-script': '脚本生成',
  'video-generation': '视频Prompt生成',
  'ai-reverse-engineer': 'AI反推'
}

export const SearchAndFilter: React.FC<SearchAndFilterProps> = ({
  searchTerm,
  onSearchChange,
  selectedModule,
  onModuleChange,
  businessModules,
  onAIReverseClick,
  onManualCreateClick
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          搜索和筛选
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="search">搜索提示词</Label>
            <Input
              id="search"
              placeholder="输入提示词名称或内容..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="module">业务模块</Label>
            <Select value={selectedModule} onValueChange={onModuleChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部模块</SelectItem>
                {businessModules.map((module) => (
                  <SelectItem key={module} value={module}>
                    {moduleLabels[module] || module}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>操作</Label>
            <div className="space-y-2">
              <Button 
                onClick={onAIReverseClick}
                className="w-full"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                AI反推新建
              </Button>
              <Button 
                onClick={onManualCreateClick}
                variant="outline"
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                手动新建
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
