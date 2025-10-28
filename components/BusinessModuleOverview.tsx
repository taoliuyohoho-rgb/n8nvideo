import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, BarChart3, Brain, Settings } from 'lucide-react';

interface ModuleTemplateCount {
  module: string;
  count: number;
}

interface BusinessModuleOverviewProps {
  moduleTemplateCounts: ModuleTemplateCount[];
  onModuleSelect: (module: string) => void;
}

const moduleConfigs = {
  'product-analysis': {
    name: '商品分析',
    description: '分析商品特征、竞品对比、市场定位等',
    icon: BarChart3,
    color: 'bg-blue-50 border-blue-200',
    inputFields: [
      { key: 'productName', label: '商品名称', required: true },
      { key: 'category', label: '商品类目', required: true },
      { key: 'price', label: '价格', required: false },
      { key: 'features', label: '商品特征', required: false },
      { key: 'targetAudience', label: '目标受众', required: false }
    ],
    outputFormat: 'JSON格式的分析报告，包含商品优势、劣势、机会、威胁等维度',
    rules: '专业、客观、数据驱动的分析风格，提供可执行的建议'
  },
  'video-script': {
    name: '视频脚本生成',
    description: '生成短视频脚本，包含文案、镜头、音效等',
    icon: FileText,
    color: 'bg-green-50 border-green-200',
    inputFields: [
      { key: 'productName', label: '商品名称', required: true },
      { key: 'style', label: '视频风格', required: true },
      { key: 'duration', label: '视频时长', required: false },
      { key: 'platform', label: '发布平台', required: false },
      { key: 'targetAudience', label: '目标受众', required: false }
    ],
    outputFormat: '结构化脚本，包含场景描述、台词、镜头指导、音效建议',
    rules: '创意、吸引人、符合平台特点，适合目标受众观看习惯'
  },
  'ai-reverse-engineer': {
    name: 'AI反推',
    description: '根据参考实例反推生成Prompt模板',
    icon: Brain,
    color: 'bg-purple-50 border-purple-200',
    inputFields: [
      { key: 'referenceExample', label: '参考实例', required: true },
      { key: 'businessModule', label: '业务模块', required: true },
      { key: 'expectedOutput', label: '期望输出', required: false },
      { key: 'style', label: '风格偏好', required: false }
    ],
    outputFormat: '完整的Prompt模板，包含输入要求、输出要求、输出规则',
    rules: '准确理解参考实例的意图，生成可复用的高质量模板'
  },
  'persona-generation': {
    name: '人设生成',
    description: '为视频生成提供统一的创作者角色，确保风格一致性',
    icon: Settings,
    color: 'bg-orange-50 border-orange-200',
    inputFields: [
      { key: 'productName', label: '商品名称', required: true },
      { key: 'category', label: '商品类目', required: true },
      { key: 'targetAudience', label: '目标受众', required: true },
      { key: 'targetMarket', label: '目标市场', required: true },
      { key: 'productDescription', label: '商品描述', required: true }
    ],
    outputFormat: 'JSON格式的人设数据，包含核心身份、外在形象、性格沟通、生活方式、可信度来源',
    rules: '真实可信、符合目标市场文化、与商品定位匹配、具有辨识度和一致性'
  }
};

export function BusinessModuleOverview({ moduleTemplateCounts, onModuleSelect }: BusinessModuleOverviewProps) {
  const getModuleCount = (module: string) => {
    return moduleTemplateCounts.find(m => m.module === module)?.count || 0;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Object.entries(moduleConfigs).map(([moduleKey, config]) => {
        const IconComponent = config.icon;
        const templateCount = getModuleCount(moduleKey);
        
        return (
          <Card key={moduleKey} className={`${config.color} hover:shadow-md transition-shadow cursor-pointer`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <IconComponent className="h-5 w-5 text-gray-600" />
                  <CardTitle className="text-lg">{config.name}</CardTitle>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {templateCount} 个模版
                </Badge>
              </div>
              <CardDescription className="text-sm">
                {config.description}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* 输入字段 */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">输入字段</h4>
                <div className="flex flex-wrap gap-1">
                  {config.inputFields.map((field) => (
                    <Badge 
                      key={field.key} 
                      variant={field.required ? "default" : "outline"}
                      className="text-xs"
                    >
                      {field.label}
                      {field.required && <span className="ml-1">*</span>}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* 输出格式 */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-1">输出格式</h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {config.outputFormat}
                </p>
              </div>

              {/* 输出规则 */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-1">输出规则</h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {config.rules}
                </p>
              </div>

              {/* 操作按钮 */}
              <div className="pt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => onModuleSelect(moduleKey)}
                >
                  查看模版 ({templateCount})
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
