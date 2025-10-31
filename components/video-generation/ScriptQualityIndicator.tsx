'use client'

import React from 'react'
import { CheckCircle, AlertCircle, XCircle, TrendingUp, Eye, Heart, Target } from 'lucide-react'

interface QualityEvaluation {
  overallScore: number
  scores: {
    content: number
    structure: number
    emotion: number
    conversion: number
  }
  strengths: string[]
  weaknesses: string[]
  suggestions: string[]
  improvedScript?: string
  optimizationApplied?: boolean
}

interface ScriptQualityIndicatorProps {
  evaluation: QualityEvaluation | null
  className?: string
}

export function ScriptQualityIndicator({ evaluation, className = '' }: ScriptQualityIndicatorProps) {
  if (!evaluation) {
    return null
  }

  const getScoreColor = (score: number) => {
    if (score >= 20) return 'text-green-600'
    if (score >= 15) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getOverallScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreIcon = (score: number) => {
    if (score >= 20) return <CheckCircle className="w-4 h-4 text-green-600" />
    if (score >= 15) return <AlertCircle className="w-4 h-4 text-yellow-600" />
    return <XCircle className="w-4 h-4 text-red-600" />
  }

  const dimensions = [
    { key: 'content', label: '内容质量', icon: <Eye className="w-4 h-4" /> },
    { key: 'structure', label: '结构逻辑', icon: <TrendingUp className="w-4 h-4" /> },
    { key: 'emotion', label: '情感共鸣', icon: <Heart className="w-4 h-4" /> },
    { key: 'conversion', label: '转化效果', icon: <Target className="w-4 h-4" /> }
  ]

  return (
    <div className={`bg-white rounded-lg border p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">脚本质量评估</h3>
        <div className="flex items-center gap-2">
          <span className={`text-2xl font-bold ${getOverallScoreColor(evaluation.overallScore)}`}>
            {evaluation.overallScore}
          </span>
          <span className="text-gray-500">/100</span>
          {evaluation.optimizationApplied && (
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
              已优化
            </span>
          )}
        </div>
      </div>

      {/* 各维度得分 */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {dimensions.map((dimension) => {
          const score = evaluation.scores[dimension.key as keyof typeof evaluation.scores]
          return (
            <div key={dimension.key} className="flex items-center gap-2">
              {dimension.icon}
              <span className="text-sm text-gray-600">{dimension.label}</span>
              <div className="flex items-center gap-1 ml-auto">
                {getScoreIcon(score)}
                <span className={`text-sm font-medium ${getScoreColor(score)}`}>
                  {score}/25
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* 优势 */}
      {evaluation.strengths && evaluation.strengths.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-green-700 mb-2">✅ 优势</h4>
          <ul className="text-sm text-green-600 space-y-1">
            {evaluation.strengths.map((strength, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">•</span>
                <span>{strength}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 不足 */}
      {evaluation.weaknesses && evaluation.weaknesses.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-red-700 mb-2">❌ 需要改进</h4>
          <ul className="text-sm text-red-600 space-y-1">
            {evaluation.weaknesses.map((weakness, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-red-500 mt-0.5">•</span>
                <span>{weakness}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 改进建议 */}
      {evaluation.suggestions && evaluation.suggestions.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-blue-700 mb-2">💡 改进建议</h4>
          <ul className="text-sm text-blue-600 space-y-1">
            {evaluation.suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 优化后脚本 */}
      {evaluation.improvedScript && evaluation.improvedScript !== evaluation.script && (
        <div>
          <h4 className="text-sm font-medium text-purple-700 mb-2">🔄 优化后脚本</h4>
          <div className="bg-purple-50 border border-purple-200 rounded p-3">
            <p className="text-sm text-purple-800">{evaluation.improvedScript}</p>
          </div>
        </div>
      )}
    </div>
  )
}
