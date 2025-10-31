'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import type { MediaFile } from '@/components/MultiMediaInput';
import { MultiMediaInput } from '@/components/MultiMediaInput'
import { 
  FileText, 
  Video, 
  Upload, 
  Link, 
  Brain,
  CheckCircle,
  AlertCircle,
  Loader2,
  Plus,
  Trash2
} from 'lucide-react'
import StylePreviewCard from './StylePreviewCard'

interface GeneratedStyle {
  id: string
  name: string
  description: string
  structure: string
  hookPool: string
  videoStylePool: string
  tonePool: string
  suggestedLength: string
  recommendedCategories: string
  targetCountries: string
  templatePrompt: string
  confidence: number
  videoAnalysis?: {
    duration: number
    scenes: string[]
    editingRhythm: string
    visualStyle: string
    audioStyle: string
  }
}

interface StyleParserProps {
  onStylesAdded?: (styles: GeneratedStyle[]) => void
}

export default function StyleParser({ onStylesAdded }: StyleParserProps) {
  const [activeTab, setActiveTab] = useState('document')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [generatedStyles, setGeneratedStyles] = useState<GeneratedStyle[]>([])
  const [selectedStyles, setSelectedStyles] = useState<Set<string>>(new Set())
  const [isSaving, setIsSaving] = useState(false)

  // 文档解析状态
  const [documentContent, setDocumentContent] = useState('')
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([])
  const [documentUrl, setDocumentUrl] = useState('')
  const [documentCategory, setDocumentCategory] = useState('')
  const [documentTargetCountry, setDocumentTargetCountry] = useState('')

  // 视频解析状态
  const [videoUrl, setVideoUrl] = useState('')
  const [videoCategory, setVideoCategory] = useState('')
  const [videoTargetCountry, setVideoTargetCountry] = useState('')

  // 处理媒体文件变化
  const handleMediaChange = (files: MediaFile[]) => {
    setMediaFiles(files);
  };

  const handleDocumentParse = async () => {
    if (!documentContent && !documentUrl && mediaFiles.length === 0) {
      alert('请输入文档内容、URL或上传文件')
      return
    }

    setIsAnalyzing(true)
    try {
      const response = await fetch('/api/styles/parse-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: documentContent || documentUrl,
          type: documentContent ? 'text' : 'url',
          category: documentCategory,
          targetCountry: documentTargetCountry
        })
      })

      const result = await response.json()
      if (result.success) {
        setGeneratedStyles(result.data.styles)
        setSelectedStyles(new Set(result.data.styles.map((s: GeneratedStyle) => s.id)))
      } else {
        alert(`解析失败: ${result.error}`)
      }
    } catch (error) {
      console.error('文档解析失败:', error)
      alert('文档解析失败，请重试')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleVideoParse = async () => {
    if (!videoUrl) {
      alert('请输入视频URL')
      return
    }

    setIsAnalyzing(true)
    try {
      const response = await fetch('/api/styles/parse-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoUrl,
          category: videoCategory,
          targetCountry: videoTargetCountry
        })
      })

      const result = await response.json()
      if (result.success) {
        setGeneratedStyles(result.data.styles)
        setSelectedStyles(new Set(result.data.styles.map((s: GeneratedStyle) => s.id)))
      } else {
        alert(`解析失败: ${result.error}`)
      }
    } catch (error) {
      console.error('视频解析失败:', error)
      alert('视频解析失败，请重试')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleStyleEdit = (id: string, updatedStyle: Partial<GeneratedStyle>) => {
    setGeneratedStyles(prev => prev.map(style => 
      style.id === id ? { ...style, ...updatedStyle } : style
    ))
  }

  const handleStyleDelete = (id: string) => {
    setGeneratedStyles(prev => prev.filter(style => style.id !== id))
    setSelectedStyles(prev => {
      const newSet = new Set(prev)
      newSet.delete(id)
      return newSet
    })
  }

  const handleToggleSelect = (id: string) => {
    setSelectedStyles(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const handleSaveStyles = async () => {
    if (selectedStyles.size === 0) {
      alert('请至少选择一个风格')
      return
    }

    setIsSaving(true)
    try {
      const stylesToSave = generatedStyles.filter(style => selectedStyles.has(style.id))
      
      const response = await fetch('/api/styles/parse-document', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          styles: stylesToSave
        })
      })

      const result = await response.json()
      if (result.success) {
        alert(`成功保存 ${result.data.count} 个风格`)
        setGeneratedStyles([])
        setSelectedStyles(new Set())
        onStylesAdded?.(stylesToSave)
      } else {
        alert(`保存失败: ${result.error}`)
      }
    } catch (error) {
      console.error('保存风格失败:', error)
      alert('保存风格失败，请重试')
    } finally {
      setIsSaving(false)
    }
  }

  const handleClearAll = () => {
    setGeneratedStyles([])
    setSelectedStyles(new Set())
    setDocumentContent('')
    setDocumentUrl('')
    setVideoUrl('')
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">风格库解析</h2>
          <p className="text-gray-600">通过文档或视频分析生成风格建议</p>
        </div>
        {generatedStyles.length > 0 && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClearAll}>
              <Trash2 className="h-4 w-4 mr-2" />
              清空
            </Button>
            <Button 
              onClick={handleSaveStyles}
              disabled={selectedStyles.size === 0 || isSaving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  保存中...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  确认添加 ({selectedStyles.size})
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="document" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            文档解析
          </TabsTrigger>
          <TabsTrigger value="video" className="flex items-center gap-2">
            <Video className="h-4 w-4" />
            视频解析
          </TabsTrigger>
        </TabsList>

        <TabsContent value="document" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                文档内容分析
              </CardTitle>
              <CardDescription>
                粘贴文档内容或输入文档链接，AI将分析并生成风格建议
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 文档内容输入区域 */}
              <div className="space-y-4">
                <MultiMediaInput
                  value={documentContent}
                  onChange={setDocumentContent}
                  onMediaChange={handleMediaChange}
                  placeholder="请粘贴文档内容，支持保持原有格式，或直接粘贴/拖拽文件..."
                  label="文档内容输入"
                  maxFiles={3}
                  acceptedTypes={['text/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']}
                />
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-500">或</span>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-700">输入文档链接</Label>
                  <p className="text-xs text-gray-500 mb-3">支持在线文档链接，AI将自动抓取内容</p>
                  <Input
                    value={documentUrl}
                    onChange={(e) => setDocumentUrl(e.target.value)}
                    placeholder="https://example.com/document.pdf"
                    className="border-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="documentCategory">产品类目</Label>
                  <Input
                    id="documentCategory"
                    value={documentCategory}
                    onChange={(e) => setDocumentCategory(e.target.value)}
                    placeholder="如：电子产品、美妆护肤..."
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="documentTargetCountry">目标国家</Label>
                  <Input
                    id="documentTargetCountry"
                    value={documentTargetCountry}
                    onChange={(e) => setDocumentTargetCountry(e.target.value)}
                    placeholder="如：美国、中国、全球..."
                    className="mt-1"
                  />
                </div>
              </div>

              <Button 
                onClick={handleDocumentParse}
                disabled={isAnalyzing || (!documentContent && !documentUrl)}
                className="w-full"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    分析中...
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4 mr-2" />
                    开始分析
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="video" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5" />
                视频内容分析
              </CardTitle>
              <CardDescription>
                输入视频链接，AI将分析视频风格并生成对应的风格建议
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="videoUrl">视频链接</Label>
                <Input
                  id="videoUrl"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="输入视频URL（支持YouTube、B站等）..."
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  支持主流视频平台的链接
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="videoCategory">产品类目</Label>
                  <Input
                    id="videoCategory"
                    value={videoCategory}
                    onChange={(e) => setVideoCategory(e.target.value)}
                    placeholder="如：电子产品、美妆护肤..."
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="videoTargetCountry">目标国家</Label>
                  <Input
                    id="videoTargetCountry"
                    value={videoTargetCountry}
                    onChange={(e) => setVideoTargetCountry(e.target.value)}
                    placeholder="如：美国、中国、全球..."
                    className="mt-1"
                  />
                </div>
              </div>

              <Button 
                onClick={handleVideoParse}
                disabled={isAnalyzing || !videoUrl}
                className="w-full"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    分析中...
                  </>
                ) : (
                  <>
                    <Video className="h-4 w-4 mr-2" />
                    开始分析
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 生成的风格预览 */}
      {generatedStyles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              生成的风格建议
            </CardTitle>
            <CardDescription>
              共生成 {generatedStyles.length} 个风格建议，已选择 {selectedStyles.size} 个
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {generatedStyles.map((style) => (
                <StylePreviewCard
                  key={style.id}
                  style={style}
                  isSelected={selectedStyles.has(style.id)}
                  onSelect={handleToggleSelect}
                  onEdit={handleStyleEdit}
                  onDelete={handleStyleDelete}
                  onToggleSelect={handleToggleSelect}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
