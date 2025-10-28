/**
 * 进度条组件
 * 
 * 显示9步向导的当前进度
 */

import React from 'react'
import { CheckCircle, ChevronRight } from 'lucide-react'

interface ProgressBarProps {
  currentStep: number
}

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
]

export function ProgressBar({ currentStep }: ProgressBarProps) {
  return (
    <div className="border-b bg-white">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between gap-2">
          {stepTitles.map((title, index) => {
            const stepNum = index + 1
            const isActive = stepNum === currentStep
            const isCompleted = stepNum < currentStep

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
            )
          })}
        </div>
      </div>
    </div>
  )
}

