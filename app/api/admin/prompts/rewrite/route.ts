import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

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
  return { promptGeneration: 'gemini-2.5-flash' }
}

// 使用AI改写prompt
export async function POST(request: NextRequest) {
  try {
    const { currentPrompt, userRequest, conversationHistory } = await request.json()

    if (!currentPrompt || !userRequest) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      )
    }

    const aiConfig = getAIConfig()
    const aiModel = aiConfig.promptGeneration || 'gemini-2.5-flash'

    console.log(`使用AI模型 ${aiModel} 改写prompt...`)

    // 构建系统prompt
    const systemPrompt = `你是一个专业的Prompt工程师。用户会提供一个现有的prompt和改进要求，你需要根据要求优化prompt。

要求：
- 保持prompt的核心功能不变
- 根据用户要求进行调整
- 使用清晰、专业的语言
- 遵循最佳实践
- 只输出改写后的prompt内容，不要添加任何解释`

    // 构建对话历史
    const messages = [
      { role: 'system', content: systemPrompt },
      ...(conversationHistory || []),
      { 
        role: 'user', 
        content: `当前prompt:\n\`\`\`\n${currentPrompt}\n\`\`\`\n\n改进要求: ${userRequest}\n\n请输出改写后的prompt:`
      }
    ]

    let rewrittenPrompt = ''

    // 根据不同的AI模型调用对应的API
    if (aiModel.includes('gemini')) {
      rewrittenPrompt = await callGeminiAPI(messages)
    } else if (aiModel.includes('doubao')) {
      rewrittenPrompt = await callDoubaoAPI(messages)
    } else if (aiModel.includes('deepseek')) {
      rewrittenPrompt = await callDeepSeekAPI(messages)
    } else if (aiModel.includes('gpt')) {
      rewrittenPrompt = await callOpenAIAPI(messages)
    } else if (aiModel.includes('claude')) {
      rewrittenPrompt = await callClaudeAPI(messages)
    } else {
      rewrittenPrompt = await callGeminiAPI(messages)
    }

    return NextResponse.json({
      success: true,
      rewrittenPrompt,
      aiModel
    })

  } catch (error: any) {
    console.error('AI改写prompt失败:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// Gemini API调用
async function callGeminiAPI(messages: any[]): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured')

  // 合并消息为单个prompt
  const prompt = messages.map(m => `${m.role}: ${m.content}`).join('\n\n')

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2000
      }
    })
  })

  const result = await response.json()
  return result.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

// DeepSeek API调用
async function callDeepSeekAPI(messages: any[]): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) throw new Error('DEEPSEEK_API_KEY not configured')

  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages,
      temperature: 0.7,
      max_tokens: 2000
    })
  })

  const result = await response.json()
  return result.choices?.[0]?.message?.content || ''
}

// 豆包 API调用
async function callDoubaoAPI(messages: any[]): Promise<string> {
  const apiKey = process.env.DOUBAO_API_KEY
  if (!apiKey) throw new Error('DOUBAO_API_KEY not configured')

  const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'doubao-seed-1-6-lite-251015',
      messages,
      temperature: 0.7
    })
  })

  const result = await response.json()
  return result.choices?.[0]?.message?.content || ''
}

// OpenAI API调用
async function callOpenAIAPI(messages: any[]): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY not configured')

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages,
      temperature: 0.7,
      max_tokens: 2000
    })
  })

  const result = await response.json()
  return result.choices?.[0]?.message?.content || ''
}

// Claude API调用
async function callClaudeAPI(messages: any[]): Promise<string> {
  const apiKey = process.env.CLAUDE_API_KEY
  if (!apiKey) throw new Error('CLAUDE_API_KEY not configured')

  // Claude需要特殊的消息格式
  const systemMessage = messages.find(m => m.role === 'system')
  const otherMessages = messages.filter(m => m.role !== 'system')

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-sonnet-20240229',
      system: systemMessage?.content || '',
      messages: otherMessages,
      temperature: 0.7,
      max_tokens: 2000
    })
  })

  const result = await response.json()
  return result.content?.[0]?.text || ''
}

