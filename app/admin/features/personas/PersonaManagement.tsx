/**
 * 人物画像管理模块
 * 
 * 功能：
 * - 显示人设列表
 * - 添加/编辑/删除人设
 * - 查看人设详情
 */

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit, Trash2, RefreshCw } from 'lucide-react'
import type { Persona } from '../../shared/types/persona'

interface PersonaManagementProps {
  personas: Persona[]
  onAdd: () => void
  onEdit: (persona: Persona) => void
  onDelete: (personaId: string) => void
  onRefresh: () => void
}

export function PersonaManagement({ 
  personas, 
  onAdd, 
  onEdit, 
  onDelete, 
  onRefresh 
}: PersonaManagementProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">人设表管理</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            刷新数据
          </Button>
          <Button onClick={onAdd}>
            <Plus className="h-4 w-4 mr-2" />
            添加人设
          </Button>
        </div>
      </div>

      <div className="border rounded-lg">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">人设名称</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">关联商品</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">职业</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">性格特征</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">版本</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">创建时间</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {personas.map((persona) => (
              <tr key={persona.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div>
                    <div className="font-medium text-gray-900">{persona.coreIdentity.name}</div>
                    <div className="text-sm text-gray-500">
                      {persona.coreIdentity.age}岁 · {persona.coreIdentity.gender} · {persona.coreIdentity.location}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm">
                    {persona.product ? (
                      <div>
                        <div className="font-medium">{persona.product.name}</div>
                        <div className="text-gray-500">{persona.product.category}</div>
                      </div>
                    ) : (
                      <span className="text-gray-400">未关联</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm">{persona.coreIdentity.occupation}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {persona.vibe.traits.slice(0, 3).map((trait, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {trait}
                      </Badge>
                    ))}
                    {persona.vibe.traits.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{persona.vibe.traits.length - 3}
                      </Badge>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge variant="outline">v{persona.version}</Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm text-gray-500">
                    {new Date(persona.createdAt).toLocaleDateString('zh-CN')}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => onEdit(persona)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => onDelete(persona.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {personas.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            暂无人设数据，点击"添加人设"创建新人设
          </div>
        )}
      </div>
    </div>
  )
}

