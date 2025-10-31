import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const { apiKey, provider, model } = await request.json()

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'API Key不能为空' },
        { status: 400 }
      )
    }

    // 根据不同的提供商测试API Key
    let testResult = { success: false, message: '' }

    switch (provider) {
      case 'openai':
        testResult = await testOpenAI(apiKey, model)
        break
      case 'claude':
        testResult = await testClaude(apiKey, model)
        break
      case 'gemini':
        testResult = await testGemini(apiKey, model)
        break
      case 'doubao':
        testResult = await testDoubao(apiKey, model)
        break
      case 'deepseek':
        testResult = await testDeepSeek(apiKey, model)
        break
      default:
        return NextResponse.json(
          { success: false, error: '不支持的提供商' },
          { status: 400 }
        )
    }

    // 如果验证成功，保存API Key到环境变量并立即更新运行时环境变量
    if (testResult.success) {
      try {
        await saveApiKeyToEnv(provider, apiKey)
        
        // 🔥 关键：立即更新运行时环境变量，无需重启服务器
        updateRuntimeEnv(provider, apiKey)
        
        console.log(`✅ ${provider.toUpperCase()} API Key已验证并保存，运行时环境变量已更新`)
        // 同步该 provider 的模型清单到候选库（estimation_models）
        try {
          const origin = new URL(request.url).origin
          const syncResp = await fetch(`${origin}/api/admin/ai-config/sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ provider })
          })
          const syncJson = await syncResp.json().catch(() => ({}))
          if (!syncResp.ok || !syncJson?.success) {
            console.warn('Provider模型同步失败（不影响验证结果）:', syncJson?.error || syncResp.statusText)
          } else {
            console.log('Provider模型已同步:', syncJson)
          }
        } catch (e) {
          console.warn('调用同步模型接口失败:', (e as any)?.message || e)
        }
      } catch (error) {
        console.error('保存API Key到环境变量失败:', error)
        return NextResponse.json({
          success: false,
          error: 'API Key验证成功，但保存到环境变量失败'
        })
      }
    }

    return NextResponse.json({
      success: testResult.success,
      message: testResult.message
    })

  } catch (error) {
    console.error('API Key测试失败:', error)
    return NextResponse.json(
      { success: false, error: 'API Key测试失败' },
      { status: 500 }
    )
  }
}

async function testOpenAI(apiKey: string, model: string) {
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    })

    if (response.ok) {
      return { success: true, message: 'OpenAI API Key验证成功' }
    } else {
      return { success: false, message: 'OpenAI API Key无效或已过期' }
    }
  } catch (error) {
    return { success: false, message: 'OpenAI API连接失败' }
  }
}

async function testClaude(apiKey: string, model: string) {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: model || 'claude-3-sonnet-20240229',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'test' }]
      })
    })

    if (response.ok) {
      return { success: true, message: 'Claude API Key验证成功' }
    } else {
      return { success: false, message: 'Claude API Key无效或已过期' }
    }
  } catch (error) {
    return { success: false, message: 'Claude API连接失败' }
  }
}

async function testGemini(apiKey: string, model: string) {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model || 'gemini-2.5-flash'}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: 'test'
          }]
        }]
      })
    })

    if (response.ok) {
      return { success: true, message: 'Gemini API Key验证成功' }
    } else {
      return { success: false, message: 'Gemini API Key无效或已过期' }
    }
  } catch (error) {
    return { success: false, message: 'Gemini API连接失败' }
  }
}

async function testDoubao(apiKey: string, model: string) {
  try {
    // 豆包API端点 - 使用字节跳动的火山引擎API
    const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model || 'doubao-seed-1-6-lite-251015',
        messages: [
          {
            role: 'user',
            content: 'test'
          }
        ],
        max_tokens: 10,
        temperature: 0.1
      })
    })

    if (response.ok) {
      const data = await response.json()
      return { success: true, message: '豆包 API Key验证成功' }
    } else {
      const errorData = await response.json().catch(() => ({}))
      console.error('豆包API错误:', errorData)
      return { 
        success: false, 
        message: `豆包 API Key无效或已过期: ${errorData.error?.message || errorData.message || response.statusText}` 
      }
    }
  } catch (error) {
    console.error('豆包API连接错误:', error)
    return { success: false, message: `豆包 API连接失败: ${error instanceof Error ? error.message : String(error)}` }
  }
}

async function testDeepSeek(apiKey: string, model: string) {
  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model || 'deepseek-chat',
        messages: [
          {
            role: 'user',
            content: 'test'
          }
        ],
        max_tokens: 10
      })
    })

    if (response.ok) {
      return { success: true, message: 'DeepSeek API Key验证成功' }
    } else {
      const errorData = await response.json().catch(() => ({}))
      
      // 处理不同的错误情况
      if (response.status === 402) {
        return { success: false, message: 'DeepSeek API Key有效，但账户余额不足，请充值后使用' }
      } else if (response.status === 401) {
        return { success: false, message: 'DeepSeek API Key无效或已过期' }
      } else {
        return { success: false, message: `DeepSeek API调用失败: ${errorData.error?.message || errorData.message || response.statusText}` }
      }
    }
  } catch (error) {
    return { success: false, message: 'DeepSeek API连接失败' }
  }
}

// 立即更新运行时环境变量（无需重启服务器）
function updateRuntimeEnv(provider: string, apiKey: string) {
  let envVarName = ''
  switch (provider) {
    case 'openai':
      envVarName = 'OPENAI_API_KEY'
      break
    case 'claude':
      envVarName = 'CLAUDE_API_KEY'
      break
    case 'gemini':
      envVarName = 'GEMINI_API_KEY'
      break
    case 'doubao':
      envVarName = 'DOUBAO_API_KEY'
      break
    case 'deepseek':
      envVarName = 'DEEPSEEK_API_KEY'
      break
    default:
      throw new Error('不支持的提供商')
  }
  
  // 直接更新 process.env，立即生效
  process.env[envVarName] = apiKey
  console.log(`🔥 运行时环境变量 ${envVarName} 已更新，立即生效！`)
}

// 保存API Key到环境变量文件
async function saveApiKeyToEnv(provider: string, apiKey: string) {
  const envFile = path.join(process.cwd(), '.env.local')
  
  // 确定环境变量名
  let envVarName = ''
  switch (provider) {
    case 'openai':
      envVarName = 'OPENAI_API_KEY'
      break
    case 'claude':
      envVarName = 'CLAUDE_API_KEY'
      break
    case 'gemini':
      envVarName = 'GEMINI_API_KEY'
      break
    case 'doubao':
      envVarName = 'DOUBAO_API_KEY'
      break
    case 'deepseek':
      envVarName = 'DEEPSEEK_API_KEY'
      break
    default:
      throw new Error('不支持的提供商')
  }
  
  console.log(`\n========== 开始保存 ${envVarName} ==========`)
  console.log(`新的API Key: ${apiKey.substring(0, 10)}...`)
  
  // 读取现有的环境变量文件
  let envContent = ''
  if (fs.existsSync(envFile)) {
    envContent = fs.readFileSync(envFile, 'utf8')
    console.log(`✓ 读取现有 .env.local 文件，大小: ${envContent.length} 字节`)
  } else {
    console.log(`⚠ .env.local 文件不存在，将创建新文件`)
  }
  
  // 检查旧值
  const oldValueMatch = envContent.match(new RegExp(`^${envVarName}=(.*)$`, 'm'))
  if (oldValueMatch) {
    const oldValue = oldValueMatch[1].replace(/['"]/g, '')
    console.log(`✓ 找到旧的 ${envVarName}: ${oldValue.substring(0, 10)}...`)
  } else {
    console.log(`✓ 未找到旧的 ${envVarName}，将添加新条目`)
  }
  
  // 多种格式匹配：OPENAI_API_KEY="xxx" 或 OPENAI_API_KEY='xxx' 或 OPENAI_API_KEY=xxx
  const envVarRegex = new RegExp(`^${envVarName}\\s*=.*$`, 'gm')
  
  // 新的键值对
  const newLine = `${envVarName}="${apiKey}"`
  
  if (envVarRegex.test(envContent)) {
    // 更新现有的环境变量（覆盖所有匹配行）
    envContent = envContent.replace(envVarRegex, newLine)
    console.log(`✓ 已覆盖旧的 ${envVarName}`)
  } else {
    // 添加新的环境变量
    // 确保文件末尾有换行符
    if (envContent && !envContent.endsWith('\n')) {
      envContent += '\n'
    }
    envContent += `\n# ${provider.toUpperCase()} API Key (已验证通过 - ${new Date().toISOString()})\n${newLine}\n`
    console.log(`✓ 添加新的 ${envVarName}`)
  }
  
  // 写入文件
  fs.writeFileSync(envFile, envContent, 'utf8')
  console.log(`✓ 已写入 .env.local 文件`)
  
  // 验证写入结果
  const verifyContent = fs.readFileSync(envFile, 'utf8')
  const verifyMatch = verifyContent.match(new RegExp(`^${envVarName}=(.*)$`, 'm'))
  if (verifyMatch) {
    const savedValue = verifyMatch[1].replace(/['"]/g, '')
    if (savedValue === apiKey) {
      console.log(`✅ 验证成功！${envVarName} 已正确保存`)
    } else {
      console.error(`❌ 验证失败！保存的值不匹配`)
      console.error(`  期望: ${apiKey.substring(0, 15)}...`)
      console.error(`  实际: ${savedValue.substring(0, 15)}...`)
    }
  } else {
    console.error(`❌ 验证失败！未在文件中找到 ${envVarName}`)
  }
  console.log(`========== 保存完成 ==========\n`)
}
