import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';


// POST /api/admin/prompts/init-defaults - 初始化默认 Prompt 模板（每个业务模块5个）
export async function POST(request: NextRequest) {
  try {
    const defaultPrompts = [

      // ========== 商品分析 (5个) ==========
      {
        name: '商品分析-标准模板',
        businessModule: 'product-analysis',
        content: `请全面分析以下商品：

商品名称：{{productName}}
类目：{{category}}
商品描述：{{description}}
目标市场：{{targetMarket}}

分析维度：
1. 核心卖点（3-5个，每个8-12字）
2. 用户痛点（3-5个，每个8-12字）
3. 目标受众（8-12字）
4. 竞争优势
5. 适用场景

JSON：{
  "sellingPoints": ["...", "...", ...],
  "painPoints": ["...", "...", ...],
  "targetAudience": "...",
  "competitiveAdvantages": [...],
  "usageScenarios": [...]
}`,
        variables: JSON.stringify(['productName', 'category', 'description', 'targetMarket']),
        description: '标准商品分析模板',
        isDefault: true,
        createdBy: 'system'
      },
      {
        name: '商品分析-快速版',
        businessModule: 'product-analysis',
        content: `快速提取商品核心信息：

商品：{{productName}}
描述：{{description}}

只提取：
- 3个核心卖点（每个8-12字）
- 3个关键痛点（每个8-12字）
- 目标受众（8-12字）

JSON：{
  "sellingPoints": ["...", "...", "..."],
  "painPoints": ["...", "...", "..."],
  "targetAudience": "..."
}`,
        variables: JSON.stringify(['productName', 'description']),
        description: '快速商品分析',
        isDefault: false,
        createdBy: 'system'
      },
      {
        name: '商品分析-深度版',
        businessModule: 'product-analysis',
        content: `深度分析商品及市场定位：

商品：{{productName}}
类目：{{category}}
描述：{{description}}
目标市场：{{targetMarket}}
竞品参考：{{competitorInfo}}

深度分析：
1. 产品定位分析
2. 目标人群细分
3. 核心卖点（5个）
4. 痛点分析（5个）
5. 差异化优势
6. 营销建议
7. 定价策略建议

JSON：{
  "positioning": "...",
  "audienceSegments": [...],
  "sellingPoints": [...],
  "painPoints": [...],
  "differentiation": [...],
  "marketingRecommendations": [...],
  "pricingStrategy": "..."
}`,
        variables: JSON.stringify(['productName', 'category', 'description', 'targetMarket', 'competitorInfo']),
        description: '深度商品与市场分析',
        isDefault: false,
        createdBy: 'system'
      },
      {
        name: '商品分析-场景化',
        businessModule: 'product-analysis',
        content: `基于使用场景分析商品：

商品：{{productName}}
类目：{{category}}
目标场景：{{targetScenarios}}

场景化分析：
- 每个场景的核心卖点
- 场景相关痛点
- 目标用户特征
- 使用时机
- 购买动机

JSON：{
  "scenarios": [
    {
      "scenario": "...",
      "sellingPoints": [...],
      "painPoints": [...],
      "targetUsers": "...",
      "timing": "...",
      "buyingMotivation": "..."
    }
  ]
}`,
        variables: JSON.stringify(['productName', 'category', 'targetScenarios']),
        description: '场景化商品分析',
        isDefault: false,
        createdBy: 'system'
      },
      {
        name: '商品分析-竞争对比',
        businessModule: 'product-analysis',
        content: `商品与竞品对比分析：

我的商品：{{productName}}
商品描述：{{description}}
竞品信息：{{competitorInfo}}

对比分析：
- 相对优势（卖点）
- 相对劣势
- 差异化点
- 目标受众重叠度
- 定位建议

JSON：{
  "advantages": [...],
  "disadvantages": [...],
  "differentiators": [...],
  "audienceOverlap": "...",
  "positioningAdvice": "..."
}`,
        variables: JSON.stringify(['productName', 'description', 'competitorInfo']),
        description: '商品竞争对比分析',
        isDefault: false,
        createdBy: 'system'
      },

      // ========== 视频生成-脚本生成 (4个差异化模板) ==========
      {
        name: '脚本生成-通用营销',
        businessModule: 'video-script',
        content: `生成通用营销型{{duration}}秒视频脚本：

【产品信息】
产品：{{productName}}
类目：{{category}}
核心卖点：{{sellingPoints}}
目标受众：{{targetAudience}}
用户痛点：{{painPoints}}
使用场景：{{usageScenarios}}

【营销脚本结构】
1. 开场钩子（前3秒）：用具体数据、疑问或冲突吸引注意
2. 痛点共鸣（5-8秒）：描述目标用户真实痛点，引发情感共鸣
3. 产品解决方案（8-15秒）：
   - 清晰展示产品如何解决痛点
   - 突出1-2个核心差异化优势
   - 用具体使用场景证明效果
4. 信任建立（5-8秒）：数据证明、用户证言或对比优势
5. 行动号召（3-5秒）：明确的下一步行动，创造紧迫感

【内容质量标准】
- 避免空洞词汇（"很好"、"不错"等）
- 使用具体数据和事实
- 语言符合目标受众习惯
- 情感化表达，有画面感
- 逻辑清晰，节奏紧凑

输出格式：
{
  "script": "完整脚本内容",
  "hook": "开场钩子",
  "painPoint": "痛点描述", 
  "solution": "解决方案",
  "trust": "信任建立",
  "cta": "行动号召",
  "tone": "语气风格",
  "visualHints": "画面提示"
}`,
        variables: JSON.stringify(['productName', 'category', 'sellingPoints', 'targetAudience', 'duration', 'painPoints', 'usageScenarios']),
        description: '通用营销脚本模板',
        isDefault: true,
        createdBy: 'system'
      },
      {
        name: '脚本生成-短视频平台',
        businessModule: 'video-script',
        content: `生成短视频平台（TikTok/抖音/快手）{{duration}}秒脚本：

【产品信息】
产品：{{productName}}
核心卖点：{{sellingPoints}}
目标受众：{{targetAudience}}
用户痛点：{{painPoints}}
使用场景：{{usageScenarios}}

【短视频脚本要求】
1. 前1秒钩子（必须抓眼球）：
   - 用争议性话题、数据冲击或情感冲突
   - 避免"大家好"等老套开头
   - 直接切入核心价值或痛点

2. 核心内容（8-12秒）：
   - 用具体数据证明产品效果
   - 展示使用前后的强烈对比
   - 突出1个最核心的差异化卖点
   - 语言简洁有力，每句话都有信息量

3. 行动号召（2-3秒）：
   - 创造紧迫感（限时、限量等）
   - 明确的下一步行动
   - 配合视觉冲击

【平台特色要求】
- 每3秒一个转折点，保持观众注意力
- 语言符合Z世代表达习惯
- 节奏紧凑，信息密度高
- 配乐建议：节奏感强的背景音乐
- 字幕节点：关键信息加字幕强调
- 转场特效：快速切换，视觉冲击

输出格式：
{
  "script": "完整脚本内容",
  "hook": "前1秒钩子",
  "mainContent": "核心内容",
  "cta": "行动号召",
  "musicStyle": "配乐风格",
  "subtitlePoints": ["字幕节点1", "字幕节点2"],
  "visualEffects": ["特效提示1", "特效提示2"],
  "shootingAngles": ["拍摄角度1", "拍摄角度2"]
}`,
        variables: JSON.stringify(['productName', 'sellingPoints', 'targetAudience', 'duration', 'painPoints', 'usageScenarios']),
        description: '短视频平台专用',
        isDefault: false,
        createdBy: 'system'
      },
      {
        name: '脚本生成-故事化叙事',
        businessModule: 'video-script',
        content: `生成故事化叙事{{duration}}秒视频脚本：

【产品信息】
产品：{{productName}}
受众：{{targetAudience}}
核心价值：{{coreValue}}
使用场景：{{usageScenarios}}
用户痛点：{{painPoints}}

【故事三幕结构】
第一幕-困境（5-8秒）：
- 描述目标用户面临的真实困境
- 用具体场景和细节增强代入感
- 突出困境带来的痛苦和损失

第二幕-转折（8-12秒）：
- 产品如何被发现或引入
- 产品如何开始改变用户生活
- 展示产品与困境的对比

第三幕-解决（5-8秒）：
- 使用产品后的具体改变
- 量化的改善效果
- 情感化的满足感

【叙事特色要求】
- 使用第一人称或真实用户视角
- 包含具体的时间、地点、人物
- 情感层次丰富，有起伏
- 画面感强，便于拍摄
- 避免说教式表达，用故事说话

输出格式：
{
  "story": "完整故事脚本",
  "act1": "困境描述",
  "act2": "转折过程", 
  "act3": "解决结果",
  "characters": "主要角色",
  "scenes": "关键场景",
  "emotions": "情感变化",
  "visualHints": "画面提示"
}`,
        variables: JSON.stringify(['productName', 'targetAudience', 'duration', 'coreValue', 'usageScenarios', 'painPoints']),
        description: '故事化叙事脚本',
        isDefault: false,
        createdBy: 'system'
      },
      {
        name: '脚本生成-专业演示',
        businessModule: 'video-script',
        content: `生成专业产品演示{{duration}}秒脚本：

【产品信息】
产品：{{productName}}
核心功能：{{features}}
目标受众：{{targetAudience}}
使用场景：{{usageScenarios}}
产品优势：{{sellingPoints}}
技术特点：{{technicalFeatures}}

【专业演示结构】
1. 产品价值定位（3-5秒）：
   - 用数据突出产品核心价值
   - 展示产品外观和质感
   - 建立产品专业形象

2. 功能深度演示（10-15秒）：
   - 逐步展示主要功能点
   - 用具体操作证明功能效果
   - 突出与竞品的差异化优势
   - 展示真实使用场景

3. 效果数据证明（5-8秒）：
   - 使用前后的明显对比
   - 用数据量化改善效果
   - 展示用户真实反馈

4. 专业购买引导（3-5秒）：
   - 明确的产品价值总结
   - 创造购买紧迫感
   - 清晰的行动指引

【专业要求】
- 语言专业但易懂，符合目标受众
- 每个功能点都要有实际效果证明
- 突出产品独特性和专业性
- 镜头语言：专业、稳定、有说服力
- 多角度特写，突出产品质感

输出格式：
{
  "script": "完整演示脚本",
  "overview": "产品全貌展示",
  "demoSteps": ["功能演示步骤1", "功能演示步骤2"],
  "comparison": "效果对比描述",
  "purchaseGuide": "购买引导",
  "shootingAngles": ["拍摄角度1", "拍摄角度2"],
  "keyFeatures": ["核心功能1", "核心功能2"],
  "dataPoints": ["数据证明1", "数据证明2"],
  "technicalHighlights": ["技术亮点1", "技术亮点2"]
}`,
        variables: JSON.stringify(['productName', 'features', 'targetAudience', 'duration', 'usageScenarios', 'sellingPoints', 'technicalFeatures']),
        description: '专业产品演示脚本',
        isDefault: false,
        createdBy: 'system'
      },
      {
        name: '脚本质量评估',
        businessModule: 'video-script',
        content: `评估以下视频脚本的质量并给出改进建议：

脚本内容：{{scriptContent}}
产品信息：{{productInfo}}
目标受众：{{targetAudience}}

【评估维度】
1. 内容质量（25分）：
   - 是否避免空洞词汇
   - 是否有具体数据和事实
   - 是否突出产品差异化

2. 结构逻辑（25分）：
   - 开场是否吸引人
   - 逻辑是否清晰
   - 节奏是否紧凑

3. 情感共鸣（25分）：
   - 是否击中用户痛点
   - 是否有情感化表达
   - 是否有画面感

4. 转化效果（25分）：
   - 行动号召是否明确
   - 是否创造紧迫感
   - 是否符合受众习惯

【输出格式】
{
  "overallScore": 85,
  "scores": {
    "content": 20,
    "structure": 22,
    "emotion": 23,
    "conversion": 20
  },
  "strengths": ["具体优势点"],
  "weaknesses": ["需要改进的地方"],
  "suggestions": ["具体改进建议"],
  "improvedScript": "优化后的脚本内容"
}`,
        variables: JSON.stringify(['scriptContent', 'productInfo', 'targetAudience']),
        description: '脚本质量评估和优化',
        isDefault: false,
        createdBy: 'system'
      },

      // ========== 竞品对比分析 (5个) ==========
      {
        name: '竞品对比-全面矩阵',
        businessModule: 'competitor-analysis',
        content: `对比分析以下竞品，生成竞品矩阵：

竞品列表：{{competitorList}}
对比维度：{{comparisonDimensions}}
我的产品：{{myProduct}}

分析维度：
1. 价格定位对比
2. 功能特性对比
3. 目标受众对比
4. 营销策略对比
5. 差异化机会点

JSON：{
  "comparisonMatrix": [
    {
      "competitor": "...",
      "price": "...",
      "features": [...],
      "audience": "...",
      "marketing": "...",
      "strengths": [...],
      "weaknesses": [...]
    }
  ],
  "opportunities": [...],
  "recommendations": [...]
}`,
        variables: JSON.stringify(['competitorList', 'comparisonDimensions', 'myProduct']),
        description: '全面竞品对比矩阵',
        isDefault: true,
        createdBy: 'system'
      },
      {
        name: '竞品对比-差异化分析',
        businessModule: 'competitor-analysis',
        content: `识别差异化机会：

我的产品：{{myProduct}}
竞品概况：{{competitorSummary}}
目标市场：{{targetMarket}}

重点分析：
- 市场空白点
- 未被满足的需求
- 可突破的维度
- 差异化策略建议

JSON：{"gaps": [...], "unmetNeeds": [...], "opportunities": [...], "strategy": "..."}`,
        variables: JSON.stringify(['myProduct', 'competitorSummary', 'targetMarket']),
        description: '差异化机会识别',
        isDefault: false,
        createdBy: 'system'
      },
      {
        name: '竞品对比-定价策略',
        businessModule: 'competitor-analysis',
        content: `竞品定价策略分析：

竞品定价：{{competitorPricing}}
我的成本：{{myCost}}
目标利润：{{targetProfit}}

分析内容：
1. 价格区间分析
2. 价值感知对比
3. 促销策略总结
4. 定价建议

JSON：{"priceRange": {...}, "valuePerception": [...], "pricingStrategy": "...", "recommendation": "..."}`,
        variables: JSON.stringify(['competitorPricing', 'myCost', 'targetProfit']),
        description: '定价策略分析',
        isDefault: false,
        createdBy: 'system'
      },
      {
        name: '竞品对比-营销策略',
        businessModule: 'competitor-analysis',
        content: `竞品营销策略对比：

竞品列表：{{competitorList}}
营销渠道：{{marketingChannels}}

对比维度：
- 内容策略
- 渠道组合
- 投放节奏
- 创意风格
- 转化路径

JSON：{"contentStrategy": {...}, "channelMix": [...], "creativeStyle": [...], "insights": [...]}`,
        variables: JSON.stringify(['competitorList', 'marketingChannels']),
        description: '营销策略对比',
        isDefault: false,
        createdBy: 'system'
      },
      {
        name: '竞品对比-用户评价',
        businessModule: 'competitor-analysis',
        content: `基于用户评价的竞品对比：

竞品评价数据：{{reviewData}}
评价来源：{{reviewSources}}

分析维度：
- 用户满意点
- 常见抱怨
- 期待改进
- 转向因素

JSON：{"satisfaction": [...], "complaints": [...], "expectations": [...], "switchingFactors": [...]}`,
        variables: JSON.stringify(['reviewData', 'reviewSources']),
        description: '基于用户评价分析',
        isDefault: false,
        createdBy: 'system'
      },

      // ========== 人设画像生成 (5个) ==========
      {
        name: '人设生成-标准模板',
        businessModule: 'persona.generate',
        content: `为产品生成详细的用户画像：

产品信息：{{productInfo}}
目标市场：{{targetMarket}}
用户痛点：{{painPoints}}

生成完整Persona，包含：
1. Demographics（人口统计）
   - 年龄、性别、职业、收入、教育、地域
2. Psychographics（心理特征）
   - 价值观、生活方式、兴趣爱好、性格特点
3. Goals & Motivations（目标与动机）
   - 主要目标、购买动机、成功标准
4. Pain Points & Challenges（痛点与挑战）
   - 主要痛点、日常挑战、挫折来源
5. Behaviors（行为习惯）
   - 购买习惯、决策方式、信息获取渠道
6. Media Habits（媒体习惯）
   - 常用平台、内容偏好、活跃时段

JSON：{
  "personaName": "...",
  "demographics": {...},
  "psychographics": {...},
  "goals": [...],
  "painPoints": [...],
  "behaviors": {...},
  "mediaHabits": {...}
}`,
        variables: JSON.stringify(['productInfo', 'targetMarket', 'painPoints']),
        description: '标准Persona生成',
        isDefault: true,
        createdBy: 'system'
      },
      {
        name: '人设生成-多角色',
        businessModule: 'persona.generate',
        content: `生成2-3个主要用户角色：

产品：{{productInfo}}
目标市场：{{targetMarket}}

生成多个Persona，每个包含：
- 简要描述（一句话）
- 核心特征
- 主要痛点
- 购买动机
- 差异点

JSON：{
  "personas": [
    {"name": "...", "description": "...", "profile": {...}},
    ...
  ]
}`,
        variables: JSON.stringify(['productInfo', 'targetMarket']),
        description: '多角色Persona生成',
        isDefault: false,
        createdBy: 'system'
      },
      {
        name: '人设生成-场景驱动',
        businessModule: 'persona.generate',
        content: `基于使用场景生成Persona：

产品：{{productInfo}}
使用场景：{{usageScenarios}}
场景痛点：{{scenarioPainPoints}}

针对每个场景生成：
- 典型用户画像
- 场景触发因素
- 期望结果
- 决策障碍

JSON：{
  "scenarioPersonas": [
    {
      "scenario": "...",
      "persona": {...},
      "triggers": [...],
      "expectedOutcomes": [...],
      "barriers": [...]
    }
  ]
}`,
        variables: JSON.stringify(['productInfo', 'usageScenarios', 'scenarioPainPoints']),
        description: '基于场景的Persona',
        isDefault: false,
        createdBy: 'system'
      },
      {
        name: '人设生成-竞品用户迁移',
        businessModule: 'persona.generate',
        content: `分析竞品用户并生成迁移Persona：

我的产品：{{myProduct}}
竞品信息：{{competitorInfo}}
竞品用户画像：{{competitorUsers}}

生成内容：
- 可迁移用户画像
- 迁移动机
- 吸引策略
- 转化障碍

JSON：{
  "migrationPersona": {...},
  "motivations": [...],
  "attractionStrategy": [...],
  "barriers": [...]
}`,
        variables: JSON.stringify(['myProduct', 'competitorInfo', 'competitorUsers']),
        description: '竞品用户迁移分析',
        isDefault: false,
        createdBy: 'system'
      },
      {
        name: '人设生成-数据驱动',
        businessModule: 'persona.generate',
        content: `基于数据生成精准Persona：

用户数据：{{userData}}
行为数据：{{behaviorData}}
反馈数据：{{feedbackData}}

数据驱动分析：
- 用户细分
- 行为模式
- 偏好洞察
- 价值主张匹配

JSON：{
  "segments": [...],
  "behaviorPatterns": {...},
  "preferences": {...},
  "valuePropositions": [...]
}`,
        variables: JSON.stringify(['userData', 'behaviorData', 'feedbackData']),
        description: '数据驱动Persona',
        isDefault: false,
        createdBy: 'system'
      },

      // ========== 视频生成 Prompt 生成 (5个) ==========
      {
        name: '视频Prompt生成-标准模板',
        businessModule: 'video-generation',
        content: `根据以下信息生成视频生成 AI 的 Prompt：

**商品信息：**
- 商品名称：{{productName}}
- 商品类目：{{category}}
- 商品卖点：{{sellingPoints}}
- 目标受众：{{targetAudience}}

**脚本信息：**
{{scriptContent}}

**人设信息：**
{{personaInfo}}

**选用模板/风格：**
{{templateName}}

**要求：**
1. 生成一个完整的视频生成 Prompt，适用于 Sora、Runway、Pika 等视频生成 AI
2. Prompt 应包含：场景描述、视觉风格、镜头运动、氛围、色调等
3. 突出商品的核心卖点和目标受众的喜好
4. 保持 Prompt 简洁且有画面感（80-200字）

请直接输出 Prompt 文本，不需要 JSON 格式。`,
        variables: JSON.stringify(['productName', 'category', 'sellingPoints', 'targetAudience', 'scriptContent', 'personaInfo', 'templateName']),
        description: '标准视频Prompt生成',
        isDefault: true,
        createdBy: 'system'
      },
      {
        name: '视频Prompt生成-视觉强化版',
        businessModule: 'video-generation',
        content: `根据商品和脚本生成强调视觉效果的视频 Prompt：

商品：{{productName}}
卖点：{{sellingPoints}}
脚本：{{scriptContent}}
模板风格：{{templateName}}

**视觉强化要求：**
- 强调光影效果、色彩搭配
- 突出产品的质感和细节
- 营造高端的视觉氛围
- 使用电影级的镜头语言

输出：直接生成可用于视频 AI 的 Prompt（100-250字）`,
        variables: JSON.stringify(['productName', 'sellingPoints', 'scriptContent', 'templateName']),
        description: '视觉强化版Prompt',
        isDefault: false,
        createdBy: 'system'
      },
      {
        name: '视频Prompt生成-简洁版',
        businessModule: 'video-generation',
        content: `生成简洁高效的视频 Prompt：

商品：{{productName}}
核心卖点：{{sellingPoints}}
目标风格：{{templateName}}

要求：
- Prompt 控制在 50-100字
- 只包含最核心的视觉元素
- 适用于快速生成测试

直接输出 Prompt：`,
        variables: JSON.stringify(['productName', 'sellingPoints', 'templateName']),
        description: '简洁快速版',
        isDefault: false,
        createdBy: 'system'
      },
      {
        name: '视频Prompt生成-场景化',
        businessModule: 'video-generation',
        content: `基于使用场景生成视频 Prompt：

商品：{{productName}}
使用场景：{{usageScenarios}}
目标受众：{{targetAudience}}
脚本：{{scriptContent}}

**场景化要求：**
- 构建真实的使用场景
- 展现用户与产品的互动
- 营造代入感和共鸣
- 突出场景中的痛点和解决方案

输出场景化的视频 Prompt（120-250字）：`,
        variables: JSON.stringify(['productName', 'usageScenarios', 'targetAudience', 'scriptContent']),
        description: '场景化Prompt',
        isDefault: false,
        createdBy: 'system'
      },
      {
        name: '视频Prompt生成-多模型适配',
        businessModule: 'video-generation',
        content: `生成适配多种视频生成 AI 的 Prompt：

商品：{{productName}}
卖点：{{sellingPoints}}
脚本：{{scriptContent}}
目标模型：{{targetModel}} (Sora/Runway/Pika/其他)

**适配策略：**
- Sora: 强调镜头运动和场景转换
- Runway: 注重风格控制和特效描述
- Pika: 简洁直接，突出主体动作

根据目标模型生成最优 Prompt（80-200字）：`,
        variables: JSON.stringify(['productName', 'sellingPoints', 'scriptContent', 'targetModel']),
        description: '多模型适配版',
        isDefault: false,
        createdBy: 'system'
      },

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

    const createdCount = results.filter(r => r.status === 'created').length;
    const modules = {
      'product-analysis': 5,
      'competitor-analysis': 5,
      'persona.generate': 5,
      'video-script': 5,
      'video-generation': 5
    };
    
    return NextResponse.json({
      success: true,
      data: results,
      message: `成功初始化 ${createdCount} 个默认模板（共${defaultPrompts.length}个模板，覆盖5个业务模块）`,
      modules
    });
  } catch (error: any) {
    console.error('初始化默认Prompt模板失败:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
