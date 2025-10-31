'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  sellingPoints: string[];
  painPoints: string[];
  targetAudience: string[];
}

interface ProductLoaderProps {
  onProductLoaded: (product: Product, top5: any) => void;
}

export function ProductLoader({ onProductLoaded }: ProductLoaderProps) {
  const [productName, setProductName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLoadProduct = async () => {
    if (!productName.trim()) {
      toast.error('请输入商品名称');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/video-gen/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productName: productName.trim() }),
      });

      if (!response.ok) throw new Error('加载失败');

      const data = await response.json();
      setProductName('');
      onProductLoaded(data.product, data.top5);
      toast.success('商品信息加载成功');
    } catch (error) {
      console.error('加载商品失败:', error);
      toast.error('加载商品失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Search className="h-5 w-5" />
          1. 加载商品信息
        </CardTitle>
        <CardDescription>
          输入商品名称，系统将自动加载商品详情和Top5分析
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <div className="flex-1">
            <Label htmlFor="product-name" className="sr-only">
              商品名称
            </Label>
            <Input
              id="product-name"
              placeholder="请输入商品名称..."
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLoadProduct()}
              disabled={loading}
            />
          </div>
          <Button 
            onClick={handleLoadProduct} 
            disabled={loading || !productName.trim()}
            className="min-w-[100px]"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                加载中
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                加载
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

