'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Upload, Sparkles, AlertCircle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';

interface AIReverseEngineerProps {
  businessModule: string;
  onSuccess?: (result: any) => void;
}

interface Recommendation {
  modelCandidates: Array<{
    id: string;
    title: string;
    score: number;
    reason: string;
    type: string;
  }>;
  promptCandidates: Array<{
    id: string;
    name: string;
    score: number;
    reason: string;
    type: string;
  }>;
}

interface PromptDraft {
  inputRequirements: string;
  outputRequirements: string;
  outputRules: string;
  suggestedTemplate: {
    name: string;
    content: string;
    businessModule: string;
  };
}

export function AIReverseEngineer({ businessModule, onSuccess }: AIReverseEngineerProps) {
  const [referenceExample, setReferenceExample] = useState<string>('');
  const [exampleType, setExampleType] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendation | null>(null);
  const [chosenModelId, setChosenModelId] = useState<string>('');
  const [chosenPromptId, setChosenPromptId] = useState<string>('');
  const [promptDraft, setPromptDraft] = useState<PromptDraft | null>(null);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState(false);

  // 文件上传处理
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setReferenceExample(e.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  // 分析参考实例并获取推荐
  const handleAnalyze = async () => {
    if (!referenceExample.trim()) {
      setError('请输入参考实例');
      return;
    }

    if (!exampleType) {
      setError('请选择实例类型');
      return;
    }

    setIsAnalyzing(true);
    setError('');

    try {
      // 1. 获取推荐
      const formData = new FormData();
      formData.append('businessModule', businessModule);
      formData.append('exampleType', exampleType);
      formData.append('referenceExample', referenceExample);

      const response = await fetch('/api/admin/prompts/reverse-engineer/analyze', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setRecommendations(data.data);
        // 默认选择第一个推荐
        if (data.data.modelCandidates.length > 0) {
          setChosenModelId(data.data.modelCandidates[0].id);
        }
        if (data.data.promptCandidates.length > 0) {
          setChosenPromptId(data.data.promptCandidates[0].id);
        }
      } else {
        setError(data.error || '分析失败');
      }
    } catch (err) {
      setError('网络错误，请重试');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 生成Prompt模板
  const handleGenerate = async () => {
    if (!chosenModelId || !chosenPromptId) {
      setError('请选择模型和Prompt模板');
      return;
    }

    setIsAnalyzing(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('businessModule', businessModule);
      formData.append('chosenModelId', chosenModelId);
      formData.append('chosenPromptId', chosenPromptId);
      formData.append('referenceExample', referenceExample);

      const response = await fetch('/api/admin/prompts/reverse-engineer/generate', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setPromptDraft(data.data);
      } else {
        setError(data.error || '生成失败');
      }
    } catch (err) {
      setError('网络错误，请重试');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 保存模板
  const handleSave = async () => {
    if (!promptDraft) {
      setError('没有可保存的模板');
      return;
    }

    setIsAnalyzing(true);
    setError('');

    try {
      const response = await fetch('/api/admin/prompts/reverse-engineer/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessModule,
          ...promptDraft,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        onSuccess?.(data.data);
        // 3秒后重置
        setTimeout(() => {
          setReferenceExample('');
          setExampleType('');
          setRecommendations(null);
          setPromptDraft(null);
          setSuccess(false);
        }, 3000);
      } else {
        setError(data.error || '保存失败');
      }
    } catch (err) {
      setError('网络错误，请重试');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* 输入区域 */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="example-type">实例类型</Label>
          <Select value={exampleType} onValueChange={setExampleType}>
            <SelectTrigger id="example-type" className="mt-1">
              <SelectValue placeholder="选择实例类型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text">文本</SelectItem>
              <SelectItem value="image">图片</SelectItem>
              <SelectItem value="video">视频</SelectItem>
              <SelectItem value="general">通用</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="reference-example">参考实例</Label>
          <Textarea
            id="reference-example"
            placeholder="输入现有的卖点、痛点、目标受众、Prompt脚本、视频描述等..."
            value={referenceExample}
            onChange={(e) => setReferenceExample(e.target.value)}
            rows={6}
            className="mt-1"
          />
          <div className="mt-2 flex items-center gap-2">
            <Input
              type="file"
              accept=".txt,.doc,.docx,.pdf"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload">
              <Button variant="outline" size="sm" asChild>
                <span>
                  <Upload className="w-4 h-4 mr-2" />
                  上传文档
                </span>
              </Button>
            </label>
            <span className="text-sm text-gray-500">支持 TXT、DOC、PDF 等格式</span>
          </div>
        </div>

        {!recommendations && (
          <Button onClick={handleAnalyze} disabled={isAnalyzing} className="w-full">
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                分析中...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                分析并获取推荐
              </>
            )}
          </Button>
        )}
      </div>

      {/* 推荐结果 */}
      {recommendations && !promptDraft && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* AI模型推荐 */}
            <div>
              <Label>推荐AI模型</Label>
              <div className="mt-2 space-y-2">
                {recommendations.modelCandidates.slice(0, 3).map((model) => (
                  <div
                    key={model.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      chosenModelId === model.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setChosenModelId(model.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{model.title}</p>
                        <p className="text-xs text-gray-600 mt-1">{model.reason}</p>
                      </div>
                      <Badge variant="secondary" className="ml-2">
                        {Math.round(model.score)}分
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Prompt模板推荐 */}
            <div>
              <Label>推荐Prompt模板</Label>
              <div className="mt-2 space-y-2">
                {recommendations.promptCandidates.slice(0, 3).map((prompt) => (
                  <div
                    key={prompt.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      chosenPromptId === prompt.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setChosenPromptId(prompt.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{prompt.name}</p>
                        <p className="text-xs text-gray-600 mt-1">{prompt.reason}</p>
                      </div>
                      <Badge variant="secondary" className="ml-2">
                        {Math.round(prompt.score)}分
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <Button onClick={handleGenerate} disabled={isAnalyzing} className="w-full">
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                生成中...
              </>
            ) : (
              '生成Prompt模板'
            )}
          </Button>
        </div>
      )}

      {/* 生成的模板 */}
      {promptDraft && (
        <Card>
          <CardHeader>
            <CardTitle>生成的Prompt模板</CardTitle>
            <CardDescription>请检查并根据需要修改</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="template-name">模板名称</Label>
              <Input
                id="template-name"
                value={promptDraft.suggestedTemplate.name}
                onChange={(e) => setPromptDraft({
                  ...promptDraft,
                  suggestedTemplate: {
                    ...promptDraft.suggestedTemplate,
                    name: e.target.value
                  }
                })}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="input-requirements">输入要求</Label>
              <Textarea
                id="input-requirements"
                value={promptDraft.inputRequirements}
                onChange={(e) => setPromptDraft({
                  ...promptDraft,
                  inputRequirements: e.target.value
                })}
                rows={3}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="output-requirements">输出要求</Label>
              <Textarea
                id="output-requirements"
                value={promptDraft.outputRequirements}
                onChange={(e) => setPromptDraft({
                  ...promptDraft,
                  outputRequirements: e.target.value
                })}
                rows={3}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="output-rules">输出规则</Label>
              <Textarea
                id="output-rules"
                value={promptDraft.outputRules}
                onChange={(e) => setPromptDraft({
                  ...promptDraft,
                  outputRules: e.target.value
                })}
                rows={3}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="template-content">完整模板内容</Label>
              <Textarea
                id="template-content"
                value={promptDraft.suggestedTemplate.content}
                onChange={(e) => setPromptDraft({
                  ...promptDraft,
                  suggestedTemplate: {
                    ...promptDraft.suggestedTemplate,
                    content: e.target.value
                  }
                })}
                rows={8}
                className="mt-1 font-mono text-sm"
              />
            </div>

            <Button onClick={handleSave} disabled={isAnalyzing} className="w-full">
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  保存中...
                </>
              ) : (
                '保存到模板库'
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 错误提示 */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 成功提示 */}
      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Prompt模板已成功保存到 {businessModule} 业务模块的模板库中！
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}