'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Play, Copy, Download, CheckCircle, XCircle, Clock, RefreshCw, Sparkles, ChevronRight, Edit2 } from 'lucide-react';
import { toast } from 'sonner';

// 定义类型
interface Product {
  id: string;
  name: string;
  description: string | null;
  category: string;
  sellingPoints: string[];
  painPoints: string[];
  targetCountries: string[];
  targetAudience: string[];
}

interface Top5 {
  sellingPoints: string[];
  painPoints: string[];
  reasons: string[];
}

interface Persona {
  coreIdentity: {
    name: string;
    age: number;
    gender: string;
    location: string;
    occupation: string;
  };
  look: {
    generalAppearance: string;
    hair: string;
    clothingAesthetic: string;
    signatureDetails: string;
  };
  vibe: {
    traits: string[];
    demeanor: string;
    communicationStyle: string;
  };
  context: {
    hobbies: string;
    values: string;
    frustrations: string;
    homeEnvironment: string;
  };
  why: string;
}

interface Script {
  angle: string;
  energy: string;
  durationSec: number;
  lines: {
    open: string;
    main: string;
    close: string;
  };
  shots: Array<{
    second: number;
    camera: string;
    action: string;
    visibility: string;
    audio: string;
  }>;
  technical: {
    orientation: string;
    filmingMethod: string;
    dominantHand: string;
    location: string;
    audioEnv: string;
  };
}

interface VideoJob {
  id: string;
  status: 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled';
  progress: number;
  errorMessage?: string;
  result?: {
    fileUrl: string;
    thumbnailUrl?: string;
  };
}

