import { NextRequest, NextResponse } from 'next/server'
import { aiExecutor } from '@/src/services/ai/AiExecutor'
import { chooseModel } from '@/src/services/ai/rules'
import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'
import { recommendRank } from '@/src/services/recommendation/recommend'
import '@/src/services/recommendation/index'
import { taskService } from '@/src/services/task/TaskService'

const prisma = new PrismaClient()

// 获取AI配置
function getAIConfig() {
  try {
    const configFile = path.join(process.cwd(), 'ai-config.json')
    if (fs.existsSync(configFile)) {
      const data = fs.readFileSync(configFile, 'utf8')
      return JSON.parse(data)
    }
  } catch (error) {
    console.error('加载AI配置失败:', error)
  }
  return { productAnalysis: 'gemini-2.5-flash' }
}

// 使用推荐系统选择最优AI模型（直接调用服务，避免HTTP自调用）
async function selectAIModelWithRecommendation(taskContext: {
  productName: string
  category?: string
  platform: string
  targetCountries: string[]
}) {
  try {
    console.log('🤖 调用推荐系统选择最优AI模型...')
    const recommendation = await recommendRank({
      scenario: 'task->model',
      task: {
        taskType: 'product-analysis',
        contentType: 'text',
        category: taskContext.category,
        region: taskContext.targetCountries[0] || 'CN',
        jsonRequirement: true,
        budgetTier: 'low'
      },
      context: {
        audience: 'ecommerce',
        channel: taskContext.platform
      },
      constraints: {
        maxCostUSD: 0.01,
        requireJsonMode: true
      }
    })
    const chosenModel = recommendation.chosen
    
    if (!chosenModel || !chosenModel.id) {
      throw new Error('推荐系统未返回有效模型')
    }

    console.log(`✅ 推荐系统选择: ${chosenModel.title} (score: ${chosenModel.fineScore?.toFixed(2)})`)
    console.log(`   候选模型: ${recommendation.topK.map((m: any) => m.title).join(', ')}`)
    
    // 返回模型ID和决策ID（用于后续反馈）
    return { modelId: chosenModel.id, decisionId: recommendation.decisionId, alternatives: recommendation.alternatives }
    
  } catch (error) {
    console.error('❌ 推荐系统调用失败，回退到传统选择:', error)
    
    // 回退：读取已验证模型列表
    const verifiedModelsFile = path.join(process.cwd(), 'verified-models.json')
    let verifiedModels: any[] = []
    
    if (fs.existsSync(verifiedModelsFile)) {
      const data = fs.readFileSync(verifiedModelsFile, 'utf8')
      verifiedModels = JSON.parse(data)
    }
    
    const allModels = [
      { id: 'gemini-2.5-flash', name: 'Gemini', key: process.env.GEMINI_API_KEY },
      { id: 'doubao-seed-1-6-lite', name: 'Doubao', key: process.env.DOUBAO_API_KEY },
      { id: 'deepseek-chat', name: 'DeepSeek', key: process.env.DEEPSEEK_API_KEY },
      { id: 'gpt-4', name: 'GPT-4', key: process.env.OPENAI_API_KEY },
      { id: 'claude-3-sonnet', name: 'Claude', key: process.env.CLAUDE_API_KEY }
    ]
    
    for (const model of allModels) {
      const verifiedModel = verifiedModels.find(m => m.id === model.id && m.status === 'verified')
      if (verifiedModel && model.key) {
        console.log(`✅ 回退选择: ${model.name} (${model.id})`)
        return { modelId: model.id, decisionId: null, alternatives: null }
      }
    }
    
    throw new Error('没有可用的AI模型！请在AI配置页面验证至少一个模型')
  }
}

// 将模型标记为未验证
async function markModelAsUnverified(modelId: string) {
  try {
    const verifiedModelsFile = path.join(process.cwd(), 'verified-models.json')
    if (fs.existsSync(verifiedModelsFile)) {
      const data = fs.readFileSync(verifiedModelsFile, 'utf8')
      const models = JSON.parse(data)
      
      const model = models.find((m: any) => m.id === modelId)
      if (model) {
        model.status = 'unverified'
        model.verified = false
        fs.writeFileSync(verifiedModelsFile, JSON.stringify(models, null, 2))
        console.log(`⚠️  模型 ${model.name} 已标记为未验证`)
      }
    }
  } catch (error) {
    console.error('更新模型验证状态失败:', error)
  }
}

