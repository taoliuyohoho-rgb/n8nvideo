#!/usr/bin/env node

/**
 * 测试AI返回的内容格式
 */

const fs = require('fs')
const path = require('path')

// 手动加载 .env.local
const envPath = path.join(__dirname, '.env.local')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=:#]+)=(.*)$/)
    if (match) {
      const key = match[1].trim()
      const value = match[2].trim().replace(/^["']|["']$/g, '')
      process.env[key] = value
    }
  })
}

async function testDeepSeek() {
  console.log('🧪 测试 DeepSeek 痛点提取...\n')
  
  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) {
    console.log('❌ DEEPSEEK_API_KEY 未配置')
    return
  }
  
  // 模拟评论
  const comments = [
    '妇炎洁草本私处湿巾质量一般，不如预期',
    '价格偏高，性价比不高',
    '包装简陋，影响第一印象',
    '使用说明不够详细',
    '客服回复慢，服务态度一般',
    '物流太慢，等了好久才到'
  ]
  
  const prompt = `You are a professional e-commerce product analyst. Please analyze the following user reviews from shopee platform about "妇炎洁草本私处湿巾" and extract the main pain points and issues.

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

你是一个专业的电商产品分析师。请分析以上来自shopee平台关于"妇炎洁草本私处湿巾"的用户评论（可能包含英语、马来语或中文），提取主要痛点。痛点用中文输出，格式如上所示。`

  try {
    console.log('📤 发送请求到 DeepSeek...')
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
    
    if (!response.ok) {
      console.log('❌ API调用失败:', result)
      return
    }
    
    const text = result.choices?.[0]?.message?.content || ''
    
    console.log('\n🔍 AI返回的原始内容:')
    console.log('=' .repeat(60))
    console.log(text)
    console.log('='.repeat(60))
    
    // 解析痛点
    const lines = text.split('\n').filter(line => line.trim())
    const painPoints = []
    
    for (const line of lines) {
      const match = line.match(/^\d+\.\s*(.+)$/) || line.match(/^[-•]\s*(.+)$/)
      if (match && match[1]) {
        const point = match[1].trim()
        if (point.length > 5 && point.length < 100) {
          painPoints.push(point)
        }
      }
    }
    
    console.log(`\n📊 解析结果: 提取了 ${painPoints.length} 个痛点`)
    if (painPoints.length > 0) {
      console.log('\n痛点列表:')
      painPoints.forEach((p, i) => {
        console.log(`  ${i + 1}. ${p}`)
      })
    } else {
      console.log('\n⚠️  警告: 没有提取到符合格式的痛点！')
      console.log('\n可能的原因:')
      console.log('  - AI返回格式不符合 "1. xxx" 或 "- xxx" 格式')
      console.log('  - 痛点描述太短(<5字符)或太长(>100字符)')
    }
    
  } catch (error) {
    console.log('❌ 请求失败:', error.message)
  }
}

testDeepSeek()