export default function VideoGenerationPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [productName, setProductName] = useState('');
  const [product, setProduct] = useState<Product | null>(null);
  const [top5, setTop5] = useState<Top5 | null>(null);
  const [persona, setPersona] = useState<Persona | null>(null);
  const [personaId, setPersonaId] = useState<string | null>(null);
  const [script, setScript] = useState<Script | null>(null);
  const [scriptId, setScriptId] = useState<string | null>(null);
  const [videoJob, setVideoJob] = useState<VideoJob | null>(null);
  const [loading, setLoading] = useState(false);
  const [analysisText, setAnalysisText] = useState('');
  const [personaMode, setPersonaMode] = useState<'select' | 'generate'>('select');
  const [availablePersonas, setAvailablePersonas] = useState<Array<Persona & { id: string; version?: number; productName?: string }>>([]);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  // 步骤标题
  const stepTitles = [
    '输入商品',
    '商品信息确认',
    '商品分析（可选）',
    '生成人设',
    '确认人设',
    '生成脚本',
    '确认脚本',
    '选择生成方式',
    '视频生成'
  ];

  // 步骤 1: 初始化商品（调用admin库）
  const handleInitProduct = async () => {
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

      if (!response.ok) {
        throw new Error('初始化失败');
      }

      const data = await response.json();
      setProduct(data.product);
      setTop5(data.top5);
      setCurrentStep(2);
      toast.success('商品信息加载成功');
    } catch (error) {
      toast.error('初始化失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 步骤 3: 提交分析
  const handleSubmitAnalysis = async () => {
    if (!product || !analysisText.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/product/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          analysisText: analysisText.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('提交分析失败');
      }

      toast.success('分析已提交到备选池');
      setAnalysisText('');
    } catch (error) {
      toast.error('提交分析失败');
    } finally {
      setLoading(false);
    }
  };

  // 加载可用人设列表
  useEffect(() => {
    if (currentStep === 4 && product) {
      loadAvailablePersonas();
    }
  }, [currentStep, product]);

  const loadAvailablePersonas = async () => {
    if (!product) return;
    
    try {
      const response = await fetch(`/api/admin/personas?productId=${product.id}`);
      const data = await response.json();
      if (data.success && data.data) {
        setAvailablePersonas(data.data);
      }
    } catch (error) {
      console.error('加载人设列表失败:', error);
    }
  };

  // 从列表中选择人设
  const handleSelectPersona = (selectedPersona: any) => {
    setPersona({
      coreIdentity: selectedPersona.coreIdentity,
      look: selectedPersona.look,
      vibe: selectedPersona.vibe,
      context: selectedPersona.context,
      why: selectedPersona.why,
    });
    setPersonaId(selectedPersona.id);
    setCurrentStep(5);
    toast.success('人设已选择');
  };

  // 步骤 4: 生成人设
  const handleGeneratePersona = async () => {
    if (!product) return;

    setLoading(true);
    try {
      const response = await fetch('/api/persona/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id }),
      });

      if (!response.ok) {
        throw new Error('人设生成失败');
      }

      const data = await response.json();
      setPersona(data.persona);
      setCurrentStep(5);
      toast.success('人设生成成功');
    } catch (error) {
      toast.error('人设生成失败');
    } finally {
      setLoading(false);
    }
  };

  // 步骤 5: 确认人设
  const handleConfirmPersona = async () => {
    if (!product || !persona) return;

    setLoading(true);
    try {
      const response = await fetch('/api/persona/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          persona,
        }),
      });

      if (!response.ok) {
        throw new Error('人设确认失败');
      }

      const data = await response.json();
      setPersonaId(data.personaId);
      setCurrentStep(6);
      toast.success('人设已确认');
    } catch (error) {
      toast.error('人设确认失败');
    } finally {
      setLoading(false);
    }
  };

  // 步骤 6: 生成脚本
  const handleGenerateScript = async () => {
    if (!product || !personaId) return;

    setLoading(true);
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

      if (!response.ok) {
        throw new Error('脚本生成失败');
      }

      const data = await response.json();
      setScript(data.scripts[0]);
      setCurrentStep(7);
      toast.success('脚本生成成功');
    } catch (error) {
      toast.error('脚本生成失败');
    } finally {
      setLoading(false);
    }
  };

  // 步骤 7: 确认脚本
  const handleConfirmScript = async () => {
    if (!product || !personaId || !script) return;

    setLoading(true);
    try {
      const response = await fetch('/api/script/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          personaId: personaId,
          scripts: [script],
        }),
      });

      if (!response.ok) {
        throw new Error('脚本确认失败');
      }

      const data = await response.json();
      setScriptId(data.scriptIds?.[0]);
      setCurrentStep(8);
      toast.success('脚本已确认');
    } catch (error) {
      toast.error('脚本确认失败');
    } finally {
      setLoading(false);
    }
  };

  // 步骤 8: 生成视频
  const handleGenerateVideo = async () => {
    if (!scriptId) return;

    setLoading(true);
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

      if (!response.ok) {
        throw new Error('视频生成失败');
      }

      const data = await response.json();
      setVideoJob({ id: data.jobId, status: 'queued', progress: 0 });
      setCurrentStep(9);
      toast.success('视频生成任务已创建');
      
      startPollingVideoJob(data.jobId);
    } catch (error) {
      toast.error('视频生成失败');
    } finally {
      setLoading(false);
    }
  };

  // 轮询视频任务状态
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
        console.error('Failed to poll video job status:', error);
      }
    }, 2000);

    setPollingInterval(interval);
  };

  // 复制脚本
  const handleCopyScript = () => {
    if (!script) return;
    
    const scriptText = `【${script.angle}】
能量: ${script.energy}
时长: ${script.durationSec}秒

=== 对话 ===
[开场] ${script.lines.open}
[主体] ${script.lines.main}
[结尾] ${script.lines.close}

=== 镜头分解 ===
${script.shots.map(shot => 
  `[${shot.second}s] ${shot.camera} | ${shot.action}`
).join('\n')}

=== 技术参数 ===
方向: ${script.technical.orientation}
拍摄: ${script.technical.filmingMethod}
位置: ${script.technical.location}`;

    navigator.clipboard.writeText(scriptText);
    toast.success('脚本已复制到剪贴板');
  };

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* 顶部导航 */}
      <div className="border-b bg-white shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                UGC 视频生成
              </h1>
              <p className="text-sm text-gray-500 mt-1">AI驱动的电商短视频制作流程</p>
            </div>
            <Badge variant="outline" className="text-sm px-3 py-1">
              步骤 {currentStep} / 9
            </Badge>
          </div>
        </div>
      </div>

      {/* 进度条 */}
      <div className="border-b bg-white">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-2">
            {stepTitles.map((title, index) => {
              const stepNum = index + 1;
              const isActive = stepNum === currentStep;
              const isCompleted = stepNum < currentStep;
              
              return (
                <React.Fragment key={stepNum}>
                  <div className="flex flex-col items-center flex-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                      isCompleted 
                        ? 'bg-green-500 text-white' 
                        : isActive 
                        ? 'bg-blue-500 text-white ring-4 ring-blue-100' 
                        : 'bg-gray-200 text-gray-500'
                    }`}>
                      {isCompleted ? <CheckCircle className="w-4 h-4" /> : stepNum}
                    </div>
                    <span className={`text-xs mt-1 text-center ${
                      isActive ? 'text-blue-600 font-medium' : 'text-gray-500'
                    }`}>
                      {title}
                    </span>
                  </div>
                  {stepNum < 9 && (
                    <ChevronRight className={`w-4 h-4 flex-shrink-0 ${
                      isCompleted ? 'text-green-500' : 'text-gray-300'
                    }`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* 主要内容区 */}
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-5xl mx-auto">
          
          {/* 步骤 1: 输入商品 */}
          {currentStep === 1 && (
            <Card className="shadow-lg border-0">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-500" />
                  输入商品名称
                </CardTitle>
                <CardDescription>请输入要生成视频的商品名称，系统将自动从商品库匹配</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="productName" className="text-sm font-medium">商品名称</Label>
                    <Input
                      id="productName"
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      placeholder="例如: iPhone 15 Pro"
                      className="mt-2 h-12 text-lg"
                      onKeyPress={(e) => e.key === 'Enter' && handleInitProduct()}
                    />
                  </div>
                  <Button 
                    onClick={handleInitProduct} 
                    disabled={loading || !productName.trim()}
                    className="w-full h-12 text-lg font-medium"
                    size="lg"
                  >
                    {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                    开始生成
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 步骤 2: 商品信息确认 */}
          {currentStep === 2 && product && top5 && (
            <div className="space-y-6">
              <Card className="shadow-lg border-0">
                <CardHeader className="bg-gradient-to-r from-green-50 to-teal-50">
                  <CardTitle>商品信息确认</CardTitle>
                  <CardDescription>系统已自动从商品库补全信息并提取Top5卖点/痛点</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {/* 商品基本信息 */}
                  <div className="bg-white border rounded-lg p-4">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Badge variant="outline">基本信息</Badge>
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">商品名称:</span>
                        <p className="font-medium mt-1">{product.name}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">类目:</span>
                        <p className="font-medium mt-1">{product.category}</p>
                      </div>
                      {product.targetCountries && product.targetCountries.length > 0 && (
                        <div>
                          <span className="text-gray-500">目标国家:</span>
                          <p className="font-medium mt-1">{product.targetCountries.join(', ')}</p>
                        </div>
                      )}
                      {product.targetAudience && product.targetAudience.length > 0 && (
                        <div>
                          <span className="text-gray-500">目标受众:</span>
                          <p className="font-medium mt-1">{product.targetAudience.join(', ')}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Top5 卖点 */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 className="font-semibold mb-3 flex items-center gap-2 text-green-700">
                      <Badge variant="default" className="bg-green-600">Top5 卖点</Badge>
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {top5.sellingPoints.map((point, index) => (
                        <Badge key={index} variant="secondary" className="text-sm px-3 py-1">
                          {index + 1}. {point}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Top5 痛点 */}
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <h3 className="font-semibold mb-3 flex items-center gap-2 text-orange-700">
                      <Badge variant="destructive" className="bg-orange-600">Top5 痛点</Badge>
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {top5.painPoints.map((point, index) => (
                        <Badge key={index} variant="outline" className="text-sm px-3 py-1 border-orange-300">
                          {index + 1}. {point}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* 选择理由 */}
                  {top5.reasons && top5.reasons.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h3 className="font-semibold mb-2 text-blue-700 text-sm">选择理由</h3>
                      <ul className="text-sm text-blue-600 space-y-1">
                        {top5.reasons.map((reason, index) => (
                          <li key={index}>• {reason}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button onClick={() => setCurrentStep(1)} variant="outline" className="flex-1">
                      返回修改
                    </Button>
                    <Button onClick={() => setCurrentStep(3)} className="flex-1">
                      确认信息
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* 步骤 3: 商品分析（可选） */}
          {currentStep === 3 && (
            <Card className="shadow-lg border-0">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                <CardTitle className="flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-purple-500" />
                  商品分析（可选）
                </CardTitle>
                <CardDescription>您可以添加自己的商品分析，系统会将其加入备选池</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="analysisText">分析内容</Label>
                    <textarea
                      id="analysisText"
                      value={analysisText}
                      onChange={(e) => setAnalysisText(e.target.value)}
                      placeholder="请输入您对商品的详细分析..."
                      className="w-full mt-2 p-4 border rounded-lg min-h-[120px] focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button 
                      onClick={handleSubmitAnalysis} 
                      disabled={loading || !analysisText.trim()}
                      variant="secondary"
                      className="flex-1"
                    >
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      提交分析
                    </Button>
                    <Button onClick={() => setCurrentStep(4)} className="flex-1">
                      跳过此步骤
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 步骤 4: 生成人设 */}
          {currentStep === 4 && (
            <Card className="shadow-lg border-0">
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50">
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-500" />
                  选择或生成UGC创作者人设
                </CardTitle>
                <CardDescription>从已有人设中选择，或让AI生成新的人设</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* 模式切换 */}
                <div className="flex gap-4 p-1 bg-gray-100 rounded-lg">
                  <button
                    onClick={() => setPersonaMode('select')}
                    className={`flex-1 py-2 px-4 rounded-md transition-all ${
                      personaMode === 'select'
                        ? 'bg-white shadow-sm text-indigo-600 font-medium'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    从人设表选择
                  </button>
                  <button
                    onClick={() => setPersonaMode('generate')}
                    className={`flex-1 py-2 px-4 rounded-md transition-all ${
                      personaMode === 'generate'
                        ? 'bg-white shadow-sm text-indigo-600 font-medium'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    生成新人设
                  </button>
                </div>

                {/* 选择模式：显示人设列表 */}
                {personaMode === 'select' && (
                  <div className="space-y-4">
                    {availablePersonas.length > 0 ? (
                      <>
                        <p className="text-sm text-gray-600">为该商品推荐以下人设：</p>
                        <div className="grid gap-4">
                          {availablePersonas.map((p) => (
                            <div
                              key={p.id}
                              className="border rounded-lg p-4 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer bg-white"
                              onClick={() => handleSelectPersona(p)}
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <h4 className="font-semibold text-lg text-gray-900">{p.coreIdentity.name}</h4>
                                  <p className="text-sm text-gray-500">
                                    {p.coreIdentity.age}岁 · {p.coreIdentity.gender} · {p.coreIdentity.location}
                                  </p>
                                </div>
                                <Badge variant="secondary">v{p.version || 1}</Badge>
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-start gap-2">
                                  <span className="text-xs font-medium text-gray-500 min-w-[60px]">职业：</span>
                                  <span className="text-sm text-gray-700">{p.coreIdentity.occupation}</span>
                                </div>
                                <div className="flex items-start gap-2">
                                  <span className="text-xs font-medium text-gray-500 min-w-[60px]">性格：</span>
                                  <div className="flex flex-wrap gap-1">
                                    {p.vibe.traits.slice(0, 4).map((trait, idx) => (
                                      <Badge key={idx} variant="outline" className="text-xs">
                                        {trait}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                                <div className="flex items-start gap-2">
                                  <span className="text-xs font-medium text-gray-500 min-w-[60px]">可信度：</span>
                                  <span className="text-sm text-gray-700 line-clamp-2">{p.why}</span>
                                </div>
                              </div>
                              <Button size="sm" className="mt-3 w-full" variant="outline">
                                选择此人设 <ChevronRight className="ml-2 h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <p>暂无可用人设</p>
                        <p className="text-sm mt-2">请切换到"生成新人设"模式</p>
                      </div>
                    )}
                  </div>
                )}

                {/* 生成模式：生成新人设 */}
                {personaMode === 'generate' && (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Sparkles className="w-8 h-8 text-indigo-500" />
                    </div>
                    <p className="text-gray-600 mb-6">点击下方按钮，AI将为您生成专业的UGC创作者人设</p>
                    <Button 
                      onClick={handleGeneratePersona} 
                      disabled={loading}
                      size="lg"
                      className="px-8"
                    >
                      {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                      生成人设
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* 步骤 5: 确认人设 */}
          {currentStep === 5 && persona && (
            <Card className="shadow-lg border-0">
              <CardHeader className="bg-gradient-to-r from-pink-50 to-rose-50">
                <CardTitle className="flex items-center justify-between">
                  <span>确认人设</span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleGeneratePersona}>
                      <RefreshCw className="w-4 h-4 mr-1" />
                      重新生成
                    </Button>
                  </div>
                </CardTitle>
                <CardDescription>请查看生成的人设信息，确认后将保存到数据库</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {/* 核心身份 */}
                <div className="bg-white border rounded-lg p-4">
                  <h3 className="font-semibold mb-3 text-pink-700">👤 核心身份</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-gray-500">姓名:</span> <strong>{persona.coreIdentity.name}</strong></div>
                    <div><span className="text-gray-500">年龄:</span> <strong>{persona.coreIdentity.age}岁</strong></div>
                    <div><span className="text-gray-500">性别:</span> <strong>{persona.coreIdentity.gender}</strong></div>
                    <div><span className="text-gray-500">职业:</span> <strong>{persona.coreIdentity.occupation}</strong></div>
                    <div className="col-span-2"><span className="text-gray-500">位置:</span> <strong>{persona.coreIdentity.location}</strong></div>
                  </div>
                </div>

                {/* 外观风格 */}
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h3 className="font-semibold mb-3 text-purple-700">👗 外观风格</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-gray-600">整体:</span> {persona.look.generalAppearance}</p>
                    <p><span className="text-gray-600">发型:</span> {persona.look.hair}</p>
                    <p><span className="text-gray-600">服装:</span> {persona.look.clothingAesthetic}</p>
                  </div>
                </div>

                {/* 性格特质 */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold mb-3 text-blue-700">✨ 性格与沟通</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-600">特质:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {persona.vibe.traits.map((trait, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">{trait}</Badge>
                        ))}
                      </div>
                    </div>
                    <p><span className="text-gray-600">风格:</span> {persona.vibe.communicationStyle}</p>
                  </div>
                </div>

                {/* 可信度理由 */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold mb-2 text-green-700">💡 可信度理由</h3>
                  <p className="text-sm text-gray-700">{persona.why}</p>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button onClick={() => setCurrentStep(4)} variant="outline" className="flex-1">
                    返回重新生成
                  </Button>
                  <Button onClick={handleConfirmPersona} disabled={loading} className="flex-1">
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    确认人设
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 步骤 6: 生成脚本 */}
          {currentStep === 6 && (
            <Card className="shadow-lg border-0">
              <CardHeader className="bg-gradient-to-r from-amber-50 to-yellow-50">
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  生成15秒UGC脚本
                </CardTitle>
                <CardDescription>系统将基于人设和商品信息生成专业的视频脚本</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Play className="w-8 h-8 text-amber-500" />
                  </div>
                  <p className="text-gray-600 mb-6">点击下方按钮，AI将生成包含镜头分解的完整脚本</p>
                  <Button 
                    onClick={handleGenerateScript} 
                    disabled={loading}
                    size="lg"
                    className="px-8"
                  >
                    {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                    生成脚本
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 步骤 7: 确认脚本 */}
          {currentStep === 7 && script && (
            <Card className="shadow-lg border-0">
              <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50">
                <CardTitle className="flex items-center justify-between">
                  <span>确认脚本</span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleCopyScript}>
                      <Copy className="w-4 h-4 mr-1" />
                      复制
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleGenerateScript}>
                      <RefreshCw className="w-4 h-4 mr-1" />
                      重新生成
                    </Button>
                  </div>
                </CardTitle>
                <CardDescription>请查看生成的脚本，确认后将保存到数据库</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {/* 脚本元信息 */}
                <div className="flex gap-4 text-sm">
                  <Badge variant="outline">角度: {script.angle}</Badge>
                  <Badge variant="outline">能量: {script.energy}</Badge>
                  <Badge variant="outline">时长: {script.durationSec}秒</Badge>
                </div>

                {/* 对话内容 */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold mb-3 text-blue-700">📝 对话内容</h3>
                  <div className="space-y-3 text-sm">
                    <div className="bg-white p-3 rounded">
                      <Badge variant="secondary" className="mb-2">开场 [0-3s]</Badge>
                      <p className="text-gray-700">"{script.lines.open}"</p>
                    </div>
                    <div className="bg-white p-3 rounded">
                      <Badge variant="secondary" className="mb-2">主体 [3-12s]</Badge>
                      <p className="text-gray-700">"{script.lines.main}"</p>
                    </div>
                    <div className="bg-white p-3 rounded">
                      <Badge variant="secondary" className="mb-2">结尾 [12-15s]</Badge>
                      <p className="text-gray-700">"{script.lines.close}"</p>
                    </div>
                  </div>
                </div>

                {/* 镜头分解 */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
                  <h3 className="font-semibold mb-3 text-purple-700">🎬 镜头分解</h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {script.shots.map((shot, index) => (
                      <div key={index} className="bg-white p-3 rounded text-xs flex items-start gap-3">
                        <Badge variant="outline" className="flex-shrink-0">{shot.second}s</Badge>
                        <div className="flex-1">
                          <p className="font-medium text-gray-700">{shot.camera} | {shot.action}</p>
                          <p className="text-gray-500 mt-1">📹 {shot.visibility} · 🔊 {shot.audio}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 技术参数 */}
                <div className="bg-gray-50 border rounded-lg p-4">
                  <h3 className="font-semibold mb-3 text-gray-700 text-sm">⚙️ 技术参数</h3>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                    <div>方向: {script.technical.orientation}</div>
                    <div>拍摄: {script.technical.filmingMethod}</div>
                    <div>位置: {script.technical.location}</div>
                    <div>音频: {script.technical.audioEnv}</div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button onClick={() => setCurrentStep(6)} variant="outline" className="flex-1">
                    返回重新生成
                  </Button>
                  <Button onClick={handleConfirmScript} disabled={loading} className="flex-1">
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    确认脚本
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 步骤 8: 选择生成方式 */}
          {currentStep === 8 && (
            <div className="grid grid-cols-2 gap-6">
              <Card className="shadow-lg border-2 border-transparent hover:border-blue-300 transition-all cursor-pointer">
                <CardHeader className="bg-gradient-to-br from-blue-50 to-cyan-50">
                  <CardTitle className="text-lg">📋 复制脚本</CardTitle>
                  <CardDescription>手动制作视频</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <p className="text-sm text-gray-600 mb-4">复制脚本到剪贴板，使用您喜欢的工具手动制作视频</p>
                  <Button onClick={handleCopyScript} variant="outline" className="w-full">
                    <Copy className="w-4 h-4 mr-2" />
                    复制脚本
                  </Button>
                </CardContent>
              </Card>

              <Card className="shadow-lg border-2 border-transparent hover:border-purple-300 transition-all cursor-pointer">
                <CardHeader className="bg-gradient-to-br from-purple-50 to-pink-50">
                  <CardTitle className="text-lg">🎬 AI生成视频</CardTitle>
                  <CardDescription>自动生成视频</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <p className="text-sm text-gray-600 mb-4">使用AI自动生成视频（需要2-3分钟）</p>
                  <Button onClick={handleGenerateVideo} disabled={loading} className="w-full">
                    {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    <Play className="w-4 h-4 mr-2" />
                    开始生成
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* 步骤 9: 视频生成进度 */}
          {currentStep === 9 && videoJob && (
            <Card className="shadow-lg border-0">
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
                <CardTitle>视频生成进度</CardTitle>
                <CardDescription>请耐心等待，AI正在为您生成视频</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* 状态显示 */}
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    {videoJob.status === 'queued' && (
                      <>
                        <Clock className="w-16 h-16 text-yellow-500 mx-auto mb-4 animate-pulse" />
                        <p className="text-lg font-medium">排队中...</p>
                      </>
                    )}
                    {videoJob.status === 'running' && (
                      <>
                        <Loader2 className="w-16 h-16 text-blue-500 mx-auto mb-4 animate-spin" />
                        <p className="text-lg font-medium">生成中 {videoJob.progress}%</p>
                        <div className="w-64 h-2 bg-gray-200 rounded-full mt-4 overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 transition-all duration-300"
                            style={{ width: `${videoJob.progress}%` }}
                          />
                        </div>
                      </>
                    )}
                    {videoJob.status === 'succeeded' && videoJob.result && (
                      <>
                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <p className="text-lg font-medium text-green-600 mb-6">生成完成！</p>
                        <div className="bg-black rounded-lg overflow-hidden mb-4">
                          <video
                            src={videoJob.result.fileUrl}
                            controls
                            className="w-full"
                          />
                        </div>
                        <Button onClick={() => window.open(videoJob.result?.fileUrl, '_blank')} size="lg">
                          <Download className="w-4 h-4 mr-2" />
                          下载视频
                        </Button>
                      </>
                    )}
                    {videoJob.status === 'failed' && (
                      <>
                        <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                        <p className="text-lg font-medium text-red-600">生成失败</p>
                        {videoJob.errorMessage && (
                          <p className="text-sm text-gray-600 mt-2">{videoJob.errorMessage}</p>
                        )}
                        <Button onClick={() => setCurrentStep(8)} variant="outline" className="mt-4">
                          返回重试
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

        </div>
      </div>
    </div>
  );
}