// 直接使用AI分析商品痛点（使用推荐系统选择最优模型）
async function extractPainPointsDirectly(
  productName: string,
  platform: string,
  targetCountries: string[],
  customPrompt?: string,
  category?: string,
  subcategory?: string,
  description?: string
): Promise<{ painPoints: string[], targetAudience: string[], decisionId: string | null }> {
  try {
    // 🤖 使用推荐系统选择最优AI模型
    const recommendation = await selectAIModelWithRecommendation({
      productName,
      category,
      platform,
      targetCountries
    })
    
    const aiModel = recommendation.modelId
    const decisionId = recommendation.decisionId
    // 读取模型以确定Provider
    const modelRow = await prisma.estimationModel.findUnique({ where: { id: aiModel } })
    const mapProvider = (p?: string): 'gemini' | 'doubao' | 'openai' | 'deepseek' | 'claude' => {
      if (!p) return 'gemini'
      if (/google/i.test(p)) return 'gemini'
      if (/字节|doubao|volc|byte/i.test(p)) return 'doubao'
      if (/openai/i.test(p)) return 'openai'
      if (/deepseek/i.test(p)) return 'deepseek'
      if (/anthropic|claude/i.test(p)) return 'claude'
      return 'gemini'
    }
    const execProvider = mapProvider(modelRow?.provider)
    console.log(`🌐 推荐系统选择模型: ${aiModel} (${modelRow?.provider})，将使用执行器: ${execProvider} 开始分析`) 
    
    // 检查Gemini API Key
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      throw new Error('❌ GEMINI_API_KEY未配置！\n\n请在AI配置页面验证Gemini API Key。')
    }
    
    // 构建prompt - 让AI基于商品信息和平台特点分析痛点
    const countries = targetCountries.join('、')
    const defaultPrompt = `分析商品：{productName}（{category}{subcategory}）

请基于商品特性分析用户痛点和目标受众。

严格要求：
1. 只分析该商品的实际使用痛点
2. 不得包含其他商品或通用痛点
3. 痛点必须与商品功能直接相关
4. 目标受众必须与商品使用场景匹配

输出JSON格式：
{"painPoints":["痛点1","痛点2","痛点3"],"targetAudience":["受众1","受众2","受众3"]}`

    const promptTemplate = customPrompt || defaultPrompt
    
    // 确保默认变量被正确设置
    const defaultVariables = {
      minSellingPoints: 3,
      maxSellingPoints: 10,
      minPainPoints: 1,
      maxPainPoints: 5,
      maxOther: 3
    }
    
    // 先替换默认变量，再替换其他变量
    let prompt = promptTemplate
      .replace(/\{\{minSellingPoints\}\}/g, String(defaultVariables.minSellingPoints))
      .replace(/\{\{maxSellingPoints\}\}/g, String(defaultVariables.maxSellingPoints))
      .replace(/\{\{minPainPoints\}\}/g, String(defaultVariables.minPainPoints))
      .replace(/\{\{maxPainPoints\}\}/g, String(defaultVariables.maxPainPoints))
      .replace(/\{\{maxOther\}\}/g, String(defaultVariables.maxOther))
      .replace(/\{productName\}/g, productName)
      .replace(/\{platform\}/g, platform)
      .replace(/\{countries\}|\{targetCountries\}/g, countries || '未指定')
      .replace(/\{category\}/g, category ? `${category}` : '')
      .replace(/\{subcategory\}/g, subcategory ? `/${subcategory}` : '')
      .replace(/\{description\}/g, (description || '').slice(0, 120))

    // 直接调用Gemini API
    console.log('📝 提示词(商品/平台):', { productName, platform })
    console.log('📝 Prompt 内容:\n', prompt)
    try {
      // 第一次：不使用搜索，直接基于商品信息分析（避免搜索返回不相关内容）
      // 按推荐的Provider执行
      let text = await aiExecutor.enqueue(() => aiExecutor.execute({ provider: execProvider, prompt, useSearch: false }))
      let analysisResult = parseProductAnalysisFromResponse(text)
      if (!analysisResult.painPoints || analysisResult.painPoints.length === 0) {
        console.warn('首次未解析出分析结果，尝试严格JSON输出...')
        const strictPrompt = `${prompt}\n\n仅输出JSON对象，不要任何说明/代码块。无法检索时基于常识输出合理分析。`
        text = await aiExecutor.enqueue(() => aiExecutor.execute({ provider: execProvider, prompt: strictPrompt, useSearch: false }))
        analysisResult = parseProductAnalysisFromResponse(text)
      }
      return { painPoints: analysisResult.painPoints, targetAudience: analysisResult.targetAudience, decisionId }
    } catch (apiError: any) {
      console.error(`❌ Gemini API调用失败:`, apiError)
      const status = apiError?.status
      // 只有鉴权相关错误才自动降级为未验证
      if (status === 401 || status === 403) {
        await markModelAsUnverified('gemini-2.5-flash')
      }
      const msg = status === 429
        ? 'Gemini 限流（429），系统会按队列和退避自动重试'
        : 'Gemini API调用失败'
      throw new Error(`${msg}${status ? ` (HTTP ${status})` : ''}：${apiError instanceof Error ? apiError.message : String(apiError)}`)
    }
    
  } catch (error) {
    console.error('AI痛点分析失败:', error)
    throw error
  }
}

