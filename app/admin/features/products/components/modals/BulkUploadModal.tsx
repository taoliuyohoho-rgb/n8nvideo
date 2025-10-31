'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { FileText, Download } from 'lucide-react'

interface BulkUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onUpload: (file: File) => Promise<void>
}

export function BulkUploadModal({ isOpen, onClose, onUpload }: BulkUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('请选择文件')
      return
    }

    setIsUploading(true)
    try {
      await onUpload(selectedFile)
      setSelectedFile(null)
      onClose()
    } catch (error) {
      console.error('批量上传失败:', error)
      alert('上传失败，请重试')
    } finally {
      setIsUploading(false)
    }
  }

  const handleClose = () => {
    setSelectedFile(null)
    onClose()
  }

  const downloadTemplate = () => {
    const csvContent = `name,description,category,subcategory,sellingPoints,painPoints,targetAudience,targetCountries
"示例商品1","这是一个示例商品描述","电子产品","手机配件","[""高性价比"",""品质保证""]","[""价格敏感"",""质量担忧""]","[""年轻用户"",""学生群体""]","[""中国"",""美国""]"
"示例商品2","另一个示例商品","服装","男装","[""时尚设计"",""舒适材质""]","[""尺码选择困难"",""搭配困扰""]","[""时尚达人"",""上班族""]","[""中国"",""日本""]"`

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', '商品批量上传模板.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>批量上传商品</DialogTitle>
          <DialogDescription>
            上传CSV文件批量创建商品
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="file">选择CSV文件</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={downloadTemplate}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                下载模板
              </Button>
            </div>
            <Input
              id="file"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
            />
            <p className="text-sm text-gray-500 mt-1">
              支持CSV格式，包含：name, description, category, subcategory, sellingPoints, painPoints, targetAudience, targetCountries
            </p>
          </div>

          {selectedFile && (
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <FileText className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-700">{selectedFile.name}</span>
              <span className="text-xs text-gray-500">
                ({(selectedFile.size / 1024).toFixed(1)} KB)
              </span>
            </div>
          )}
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose} disabled={isUploading}>
              取消
            </Button>
            <Button 
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
            >
              {isUploading ? '上传中...' : '上传'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
