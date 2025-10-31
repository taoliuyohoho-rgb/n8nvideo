# 人设生成功能 PRD

## 📋 功能概述

人设生成功能允许用户基于类目、商品或文字描述，通过AI推荐合适的模型和prompt，自动生成目标用户人设，并保存到数据库中供后续使用。

## 🎯 核心价值

- **提升效率**：自动化人设生成，减少手动创建时间
- **AI驱动**：基于类目和商品特征智能推荐模型和prompt
- **灵活输入**：支持类目选择、商品选择、文字描述多种输入方式
- **数据积累**：生成的人设保存到库中，形成可复用的资源

## 👥 目标用户

- **运营人员**：需要快速生成目标用户人设进行营销策划
- **内容创作者**：需要了解目标受众特征制作精准内容
- **产品经理**：需要分析用户画像指导产品决策

## 🔧 功能需求

### 1. 输入方式

#### 1.1 类目选择（必选）
- 从现有商品类目中选择
- 支持多级类目结构
- 类目信息包含：名称、描述、目标市场特征

#### 1.2 商品选择（可选）
- 从商品库中选择具体商品
- 基于商品信息自动提取相关特征
- 商品信息包含：名称、描述、卖点、目标受众

#### 1.3 文字描述（可选）
- 用户输入自定义文字描述
- 支持多语言输入
- 描述内容：目标用户特征、行为习惯、偏好等

### 2. AI推荐系统

#### 2.1 模型推荐
- 基于类目特征推荐最适合的AI模型
- 考虑模型在特定类目的历史表现
- 支持多模型对比和选择

#### 2.2 Prompt推荐
- 根据输入信息推荐最佳prompt模板
- 自动填充prompt中的变量
- 支持prompt的个性化调整

### 3. 人设生成

#### 3.1 生成内容
- **基础信息**：年龄、性别、职业、收入水平
- **行为特征**：购买习惯、使用场景、决策因素
- **偏好特征**：品牌偏好、价格敏感度、功能需求
- **心理特征**：价值观、生活方式、痛点需求

#### 3.2 输出格式
- 结构化JSON数据
- 可读性强的文本描述
- 可视化图表展示

### 4. 数据管理

#### 4.1 人设存储
- 保存到数据库persona表
- 关联类目、商品、生成参数
- 支持版本管理和历史记录

#### 4.2 人设库管理
- 人设列表查看和搜索
- 人设编辑和更新
- 人设删除和归档

## 🗄️ 数据库设计

### Persona表
```sql
CREATE TABLE personas (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,                    -- 人设名称
  description TEXT,                      -- 人设描述
  category_id TEXT NOT NULL,            -- 关联类目ID
  product_id TEXT,                       -- 关联商品ID（可选）
  text_description TEXT,                 -- 用户输入的文字描述（可选）
  generated_content JSONB NOT NULL,     -- 生成的人设内容
  ai_model TEXT NOT NULL,               -- 使用的AI模型
  prompt_template TEXT NOT NULL,        -- 使用的prompt模板
  generation_params JSONB,              -- 生成参数
  created_by TEXT NOT NULL,             -- 创建者
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);
```

### 关联关系
- Persona → Category (多对一)
- Persona → Product (多对一，可选)
- Persona → User (多对一)

## 🔄 用户流程

### 主要流程
1. **选择类目**（必选）
2. **选择商品**（可选）或 **输入文字描述**（可选）
3. **AI推荐**模型和prompt
4. **生成人设**内容
5. **预览确认**生成结果
6. **保存到库**中

### 详细步骤

#### 步骤1：类目选择
- 展示类目列表
- 支持搜索和筛选
- 显示类目描述和特征

#### 步骤2：商品/文字选择
- 商品选择：从商品库中选择，自动提取特征
- 文字描述：输入框，支持多行文本

#### 步骤3：AI推荐
- 显示推荐的AI模型和理由
- 显示推荐的prompt模板
- 允许用户调整推荐结果

#### 步骤4：生成人设
- 调用AI服务生成人设
- 显示生成进度
- 实时预览生成结果

#### 步骤5：确认保存
- 预览完整人设内容
- 编辑人设名称和描述
- 确认保存到库中

## 🎨 界面设计

### 页面布局
```
┌─────────────────────────────────────────┐
│ 人设生成                                │
├─────────────────────────────────────────┤
│ 1. 类目选择（必选）                      │
│    [类目选择器]                         │
├─────────────────────────────────────────┤
│ 2. 商品选择（可选）                      │
│    [商品选择器] 或 [文字描述输入框]       │
├─────────────────────────────────────────┤
│ 3. AI推荐                               │
│    推荐模型：[模型A] 推荐理由：...        │
│    推荐Prompt：[模板B]                  │
├─────────────────────────────────────────┤
│ 4. 生成结果                             │
│    [人设内容预览]                       │
├─────────────────────────────────────────┤
│ 5. 保存设置                             │
│    人设名称：[输入框]                    │
│    [保存到库] [重新生成]                 │
└─────────────────────────────────────────┘
```

