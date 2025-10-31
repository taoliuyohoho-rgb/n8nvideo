/**
 * 人物画像管理模块
 * 
 * 功能：
 * - 显示人设列表
 * - 添加/编辑/删除人设（弹窗形式）
 * - 查看人设详情
 */

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit, Trash2, RefreshCw, Sparkles } from 'lucide-react'
import { PersonaFormModal } from '@/app/admin/components/PersonaFormModalV2'
import type { CompatiblePersona } from '@/types/compat'
import { toast } from 'sonner'

interface PersonaManagementProps {
  personas: CompatiblePersona[]
  onDelete: (personaId: string) => void
  onRefresh: () => void
}

export function PersonaManagement({ 
  personas, 
  onDelete, 
  onRefresh 
}: PersonaManagementProps) {
  const [formModalOpen, setFormModalOpen] = useState(false)
  const [editingPersona, setEditingPersona] = useState<CompatiblePersona | undefined>(undefined)
  const [matchingPersonaId, setMatchingPersonaId] = useState<string | null>(null)

  const handleAdd = () => {
    setEditingPersona(undefined)
    setFormModalOpen(true)
  }

  const handleEdit = (persona: CompatiblePersona) => {
    setEditingPersona(persona)
    setFormModalOpen(true)
  }

  const handleFormSuccess = () => {
    onRefresh()
  }

  const handleAutoMatch = async (personaId: string, personaName: string) => {
    setMatchingPersonaId(personaId)
    try {
      const res = await fetch(`/api/persona/${personaId}/match-products`, {
        method: 'POST',
        credentials: 'include'
      })
      
      const data = await res.json()
      
      if (!res.ok || !data.success) {
        throw new Error(data.error || '匹配失败')
      }
      
      toast.success(`"${personaName}" 成功匹配 ${data.matchedCount} 个商品`, {
        description: data.topProduct ? `主商品: ${data.topProduct.name} (${data.topProduct.category})` : undefined
      })
      
      // 刷新列表
      onRefresh()
    } catch (error) {
      console.error('[PersonaManagement] 自动匹配失败:', error)
      toast.error(`自动匹配失败`, {
        description: error instanceof Error ? error.message : '未知错误'
      })
    } finally {
      setMatchingPersonaId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">人设表管理</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            刷新数据
          </Button>
          <Button onClick={handleAdd} variant="secondary">
            <Plus className="h-4 w-4 mr-2" />
            添加人设
          </Button>
        </div>
      </div>

      <PersonaFormModal
        open={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        onSuccess={handleFormSuccess}
        editingPersona={editingPersona}
      />

      <div className="border rounded-lg">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">人设名称</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">类目</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">关联商品</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">职业</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">性格特征</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">版本</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">创建时间</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {personas.map((persona) => {
              // 兼容两种数据结构：coreIdentity（旧） 和 generatedContent（新）
              const basicInfo = persona.generatedContent?.basicInfo || persona.coreIdentity
              const psychology = persona.generatedContent?.psychology || persona.vibe
              const name = persona.name || basicInfo?.name || '未知'
              const age = basicInfo?.age || '未知'
              const gender = basicInfo?.gender || '未知'
              const location = basicInfo?.location || '未知'
              const occupation = basicInfo?.occupation || '未知'
              const values = psychology?.values || psychology?.traits || []
              
              return (
                <tr key={persona.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div>
                      <div className="font-medium text-gray-900">{name}</div>
                      <div className="text-sm text-gray-500">
                        {age} · {gender} · {location}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm">
                      {persona.category ? (
                        <Badge variant="outline">{persona.category.name}</Badge>
                      ) : (
                        <span className="text-gray-400">未分类</span>
                      )}
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
                    <div className="text-sm">{occupation}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {values.slice(0, 3).map((trait: string, idx: number) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {trait}
                        </Badge>
                      ))}
                      {values.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{values.length - 3}
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline">v{persona.version || 1}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-500">
                      {persona.createdAt ? new Date(persona.createdAt).toLocaleDateString('zh-CN') : '未知'}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleAutoMatch(persona.id, name)}
                        disabled={matchingPersonaId === persona.id}
                        title="自动匹配商品/类目"
                      >
                        {matchingPersonaId === persona.id ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <Sparkles className="h-4 w-4" />
                        )}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleEdit(persona)} title="编辑人设">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => onDelete(persona.id)} title="删除人设">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              )
            })}
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

