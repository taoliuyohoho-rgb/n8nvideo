'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Upload, Link, Image, AlertCircle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ProductAnalysisProps {
  productId: string;
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

interface AnalysisResult {
  success: boolean;
  data: {
    sellingPoints: string[];
    painPoints: string[];
    targetAudience?: string;
    modelUsed: string;
    promptUsed: string;
    duplicates: {
      sellingPoints: string[];
      painPoints: string[];
      targetAudience: string[];
    };
  };
  error?: string;
}

export function ProductAnalysis({ productId, onSuccess }: ProductAnalysisProps) {
  const [competitorContent, setCompetitorContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isUrl, setIsUrl] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendation | null>(null);
  const [chosenModelId, setChosenModelId] = useState<string>('');
  const [chosenPromptId, setChosenPromptId] = useState<string>('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string>('');

  // 获取推荐候选项
  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const response = await fetch('/api/competitor/recommend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId,
            input: '',
            images: []
          })
        });
        const data = await response.json();
        
        if (data.success) {
          const recommendations = {
            modelCandidates: data.data.models?.topK?.map((item: any) => ({
              id: item.id,
              title: item.title,
              score: item.fineScore || item.coarseScore || 0,
              reason: item.summary || '推荐模型',
              type: 'model'
            })) || [],
            promptCandidates: data.data.prompts?.topK?.map((item: any) => ({
              id: item.id,
              name: item.title,
              score: item.fineScore || item.coarseScore || 0,
              reason: item.summary || '推荐Prompt',
              type: 'prompt'
            })) || []
          };
          setRecommendations(recommendations);
          // 默认选择第一个推荐
          if (recommendations.modelCandidates.length > 0) {
            setChosenModelId(recommendations.modelCandidates[0].id);
          }
          if (recommendations.promptCandidates.length > 0) {
            setChosenPromptId(recommendations.promptCandidates[0].id);
          }
        }
      } catch (err) {
        console.error('获取推荐失败:', err);
      }
    };

    fetchRecommendations();
  }, [productId]);

  // 检测输入类型
  const detectInputType = (content: string) => {
    const urlPattern = /^https?:\/\/.+/;
    if (urlPattern.test(content.trim())) {
      setIsUrl(true);
      return 'url';
    }
    setIsUrl(false);
    return 'text';
  };

  // 处理内容输入
  const handleContentChange = (value: string) => {
    setCompetitorContent(value);
    detectInputType(value);
  };

  // 处理图片上传
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const imageUrls = Array.from(files).map(file => URL.createObjectURL(file));
      setImages(prev => [...prev, ...imageUrls]);
    }
  };

  // 移除图片
  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  // 开始分析
  const handleAnalyze = async () => {
    if (!competitorContent.trim() && images.length === 0) {
      setError('请输入竞品内容或上传图片');
      return;
    }

    setIsAnalyzing(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/competitor/parse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          input: competitorContent.trim() || undefined,
          images: images.length > 0 ? images : undefined,
          isUrl,
          chosenModelId: chosenModelId || undefined,
          chosenPromptId: chosenPromptId || undefined,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // 适配新的API响应格式
        const analysisData = data.data;
        const result = {
          success: true,
          data: {
            sellingPoints: analysisData.combinedInsights?.sellingPoints || [],
            painPoints: analysisData.combinedInsights?.painPoints || [],
            targetAudience: analysisData.combinedInsights?.targetAudience || '',
            modelUsed: analysisData.aiModelUsed || 'unknown',
            promptUsed: analysisData.promptUsed || 'unknown',
            duplicates: {
              sellingPoints: [],
              painPoints: [],
              targetAudience: []
            }
          }
        };
        setResult(result);
        onSuccess?.(result.data);
      } else {
        setError(data.error || '分析失败');
      }
    } catch (err) {
      setError('网络错误，请重试');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 输入区域 */}
      <Card>
        <CardHeader>
          <CardTitle>商品分析</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 竞品内容输入 */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              竞品参考内容（可选）
            </label>
            <Textarea
              placeholder="输入竞品信息、用户评论、产品描述等..."
              value={competitorContent}
              onChange={(e) => handleContentChange(e.target.value)}
              rows={4}
            />
            {isUrl && (
              <p className="text-sm text-blue-600 mt-1">
                <Link className="w-4 h-4 inline mr-1" />
                检测到链接，将尝试解析内容
              </p>
            )}
          </div>

          {/* 图片上传 */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              上传图片（可选）
            </label>
            <div className="flex items-center space-x-2">
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="flex-1"
              />
              <Button variant="outline" size="sm">
                <Upload className="w-4 h-4 mr-1" />
                上传
              </Button>
            </div>
            
            {/* 图片预览 */}
            {images.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                {images.map((url, index) => (
                  <div key={index} className="relative">
                    <img
                      src={url}
                      alt={`上传图片 ${index + 1}`}
                      className="w-full h-20 object-cover rounded border"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-1 right-1 h-6 w-6 p-0"
                      onClick={() => removeImage(index)}
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 推荐选择 */}
          {recommendations && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">AI模型</label>
                <div className="grid grid-cols-1 gap-2">
                  {recommendations.modelCandidates.slice(0, 3).map((model) => (
                    <div
                      key={model.id}
                      className={`p-3 border rounded cursor-pointer transition-colors ${
                        chosenModelId === model.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setChosenModelId(model.id)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{model.title}</p>
                          <p className="text-sm text-gray-600">{model.reason}</p>
                        </div>
                        <Badge variant="secondary">
                          {Math.round(model.score)}分
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Prompt模板</label>
                <div className="grid grid-cols-1 gap-2">
                  {recommendations.promptCandidates.slice(0, 3).map((prompt) => (
                    <div
                      key={prompt.id}
                      className={`p-3 border rounded cursor-pointer transition-colors ${
                        chosenPromptId === prompt.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setChosenPromptId(prompt.id)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{prompt.name}</p>
                          <p className="text-sm text-gray-600">{prompt.reason}</p>
                        </div>
                        <Badge variant="secondary">
                          {Math.round(prompt.score)}分
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 分析按钮 */}
          <Button
            onClick={handleAnalyze}
            disabled={isAnalyzing || (!competitorContent.trim() && images.length === 0)}
            className="w-full"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                分析中...
              </>
            ) : (
              '开始分析'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* 错误提示 */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 分析结果 */}
      {result && result.success && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
              分析结果
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 使用的模型和模板 */}
            <div className="text-sm text-gray-600">
              <p>使用模型: {result.data.modelUsed}</p>
              <p>使用模板: {result.data.promptUsed}</p>
            </div>

            {/* 卖点 */}
            {result.data.sellingPoints.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">卖点 ({result.data.sellingPoints.length})</h4>
                <div className="flex flex-wrap gap-2">
                  {result.data.sellingPoints.map((point, index) => (
                    <Badge key={index} variant="default">
                      {point}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* 痛点 */}
            {result.data.painPoints.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">痛点 ({result.data.painPoints.length})</h4>
                <div className="flex flex-wrap gap-2">
                  {result.data.painPoints.map((point, index) => (
                    <Badge key={index} variant="destructive">
                      {point}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* 目标受众 */}
            {result.data.targetAudience && (
              <div>
                <h4 className="font-medium mb-2">目标受众</h4>
                <Badge variant="outline">{result.data.targetAudience}</Badge>
              </div>
            )}

            {/* 重复内容提示 */}
            {(result.data.duplicates.sellingPoints.length > 0 || 
              result.data.duplicates.painPoints.length > 0 || 
              result.data.duplicates.targetAudience.length > 0) && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  发现重复内容已自动过滤：
                  {result.data.duplicates.sellingPoints.length > 0 && 
                    ` ${result.data.duplicates.sellingPoints.length}个卖点`}
                  {result.data.duplicates.painPoints.length > 0 && 
                    ` ${result.data.duplicates.painPoints.length}个痛点`}
                  {result.data.duplicates.targetAudience.length > 0 && 
                    ` 目标受众`}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