## 🔌 API接口设计

### 1. 获取类目列表
```http
GET /api/persona/categories
Response: {
  "success": true,
  "data": [
    {
      "id": "cat_001",
      "name": "电子产品",
      "description": "手机、电脑、耳机等电子设备",
      "targetMarket": "全球市场"
    }
  ]
}
```

### 2. 获取商品列表
```http
GET /api/persona/products?categoryId=cat_001
Response: {
  "success": true,
  "data": [
    {
      "id": "prod_001",
      "name": "无线蓝牙耳机",
      "description": "降噪技术，长续航",
      "sellingPoints": ["降噪", "续航", "音质"]
    }
  ]
}
```

### 3. AI推荐
```http
POST /api/persona/recommend
Body: {
  "categoryId": "cat_001",
  "productId": "prod_001", // 可选
  "textDescription": "年轻专业人士，注重音质和便携性" // 可选
}
Response: {
  "success": true,
  "data": {
    "recommendedModel": {
      "id": "gemini-pro",
      "name": "Gemini Pro",
      "reason": "在电子产品类目表现优异"
    },
    "recommendedPrompt": {
      "id": "prompt_001",
      "content": "基于以下信息生成目标用户人设...",
      "variables": ["category", "product", "description"]
    }
  }
}
```

### 4. 生成人设
```http
POST /api/persona/generate
Body: {
  "categoryId": "cat_001",
  "productId": "prod_001",
  "textDescription": "年轻专业人士",
  "aiModel": "gemini-pro",
  "promptTemplate": "prompt_001"
}
Response: {
  "success": true,
  "data": {
    "persona": {
      "basicInfo": {
        "age": "25-35",
        "gender": "不限",
        "occupation": "白领/专业人士"
      },
      "behavior": {
        "purchaseHabits": "注重性价比，喜欢研究产品参数",
        "usageScenarios": "通勤、运动、办公"
      },
      "preferences": {
        "brandPreference": "注重技术实力和口碑",
        "priceSensitivity": "中等",
        "featureNeeds": ["降噪", "续航", "音质"]
      }
    }
  }
}
```

### 5. 保存人设
```http
POST /api/persona/save
Body: {
  "name": "无线耳机目标用户",
  "description": "基于电子产品类目生成的专业人士人设",
  "categoryId": "cat_001",
  "productId": "prod_001",
  "textDescription": "年轻专业人士",
  "generatedContent": {...},
  "aiModel": "gemini-pro",
  "promptTemplate": "prompt_001"
}
Response: {
  "success": true,
  "data": {
    "personaId": "persona_001",
    "message": "人设保存成功"
  }
}
```

## 🧪 验收标准

### 功能验收
- [ ] 用户可以选择类目（必选）
- [ ] 用户可以选择商品或输入文字描述（可选）
- [ ] AI能正确推荐模型和prompt
- [ ] 能成功生成结构化的人设内容
- [ ] 人设能正确保存到数据库
- [ ] 支持人设的查看、编辑、删除

### 性能验收
- [ ] 类目列表加载时间 < 1秒
- [ ] 商品列表加载时间 < 2秒
- [ ] AI推荐响应时间 < 3秒
- [ ] 人设生成时间 < 10秒
- [ ] 页面整体响应时间 < 5秒

### 用户体验验收
- [ ] 界面清晰直观，操作流程顺畅
- [ ] 错误提示友好，帮助用户解决问题
- [ ] 支持移动端访问
- [ ] 生成结果可读性强，便于理解

## 🚀 开发计划

### Phase 1: 基础功能（1周）
- 数据库设计和迁移
- 基础API接口开发
- 类目和商品选择功能

### Phase 2: AI集成（1周）
- AI推荐系统集成
- 人设生成功能实现
- Prompt模板管理

### Phase 3: 界面开发（1周）
- 前端界面开发
- 用户交互优化
- 响应式设计

### Phase 4: 测试优化（0.5周）
- 功能测试和bug修复
- 性能优化
- 用户体验优化

## 🔮 未来扩展

### 短期扩展
- 人设模板库管理
- 批量人设生成
- 人设效果评估

### 长期扩展
- 人设画像可视化
- 人设A/B测试
- 人设推荐系统
- 多语言支持

## 📊 成功指标

### 业务指标
- 人设生成成功率 > 95%
- 用户满意度 > 4.5/5
- 人设库使用率 > 80%

### 技术指标
- API响应时间 < 3秒
- 系统可用性 > 99.5%
- 错误率 < 1%

---

**文档版本**: v1.0  
**创建时间**: 2024-01-XX  
**最后更新**: 2024-01-XX  
**负责人**: 产品团队
