'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'

export default function VideoAnalysisPage() {
  const [activeTab, setActiveTab] = useState('upload')
  const [uploading, setUploading] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<any>(null)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('video', file)
      formData.append('options', JSON.stringify({
        includeAIAnalysis: true,
        extractFrames: true,
        detectObjects: true,
        extractText: true
      }))

      const response = await fetch('/api/video/analyze', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()
      if (result.success) {
        setAnalysisResult(result.data)
      } else {
        console.error('Analysis failed:', result.error)
      }
    } catch (error) {
      console.error('Upload failed:', error)
    } finally {
      setUploading(false)
    }
  }

  const handleUrlAnalysis = async (url: string) => {
    setUploading(true)
    try {
      const response = await fetch('/api/video/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url,
          options: {
            includeAIAnalysis: true,
            extractFrames: true,
            detectObjects: true,
            extractText: true
          }
        })
      })

      const result = await response.json()
      if (result.success) {
        setAnalysisResult(result.data)
      } else {
        console.error('Analysis failed:', result.error)
      }
    } catch (error) {
      console.error('URL analysis failed:', error)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">视频分析中心</h1>
        <p className="text-gray-600 mt-2">
          上传视频或输入URL进行深度分析，包括AI内容分析、物体检测、文本提取等
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="upload">上传分析</TabsTrigger>
          <TabsTrigger value="url">URL分析</TabsTrigger>
          <TabsTrigger value="competitor">商品分析</TabsTrigger>
          <TabsTrigger value="reference">参考视频</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>上传视频分析</CardTitle>
              <CardDescription>
                上传本地视频文件进行深度分析
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="video-upload">选择视频文件</Label>
                  <Input
                    id="video-upload"
                    type="file"
                    accept="video/*"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="mt-2"
                  />
                </div>
                {uploading && (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span>分析中...</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="url" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>URL视频分析</CardTitle>
              <CardDescription>
                输入视频URL进行在线分析
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="video-url">视频URL</Label>
                  <Input
                    id="video-url"
                    type="url"
                    placeholder="https://example.com/video.mp4"
                    className="mt-2"
                  />
                </div>
                <Button 
                  onClick={() => {
                    const url = (document.getElementById('video-url') as HTMLInputElement)?.value
                    if (url) handleUrlAnalysis(url)
                  }}
                  disabled={uploading}
                >
                  {uploading ? '分析中...' : '开始分析'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="competitor" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>商品分析</CardTitle>
              <CardDescription>
                分析商品相关的视频营销策略、内容结构和表现数据
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="competitor-url">竞品视频URL</Label>
                  <Input
                    id="competitor-url"
                    type="url"
                    placeholder="https://tiktok.com/@user/video/123"
                    className="mt-2"
                  />
                </div>
                <Button 
                  onClick={() => {
                    const url = (document.getElementById('competitor-url') as HTMLInputElement)?.value
                    if (url) {
                      // 调用竞品分析API
                      fetch('/api/competitor/analyze', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ url })
                      }).then(res => res.json()).then(data => {
                        if (data.success) {
                          setAnalysisResult(data.data)
                        }
                      })
                    }
                  }}
                >
                  分析竞品
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reference" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>参考视频管理</CardTitle>
              <CardDescription>
                管理参考视频库，支持上传和URL添加
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="ref-name">视频名称</Label>
                    <Input id="ref-name" placeholder="参考视频名称" />
                  </div>
                  <div>
                    <Label htmlFor="ref-category">分类</Label>
                    <Input id="ref-category" placeholder="产品展示" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="ref-tags">标签</Label>
                  <Input id="ref-tags" placeholder="科技,产品,演示" />
                </div>
                <div>
                  <Label htmlFor="ref-upload">上传文件或输入URL</Label>
                  <Input id="ref-upload" type="file" accept="video/*" />
                </div>
                <Button>添加参考视频</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {analysisResult && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>分析结果</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>视频时长</Label>
                  <p className="text-sm text-gray-600">{analysisResult.duration}秒</p>
                </div>
                <div>
                  <Label>分辨率</Label>
                  <p className="text-sm text-gray-600">{analysisResult.width}x{analysisResult.height}</p>
                </div>
                <div>
                  <Label>帧率</Label>
                  <p className="text-sm text-gray-600">{analysisResult.fps} FPS</p>
                </div>
                <div>
                  <Label>文件大小</Label>
                  <p className="text-sm text-gray-600">{(analysisResult.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>

              {analysisResult.quality && (
                <div>
                  <Label>质量指标</Label>
                  <div className="flex space-x-4 mt-2">
                    <Badge variant="outline">清晰度: {(analysisResult.quality.clarity * 100).toFixed(0)}%</Badge>
                    <Badge variant="outline">稳定性: {(analysisResult.quality.stability * 100).toFixed(0)}%</Badge>
                    <Badge variant="outline">色彩准确度: {(analysisResult.quality.colorAccuracy * 100).toFixed(0)}%</Badge>
                  </div>
                </div>
              )}

              {analysisResult.aiAnalysis && (
                <div>
                  <Label>AI分析结果</Label>
                  <div className="mt-2 space-y-2">
                    <p><strong>脚本结构:</strong> {analysisResult.aiAnalysis.scriptStructure}</p>
                    <p><strong>编辑节奏:</strong> {analysisResult.aiAnalysis.editingRhythm}</p>
                    <p><strong>视觉风格:</strong> {analysisResult.aiAnalysis.visualStyle}</p>
                    <p><strong>语调:</strong> {analysisResult.aiAnalysis.tone}</p>
                    <p><strong>目标受众:</strong> {analysisResult.aiAnalysis.targetAudience?.join(', ')}</p>
                    <p><strong>表现评分:</strong> {(analysisResult.aiAnalysis.performanceScore * 100).toFixed(0)}%</p>
                  </div>
                </div>
              )}

              {analysisResult.content && (
                <div>
                  <Label>内容分析</Label>
                  <div className="mt-2">
                    <p><strong>场景数量:</strong> {analysisResult.content.scenes?.length || 0}</p>
                    <p><strong>检测到的物体:</strong> {analysisResult.content.objects?.length || 0}</p>
                    <p><strong>提取的文本:</strong> {analysisResult.content.text?.length || 0}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
