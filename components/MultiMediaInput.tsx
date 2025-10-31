'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, X, FileText, Image, Video, File, Copy, Trash2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export interface MediaFile {
  id: string;
  name: string;
  type: 'text' | 'image' | 'video' | 'file';
  content: string; // base64 or text content
  size: number;
  file?: File;
}

interface MultiMediaInputProps {
  value: string;
  onChange: (value: string) => void;
  onMediaChange?: (files: MediaFile[]) => void;
  placeholder?: string;
  label?: string;
  maxFiles?: number;
  acceptedTypes?: string[];
  className?: string;
  disabled?: boolean;
}

export function MultiMediaInput({
  value,
  onChange,
  onMediaChange,
  placeholder = "输入文本内容，或拖拽/粘贴文件...",
  label = "内容输入",
  maxFiles = 10,
  acceptedTypes = ['image/*', 'video/*', 'text/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  className = "",
  disabled = false
}: MultiMediaInputProps) {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 生成唯一ID
  const generateId = () => `media-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // 处理文件
  const processFile = useCallback(async (file: File): Promise<MediaFile> => {
    const id = generateId();
    const mediaFile: MediaFile = {
      id,
      name: file.name,
      type: file.type.startsWith('image/') ? 'image' : 
            file.type.startsWith('video/') ? 'video' : 
            file.type.startsWith('text/') ? 'text' : 'file',
      content: '',
      size: file.size,
      file
    };

    // 根据文件类型处理内容
    if (file.type.startsWith('text/')) {
      const text = await file.text();
      mediaFile.content = text;
    } else {
      // 对于图片、视频等，转换为base64
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      mediaFile.content = base64;
    }

    return mediaFile;
  }, []);

  // 添加文件
  const addFiles = useCallback(async (files: FileList) => {
    if (mediaFiles.length + files.length > maxFiles) {
      setError(`最多只能上传 ${maxFiles} 个文件`);
      return;
    }

    try {
      const newFiles: MediaFile[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // 检查文件类型
        const isAccepted = acceptedTypes.some(type => {
          if (type.endsWith('/*')) {
            return file.type.startsWith(type.slice(0, -1));
          }
          return file.type === type;
        });

        if (!isAccepted) {
          setError(`不支持的文件类型: ${file.type}`);
          continue;
        }

        // 检查文件大小 (50MB限制)
        if (file.size > 50 * 1024 * 1024) {
          setError(`文件 ${file.name} 太大，最大支持50MB`);
          continue;
        }

        const processedFile = await processFile(file);
        newFiles.push(processedFile);
      }

      if (newFiles.length > 0) {
        const updatedFiles = [...mediaFiles, ...newFiles];
        setMediaFiles(updatedFiles);
        onMediaChange?.(updatedFiles);
        setError('');
      }
    } catch (err) {
      setError('处理文件时出错');
    }
  }, [mediaFiles, maxFiles, acceptedTypes, processFile, onMediaChange]);

  // 删除文件
  const removeFile = useCallback((id: string) => {
    const updatedFiles = mediaFiles.filter(file => file.id !== id);
    setMediaFiles(updatedFiles);
    onMediaChange?.(updatedFiles);
  }, [mediaFiles, onMediaChange]);

  // 复制文件内容到文本框
  const copyToTextarea = useCallback((file: MediaFile) => {
    if (file.type === 'text') {
      const newValue = value + (value ? '\n\n' : '') + file.content;
      onChange(newValue);
    }
  }, [value, onChange]);

  // 拖拽处理
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      addFiles(files);
    }
  }, [disabled, addFiles]);

  // 文件选择
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      addFiles(files);
    }
    // 重置input值，允许重复选择同一文件
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [addFiles]);

  // 粘贴处理
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    if (disabled) return;

    const items = e.clipboardData.items;
    const files: File[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file) {
          files.push(file);
        }
      }
    }

    if (files.length > 0) {
      e.preventDefault();
      addFiles(files as any);
    }
  }, [disabled, addFiles]);

  // 获取文件图标
  const getFileIcon = (type: MediaFile['type']) => {
    switch (type) {
      case 'image': return <Image className="w-4 h-4" />;
      case 'video': return <Video className="w-4 h-4" />;
      case 'text': return <FileText className="w-4 h-4" />;
      default: return <File className="w-4 h-4" />;
    }
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {label && <Label>{label}</Label>}
      
      {/* 文本输入区域 */}
      <div
        className={`relative border-2 border-dashed rounded-lg transition-colors ${
          dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-text'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onPaste={handlePaste}
          placeholder={placeholder}
          disabled={disabled}
          className="min-h-[120px] border-0 resize-none focus:ring-0 focus:border-0"
        />
        
        {/* 拖拽提示 */}
        {dragActive && (
          <div className="absolute inset-0 flex items-center justify-center bg-blue-50 bg-opacity-90 rounded-lg">
            <div className="text-center">
              <Upload className="w-8 h-8 mx-auto mb-2 text-blue-500" />
              <p className="text-blue-600 font-medium">松开鼠标上传文件</p>
            </div>
          </div>
        )}
      </div>

      {/* 文件上传按钮 */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className="flex items-center gap-2"
        >
          <Upload className="w-4 h-4" />
          选择文件
        </Button>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* 已上传文件列表 */}
      {mediaFiles.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm text-gray-700">已上传文件 ({mediaFiles.length})</h4>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setMediaFiles([]);
                    onMediaChange?.([]);
                  }}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  清空
                </Button>
              </div>
              
              <div className="space-y-2">
                {mediaFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {getFileIcon(file.type)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      {file.type === 'text' && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToTextarea(file)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(file.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 错误提示 */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
