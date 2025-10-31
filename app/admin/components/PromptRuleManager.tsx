'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Edit, Save, X, Plus, Settings } from 'lucide-react';
import type { PromptRule, BusinessModule, PromptRuleFormData } from '@/types/prompt-rule';

interface PromptRuleManagerProps {
  currentModule: BusinessModule;
  rule: PromptRule | null;
  onRuleUpdate: (rule: PromptRule) => void;
  onRuleCreate: (ruleData: PromptRuleFormData) => Promise<void>;
  onRuleEdit: (rule: PromptRule) => void;
  onRuleCancel: () => void;
  editing: boolean;
  loading: boolean;
}

const businessModuleLabels: Record<BusinessModule, string> = {
  'product-analysis': '商品分析',
  'competitor-analysis': '竞品分析',
  'persona-analysis': '人设分析',
  'persona.generate': '人设生成',
  'video-script': '脚本生成',
  'video-generation': '视频生成',
  'ai-reverse-engineer': 'AI反推'
};

export function PromptRuleManager({
  currentModule,
  rule,
  onRuleUpdate,
  onRuleCreate,
  onRuleEdit,
  onRuleCancel,
  editing,
  loading
}: PromptRuleManagerProps) {
  const [formData, setFormData] = useState<PromptRuleFormData>({
    businessModule: currentModule,
    inputFormat: '',
    outputFormat: '',
    analysisMethod: ''
  });

  // 当规则变化时更新表单数据
  React.useEffect(() => {
    if (rule) {
      setFormData({
        businessModule: rule.businessModule,
        inputFormat: rule.inputFormat,
        outputFormat: rule.outputFormat,
        analysisMethod: rule.analysisMethod
      });
    } else {
      setFormData({
        businessModule: currentModule,
        inputFormat: '',
        outputFormat: '',
        analysisMethod: ''
      });
    }
  }, [rule, currentModule]);

  const handleSave = async () => {
    try {
      if (rule) {
        // 更新现有规则
        await onRuleUpdate(rule);
      } else {
        // 创建新规则
        await onRuleCreate(formData);
      }
    } catch (error) {
      // console.error('保存规则失败:', error);
    }
  };

  const handleEdit = () => {
    if (rule) {
      onRuleEdit(rule);
    }
  };

  const handleCancel = () => {
    onRuleCancel();
    // 重置表单数据
    if (rule) {
      setFormData({
        businessModule: rule.businessModule,
        inputFormat: rule.inputFormat,
        outputFormat: rule.outputFormat,
        analysisMethod: rule.analysisMethod
      });
    }
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            规则管理
          </CardTitle>
          <CardDescription>
            {businessModuleLabels[currentModule]} - 加载中...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          规则管理
        </CardTitle>
        <CardDescription>
          {businessModuleLabels[currentModule]} - 管理提示词的输入格式、输出格式和分析方法
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!rule && !editing ? (
          // 无规则状态
          <div className="text-center py-8">
            <div className="text-gray-500 mb-4">
              该业务模块暂无规则配置
            </div>
            <Button onClick={handleEdit} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              创建规则
            </Button>
          </div>
        ) : editing ? (
          // 编辑状态
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">输入格式</label>
                <Textarea
                  value={formData.inputFormat}
                  onChange={(e) => setFormData(prev => ({ ...prev, inputFormat: e.target.value }))}
                  placeholder="定义必须包含的占位符和变量格式"
                  className="min-h-[80px]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">输出格式</label>
                <Textarea
                  value={formData.outputFormat}
                  onChange={(e) => setFormData(prev => ({ ...prev, outputFormat: e.target.value }))}
                  placeholder="指定内容格式和必需字段"
                  className="min-h-[80px]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">分析方法</label>
                <Textarea
                  value={formData.analysisMethod}
                  onChange={(e) => setFormData(prev => ({ ...prev, analysisMethod: e.target.value }))}
                  placeholder="描述内容质量检查和分析要求"
                  className="min-h-[80px]"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleCancel}>
                <X className="h-4 w-4 mr-2" />
                取消
              </Button>
              <Button onClick={handleSave} disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                保存
              </Button>
            </div>
          </div>
        ) : (
          // 显示规则状态
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-sm">
                {businessModuleLabels[currentModule]}
              </Badge>
              <Button variant="outline" size="sm" onClick={handleEdit}>
                <Edit className="h-4 w-4 mr-2" />
                编辑
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-600">输入格式</div>
                <div className="p-3 bg-gray-50 rounded-md text-sm">
                  {rule?.inputFormat ?? '未设置'}
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-600">输出格式</div>
                <div className="p-3 bg-gray-50 rounded-md text-sm">
                  {rule?.outputFormat ?? '未设置'}
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-600">分析方法</div>
                <div className="p-3 bg-gray-50 rounded-md text-sm">
                  {rule?.analysisMethod ?? '未设置'}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