// 使用AI分析评论提取痛点（保留旧函数以防需要）
async function extractPainPointsWithAI(comments: string[], productName: string, platform: string, customPrompt?: string): Promise<string[]> {
  try {
    const aiConfig = getAIConfig()
    let aiModel = aiConfig.productAnalysis || 'gemini-2.5-flash'
    
    // 如果配置为auto，自动选择可用的模型
    if (aiModel === 'auto') {
      try {
        aiModel = await chooseModel({}, 'auto')
        console.log(`自动选择AI模型: ${aiModel}`)
      } catch (error) {
        console.error('自动选择AI模型失败:', error)
        throw error // 抛出错误，让上层处理
      }
    }
    
    console.log(`使用AI模型 ${aiModel} 分析痛点...`)
    
    // 构建prompt
    let prompt = ''
    if (customPrompt) {
      // 使用自定义prompt，替换占位符
      prompt = customPrompt
        .replace(/{platform}/g, platform)
        .replace(/{productName}/g, productName)
        .replace(/{comments}/g, comments.join('\n---\n'))
      console.log('使用自定义Prompt')
    } else {
      // 使用默认prompt
      prompt = `You are a professional e-commerce product analyst. Please analyze the following user reviews from ${platform} platform about "${productName}" and extract the main pain points and issues.

User Reviews (may include English, Malay, or Chinese):
${comments.join('\n---\n')}

Please output the pain points in the following format (one pain point per line, maximum 10):
1. [Pain point description]
2. [Pain point description]
...

Requirements:
- Pain point descriptions should be concise and clear (10-30 characters)
- Sort by importance and frequency
- Merge similar pain points
- Only output real issues and negative feedback
- Do not output positive reviews
- Output in Chinese (用中文输出痛点)
- Strictly follow the above format

你是一个专业的电商产品分析师。请分析以上来自${platform}平台关于"${productName}"的用户评论（可能包含英语、马来语或中文），提取主要痛点。痛点用中文输出，格式如上所示。`
    }

    // 根据不同的AI模型调用对应的API
    let painPoints: string[] = []
    
    try {
      if (aiModel.includes('gemini')) {
        painPoints = await callGeminiAPI(prompt, false)
      } else if (aiModel.includes('doubao')) {
        painPoints = await callDoubaoAPI(prompt)
      } else if (aiModel.includes('deepseek')) {
        painPoints = await callDeepSeekAPI(prompt)
      } else if (aiModel.includes('gpt')) {
        painPoints = await callOpenAIAPI(prompt)
      } else if (aiModel.includes('claude')) {
        painPoints = await callClaudeAPI(prompt)
      } else {
        // 默认使用Gemini
        painPoints = await callGeminiAPI(prompt, false)
      }
      
      return painPoints
      
    } catch (apiError) {
      // API调用失败，将该模型标记为未验证
      console.error(`❌ AI模型 ${aiModel} 调用失败:`, apiError)
      await markModelAsUnverified(aiModel)
      
      // 抛出详细错误
      throw new Error(`AI模型 ${aiModel} 调用失败，已自动标记为未验证。请重新验证API Key。\n\n错误详情: ${apiError instanceof Error ? apiError.message : String(apiError)}`)
    }
    
  } catch (error) {
    console.error('AI痛点提取失败:', error)
    throw error
  }
}

// Gemini API调用（带实时搜索功能）
async function callGeminiAPI(prompt: string, useSearch: boolean): Promise<string[]> {
  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY not configured')
    }
    
    console.log('🌐 使用Gemini + Google Search进行实时搜索分析...')
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 800,
          response_mime_type: 'application/json'
        },
        // 🔥 可选：启用Google Search实时搜索
        ...(useSearch ? { tools: [{ googleSearch: {} }] } : {})
      })
    })
    
    const result = await response.json()
    
    // 检查是否有搜索结果
    if (result.candidates?.[0]?.groundingMetadata) {
      console.log('✅ 使用了实时搜索数据，来源:')
      const searchQueries = result.candidates[0].groundingMetadata.searchEntryPoint?.renderedContent
      if (searchQueries) {
        console.log('   搜索查询:', searchQueries)
      }
    }
    
    // 先尝试直接解析JSON返回
    const jsonText = result.candidates?.[0]?.content?.parts?.[0]?.text || ''
    return parsePainPointsFromResponse(jsonText)
    
  } catch (error) {
    console.error('Gemini API调用失败:', error)
    throw error
  }
}

