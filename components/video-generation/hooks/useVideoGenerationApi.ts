/**
 * 视频生成API调用Hook
 * 基于单文件示例重构，集成现有API
 */

import { useCallback } from 'react'
import type { Product, ProductAnalysis, Persona, VideoScript, VideoJob } from '../types/video-generation'

// 模拟延迟函数
function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// 生成随机ID
function generateId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`
}

export function useVideoGenerationApi() {
  // 加载商品信息
  const loadProduct = useCallback(async (id: string): Promise<Product> => {
    await sleep(300)
    
    try {
      const response = await fetch(`/api/products/${id}`, {
        credentials: 'include', // 携带认证信息
        headers: {
          'Content-Type': 'application/json'
        }
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: '商品加载失败' }))
        console.error('商品加载失败:', response.status, errorData)
        throw new Error(errorData.error || '商品加载失败')
      }
      
      const data = await response.json()
      return data.data
    } catch (error) {
      console.error('加载商品失败:', error)
      throw error
    }
  }, [])

  // 搜索商品
  const searchProducts = useCallback(async (query: string): Promise<Product[]> => {
    await sleep(200)
    
    try {
      const response = await fetch(`/api/products?search=${encodeURIComponent(query)}&limit=10`, {
        credentials: 'include', // 携带认证信息
        headers: {
          'Content-Type': 'application/json'
        }
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: '商品搜索失败' }))
        console.error('商品搜索失败:', response.status, errorData)
        throw new Error(errorData.error || '商品搜索失败')
      }
      
      const data = await response.json()
      return data.data.products || []
    } catch (error) {
      console.error('搜索商品失败:', error)
      throw error
    }
  }, [])

  // 提交商品分析
  const submitAnalysis = useCallback(async (product: Product): Promise<ProductAnalysis> => {
    await sleep(500)
    
    try {
      const response = await fetch('/api/competitor/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          input: `分析商品：${product.name}`,
        })
      })
      
      if (!response.ok) {
        throw new Error('商品分析失败')
      }
      
      // 🎲 随机打乱函数
      const shuffleArray = <T,>(arr: T[]): T[] => {
        const shuffled = [...arr]
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
        }
        return shuffled
      }
      
      const data = await response.json()
      
      // 从商品的完整卖点/痛点中随机选择
      const allSellingPoints = Array.isArray(product.sellingPoints) ? product.sellingPoints : []
      const allPainPoints = Array.isArray(product.painPoints) ? product.painPoints : []
      
      return {
        id: generateId('analysis'),
        productId: product.id,
        description: product.description || `针对「${product.name}」的分析结果`,
        category: product.category,
        targetCountries: product.targetCountries,
        sellingPoints: shuffleArray(allSellingPoints).slice(0, 5),
        painPoints: shuffleArray(allPainPoints).slice(0, 5),
        targetAudience: product.targetAudience.join('、')
      }
    } catch (error) {
      console.error('商品分析失败:', error)
      throw error
    }
  }, [])

  // 推荐人设
  const recommendPersona = useCallback(async (product: Product, analysis: ProductAnalysis): Promise<Persona[]> => {
    await sleep(300)
    
    try {
      console.log('📡 调用人设推荐API:', {
        productId: product.id,
        targetCountry: product.targetCountries[0] || 'CN'
      })
      
      const response = await fetch('/api/persona/recommend', {
        method: 'POST',
        credentials: 'include', // 携带认证信息
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          // 后端允许只传 productId，会自动从商品上获取类目信息
          targetCountry: product.targetCountries[0] || 'CN',
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: '人设推荐失败' }))
        console.error('❌ 人设推荐API失败:', response.status, errorData)
        throw new Error(errorData.error || '人设推荐失败')
      }
      
      const data = await response.json()
      console.log('📦 人设推荐API响应:', {
        success: data.success,
        dataKeys: Object.keys(data.data || {}),
        personas: data.data?.personas,
        personasCount: data.data?.personas?.length || 0
      })
      
      // API 返回的 personas 可能是空数组
      const personas = data.data?.personas || []
      if (personas.length === 0) {
        console.log('⚠️ API 返回空人设列表（数据库中没有匹配的人设）')
      }
      
      return personas
    } catch (error) {
      console.error('❌ 人设推荐异常:', error)
      return []
    }
  }, [])

  // 生成人设
  const generatePersona = useCallback(async (product: Product, analysis: ProductAnalysis): Promise<Persona> => {
    await sleep(700)
    
    try {
      const response = await fetch('/api/persona/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          categoryId: product.category,
          textDescription: `为${product.name}生成人设`,
        })
      })
      
      if (!response.ok) {
        throw new Error('人设生成失败')
      }
      
      const data = await response.json()
      return {
        id: generateId('persona'),
        coreIdentity: {
          name: '小敏',
          age: 25,
          gender: '女',
          location: '北京',
          occupation: '白领',
        },
        look: {
          generalAppearance: '时尚简约',
          hair: '中长发',
          clothingAesthetic: '商务休闲',
          signatureDetails: '喜欢配饰',
        },
        vibe: {
          traits: ['积极', '理性'],
          demeanor: '专业',
          communicationStyle: '直接',
        },
        context: {
          hobbies: '购物、阅读',
          values: '品质、效率',
          frustrations: '时间紧张',
          homeEnvironment: '现代简约',
        },
        why: '符合目标用户特征',
      }
    } catch (error) {
      console.error('人设生成失败:', error)
      throw error
    }
  }, [])

  // 生成脚本（调用后端统一接口）
  const generateScript = useCallback(async (product: Product, persona?: Persona, options?: {
    enableProgress?: boolean
    progressId?: string
  }): Promise<VideoScript> => {
    await sleep(300)
    
    if (!persona?.id) {
      throw new Error('请先选择人设')
    }

    try {
      // 使用新的脚本生成API（不需要Template）
      const response = await fetch('/api/script/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          personaId: persona.id,
          variants: 1
        })
      })
      
      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.error || '脚本生成失败')
      }
      
      // 🔍 检查并显示警告信息（用于调试兜底逻辑）
      if (data.warnings && data.warnings.length > 0) {
        console.warn('⚠️⚠️⚠️ 脚本生成警告 ⚠️⚠️⚠️')
        data.warnings.forEach((warning: string) => {
          console.warn('  ', warning)
        })
        console.warn('⚠️⚠️⚠️ 这说明AI输出有问题，触发了兜底逻辑 ⚠️⚠️⚠️')
      }
      
      // 处理返回的脚本数据
      const scriptData = Array.isArray(data.scripts) ? data.scripts[0] : data.scripts?.[0]
      if (!scriptData) {
        throw new Error('未返回脚本数据')
      }

      const content = `${scriptData.lines?.open || ''}\n${scriptData.lines?.main || ''}\n${scriptData.lines?.close || ''}`.trim()

      return {
        id: scriptData.id || generateId('script'),
        productId: product.id,
        personaId: persona.id,
        angle: scriptData.angle || '产品展示',
        content,
        // ✅ 保留完整的原始数据
        lines: scriptData.lines,
        shots: scriptData.shots || [],  // ✅ 保留shots数组
        technical: scriptData.technical || {  // ✅ 保留technical参数
          orientation: 'vertical',
          filmingMethod: 'handheld',
          dominantHand: 'right',
          location: 'indoor',
          audioEnv: 'quiet'
        },
        durationSec: scriptData.durationSec || 15,
        energy: scriptData.energy || '紧凑',
        // 兼容旧格式（用于旧组件）
        structure: {
          hook: scriptData.lines?.open || '',
          problem: scriptData.lines?.main || '',
          solution: scriptData.lines?.main || '',
          benefits: Array.isArray(product.sellingPoints) ? product.sellingPoints.slice(0, 3) : [],
          callToAction: scriptData.lines?.close || '立即下单'
        },
        style: {
          tone: persona.vibe?.communicationStyle || 'clear',
          length: scriptData.durationSec || 15,
          format: 'ugc'
        }
      }
    } catch (error) {
      console.error('脚本生成失败:', error)
      throw error
    }
  }, [])

  // 创建视频任务
  const createVideoJob = useCallback(async (product: Product, script: VideoScript, params: VideoJob['parameters']): Promise<VideoJob> => {
    await sleep(300)
    
    try {
      const response = await fetch('/api/video/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          scriptId: script.id,
          parameters: params,
        })
      })
      
      if (!response.ok) {
        throw new Error('视频任务创建失败')
      }
      
      const data = await response.json()
      return {
        id: data.data.id || generateId('job'),
        productId: product.id,
        scriptId: script.id,
        status: 'pending',
        progress: 0,
        parameters: params,
      }
    } catch (error) {
      console.error('视频任务创建失败:', error)
      throw error
    }
  }, [])

  // 轮询视频任务状态
  const pollVideoJobStatus = useCallback(async (job: VideoJob, onTick?: (j: VideoJob) => void): Promise<VideoJob> => {
    let progress = 0
    let current: VideoJob = { ...job, status: 'processing', progress }
    onTick?.(current)
    
    for (let i = 0; i < 8; i++) {
      await sleep(400)
      progress = Math.min(100, progress + 12 + Math.round(Math.random() * 8))
      current = { ...current, progress }
      onTick?.(current)
    }
    
    if (Math.random() < 0.08) {
      current = { ...current, status: 'failed', error: '渲染失败，请重试或降低分辨率' }
    } else {
      current = { ...current, status: 'completed', result: { url: `https://example.com/${current.id}.mp4`, sizeMB: 18.6 } }
    }
    
    onTick?.(current)
    return current
  }, [])

  return {
    loadProduct,
    searchProducts,
    submitAnalysis,
    recommendPersona,
    generatePersona,
    generateScript,
    createVideoJob,
    pollVideoJobStatus,
  }
}