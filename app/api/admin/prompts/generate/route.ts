import { NextRequest, NextResponse } from 'next/server';

// POST /api/admin/prompts/generate - 使用AI生成 Prompt 候选模板
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      businessModule,
      referenceExamples, // 用户提供的参考例子
      context, // 业务场景描述
      variables // 需要使用的变量
    } = body;

    if (!businessModule || !referenceExamples || referenceExamples.length === 0) {
      return NextResponse.json(
        { success: false, error: '缺少必需参数: businessModule, referenceExamples' },
        { status: 400 }
      );
    }

    // 构建生成 Prompt 的元提示
    const metaPrompt = `你是一个专业的 Prompt 工程师。请根据以下信息，生成3个高质量的 Prompt 模板候选：

业务模块：${businessModule}
业务场景：${context || '未提供'}
可用变量：${variables ? variables.join(', ') : '未指定'}

参考例子：
${referenceExamples.map((ex: any, i: number) => `
例子${i + 1}:
输入：${ex.input}
期望输出：${ex.expectedOutput}
`).join('\n')}

要求：
1. 生成3个不同风格的 Prompt 模板
2. 每个模板都要清晰、具体、可执行
3. 使用 {{variableName}} 格式标注变量占位符
4. 包含明确的输出格式要求
5. 考虑边界情况和异常处理

返回JSON格式：
{
  "candidates": [
    {
      "name": "模板名称",
      "content": "完整的Prompt内容",
      "style": "模板风格描述（如：简洁型、详细型、结构化等）",
      "variables": ["var1", "var2", ...],
      "expectedPerformance": "预期效果描述"
    },
    ...
  ]
}`;

    // 调用 AI 服务生成候选模板
    // 这里需要根据实际的 AI 配置来调用
    const aiConfigResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/admin/ai-config`, {
      method: 'GET'
    });
    
    if (!aiConfigResponse.ok) {
      throw new Error('无法获取AI配置');
    }

    const aiConfigData = await aiConfigResponse.json();
    const promptGenerationAI = aiConfigData.promptGenerationAI;

    if (!promptGenerationAI || !promptGenerationAI.provider || !promptGenerationAI.model) {
      return NextResponse.json(
        { success: false, error: 'AI配置不完整，无法生成Prompt模板' },
        { status: 400 }
      );
    }

    // 调用对应的 AI provider
    let aiResponse;
    
    if (promptGenerationAI.provider === 'doubao') {
      // 调用豆包 API
      const doubaoResponse = await fetch('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${promptGenerationAI.apiKey}`
        },
        body: JSON.stringify({
          model: promptGenerationAI.model,
          messages: [
            { role: 'user', content: metaPrompt }
          ]
        })
      });

      if (!doubaoResponse.ok) {
        throw new Error(`豆包API调用失败: ${doubaoResponse.statusText}`);
      }

      const doubaoData = await doubaoResponse.json();
      aiResponse = doubaoData.choices?.[0]?.message?.content;
    } else if (promptGenerationAI.provider === 'openai') {
      // 调用 OpenAI API
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${promptGenerationAI.apiKey}`
        },
        body: JSON.stringify({
          model: promptGenerationAI.model,
          messages: [
            { role: 'user', content: metaPrompt }
          ]
        })
      });

      if (!openaiResponse.ok) {
        throw new Error(`OpenAI API调用失败: ${openaiResponse.statusText}`);
      }

      const openaiData = await openaiResponse.json();
      aiResponse = openaiData.choices?.[0]?.message?.content;
    } else {
      return NextResponse.json(
        { success: false, error: `不支持的AI提供商: ${promptGenerationAI.provider}` },
        { status: 400 }
      );
    }

    if (!aiResponse) {
      throw new Error('AI返回为空');
    }

    // 解析 AI 返回的 JSON
    let candidates;
    try {
      // 尝试提取JSON（可能被markdown包裹）
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        candidates = parsed.candidates || [];
      } else {
        throw new Error('无法从AI响应中提取JSON');
      }
    } catch (parseError: any) {
      console.error('解析AI响应失败:', parseError, 'AI响应:', aiResponse);
      return NextResponse.json(
        { success: false, error: '解析AI生成的模板失败', details: parseError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        candidates,
        rawResponse: aiResponse
      },
      message: `成功生成 ${candidates.length} 个Prompt候选模板`
    });
  } catch (error: any) {
    console.error('生成Prompt模板失败:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

