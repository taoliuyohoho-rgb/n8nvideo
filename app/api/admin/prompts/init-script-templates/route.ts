import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * 初始化脚本生成Prompt模板
 * 根据PRD定义创建脚本生成模板
 */
export async function POST(request: NextRequest) {
  try {
    const scriptTemplates = [
      // 标准脚本生成模板
      {
        name: '脚本生成-标准模板',
        businessModule: 'script.generate',
        content: `请为以下商品生成15-30秒视频脚本：

商品：{{productName}}
类目：{{category}}
卖点：{{sellingPoints}}
受众：{{targetAudience}}
人设：{{personaName}} ({{personaAge}}岁, {{personaOccupation}}, {{personaLocation}})
人设特质：{{personaTraits}}
人设沟通风格：{{personaCommunicationStyle}}
时长：{{duration}}秒

脚本结构：
1. 开场钩子（3-5秒）- 吸引注意
2. 痛点呈现（5-8秒）- 引发共鸣
3. 产品介绍（8-12秒）- 展示解决方案
4. 卖点强化（5-8秒）- 突出优势
5. 行动号召（3-5秒）- 促进转化

请包含：旁白、画面描述、转场提示

输出JSON格式：
{
  "angle": "脚本角度描述",
  "energy": "能量描述",
  "durationSec": 15,
  "lines": {
    "open": "开场钩子文案",
    "main": "主要内容文案",
    "close": "行动号召文案"
  },
  "shots": [
    {
      "second": 0,
      "camera": "特写",
      "action": "展示产品",
      "visibility": "产品清晰可见",
      "audio": "旁白+背景音乐"
    }
  ],
  "technical": {
    "orientation": "竖屏",
    "filmingMethod": "手持",
    "dominantHand": "右手",
    "location": "家庭环境",
    "audioEnv": "安静室内"
  }
}`,
        variables: JSON.stringify(['productName', 'category', 'sellingPoints', 'targetAudience', 'personaName', 'personaAge', 'personaOccupation', 'personaLocation', 'personaTraits', 'personaCommunicationStyle', 'duration']),
        description: '标准视频脚本模板，15秒UGC风格',
        isDefault: true,
        createdBy: 'system'
      },
      // TikTok风格脚本模板
      {
        name: '脚本生成-TikTok风格',
        businessModule: 'script.generate',
        content: `请为以下商品生成15秒TikTok风格视频脚本：

商品：{{productName}}
类目：{{category}}
卖点：{{sellingPoints}}
受众：{{targetAudience}}
人设：{{personaName}} ({{personaAge}}岁, {{personaOccupation}}, {{personaLocation}})
人设特质：{{personaTraits}}
人设沟通风格：{{personaCommunicationStyle}}

TikTok风格要求：
- 快速节奏，3秒内抓住注意力
- 使用流行音乐和音效
- 视觉冲击力强
- 互动性强，鼓励点赞分享
- 语言简洁有力

输出JSON格式：
{
  "angle": "TikTok风格角度",
  "energy": "高能量",
  "durationSec": 15,
  "lines": {
    "open": "3秒内抓住注意力的开场",
    "main": "快速展示产品卖点",
    "close": "强烈行动号召"
  },
  "shots": [
    {
      "second": 0,
      "camera": "特写",
      "action": "快速展示",
      "visibility": "产品突出",
      "audio": "流行音乐+音效"
    }
  ],
  "technical": {
    "orientation": "竖屏9:16",
    "filmingMethod": "手持自拍",
    "dominantHand": "右手",
    "location": "生活场景",
    "audioEnv": "音乐+音效"
  }
}`,
        variables: JSON.stringify(['productName', 'category', 'sellingPoints', 'targetAudience', 'personaName', 'personaAge', 'personaOccupation', 'personaLocation', 'personaTraits', 'personaCommunicationStyle']),
        description: 'TikTok风格脚本模板，快速节奏，视觉冲击力强',
        isDefault: true,
        createdBy: 'system'
      },
      // 教育风格脚本模板
      {
        name: '脚本生成-教育风格',
        businessModule: 'script.generate',
        content: `请为以下商品生成15-30秒教育风格视频脚本：

商品：{{productName}}
类目：{{category}}
卖点：{{sellingPoints}}
受众：{{targetAudience}}
人设：{{personaName}} ({{personaAge}}岁, {{personaOccupation}}, {{personaLocation}})
人设特质：{{personaTraits}}
人设沟通风格：{{personaCommunicationStyle}}

教育风格要求：
- 专业可信，像专家分享
- 详细解释产品功能
- 使用数据和事实
- 语言专业但易懂
- 强调学习价值

输出JSON格式：
{
  "angle": "教育分享角度",
  "energy": "专业稳重",
  "durationSec": 30,
  "lines": {
    "open": "专业开场，建立权威",
    "main": "详细解释产品功能和使用方法",
    "close": "鼓励学习和尝试"
  },
  "shots": [
    {
      "second": 0,
      "camera": "中景",
      "action": "专业讲解",
      "visibility": "产品+讲解者",
      "audio": "清晰旁白"
    }
  ],
  "technical": {
    "orientation": "横屏16:9",
    "filmingMethod": "固定机位",
    "dominantHand": "右手",
    "location": "专业环境",
    "audioEnv": "安静专业"
  }
}`,
        variables: JSON.stringify(['productName', 'category', 'sellingPoints', 'targetAudience', 'personaName', 'personaAge', 'personaOccupation', 'personaLocation', 'personaTraits', 'personaCommunicationStyle']),
        description: '教育风格脚本模板，专业可信，详细解释产品功能',
        isDefault: true,
        createdBy: 'system'
      },
      // 情感共鸣风格脚本模板
      {
        name: '脚本生成-情感共鸣风格',
        businessModule: 'script.generate',
        content: `请为以下商品生成15-30秒情感共鸣风格视频脚本：

商品：{{productName}}
类目：{{category}}
卖点：{{sellingPoints}}
受众：{{targetAudience}}
人设：{{personaName}} ({{personaAge}}岁, {{personaOccupation}}, {{personaLocation}})
人设特质：{{personaTraits}}
人设沟通风格：{{personaCommunicationStyle}}

情感共鸣风格要求：
- 讲述真实故事和经历
- 引发情感共鸣
- 语言温暖真诚
- 强调产品如何改变生活
- 鼓励分享和互动

输出JSON格式：
{
  "angle": "情感故事角度",
  "energy": "温暖真诚",
  "durationSec": 25,
  "lines": {
    "open": "真实故事开场",
    "main": "分享使用体验和感受",
    "close": "鼓励分享和互动"
  },
  "shots": [
    {
      "second": 0,
      "camera": "近景",
      "action": "真诚分享",
      "visibility": "产品+情感表达",
      "audio": "温暖旁白+轻柔音乐"
    }
  ],
  "technical": {
    "orientation": "竖屏",
    "filmingMethod": "手持",
    "dominantHand": "右手",
    "location": "温馨环境",
    "audioEnv": "温暖音乐"
  }
}`,
        variables: JSON.stringify(['productName', 'category', 'sellingPoints', 'targetAudience', 'personaName', 'personaAge', 'personaOccupation', 'personaLocation', 'personaTraits', 'personaCommunicationStyle']),
        description: '情感共鸣风格脚本模板，讲述真实故事，引发情感共鸣',
        isDefault: true,
        createdBy: 'system'
      },
      // 对比测试风格脚本模板
      {
        name: '脚本生成-对比测试风格',
        businessModule: 'script.generate',
        content: `请为以下商品生成15-30秒对比测试风格视频脚本：

商品：{{productName}}
类目：{{category}}
卖点：{{sellingPoints}}
受众：{{targetAudience}}
人设：{{personaName}} ({{personaAge}}岁, {{personaOccupation}}, {{personaLocation}})
人设特质：{{personaTraits}}
人设沟通风格：{{personaCommunicationStyle}}

对比测试风格要求：
- 展示使用前后对比
- 突出产品优势
- 使用数据和结果
- 语言客观公正
- 强调实际效果

输出JSON格式：
{
  "angle": "对比测试角度",
  "energy": "客观专业",
  "durationSec": 20,
  "lines": {
    "open": "介绍测试目的",
    "main": "展示对比结果",
    "close": "总结产品优势"
  },
  "shots": [
    {
      "second": 0,
      "camera": "中景",
      "action": "对比展示",
      "visibility": "产品+对比效果",
      "audio": "客观旁白"
    }
  ],
  "technical": {
    "orientation": "横屏",
    "filmingMethod": "固定机位",
    "dominantHand": "右手",
    "location": "测试环境",
    "audioEnv": "清晰录音"
  }
}`,
        variables: JSON.stringify(['productName', 'category', 'sellingPoints', 'targetAudience', 'personaName', 'personaAge', 'personaOccupation', 'personaLocation', 'personaTraits', 'personaCommunicationStyle']),
        description: '对比测试风格脚本模板，展示使用前后对比，突出产品优势',
        isDefault: true,
        createdBy: 'system'
      }
    ]

    // 检查是否已存在脚本生成模板
    const existingTemplates = await prisma.promptTemplate.findMany({
      where: {
        businessModule: 'script.generate'
      }
    })

    if (existingTemplates.length > 0) {
      return NextResponse.json({
        success: true,
        message: '脚本生成模板已存在',
        count: existingTemplates.length
      })
    }

    // 创建模板
    const createdTemplates = []
    for (const template of scriptTemplates) {
      const created = await prisma.promptTemplate.create({
        data: template
      })
      createdTemplates.push(created)
    }

    return NextResponse.json({
      success: true,
      message: '脚本生成模板初始化成功',
      templates: createdTemplates.map(t => ({
        id: t.id,
        name: t.name,
        businessModule: t.businessModule
      }))
    })

  } catch (error) {
    console.error('初始化脚本生成模板失败:', error)
    return NextResponse.json(
      { success: false, error: '初始化失败' },
      { status: 500 }
    )
  }
}