// DeepSeek API调用
async function callDeepSeekAPI(prompt: string): Promise<string[]> {
  try {
    const apiKey = process.env.DEEPSEEK_API_KEY
    if (!apiKey) {
      throw new Error('DEEPSEEK_API_KEY not configured')
    }
    
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 1000
      })
    })
    
    const result = await response.json()
    const text = result.choices?.[0]?.message?.content || ''
    return parsePainPointsFromResponse(text)
    
  } catch (error) {
    console.error('DeepSeek API调用失败:', error)
    throw error
  }
}

// 豆包 API调用
async function callDoubaoAPI(prompt: string): Promise<string[]> {
  try {
    const apiKey = process.env.DOUBAO_API_KEY
    if (!apiKey) {
      throw new Error('DOUBAO_API_KEY not configured')
    }
    
    const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'doubao-seed-1-6-lite-251015',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3
      })
    })
    
    const result = await response.json()
    const text = result.choices?.[0]?.message?.content || ''
    return parsePainPointsFromResponse(text)
    
  } catch (error) {
    console.error('豆包 API调用失败:', error)
    throw error
  }
}

// OpenAI API调用
async function callOpenAIAPI(prompt: string): Promise<string[]> {
  try {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY not configured')
    }
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 1000
      })
    })
    
    const result = await response.json()
    const text = result.choices?.[0]?.message?.content || ''
    return parsePainPointsFromResponse(text)
    
  } catch (error) {
    console.error('OpenAI API调用失败:', error)
    throw error
  }
}

// Claude API调用
async function callClaudeAPI(prompt: string): Promise<string[]> {
  try {
    const apiKey = process.env.CLAUDE_API_KEY
    if (!apiKey) {
      throw new Error('CLAUDE_API_KEY not configured')
    }
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 1000
      })
    })
    
    const result = await response.json()
    const text = result.content?.[0]?.text || ''
    return parsePainPointsFromResponse(text)
    
  } catch (error) {
    console.error('Claude API调用失败:', error)
    throw error
  }
}

// 解析AI返回的商品分析结果
function parseProductAnalysisFromResponse(text: string): { painPoints: string[], targetAudience: string[] } {
  console.log('🔍 AI返回的原始内容:')
  console.log('================')
  console.log(text)
  console.log('================')
  
  // 1) 优先尝试解析为JSON对象（支持```json 代码块）
  try {
    let jsonCandidate = text
    const codeBlockMatch = text.match(/```(?:json)?\n([\s\S]*?)\n```/i)
    if (codeBlockMatch && codeBlockMatch[1]) {
      jsonCandidate = codeBlockMatch[1]
    }
    
    // 尝试解析JSON对象
    const objMatch = jsonCandidate.match(/\{[\s\S]*\}/)
    if (objMatch) {
      const obj = JSON.parse(objMatch[0])
      if (obj && typeof obj === 'object') {
        const painPoints = Array.isArray(obj.painPoints) ? obj.painPoints : []
        let targetAudience = Array.isArray(obj.targetAudience) ? obj.targetAudience : []
        
        // 如果targetAudience是字符串，尝试智能分割成数组
        if (typeof obj.targetAudience === 'string' && obj.targetAudience.trim()) {
          const str = obj.targetAudience.trim()
          // 使用更智能的分割：只在括号外的分隔符处分割
          const parts = []
          let current = ''
          let depth = 0
          
          for (let i = 0; i < str.length; i++) {
            const char = str[i]
            if (char === '（' || char === '(') {
              depth++
              current += char
            } else if (char === '）' || char === ')') {
              depth--
              current += char
            } else if ((char === '、' || char === '，' || char === ',') && depth === 0) {
              if (current.trim()) {
                parts.push(current.trim())
              }
              current = ''
            } else {
              current += char
            }
          }
          if (current.trim()) {
            parts.push(current.trim())
          }
          
          targetAudience = parts.filter(s => s && s.length > 2)
        }
        
        const cleanedPainPoints = painPoints
          .map((item: any) => {
            if (typeof item === 'string') return item.trim()
            if (item && typeof item === 'object') {
              return (item.text || item.title || item.painPoint || '').toString().trim()
            }
            return ''
          })
          .filter((s: string) => s && s.length > 5 && s.length < 100)
          
        const cleanedTargetAudience = targetAudience
          .map((item: any) => {
            if (typeof item === 'string') return item.trim()
            return ''
          })
          .filter((s: string) => s && s.length > 2 && s.length < 50)
          
        if (cleanedPainPoints.length > 0 || cleanedTargetAudience.length > 0) {
          console.log(`📊 JSON解析结果: 提取了 ${cleanedPainPoints.length} 个痛点, ${cleanedTargetAudience.length} 个目标受众`)
          return { painPoints: cleanedPainPoints, targetAudience: cleanedTargetAudience }
        }
      }
    }
  } catch (e) {
    console.warn('JSON对象解析失败，回退到数组解析:', (e as Error).message)
  }
  
  // 2) 回退到旧的数组解析方式（兼容性）
  const painPoints = parsePainPointsFromResponse(text)
  return { painPoints, targetAudience: [] }
}

