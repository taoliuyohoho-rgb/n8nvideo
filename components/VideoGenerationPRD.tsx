'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Play, Copy, Download, CheckCircle, XCircle, Clock, RefreshCw, Sparkles, Edit2, Search } from 'lucide-react';
import { toast } from 'sonner';

export default function VideoGenerationPRD() {
  // 状态管理
  const [productName, setProductName] = useState('');
  const [product, setProduct] = useState<any>(null);
  const [top5, setTop5] = useState<any>(null);
  const [loadingProduct, setLoadingProduct] = useState(false);
  
  const [analysisText, setAnalysisText] = useState('');
  const [submittingAnalysis, setSubmittingAnalysis] = useState(false);
  
  const [persona, setPersona] = useState<any>(null);
  const [personaId, setPersonaId] = useState<string | null>(null);
  const [generatingPersona, setGeneratingPersona] = useState(false);
  
  const [script, setScript] = useState<any>(null);
  const [scriptId, setScriptId] = useState<string | null>(null);
  const [generatingScript, setGeneratingScript] = useState(false);
  
  const [videoJob, setVideoJob] = useState<any>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  // 1. 加载商品信息
  const handleLoadProduct = async () => {
    if (!productName.trim()) {
      toast.error('请输入商品名称');
      return;
    }

    setLoadingProduct(true);
    try {
      const response = await fetch('/api/video-gen/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productName: productName.trim() }),
      });

      if (!response.ok) throw new Error('加载失败');

      const data = await response.json();
      setProduct(data.product);
      setTop5(data.top5);
      toast.success('商品信息已加载');
    } catch (error) {
      toast.error('加载失败，请重试');
    } finally {
      setLoadingProduct(false);
    }
  };

  // 2. 提交分析（可选）
  const handleSubmitAnalysis = async () => {
    if (!product || !analysisText.trim()) return;

    setSubmittingAnalysis(true);
    try {
      const response = await fetch('/api/product/manual-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          sellingPoints: [],
          painPoints: [],
          targetAudience: analysisText.trim(),
        }),
      });

      if (!response.ok) throw new Error('提交失败');

      toast.success('分析已提交');
      setAnalysisText('');
    } catch (error) {
      toast.error('提交失败');
    } finally {
      setSubmittingAnalysis(false);
    }
  };

  // 3. 生成人设
  const handleGeneratePersona = async () => {
    if (!product) {
      toast.error('请先加载商品信息');
      return;
    }

    setGeneratingPersona(true);
    try {
      const response = await fetch('/api/persona/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id }),
      });

      if (!response.ok) throw new Error('生成失败');

      const data = await response.json();
      setPersona(data.persona);
      
      // 自动确认人设
      const confirmResponse = await fetch('/api/persona/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id, persona: data.persona }),
      });
      
      if (confirmResponse.ok) {
        const confirmData = await confirmResponse.json();
        setPersonaId(confirmData.personaId);
      }
      
      toast.success('人设已生成');
    } catch (error) {
      toast.error('人设生成失败');
    } finally {
      setGeneratingPersona(false);
    }
  };

  // 4. 生成脚本
  const handleGenerateScript = async () => {
    if (!product || !personaId) {
      toast.error('请先生成人设');
      return;
    }

    setGeneratingScript(true);
    try {
      const response = await fetch('/api/script/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          personaId: personaId,
          variants: 1,
        }),
      });

      if (!response.ok) throw new Error('生成失败');

      const data = await response.json();
      setScript(data.scripts[0]);
      
      // 自动确认脚本
      const confirmResponse = await fetch('/api/script/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          personaId: personaId,
          scripts: [data.scripts[0]],
        }),
      });
      
      if (confirmResponse.ok) {
        const confirmData = await confirmResponse.json();
        setScriptId(confirmData.scriptIds?.[0]);
      }
      
      toast.success('脚本已生成');
    } catch (error) {
      toast.error('脚本生成失败');
    } finally {
      setGeneratingScript(false);
    }
  };

  // 5. 生成视频
  const handleGenerateVideo = async () => {
    if (!scriptId) {
      toast.error('请先生成脚本');
      return;
    }

    try {
      const response = await fetch('/api/video/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scriptId: scriptId,
          providerPref: ['OpenAI', 'Pika'],
          seconds: 15,
          size: '720x1280',
        }),
      });

      if (!response.ok) throw new Error('创建失败');

      const data = await response.json();
      setVideoJob({ id: data.jobId, status: 'queued', progress: 0 });
      toast.success('视频生成任务已创建');
      
      startPollingVideoJob(data.jobId);
    } catch (error) {
      toast.error('视频生成失败');
    }
  };

  // 轮询视频任务
  const startPollingVideoJob = (jobId: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/video/jobs/${jobId}`);
        if (response.ok) {
          const data = await response.json();
          const job = data.job;
          
          setVideoJob({
            id: job.id,
            status: job.status,
            progress: job.progress,
            errorMessage: job.errorMessage,
            result: job.result
          });

          if (job.status === 'succeeded' || job.status === 'failed' || job.status === 'cancelled') {
            clearInterval(interval);
            setPollingInterval(null);
            
            if (job.status === 'succeeded') {
              toast.success('视频生成完成！');
            } else if (job.status === 'failed') {
              toast.error('视频生成失败');
            }
          }
        }
      } catch (error) {
        console.error('轮询失败:', error);
      }
    }, 2000);

    setPollingInterval(interval);
  };

  // 复制脚本
  const handleCopyScript = () => {
    if (!script) return;
    
    const scriptText = `【${script.angle}】
能量: ${script.energy} | 时长: ${script.durationSec}秒

=== 对话 ===
[开场] ${script.lines.open}
[主体] ${script.lines.main}
[结尾] ${script.lines.close}

=== 镜头分解 ===
${script.shots.map((shot: any) => `[${shot.second}s] ${shot.camera} | ${shot.action}`).join('\n')}

=== 技术参数 ===
方向: ${script.technical.orientation} | 拍摄: ${script.technical.filmingMethod}
位置: ${script.technical.location} | 音频: ${script.technical.audioEnv}`;

    navigator.clipboard.writeText(scriptText);
    toast.success('脚本已复制');
  };

  // 清理轮询
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      {/* 标题 */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold">UGC视频生成</h2>
        <p className="text-sm text-gray-500 mt-1">输入商品名称，AI自动生成人设和脚本</p>
      </div>

      {/* 1. 商品输入 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Search className="w-5 h-5 text-blue-500" />
            商品名称
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="输入商品名称，例如: iPhone 15 Pro"
              onKeyPress={(e) => e.key === 'Enter' && handleLoadProduct()}
              className="flex-1"
            />
            <Button 
              onClick={handleLoadProduct} 
              disabled={loadingProduct || !productName.trim()}
            >
              {loadingProduct ? <Loader2 className="w-4 h-4 animate-spin" /> : '加载'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 2. 商品信息（自动展开） */}
      {product && top5 && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                商品信息
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => {
                setProduct(null);
                setTop5(null);
                setPersona(null);
                setScript(null);
              }}>
                <Edit2 className="w-3 h-3 mr-1" />
                重新选择
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex gap-4 text-xs">
              <div>
                <span className="text-gray-500">商品:</span>
                <span className="font-medium ml-1">{product.name}</span>
              </div>
              <div>
                <span className="text-gray-500">类目:</span>
                <span className="font-medium ml-1">{product.category}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-green-50 border border-green-200 rounded p-2">
                <h4 className="text-xs font-semibold text-green-700 mb-1">Top5 卖点</h4>
                <div className="flex flex-wrap gap-1">
                  {top5.sellingPoints.map((point: string, i: number) => (
                    <Badge key={i} variant="secondary" className="text-xs py-0 px-1">{i + 1}. {point}</Badge>
                  ))}
                </div>
              </div>
              
              <div className="bg-orange-50 border border-orange-200 rounded p-2">
                <h4 className="text-xs font-semibold text-orange-700 mb-1">Top5 痛点</h4>
                <div className="flex flex-wrap gap-1">
                  {top5.painPoints.map((point: string, i: number) => (
                    <Badge key={i} variant="outline" className="text-xs py-0 px-1">{i + 1}. {point}</Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 3. 生成人设 */}
      {product && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-500" />
                UGC创作者人设
              </CardTitle>
              <Button 
                onClick={handleGeneratePersona} 
                disabled={generatingPersona}
                size="sm"
              >
                {generatingPersona ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <RefreshCw className="w-4 h-4 mr-1" />}
                {persona ? '重新生成' : '生成人设'}
              </Button>
            </div>
          </CardHeader>
          {persona && (
            <CardContent className="space-y-2">
              <div className="flex items-start gap-2 text-xs">
                <div className="flex-1 bg-blue-50 border border-blue-200 rounded p-2">
                  <span className="font-semibold text-blue-700">核心身份: </span>
                  <span className="text-gray-700">
                    <strong>{persona.coreIdentity.name}</strong> · {persona.coreIdentity.age}岁 · {persona.coreIdentity.occupation} · {persona.coreIdentity.location}
                  </span>
                </div>
                <div className="flex-1 bg-purple-50 border border-purple-200 rounded p-2">
                  <span className="font-semibold text-purple-700">外观风格: </span>
                  <span className="text-gray-700">{persona.look.generalAppearance}，{persona.look.clothingAesthetic}</span>
                </div>
              </div>
              
              <div className="flex items-start gap-2 text-xs">
                <div className="flex-1 bg-pink-50 border border-pink-200 rounded p-2">
                  <span className="font-semibold text-pink-700">性格特质: </span>
                  <span className="text-gray-700">{persona.vibe.traits.slice(0, 4).join('、')}</span>
                </div>
                <div className="flex-1 bg-green-50 border border-green-200 rounded p-2">
                  <span className="font-semibold text-green-700">💡 可信度: </span>
                  <span className="text-gray-700">{persona.why}</span>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* 4. 生成脚本 */}
      {persona && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Play className="w-4 h-4 text-amber-500" />
                15秒UGC脚本
              </CardTitle>
              <div className="flex gap-2">
                {script && (
                  <Button onClick={handleCopyScript} variant="outline" size="sm">
                    <Copy className="w-4 h-4 mr-1" />
                    复制
                  </Button>
                )}
                <Button 
                  onClick={handleGenerateScript} 
                  disabled={generatingScript}
                  size="sm"
                >
                  {generatingScript ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <RefreshCw className="w-4 h-4 mr-1" />}
                  {script ? '重新生成' : '生成脚本'}
                </Button>
              </div>
            </div>
          </CardHeader>
          {script && (
            <CardContent className="space-y-3">
              <div className="flex gap-2 text-xs">
                <Badge variant="outline">角度: {script.angle}</Badge>
                <Badge variant="outline">能量: {script.energy}</Badge>
                <Badge variant="outline">时长: {script.durationSec}秒</Badge>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="bg-blue-50 border border-blue-200 rounded p-2">
                  <div className="text-xs font-semibold text-blue-700 mb-1">开场 [0-3s]</div>
                  <p className="text-xs text-gray-700">"{script.lines.open}"</p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded p-2">
                  <div className="text-xs font-semibold text-blue-700 mb-1">主体 [3-12s]</div>
                  <p className="text-xs text-gray-700">"{script.lines.main}"</p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded p-2">
                  <div className="text-xs font-semibold text-blue-700 mb-1">结尾 [12-15s]</div>
                  <p className="text-xs text-gray-700">"{script.lines.close}"</p>
                </div>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded p-3">
                <h4 className="text-xs font-semibold text-purple-700 mb-2">🎬 镜头分解</h4>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                  {script.shots.map((shot: any, i: number) => (
                    <div key={i} className="text-xs flex gap-2">
                      <Badge variant="outline" className="text-xs flex-shrink-0">{shot.second}s</Badge>
                      <span className="text-gray-700">{shot.camera} | {shot.action}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* 5. 视频生成 */}
      {script && scriptId && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">视频生成</CardTitle>
          </CardHeader>
          <CardContent>
            {!videoJob && (
              <div className="flex gap-2">
                <Button onClick={handleCopyScript} variant="outline" className="flex-1">
                  <Copy className="w-4 h-4 mr-2" />
                  仅复制脚本
                </Button>
                <Button onClick={handleGenerateVideo} className="flex-1">
                  <Play className="w-4 h-4 mr-2" />
                  AI生成视频
                </Button>
              </div>
            )}

            {videoJob && (
              <div className="space-y-3">
                {videoJob.status === 'queued' && (
                  <div className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <Clock className="w-5 h-5 text-yellow-600 animate-pulse" />
                    <span className="text-sm font-medium">排队中...</span>
                  </div>
                )}
                
                {videoJob.status === 'running' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">生成中...</span>
                      <span>{videoJob.progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 transition-all duration-300"
                        style={{ width: `${videoJob.progress}%` }}
                      />
                    </div>
                  </div>
                )}
                
                {videoJob.status === 'succeeded' && videoJob.result && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">生成完成！</span>
                    </div>
                    <div className="bg-black rounded overflow-hidden">
                      <video src={videoJob.result.fileUrl} controls className="w-full" />
                    </div>
                    <Button onClick={() => window.open(videoJob.result?.fileUrl, '_blank')} className="w-full">
                      <Download className="w-4 h-4 mr-2" />
                      下载视频
                    </Button>
                  </div>
                )}
                
                {videoJob.status === 'failed' && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-red-600 p-3 bg-red-50 border border-red-200 rounded">
                      <XCircle className="w-5 h-5" />
                      <div>
                        <p className="font-medium">生成失败</p>
                        {videoJob.errorMessage && (
                          <p className="text-sm">{videoJob.errorMessage}</p>
                        )}
                      </div>
                    </div>
                    <Button onClick={() => setVideoJob(null)} variant="outline" className="w-full">
                      重试
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}