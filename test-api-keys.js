#!/usr/bin/env node

/**
 * 测试 Gemini、Doubao、DeepSeek 的 API Key 是否可用
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
      const value = match[2].trim()
      process.env[key] = value
    }
  })
}

async function testGemini() {
  console.log('\n🧪 测试 Gemini API Key...')
  const apiKey = process.env.GEMINI_API_KEY
  
  if (!apiKey) {
    console.log('❌ GEMINI_API_KEY 未配置')
    return false
  }
  
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: 'Say hello' }]
        }]
      })
    })
    
    const result = await response.json()
    
    if (response.ok && result.candidates) {
      console.log('✅ Gemini API Key 可用')
      console.log('   响应:', result.candidates[0]?.content?.parts[0]?.text?.substring(0, 50))
      return true
    } else {
      console.log('❌ Gemini API 调用失败:', result.error?.message || JSON.stringify(result))
      return false
    }
  } catch (error) {
    console.log('❌ Gemini API 请求失败:', error.message)
    return false
  }
}

async function testDoubao() {
  console.log('\n🧪 测试 Doubao API Key...')
  const apiKey = process.env.DOUBAO_API_KEY
  
  if (!apiKey) {
    console.log('❌ DOUBAO_API_KEY 未配置')
    return false
  }
  
  try {
    const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'doubao-seed-1-6-lite-251015',
        messages: [{ role: 'user', content: 'Say hello' }]
      })
    })
    
    const result = await response.json()
    
    if (response.ok && result.choices) {
      console.log('✅ Doubao API Key 可用')
      console.log('   响应:', result.choices[0]?.message?.content?.substring(0, 50))
      return true
    } else {
      console.log('❌ Doubao API 调用失败:', result.error?.message || JSON.stringify(result))
      return false
    }
  } catch (error) {
    console.log('❌ Doubao API 请求失败:', error.message)
    return false
  }
}

async function testDeepSeek() {
  console.log('\n🧪 测试 DeepSeek API Key...')
  const apiKey = process.env.DEEPSEEK_API_KEY
  
  if (!apiKey) {
    console.log('❌ DEEPSEEK_API_KEY 未配置')
    return false
  }
  
  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: 'Say hello' }]
      })
    })
    
    const result = await response.json()
    
    if (response.ok && result.choices) {
      console.log('✅ DeepSeek API Key 可用')
      console.log('   响应:', result.choices[0]?.message?.content?.substring(0, 50))
      return true
    } else {
      console.log('❌ DeepSeek API 调用失败:', result.error?.message || JSON.stringify(result))
      return false
    }
  } catch (error) {
    console.log('❌ DeepSeek API 请求失败:', error.message)
    return false
  }
}

async function main() {
  console.log('🔑 开始验证 API Keys...\n')
  console.log('=' .repeat(60))
  
  const results = {
    gemini: await testGemini(),
    doubao: await testDoubao(),
    deepseek: await testDeepSeek()
  }
  
  console.log('\n' + '='.repeat(60))
  console.log('\n📊 验证结果汇总:')
  console.log(`   Gemini: ${results.gemini ? '✅ 可用' : '❌ 不可用'}`)
  console.log(`   Doubao: ${results.doubao ? '✅ 可用' : '❌ 不可用'}`)
  console.log(`   DeepSeek: ${results.deepseek ? '✅ 可用' : '❌ 不可用'}`)
  
  const availableCount = Object.values(results).filter(r => r).length
  console.log(`\n✅ 可用模型数量: ${availableCount}/3`)
  
  if (availableCount === 0) {
    console.log('\n⚠️  警告: 没有可用的 API Key！请检查 .env.local 配置')
    process.exit(1)
  }
}

main().catch(error => {
  console.error('\n❌ 测试失败:', error)
  process.exit(1)
})