// 解析AI返回的痛点（保留旧函数以兼容）
function parsePainPointsFromResponse(text: string): string[] {
  console.log('🔍 AI返回的原始内容:')
  console.log('================')
  console.log(text)
  console.log('================')
  
  // 1) 优先尝试解析为JSON数组（支持```json 代码块）
  try {
    let jsonCandidate = text
    const codeBlockMatch = text.match(/```(?:json)?\n([\s\S]*?)\n```/i)
    if (codeBlockMatch && codeBlockMatch[1]) {
      jsonCandidate = codeBlockMatch[1]
    }
    // 简单提取第一个数组片段
    const arrayMatch = jsonCandidate.match(/\[[\s\S]*\]/)
    if (arrayMatch) {
      const arr = JSON.parse(arrayMatch[0])
      if (Array.isArray(arr)) {
        const cleaned = arr
          .map((item: any) => {
            if (typeof item === 'string') return item.trim()
            if (item && typeof item === 'object') {
              // 常见字段兼容
              return (item.text || item.title || item.painPoint || '').toString().trim()
            }
            return ''
          })
          .filter((s: string) => s && s.length > 5 && s.length < 100)
        if (cleaned.length > 0) {
          console.log(`📊 JSON解析结果: 提取了 ${cleaned.length} 个痛点`)
          return cleaned.slice(0, 10)
        }
      }
    }
  } catch (e) {
    console.warn('JSON解析失败，回退到行解析:', (e as Error).message)
  }

  const lines = text
    .replace(/\r/g, '\n')
    .split('\n')
    .map(line => line.trim())
    .filter(line => line)
  const painPoints: string[] = []
  
  for (const line of lines) {
    // 匹配 "1. xxx"、"- xxx"、"• xxx"、") xxx"等常见列表格式
    const match = line.match(/^\d+\.\s*(.+)$/) 
      || line.match(/^[-•]\s*(.+)$/) 
      || line.match(/^\d+\)\s*(.+)$/)
    if (match && match[1]) {
      const point = match[1].trim()
      if (point.length > 5 && point.length < 100) {
        painPoints.push(point)
      }
    }
  }
  
  console.log(`📊 解析结果: 提取了 ${painPoints.length} 个痛点`)
  if (painPoints.length > 0) {
    console.log('痛点列表:', painPoints)
  } else {
    console.warn('⚠️  警告: AI返回的内容中没有找到符合格式的痛点！')
  }
  
  return painPoints // 返回所有去重后的痛点
}

// 备用方案：智能模拟痛点分析
function generateFallbackPainPoints(comments: string[], platform: string): string[] {
  console.log('使用备用方案生成痛点...')
  
  // 分析评论中的关键词，生成更智能的痛点
  const painPoints: string[] = []
  const commentText = comments.join(' ')
  
  // 物流相关痛点
  if (commentText.includes('慢') || commentText.includes('久') || commentText.includes('shipping') || commentText.includes('penghantaran')) {
    painPoints.push('物流速度慢，配送时间过长')
  }
  
  // 价格相关痛点
  if (commentText.includes('贵') || commentText.includes('高') || commentText.includes('price') || commentText.includes('harga')) {
    painPoints.push('价格偏高，性价比不高')
  }
  
  // 质量相关痛点
  if (commentText.includes('坏') || commentText.includes('差') || commentText.includes('quality') || commentText.includes('kualiti')) {
    painPoints.push('产品质量不稳定，容易损坏')
  }
  
  // 包装相关痛点
  if (commentText.includes('包装') || commentText.includes('packaging') || commentText.includes('pembungkusan')) {
    painPoints.push('包装简陋，影响产品形象')
  }
  
  // 客服相关痛点
  if (commentText.includes('客服') || commentText.includes('service') || commentText.includes('perkhidmatan')) {
    painPoints.push('客服响应慢，服务质量有待提升')
  }
  
  // 使用体验痛点
  if (commentText.includes('难') || commentText.includes('复杂') || commentText.includes('difficult') || commentText.includes('sukar')) {
    painPoints.push('操作复杂，使用体验不佳')
  }
  
  // 噪音相关痛点
  if (commentText.includes('噪音') || commentText.includes('吵') || commentText.includes('noise') || commentText.includes('bising')) {
    painPoints.push('噪音过大，影响使用体验')
  }
  
  // 续航相关痛点
  if (commentText.includes('续航') || commentText.includes('电池') || commentText.includes('battery') || commentText.includes('kuasa')) {
    painPoints.push('电池续航时间短，需要频繁充电')
  }
  
  // 如果没找到具体痛点，根据商品类型生成相关痛点
  if (painPoints.length === 0) {
    // 根据评论内容生成通用痛点
    if (commentText.includes('质量') || commentText.includes('quality') || commentText.includes('kualiti')) {
      painPoints.push('产品质量需要提升')
    }
    if (commentText.includes('价格') || commentText.includes('price') || commentText.includes('harga')) {
      painPoints.push('价格竞争力不足')
    }
    if (commentText.includes('服务') || commentText.includes('service') || commentText.includes('perkhidmatan')) {
      painPoints.push('客户服务质量有待改善')
    }
    
    // 如果还是没有，添加通用痛点
    if (painPoints.length === 0) {
      painPoints.push('产品整体表现一般，有待改进')
      painPoints.push('用户满意度不高，需要优化')
    }
  }
  
  console.log(`生成痛点 ${painPoints.length} 个:`, painPoints)
  return painPoints // 返回所有生成的痛点
}

