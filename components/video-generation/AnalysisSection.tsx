'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface AnalysisSectionProps {
  product: any;
  onAnalysisSubmitted: (analysisText: string) => void;
}

export function AnalysisSection({ product, onAnalysisSubmitted }: AnalysisSectionProps) {
  const [analysisText, setAnalysisText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmitAnalysis = async () => {
    if (!analysisText.trim()) {
      toast.error('请输入分析内容');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/product/manual-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          content: analysisText.trim(),
          type: 'analysis'
        }),
      });

      if (!response.ok) throw new Error('提交失败');

      const data = await response.json();
      onAnalysisSubmitted(analysisText);
      setAnalysisText('');
      toast.success('分析内容提交成功');
    } catch (error) {
      console.error('提交分析失败:', error);
      toast.error('提交分析失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  if (!product) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="h-5 w-5" />
          2. 商品分析
        </CardTitle>
        <CardDescription>
          基于商品信息进行深度分析，为后续人设和脚本生成提供依据
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <Label className="text-gray-500">商品名称</Label>
            <p className="font-medium">{product.name}</p>
          </div>
          <div>
            <Label className="text-gray-500">商品类别</Label>
            <p className="font-medium">{product.category}</p>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="analysis-text">分析内容</Label>
          <Textarea
            id="analysis-text"
            placeholder="请输入对商品的深度分析..."
            value={analysisText}
            onChange={(e) => setAnalysisText(e.target.value)}
            rows={4}
            disabled={submitting}
          />
        </div>
        
        <Button 
          onClick={handleSubmitAnalysis} 
          disabled={submitting || !analysisText.trim()}
          className="w-full"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              提交中...
            </>
          ) : (
            '提交分析'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

