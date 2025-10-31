/**
 * 商品信息展示组件
 * 展示商品基本信息 + AI分析（复用ProductAnalysis组件）
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Package, Tag, Globe, Lightbulb, AlertCircle, Users, Sparkles, ChevronDown, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { CompetitorAnalysis } from '@/components/CompetitorAnalysis'
import type { ProductAnalysisProps, Product } from './types/video-generation'

export function ProductAnalysis({ product, onAnalysisComplete, disabled, className }: ProductAnalysisProps) {
  const [analysisData, setAnalysisData] = useState<any>(null)
  const [isAiAnalysisOpen, setIsAiAnalysisOpen] = useState(false) // AI分析默认折叠
  
  // 智能推荐的 Top 5
  const [recommendedSellingPoints, setRecommendedSellingPoints] = useState<string[]>([])
  const [recommendedPainPoints, setRecommendedPainPoints] = useState<string[]>([])
  const [recommendedAudiences, setRecommendedAudiences] = useState<string[]>([])
  const [isRecommending, setIsRecommending] = useState(false)

  // 使用推荐引擎获取 Top 5
  useEffect(() => {
    if (product?.id) {
      recommendContentElements()
    }
  }, [product?.id])

  const recommendContentElements = async () => {
    if (!product?.id) return
    
    setIsRecommending(true)
    console.log('🔍 开始推荐内容元素:', {
      productId: product.id,
      sellingPoints: product.sellingPoints,
      painPoints: product.painPoints,
      targetAudience: product.targetAudience
    })
    
    try {
      // 🎲 从商品的卖点/痛点/受众中随机选择（保证每次不一样）
      const shuffleArray = <T,>(arr: T[]): T[] => {
        const shuffled = [...arr]
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
        }
        return shuffled
      }
      
      const allSellingPoints = Array.isArray(product.sellingPoints) ? product.sellingPoints : []
      const allPainPoints = Array.isArray(product.painPoints) ? product.painPoints : []
      const allAudiences = Array.isArray(product.targetAudience) ? product.targetAudience : []
      
      // 随机选择最多5个（如果总数小于5，全部返回）
      const sellingPoints = shuffleArray(allSellingPoints).slice(0, Math.min(5, allSellingPoints.length))
      const painPoints = shuffleArray(allPainPoints).slice(0, Math.min(5, allPainPoints.length))
      const audiences = shuffleArray(allAudiences).slice(0, Math.min(5, allAudiences.length))
      
      setRecommendedSellingPoints(sellingPoints)
      setRecommendedPainPoints(painPoints)
      setRecommendedAudiences(audiences)

      console.log('✅ 内容元素设置完成:', {
        sellingPoints,
        painPoints,
        audiences
      })

      // 立即通知父组件：商品信息已自动填充完成
      onAnalysisComplete({
        description: product.description || '',
        category: product.category || '',
        targetCountries: product.targetCountries || [],
        sellingPoints,
        painPoints,
        targetAudience: audiences.join('、')
      })
      console.log('✅ 已通知父组件：商品信息自动填充完成')
    } catch (error) {
      console.error('❌ 内容元素设置失败:', error)
      setRecommendedSellingPoints([])
      setRecommendedPainPoints([])
      setRecommendedAudiences([])
    } finally {
      setIsRecommending(false)
    }
  }

  // 处理AI分析成功
  const handleAnalysisSuccess = (result: any) => {
    setAnalysisData(result)
    
    // 使用分析结果中的最新数据，而不是旧的product数据
    const updatedSellingPoints = result.sellingPoints?.slice(0, 5) || recommendedSellingPoints
    const updatedPainPoints = result.painPoints?.slice(0, 5) || recommendedPainPoints
    const updatedTargetAudience = result.targetAudience || recommendedAudiences.join('、') || ''
    
    // 更新本地状态，确保UI显示最新数据
    setRecommendedSellingPoints(updatedSellingPoints)
    setRecommendedPainPoints(updatedPainPoints)
    setRecommendedAudiences(updatedTargetAudience.split('、').filter(Boolean))
    
    // 通知父组件分析完成，使用最新的分析结果
    onAnalysisComplete({
      description: result.targetAudience || product.description || '',
      category: product.category || '',
      targetCountries: result.targetCountries || product.targetCountries || [],
      sellingPoints: updatedSellingPoints,
      painPoints: updatedPainPoints,
      targetAudience: updatedTargetAudience || ''
    })
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 商品基本信息 */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          {/* 商品名称 */}
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">{product.name}</h3>
          </div>

          {/* 横向展示：描述、国家、类目 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Tag className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">描述</span>
              </div>
              <p className="text-sm text-gray-900">{product.description || '暂无描述'}</p>
            </div>
            
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Globe className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">国家</span>
              </div>
              <p className="text-sm text-gray-900">
                {product.targetCountries && product.targetCountries.length > 0 
                  ? product.targetCountries.join(', ') 
                  : '未设置'}
              </p>
            </div>
            
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Tag className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">类目</span>
              </div>
              <p className="text-sm text-gray-900">{product.category || '未分类'}</p>
            </div>
          </div>

          {/* Top 5 信息 */}
          <div className="space-y-4 pt-2 border-t">
            {isRecommending && (
              <div className="flex items-center gap-2 text-sm text-gray-500 py-4">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>加载中...</span>
              </div>
            )}

            {!isRecommending && (
              <>
                {/* 卖点 (Top 5) */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium text-gray-700">卖点 (Top 5)</span>
                  </div>
                  {recommendedSellingPoints.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {recommendedSellingPoints.map((point: string, index: number) => (
                        <Badge key={index} variant="default" className="text-xs">{point}</Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">暂无卖点信息</p>
                  )}
                </div>

                {/* 痛点 (Top 5) */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <span className="text-sm font-medium text-gray-700">痛点 (Top 5)</span>
                  </div>
                  {recommendedPainPoints.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {recommendedPainPoints.map((point: string, index: number) => (
                        <Badge key={index} variant="destructive" className="text-xs">{point}</Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">暂无痛点信息</p>
                  )}
                </div>

                {/* 目标受众 (Top 5) */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium text-gray-700">目标受众 (Top 5)</span>
                  </div>
                  {recommendedAudiences.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {recommendedAudiences.map((aud: string, index: number) => (
                        <Badge key={index} variant="outline" className="text-xs">{aud}</Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">暂无目标受众信息</p>
                  )}
                </div>
              </>
            )}
          </div>

          {/* AI分析结果 - 如果已有分析数据则展示 */}
          {analysisData && (
            <div className="space-y-4 pt-4 border-t">
              {/* 卖点 (Top 5) */}
              {analysisData.sellingPoints && analysisData.sellingPoints.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium text-gray-700">卖点 (Top 5)</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {analysisData.sellingPoints.slice(0, 5).map((point: string, index: number) => (
                      <Badge key={index} variant="default" className="text-xs">
                        {point}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* 痛点 (Top 5) */}
              {analysisData.painPoints && analysisData.painPoints.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <span className="text-sm font-medium text-gray-700">痛点 (Top 5)</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {analysisData.painPoints.slice(0, 5).map((point: string, index: number) => (
                      <Badge key={index} variant="destructive" className="text-xs">
                        {point}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* 目标受众 */}
              {analysisData.targetAudience && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium text-gray-700">目标受众</span>
                  </div>
                  <p className="text-sm text-gray-900">{analysisData.targetAudience}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI分析：复用 CompetitorAnalysis 组件（默认折叠）*/}
      <Collapsible open={isAiAnalysisOpen} onOpenChange={setIsAiAnalysisOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5" />
                  AI 分析（可选）
                </div>
                <ChevronDown 
                  className={`w-5 h-5 transition-transform ${isAiAnalysisOpen ? 'rotate-180' : ''}`} 
                />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <CompetitorAnalysis
                productId={product.id}
                onSuccess={handleAnalysisSuccess}
              />
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  )
}