// 模拟爬取评论（实际应该调用真实的爬虫服务）
async function scrapeComments(platform: string, keywords: string, maxComments: number, targetCountries: string[]): Promise<string[]> {
  // TODO: 实现真实的爬虫逻辑
  // 根据目标国家决定评论语言
  const isMalaysia = targetCountries.includes('MY') || targetCountries.includes('Malaysia')
  
  // 为每个商品生成不同的模拟评论，基于商品名称
  const generateProductSpecificComments = (productName: string, isMalaysia: boolean) => {
    const productType = productName.toLowerCase()
    
    // 根据商品类型生成不同的痛点
    let baseComments = []
    
    if (productType.includes('电磁炉') || productType.includes('电') || productType.includes('炉')) {
      baseComments = [
        `${productName}加热速度太慢，等了好久才热`,
        `温度控制不准确，容易烧焦食物`,
        `噪音太大，影响使用体验`,
        `清洁困难，油污很难清理`,
        `功率不够，炒菜火力不足`,
        `面板容易坏，用了几个月就出问题`,
        `设计不够人性化，操作复杂`,
        `价格偏高，性价比不高`
      ]
    } else if (productType.includes('风扇') || productType.includes('风')) {
      baseComments = [
        `${productName}风力不够大，夏天不够用`,
        `电池续航太短，用不了多久就没电`,
        `噪音太大，影响睡眠`,
        `充电时间太长，等得着急`,
        `材质感觉廉价，手感不好`,
        `容易坏，用了几个月就坏了`,
        `风力调节不够精细`,
        `价格偏贵，不如买大品牌`
      ]
    } else if (productType.includes('按摩') || productType.includes('膏')) {
      baseComments = [
        `${productName}效果不明显，用了没感觉`,
        `质地太油腻，涂了不舒服`,
        `香味太重，闻着头晕`,
        `包装设计不好，很难挤出来`,
        `价格太贵，性价比不高`,
        `容易过敏，用了皮肤发红`,
        `效果持续时间太短`,
        `成分不明确，不敢长期使用`
      ]
    } else {
      // 通用痛点
      baseComments = [
        `${productName}质量一般，不如预期`,
        `价格偏高，性价比不高`,
        `包装简陋，影响第一印象`,
        `使用说明不够详细`,
        `客服回复慢，服务态度一般`,
        `物流太慢，等了好久才到`,
        `与描述不符，实物差距大`,
        `容易坏，质量堪忧`
      ]
    }
    
    if (isMalaysia) {
      // 马来西亚市场：混合英语和马来语
      const englishComments = baseComments.slice(0, 4).map(comment => 
        comment.replace(productName, productName).replace(/质量|价格|包装|客服|物流|容易|效果/g, (match) => {
          const translations: {[key: string]: string} = {
            '质量': 'quality',
            '价格': 'price', 
            '包装': 'packaging',
            '客服': 'customer service',
            '物流': 'shipping',
            '容易': 'easily',
            '效果': 'effect'
          }
          return translations[match] || match
        })
      )
      const malayComments = baseComments.slice(4, 6).map(comment => 
        comment.replace(productName, productName).replace(/质量|价格|包装|客服|物流|容易|效果/g, (match) => {
          const translations: {[key: string]: string} = {
            '质量': 'kualiti',
            '价格': 'harga',
            '包装': 'pembungkusan', 
            '客服': 'perkhidmatan pelanggan',
            '物流': 'penghantaran',
            '容易': 'mudah',
            '效果': 'kesan'
          }
          return translations[match] || match
        })
      )
      return [...englishComments, ...malayComments]
    } else {
      return baseComments
    }
  }
  
  const selectedComments = generateProductSpecificComments(keywords, isMalaysia)
  
  return selectedComments.slice(0, Math.min(maxComments, selectedComments.length))
}

