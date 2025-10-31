import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'

// 豆包AI服务集成
export async function POST(request: NextRequest) {
  try {
    const { prompt, model = 'doubao-seed-1-6-lite-251015', apiKey } = await request.json()

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: '豆包API Key未配置' },
        { status: 400 }
      )
    }

    if (!prompt) {
      return NextResponse.json(
        { success: false, error: '请输入提示词' },
        { status: 400 }
      )
    }

    // 调用豆包API
    const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.7
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json(
        { 
          success: false, 
          error: `豆包API调用失败: ${errorData.error?.message || response.statusText}` 
        },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    return NextResponse.json({
      success: true,
      data: {
        content: data.choices?.[0]?.message?.content || '豆包返回空内容',
        usage: data.usage,
        model: data.model
      }
    })

  } catch (error) {
    console.error('豆包API调用错误:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: `豆包API调用失败: ${error instanceof Error ? error.message : '未知错误'}` 
      },
      { status: 500 }
    )
  }
}

// 测试豆包连接
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const apiKey = searchParams.get('apiKey')
    
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: '请提供API Key' },
        { status: 400 }
      )
    }

    // 测试连接
    const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'doubao-seed-1-6-lite-251015',
        messages: [
          {
            role: 'user',
            content: '你好，请回复"连接成功"'
          }
        ],
        max_tokens: 10
      })
    })

    if (response.ok) {
      const data = await response.json()
      return NextResponse.json({
        success: true,
        message: '豆包连接成功',
        response: data.choices?.[0]?.message?.content
      })
    } else {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json(
        { 
          success: false, 
          error: `豆包连接失败: ${errorData.error?.message || response.statusText}` 
        },
        { status: response.status }
      )
    }

  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: `豆包连接测试失败: ${error instanceof Error ? error.message : '未知错误'}` 
      },
      { status: 500 }
    )
  }
}
