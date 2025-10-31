import { NextResponse } from 'next/server'
import { decisionCache, poolCache } from '@/src/services/recommendation/cache'

/**
 * 清除推荐系统缓存
 * 用于调试和强制刷新推荐结果
 */
export async function POST() {
  try {
    decisionCache.clear()
    poolCache.clear()
    
    console.log('✅ 推荐系统缓存已清除')
    
    return NextResponse.json({
      success: true,
      message: '推荐系统缓存已清除'
    })
  } catch (error) {
    console.error('❌ 清除推荐缓存失败:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '清除缓存失败' 
      },
      { status: 500 }
    )
  }
}

