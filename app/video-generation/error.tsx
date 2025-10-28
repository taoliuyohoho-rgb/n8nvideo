'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Video generation page error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">页面加载出错</h2>
        <p className="text-gray-600 mb-6">
          {error.message || '加载视频生成页面时出现问题'}
        </p>
        <div className="space-y-3">
          <Button 
            onClick={() => reset()} 
            className="w-full"
          >
            重试
          </Button>
          <Button 
            onClick={() => window.location.href = '/dashboard'} 
            variant="outline"
            className="w-full"
          >
            返回首页
          </Button>
        </div>
      </div>
    </div>
  );
}

