import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST /api/admin/prompts/init-defaults - 初始化默认 Prompt 模板（每个业务模块5个）
export async function POST(request: NextRequest) {
  try {
    const defaultPrompts = [
      // ========== 商品库-痛点管理 (5个) ==========
      {
        name: '痛点分析-标准模板',
        businessModule: 'product-painpoint',
        content: `请分析以下商品的用户痛点：

商品名称：{{productName}}
商品类目：{{category}}
商品描述：{{description}}

请从以下角度分析痛点：
1. 功能性痛点
2. 情感性痛点
3. 社交性痛点
4. 价格敏感性痛点

返回JSON格式：
{
  "painPoints": ["痛点1", "痛点2", ...],
  "severity": "high|medium|low",
  "targetAudience": "目标受众描述"
}`,
        variables: JSON.stringify(['productName', 'category', 'description']),
        description: '标准痛点分析模板',
        isDefault: true,
        createdBy: 'system'
      },
      {
        name: '痛点分析-电商专用',
        businessModule: 'product-painpoint',
        content: `作为跨境电商专家，请分析以下商品在目标市场的用户痛点：

商品：{{productName}}
类目：{{category}}
目标国家：{{targetCountry}}

重点关注：
- 本地化需求
- 物流痛点
- 价格敏感度
- 信任问题

JSON输出：{"painPoints": [...], "localizedConcerns": [...]}`,
        variables: JSON.stringify(['productName', 'category', 'targetCountry']),
        description: '专注跨境电商痛点',
        isDefault: false,
        createdBy: 'system'
      },
      {
        name: '痛点分析-情感驱动',
        businessModule: 'product-painpoint',
        content: `请深入挖掘用户的情感痛点：

产品：{{productName}}
受众：{{targetAudience}}

分析维度：
1. 焦虑与恐惧
2. 愿望与渴望
3. 社交认同
4. 自我实现

输出格式：{"emotionalPainPoints": [...], "triggers": [...]}`,
        variables: JSON.stringify(['productName', 'targetAudience']),
        description: '强调情感层面的痛点',
        isDefault: false,
        createdBy: 'system'
      },
      {
        name: '痛点分析-竞品对比',
        businessModule: 'product-painpoint',
        content: `基于竞品分析，找出我们产品能解决的痛点：

我的产品：{{productName}}
竞品：{{competitorProducts}}
类目：{{category}}

对比分析：
- 竞品未解决的痛点
- 我们的优势点
- 用户转换动机

JSON：{"painPoints": [...], "competitiveAdvantages": [...]}`,
        variables: JSON.stringify(['productName', 'competitorProducts', 'category']),
        description: '结合竞品找痛点',
        isDefault: false,
        createdBy: 'system'
      },
      {
        name: '痛点分析-快速版',
        businessModule: 'product-painpoint',
        content: `快速提取核心痛点（10秒内完成）：

产品：{{productName}}
类目：{{category}}

只需输出3-5个最核心的痛点，每个10-15字。

JSON：{"painPoints": ["...", "...", "..."]}`,
        variables: JSON.stringify(['productName', 'category']),
        description: '快速简洁版本',
        isDefault: false,
        createdBy: 'system'
      },

      // ========== 商品库-竞品分析 (5个) ==========
      {
        name: '竞品分析-全面版',
        businessModule: 'product-competitor',
        content: `请全面分析以下竞品：

竞品URL：{{competitorUrl}}
类目：{{category}}

分析维度：
1. 核心卖点
2. 视觉风格
3. 文案结构
4. 目标受众
5. 价格策略

JSON：{
  "sellingPoints": [...],
  "visualStyle": "...",
  "scriptStructure": "...",
  "targetAudience": "...",
  "priceStrategy": "..."
}`,
        variables: JSON.stringify(['competitorUrl', 'category']),
        description: '全面竞品分析模板',
        isDefault: true,
        createdBy: 'system'
      },
      {
        name: '竞品分析-视频专用',
        businessModule: 'product-competitor',
        content: `分析竞品视频的制作要素：

视频URL：{{competitorUrl}}
标题：{{videoTitle}}

重点提取：
- 开场钩子（前3秒）
- 视觉效果
- 转场方式
- BGM风格
- CTA设计

JSON：{"hooks": [...], "visualEffects": [...], "transitions": [...]}`,
        variables: JSON.stringify(['competitorUrl', 'videoTitle']),
        description: '专注视频制作分析',
        isDefault: false,
        createdBy: 'system'
      },
      {
        name: '竞品分析-文案提取',
        businessModule: 'product-competitor',
        content: `提取竞品的核心文案：

来源：{{competitorUrl}}
描述：{{videoDescription}}

提取内容：
1. 标题公式
2. 痛点描述方式
3. 卖点表达
4. 行动号召

JSON：{"titleFormula": "...", "painPointPhrases": [...], "ctaTemplates": [...]}`,
        variables: JSON.stringify(['competitorUrl', 'videoDescription']),
        description: '专注文案提取',
        isDefault: false,
        createdBy: 'system'
      },
      {
        name: '竞品分析-受众洞察',
        businessModule: 'product-competitor',
        content: `分析竞品的目标受众：

竞品：{{competitorUrl}}
评论：{{referenceComments}}

洞察维度：
- 受众画像
- 关注点
- 决策因素
- 情感需求

JSON：{"audience": {...}, "keyFactors": [...], "emotions": [...]}`,
        variables: JSON.stringify(['competitorUrl', 'referenceComments']),
        description: '深入受众分析',
        isDefault: false,
        createdBy: 'system'
      },
      {
        name: '竞品分析-快速扫描',
        businessModule: 'product-competitor',
        content: `30秒快速扫描竞品核心信息：

URL：{{competitorUrl}}

只提取：
- 3个核心卖点
- 1句价值主张
- 目标受众（一句话）

JSON：{"sellingPoints": ["...", "...", "..."], "valueProposition": "...", "audience": "..."}`,
        variables: JSON.stringify(['competitorUrl']),
        description: '快速版竞品扫描',
        isDefault: false,
        createdBy: 'system'
      },

      // ========== 视频生成-脚本生成 (5个) ==========
      {
        name: '脚本生成-标准模板',
        businessModule: 'video-script',
        content: `请为以下商品生成15-30秒视频脚本：

商品：{{productName}}
类目：{{category}}
卖点：{{sellingPoints}}
受众：{{targetAudience}}
时长：{{duration}}秒

脚本结构：
1. 开场钩子（3-5秒）- 吸引注意
2. 痛点呈现（5-8秒）- 引发共鸣
3. 产品介绍（8-12秒）- 展示解决方案
4. 卖点强化（5-8秒）- 突出优势
5. 行动号召（3-5秒）- 促进转化

请包含：旁白、画面描述、转场提示`,
        variables: JSON.stringify(['productName', 'category', 'sellingPoints', 'targetAudience', 'duration']),
        description: '标准视频脚本模板',
        isDefault: true,
        createdBy: 'system'
      },
      {
        name: '脚本生成-TikTok风格',
        businessModule: 'video-script',
        content: `生成TikTok/抖音风格的15秒快节奏脚本：

产品：{{productName}}
卖点：{{sellingPoints}}

TikTok要求：
- 前1秒必须抓眼球
- 节奏快，信息密度高
- 配乐建议
- 字幕节点
- 转场特效

输出：旁白 + 画面 + 特效提示`,
        variables: JSON.stringify(['productName', 'sellingPoints']),
        description: 'TikTok短视频专用',
        isDefault: false,
        createdBy: 'system'
      },
      {
        name: '脚本生成-故事叙事',
        businessModule: 'video-script',
        content: `用故事化叙事生成脚本：

产品：{{productName}}
受众：{{targetAudience}}
时长：{{duration}}秒

故事三幕：
1. 困境：用户遇到的问题
2. 转折：发现产品
3. 解决：使用后的改变

要求：情感化、画面感强、有代入感`,
        variables: JSON.stringify(['productName', 'targetAudience', 'duration']),
        description: '故事化脚本',
        isDefault: false,
        createdBy: 'system'
      },
      {
        name: '脚本生成-产品演示',
        businessModule: 'video-script',
        content: `生成产品演示型脚本：

产品：{{productName}}
功能：{{features}}
时长：{{duration}}秒

演示流程：
1. 产品全貌展示
2. 核心功能演示
3. 使用场景展示
4. 效果对比
5. 购买引导

强调：清晰的产品展示角度和特写镜头`,
        variables: JSON.stringify(['productName', 'features', 'duration']),
        description: '产品演示专用',
        isDefault: false,
        createdBy: 'system'
      },
      {
        name: '脚本生成-促销活动',
        businessModule: 'video-script',
        content: `生成促销/限时活动脚本：

产品：{{productName}}
优惠：{{promotion}}
时长：{{duration}}秒

紧迫感元素：
- 倒计时提示
- 限量信息
- 价格对比
- 立即行动号召

要求：制造FOMO（错失恐惧）`,
        variables: JSON.stringify(['productName', 'promotion', 'duration']),
        description: '促销活动专用',
        isDefault: false,
        createdBy: 'system'
      },

      // ========== 视频生成-风格匹配 (5个) ==========
      {
        name: '风格匹配-智能推荐',
        businessModule: 'style-matching',
        content: `为商品推荐最合适的视频风格：

商品：{{productName}}
类目：{{category}}
目标国家：{{targetCountries}}
受众：{{targetAudience}}

可选风格：
{{availableStyles}}

分析维度：
- 产品属性匹配
- 受众偏好
- 文化适配
- 转化潜力

JSON：{
  "recommendations": [
    {"styleId": "...", "styleName": "...", "score": 0.95, "reason": "..."},
    ...
  ]
}`,
        variables: JSON.stringify(['productName', 'category', 'targetCountries', 'targetAudience', 'availableStyles']),
        description: '智能风格推荐',
        isDefault: true,
        createdBy: 'system'
      },
      {
        name: '风格匹配-类目优先',
        businessModule: 'style-matching',
        content: `基于类目推荐风格：

类目：{{category}}
子类目：{{subcategory}}

风格库：{{availableStyles}}

优先考虑：
1. 类目常见风格
2. 转化率数据
3. 行业标准

JSON：{"topStyles": [...], "reasons": [...]}`,
        variables: JSON.stringify(['category', 'subcategory', 'availableStyles']),
        description: '基于类目匹配',
        isDefault: false,
        createdBy: 'system'
      },
      {
        name: '风格匹配-受众驱动',
        businessModule: 'style-matching',
        content: `基于受众特征推荐风格：

目标受众：{{targetAudience}}
年龄段：{{ageGroup}}
兴趣：{{interests}}

风格选择考虑：
- 审美偏好
- 内容消费习惯
- 平台特点

JSON：{"recommendedStyles": [...], "audienceMatch": {...}}`,
        variables: JSON.stringify(['targetAudience', 'ageGroup', 'interests']),
        description: '基于受众匹配',
        isDefault: false,
        createdBy: 'system'
      },
      {
        name: '风格匹配-竞品参考',
        businessModule: 'style-matching',
        content: `参考竞品推荐风格：

我的产品：{{productName}}
竞品风格：{{competitorStyles}}

可选风格：{{availableStyles}}

策略：
- 借鉴成功元素
- 差异化创新
- 规避同质化

JSON：{"styles": [...], "differentiationPoints": [...]}`,
        variables: JSON.stringify(['productName', 'competitorStyles', 'availableStyles']),
        description: '竞品参考匹配',
        isDefault: false,
        createdBy: 'system'
      },
      {
        name: '风格匹配-A/B测试',
        businessModule: 'style-matching',
        content: `推荐2-3个风格用于A/B测试：

产品：{{productName}}
类目：{{category}}

推荐策略：
1个保守安全风格 + 1个创新风格 + 1个差异化风格

JSON：{
  "safeStyle": {...},
  "innovativeStyle": {...},
  "uniqueStyle": {...},
  "testingStrategy": "..."
}`,
        variables: JSON.stringify(['productName', 'category']),
        description: 'A/B测试风格组合',
        isDefault: false,
        createdBy: 'system'
      },

      // ========== 视频生成-质量评估 (5个) ==========
      {
        name: '质量评估-全面打分',
        businessModule: 'video-quality',
        content: `全面评估视频质量：

视频：{{videoTitle}}
描述：{{videoDescription}}
时长：{{duration}}秒
平台：{{platform}}

评估维度（0-100分）：
1. 内容质量
2. 视觉效果
3. 文案吸引力
4. 受众匹配度
5. 转化潜力

JSON：{
  "overallScore": 85,
  "dimensions": {...},
  "suggestions": [...]
}`,
        variables: JSON.stringify(['videoTitle', 'videoDescription', 'duration', 'platform']),
        description: '全面质量评估',
        isDefault: true,
        createdBy: 'system'
      },
      {
        name: '质量评估-转化导向',
        businessModule: 'video-quality',
        content: `评估视频的转化能力：

视频：{{videoTitle}}
CTA：{{callToAction}}
平台：{{platform}}

转化要素检查：
- 钩子效果
- 痛点触达
- 信任建立
- CTA清晰度
- 紧迫感营造

JSON：{"conversionScore": 0.85, "bottlenecks": [...], "improvements": [...]}`,
        variables: JSON.stringify(['videoTitle', 'callToAction', 'platform']),
        description: '转化能力评估',
        isDefault: false,
        createdBy: 'system'
      },
      {
        name: '质量评估-技术指标',
        businessModule: 'video-quality',
        content: `评估视频技术质量：

视频：{{videoTitle}}
时长：{{duration}}秒

技术指标：
- 画质清晰度
- 音频质量
- 剪辑流畅度
- 字幕准确性
- 特效使用

JSON：{"technicalScore": {...}, "issues": [...]}`,
        variables: JSON.stringify(['videoTitle', 'duration']),
        description: '技术质量评估',
        isDefault: false,
        createdBy: 'system'
      },
      {
        name: '质量评估-平台适配',
        businessModule: 'video-quality',
        content: `评估视频平台适配度：

视频：{{videoTitle}}
目标平台：{{platform}}

适配检查：
- 时长是否合适
- 画幅比例
- 节奏快慢
- 风格匹配
- 算法友好度

JSON：{"platformFit": 0.9, "optimizations": [...]}`,
        variables: JSON.stringify(['videoTitle', 'platform']),
        description: '平台适配评估',
        isDefault: false,
        createdBy: 'system'
      },
      {
        name: '质量评估-快速诊断',
        businessModule: 'video-quality',
        content: `10秒快速诊断视频问题：

视频：{{videoTitle}}

快速检查：
- 开场是否抓人
- 核心信息是否清晰
- CTA是否明确

JSON：{"quickScore": 0.8, "criticalIssues": [...], "quickFixes": [...]}`,
        variables: JSON.stringify(['videoTitle']),
        description: '快速诊断版',
        isDefault: false,
        createdBy: 'system'
      }
    ];

    // 为每个模板创建（允许同一模块多个模板）
    const results = [];
    for (const promptData of defaultPrompts) {
      // 检查是否已存在同名模板
      const existing = await prisma.promptTemplate.findFirst({
        where: {
          name: promptData.name,
          businessModule: promptData.businessModule
        }
      });

      if (!existing) {
        const created = await prisma.promptTemplate.create({
          data: promptData
        });
        results.push({ ...created, status: 'created' });
      } else {
        results.push({ ...existing, status: 'already_exists' });
      }
    }

    return NextResponse.json({
      success: true,
      data: results,
      message: `成功初始化 ${results.filter(r => r.status === 'created').length} 个默认模板（共${defaultPrompts.length}个模板）`
    });
  } catch (error: any) {
    console.error('初始化默认Prompt模板失败:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