export async function POST(request: NextRequest) {
  try {
    const { productIds, platforms, keywords, maxComments, dateRange, customPrompt } = await request.json()

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json(
        { success: false, error: '请选择商品' },
        { status: 400 }
      )
    }

    if (!platforms || !Array.isArray(platforms) || platforms.length === 0) {
      return NextResponse.json(
        { success: false, error: '请选择平台' },
        { status: 400 }
      )
    }

    console.log('批量痛点分析请求:', { productIds, platforms, maxComments })

    // 获取所有选中的商品信息
    const products = await prisma.product.findMany({
      where: {
        id: {
          in: productIds
        }
      }
    })

    if (products.length === 0) {
      return NextResponse.json(
        { success: false, error: '未找到选中的商品' },
        { status: 404 }
      )
    }

    // 为每个商品创建统一的任务监控任务
    const tasks: any[] = []
    const mergedPlatform = platforms.join(', ')
    for (const product of products) {
      const productKeywords = product.name
      
      // 创建统一的任务
      const task = await taskService.createTask({
        type: 'product_analysis',
        payload: {
          productId: product.id,
          productName: product.name,
          platform: mergedPlatform,
          keywords: productKeywords,
          maxComments: maxComments || 100,
          dateRange: dateRange || '',
          customPrompt
        },
        priority: 1,
        dedupeKey: `product-analysis-${product.id}-${mergedPlatform}-${Date.now()}`,
        ownerId: 'admin'
      })
      
      // 同时创建旧的 commentScrapingTask 以保持兼容性
      const legacyTask = await prisma.commentScrapingTask.create({
        data: {
          productId: product.id,
          platform: mergedPlatform,
          keywords: productKeywords,
          maxComments: maxComments || 100,
          dateRange: dateRange || '',
          status: 'pending'
        }
      })
      
      tasks.push({ task, legacyTask })
    }

    // 异步执行爬取和分析（通过任务系统）
    setTimeout(async () => {
      try {
        for (const { task, legacyTask } of tasks) {
          const product = products.find(p => p.id === task.payload.productId)
          if (!product) continue

          // 更新统一任务状态为进行中
          await taskService.startTask(task.id, 'product-analysis-worker')
          
          // 同时更新旧任务状态以保持兼容性
          await prisma.commentScrapingTask.update({
            where: { id: legacyTask.id },
            data: { status: 'running', startedAt: new Date() }
          })

          // 获取商品的目标国家
          let targetCountries: string[] = []
          try {
            targetCountries = product.targetCountries ? JSON.parse(String(product.targetCountries)) : []
          } catch (e) {
            targetCountries = []
          }
          
          // 直接使用AI进行商品分析（不需要爬虫）
          console.log(`🤖 使用AI直接进行商品分析: ${product.name}, 平台: ${task.payload.platform}`)
          let painPointsFromAI: string[] = []
          let targetAudienceFromAI: string[] = []
          let decisionId: string | null = null
          try {
            const result = await extractPainPointsDirectly(
              product.name,
              task.payload.platform,
              targetCountries,
              customPrompt,
              product.category || undefined,
              product.subcategory || undefined,
              product.description || undefined
            )
            painPointsFromAI = result.painPoints
            targetAudienceFromAI = result.targetAudience || []
            decisionId = result.decisionId
            console.log(`✅ AI分析成功，提取了 ${painPointsFromAI.length} 个痛点, ${targetAudienceFromAI.length} 个目标受众`)

            // 如果没有解析到痛点，则标记任务失败，并跳过对该商品的写入
            if (!painPointsFromAI || painPointsFromAI.length === 0) {
              const warnMsg = 'AI返回内容未解析出任何痛点（请检查prompt或网络搜索结果）'
              console.warn(`⚠️ ${product.name}: ${warnMsg}`)
              
              // 更新统一任务状态为失败
              await taskService.failTask(task.id, warnMsg)
              
              // 同时更新旧任务状态以保持兼容性
              await prisma.commentScrapingTask.update({
                where: { id: legacyTask.id },
                data: {
                  status: 'failed',
                  completedAt: new Date(),
                  errorLog: warnMsg
                }
              })
              continue
            }
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'AI分析失败'
            console.error(`❌ AI分析失败 for ${product.name}:`, errorMsg)
            
            // 更新统一任务状态为失败
            await taskService.failTask(task.id, errorMsg)
            
            // 同时更新旧任务状态以保持兼容性
            await prisma.commentScrapingTask.update({
              where: { id: legacyTask.id },
              data: {
                status: 'failed',
                completedAt: new Date(),
                errorLog: errorMsg
              }
            })
            
            // 不要continue，而是抛出错误让用户知道
            throw new Error(`商品"${product.name}"痛点分析失败: ${errorMsg}`)
          }

          // 处理痛点：与现有数据合并并去重
          let existingPainPoints: string[] = []
          try {
            if (product.painPoints) {
              existingPainPoints = Array.isArray(product.painPoints) 
                ? product.painPoints 
                : JSON.parse(String(product.painPoints))
            }
          } catch (e) {
            console.warn('解析现有痛点失败:', e)
            existingPainPoints = []
          }
          
          // 合并新旧痛点并去重
          const mergedPainPoints = Array.from(new Set([
            ...existingPainPoints,
            ...painPointsFromAI
          ]))
          
          // 处理目标受众：与现有数据合并并去重
          let existingTargetAudience: string[] = []
          try {
            if (product.targetAudience) {
              existingTargetAudience = Array.isArray(product.targetAudience) 
                ? product.targetAudience 
                : JSON.parse(String(product.targetAudience))
            }
          } catch (e) {
            console.warn('解析现有目标受众失败:', e)
            existingTargetAudience = []
          }
          
          // 合并新旧目标受众并去重
          const mergedTargetAudience = Array.from(new Set([
            ...existingTargetAudience,
            ...targetAudienceFromAI
          ]))

          // 向推荐系统提交反馈
          if (decisionId) {
            try {
              await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/recommend/feedback`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  decisionId,
                  qualityScore: mergedPainPoints.length >= 5 ? 0.9 : (mergedPainPoints.length >= 3 ? 0.7 : 0.5),
                  notes: `提取了 ${mergedPainPoints.length} 个痛点, ${targetAudienceFromAI.length} 个目标受众`
                })
              })
              console.log(`✅ 已向推荐系统提交反馈 (${mergedPainPoints.length}个痛点, ${targetAudienceFromAI.length}个目标受众)`)
            } catch (feedbackError) {
              console.warn('提交推荐反馈失败:', feedbackError)
            }
          }

          // 更新商品的痛点和目标受众字段
          console.log(`✅ 更新商品 ${product.name} 的分析结果:`, { 
            painPoints: mergedPainPoints.length, 
            targetAudience: mergedTargetAudience.length 
          })
          await prisma.product.update({
            where: { id: product.id },
            data: {
              painPoints: mergedPainPoints,
              painPointsLastUpdate: new Date(),
              painPointsSource: `批量分析 - ${platforms.join(', ')}`,
              targetAudience: mergedTargetAudience
            }
          })
          console.log(`✅ 商品 ${product.name} 分析结果已保存到数据库`)

          // 创建痛点分析记录
          await prisma.productPainPoint.create({
            data: {
              productId: product.id,
              platform: task.payload.platform,
              productName: product.name,
              painPoints: JSON.stringify(painPointsFromAI),
              painCategories: JSON.stringify(['质量', '物流', '价格', '选择', '包装']),
              severity: 'medium',
              // 直接AI检索分析：频次以提取的痛点数量近似表示
              frequency: painPointsFromAI.length,
              aiAnalysis: `AI基于${task.payload.platform}平台的实时检索，提取出${painPointsFromAI.length}个痛点`,
              keywords: task.payload.keywords,
              sentiment: 'mixed',
              sourceData: JSON.stringify({ 
                platform: task.payload.platform, 
                taskId: task.id, 
                commentsCount: 0,
                aiModel: 'gemini-2.0-flash-exp'
              })
            }
          })

          // 更新统一任务状态为完成
          await taskService.completeTask(task.id, {
            painPoints: mergedPainPoints,
            targetAudience: mergedTargetAudience,
            productId: product.id,
            productName: product.name,
            platform: task.payload.platform,
            analysisCount: painPointsFromAI.length
          })
          
          // 同时更新旧任务状态以保持兼容性
          await prisma.commentScrapingTask.update({
            where: { id: legacyTask.id },
            data: {
              status: 'completed',
              completedAt: new Date(),
              scraped: task.payload.maxComments,
              totalFound: task.payload.maxComments
            }
          })

          console.log(`痛点分析完成: ${product.name} - ${task.payload.platform}`)
        }
      } catch (error) {
        console.error('批量痛点分析失败:', error)
        // 更新失败的任务状态
        for (const { task, legacyTask } of tasks) {
          const errorMsg = error instanceof Error ? error.message : '未知错误'
          
          // 更新统一任务状态为失败
          await taskService.failTask(task.id, errorMsg)
          
          // 同时更新旧任务状态以保持兼容性
          await prisma.commentScrapingTask.update({
            where: { id: legacyTask.id },
            data: {
              status: 'failed',
              errorLog: errorMsg
            }
          })
        }
      }
    }, 1000) // 1秒后开始处理

    return NextResponse.json({
      success: true,
      message: `已创建${tasks.length}个痛点分析任务`,
      tasks: tasks.map(t => ({
        taskId: t.id,
        productId: t.productId,
        platform: t.platform
      }))
    })

  } catch (error: any) {
    console.error('批量痛点分析失败:', error)
    return NextResponse.json(
      { success: false, error: error.message || '服务器错误' },
      { status: 500 }
    )
  }
}

