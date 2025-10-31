/**
 * 进度条组件
 * 支持多种样式和动画效果
 */

'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ProgressStep {
  id: string
  label: string
  status: 'pending' | 'active' | 'completed' | 'error'
  progress?: number // 0-100，用于子步骤进度
  description?: string
  duration?: number // 预计耗时（秒）
}

export interface ProgressBarProps {
  steps: ProgressStep[]
  currentStepId?: string
  showTiming?: boolean
  showDescriptions?: boolean
  className?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'minimal' | 'detailed'
}

export function ProgressBar({
  steps,
  currentStepId,
  showTiming = true,
  showDescriptions = true,
  className,
  size = 'md',
  variant = 'default'
}: ProgressBarProps) {
  const getStepIcon = (step: ProgressStep) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'active':
        return <Clock className="w-4 h-4 text-blue-600 animate-pulse" />
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />
      default:
        return <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
    }
  }

  const getStepColor = (step: ProgressStep) => {
    switch (step.status) {
      case 'completed':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'active':
        return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200'
      default:
        return 'text-gray-500 bg-gray-50 border-gray-200'
    }
  }

  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }

  if (variant === 'minimal') {
    return (
      <div className={cn('w-full', className)}>
        <div className="flex items-center justify-between mb-2">
          <span className={cn('font-medium text-gray-700', sizeClasses[size])}>
            {steps.find(s => s.status === 'active')?.label || '处理中...'}
          </span>
          <span className={cn('text-gray-500', sizeClasses[size])}>
            {steps.filter(s => s.status === 'completed').length} / {steps.length}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <motion.div
            className="h-2 bg-blue-600 rounded-full"
            initial={{ width: 0 }}
            animate={{
              width: `${(steps.filter(s => s.status === 'completed').length / steps.length) * 100}%`
            }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>
    )
  }

  if (variant === 'detailed') {
    return (
      <div className={cn('space-y-4', className)}>
        {steps.map((step, index) => (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={cn(
              'flex items-start gap-3 p-3 rounded-lg border transition-all',
              getStepColor(step)
            )}
          >
            <div className="flex-shrink-0 mt-0.5">
              {getStepIcon(step)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className={cn('font-medium', sizeClasses[size])}>
                  {step.label}
                </h4>
                {showTiming && step.duration && (
                  <span className={cn('text-gray-500', sizeClasses[size])}>
                    ~{step.duration}s
                  </span>
                )}
              </div>
              
              {showDescriptions && step.description && (
                <p className={cn('text-gray-600 mt-1', sizeClasses[size])}>
                  {step.description}
                </p>
              )}
              
              {step.status === 'active' && step.progress !== undefined && (
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <motion.div
                      className="h-1.5 bg-blue-600 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${step.progress}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <span className={cn('text-gray-500 mt-1', sizeClasses[size])}>
                    {step.progress}%
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    )
  }

  // Default variant
  return (
    <div className={cn('space-y-3', className)}>
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center gap-3">
          <div className="flex-shrink-0">
            {getStepIcon(step)}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className={cn('font-medium', sizeClasses[size])}>
                {step.label}
              </span>
              {showTiming && step.duration && (
                <span className={cn('text-gray-500', sizeClasses[size])}>
                  ~{step.duration}s
                </span>
              )}
            </div>
            
            {showDescriptions && step.description && (
              <p className={cn('text-gray-600 mt-1', sizeClasses[size])}>
                {step.description}
              </p>
            )}
          </div>
        </div>
      ))}
      
      {/* Overall progress bar */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <span className={cn('font-medium text-gray-700', sizeClasses[size])}>
            整体进度
          </span>
          <span className={cn('text-gray-500', sizeClasses[size])}>
            {steps.filter(s => s.status === 'completed').length} / {steps.length}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <motion.div
            className="h-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
            initial={{ width: 0 }}
            animate={{
              width: `${(steps.filter(s => s.status === 'completed').length / steps.length) * 100}%`
            }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>
    </div>
  )
}

// 预设的脚本生成步骤
export const SCRIPT_GENERATION_STEPS: ProgressStep[] = [
  {
    id: 'recommend',
    label: 'AI推荐配置',
    description: '选择最佳模型和Prompt模板',
    duration: 2,
    status: 'pending'
  },
  {
    id: 'template',
    label: '模板处理',
    description: '处理Prompt模板和变量替换',
    duration: 1,
    status: 'pending'
  },
  {
    id: 'generate',
    label: '脚本生成',
    description: 'AI生成视频脚本内容',
    duration: 8,
    status: 'pending'
  },
  {
    id: 'evaluate',
    label: '质量评估',
    description: '评估脚本质量并优化',
    duration: 3,
    status: 'pending'
  },
  {
    id: 'complete',
    label: '生成完成',
    description: '脚本生成完成，准备使用',
    duration: 1,
    status: 'pending'
  }
]
