# 视频生成流程实现文档

## 概述

本文档描述了基于PRD实现的完整视频生成流程，包括9步向导式流程、API接口、数据模型和前端集成。

## 功能特性

### ✅ 已实现功能

1. **商品库补全与Top5提取**
   - 自动从商品库匹配商品信息
   - 规则引擎提取Top5卖点和痛点
   - 支持模糊匹配和精确匹配

2. **人设生成系统**
   - 5种不同风格的人设生成模板
   - 集成推荐引擎选择最优模型和Prompt
   - 结构化人设数据验证和存储

3. **脚本生成系统**
   - 5种不同风格的脚本生成模板
   - 基于人设和商品信息生成15秒UGC脚本
   - 包含镜头分解和技术细节

4. **视频任务管理**
   - 异步视频生成任务创建
   - 任务状态轮询和进度跟踪
   - 支持多种视频提供商

5. **前端集成**
   - 9步向导式UI界面
   - 实时状态更新和进度显示
   - 错误处理和用户反馈

## API接口

### 1. 商品初始化
```http
POST /api/video-gen/init
Content-Type: application/json

{
  "productName": "iPhone 15 Pro"
}
```

**响应:**
```json
{
  "success": true,
  "product": {
    "id": "prod_123",
    "name": "iPhone 15 Pro",
    "sellingPointsTop5": ["高性能", "长续航", "专业摄影"],
    "painPointsTop5": ["价格高", "重量重", "维修贵"]
  },
  "top5": {
    "sellingPoints": ["高性能", "长续航", "专业摄影"],
    "painPoints": ["价格高", "重量重", "维修贵"],
    "reasons": ["基于商品库数据", "用户反馈分析"]
  }
}
```

### 2. 人设生成
```http
POST /api/persona/generate
Content-Type: application/json

{
  "productId": "prod_123"
}
```

**响应:**
```json
{
  "success": true,
  "persona": {
    "coreIdentity": {
      "name": "Alex",
      "age": 28,
      "gender": "non-binary",
      "location": "Urban area",
      "occupation": "Professional"
    },
    "look": {
      "generalAppearance": "Clean and approachable",
      "hair": "Well-groomed",
      "clothingAesthetic": "Casual professional",
      "signatureDetails": "Friendly smile"
    },
    "vibe": {
      "traits": ["friendly", "authentic", "reliable"],
      "demeanor": "Warm and approachable",
      "communicationStyle": "Clear and conversational"
    },
    "context": {
      "hobbies": "Various interests",
      "values": "Quality and authenticity",
      "frustrations": "Common daily challenges",
      "homeEnvironment": "Comfortable living space"
    },
    "why": "Experienced user with genuine insights"
  },
  "modelUsed": {
    "provider": "gemini",
    "model": "gemini-2.5-pro",
    "promptTemplate": "人设生成-北美日常风"
  }
}
```

### 3. 人设确认
```http
POST /api/persona/confirm
Content-Type: application/json

{
  "productId": "prod_123",
  "persona": { /* 人设数据 */ }
}
```

### 4. 脚本生成
```http
POST /api/script/generate
Content-Type: application/json

{
  "productId": "prod_123",
  "personaId": "persona_456",
  "variants": 1
}
```

### 5. 脚本确认
```http
POST /api/script/confirm
Content-Type: application/json

{
  "productId": "prod_123",
  "personaId": "persona_456",
  "scripts": [{ /* 脚本数据 */ }]
}
```

### 6. 视频任务创建
```http
POST /api/video/jobs
Content-Type: application/json

{
  "scriptId": "script_789",
  "providerPref": ["OpenAI", "Pika"],
  "seconds": 15,
  "size": "720x1280"
}
```

### 7. 任务状态查询
```http
GET /api/video/jobs/{jobId}
```

### 8. 视频结果下载
```http
GET /api/video/jobs/{jobId}/result
```

## 数据模型

### Persona (人设)
```sql
CREATE TABLE personas (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  version INTEGER DEFAULT 1,
  core_identity JSON NOT NULL,  -- { name, age, gender, location, occupation }
  look JSON NOT NULL,           -- { generalAppearance, hair, clothingAesthetic, signatureDetails }
  vibe JSON NOT NULL,           -- { traits, demeanor, communicationStyle }
  context JSON NOT NULL,        -- { hobbies, values, frustrations, homeEnvironment }
  why TEXT NOT NULL,            -- 可信度理由
  created_by TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  model_used JSON              -- { provider, model }
);
```

### Script (脚本)
```sql
CREATE TABLE scripts (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  persona_id TEXT NOT NULL,
  version INTEGER DEFAULT 1,
  angle TEXT NOT NULL,          -- 脚本角度
  energy TEXT NOT NULL,         -- 能量描述
  duration_sec INTEGER DEFAULT 15,
  lines JSON NOT NULL,          -- { open, main, close }
  shots JSON NOT NULL,          -- [second, camera, action, visibility, audio]
  technical JSON NOT NULL,      -- { orientation, filmingMethod, dominantHand, location, audioEnv }
  model_used JSON,              -- { provider, model }
  evidence_ids TEXT[] DEFAULT '{}',
  created_by TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### VideoJob (视频任务)
```sql
CREATE TABLE video_jobs (
  id TEXT PRIMARY KEY,
  idempotency_key TEXT UNIQUE,
  product_id TEXT NOT NULL,
  persona_id TEXT NOT NULL,
  script_id TEXT NOT NULL,
  provider TEXT NOT NULL,       -- OpenAI|Pika|Luma|Runway|Custom
  model TEXT,
  status TEXT DEFAULT 'queued', -- queued|running|succeeded|failed|cancelled
  progress INTEGER DEFAULT 0,
  error_code TEXT,
  error_message TEXT,
  params JSON,                  -- { seconds, size, inputReferenceRef, extras }
  result JSON,                  -- { fileUrl, thumbnailUrl, providerRaw }
  cost JSON,                    -- { promptTokens, outputTokens, credits }
  created_by TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## 使用指南

### 1. 初始化模板
```bash
# 初始化人设生成模板
node scripts/init-video-generation-templates.js

# 或者分别初始化
curl -X POST http://localhost:3000/api/admin/prompts/init-persona-templates
curl -X POST http://localhost:3000/api/admin/prompts/init-script-templates
```

### 2. 测试完整流程
```bash
# 运行端到端测试
node scripts/test-video-generation-flow.js
```

### 3. 前端使用
访问 `http://localhost:3000/video-generation` 使用9步向导界面。

## 配置说明

### 环境变量
```bash
# 数据库连接
DATABASE_URL="postgresql://..."

# AI服务配置
GEMINI_API_KEY="your-gemini-key"
OPENAI_API_KEY="your-openai-key"

# 推荐引擎配置
RECOMMENDATION_ENGINE_URL="http://localhost:3000"
```

### AI模型配置
系统会自动选择最适合的AI模型和Prompt模板：
- **人设生成**: 优先使用Gemini，支持5种风格模板
- **脚本生成**: 优先使用Gemini，支持5种风格模板
- **视频生成**: 支持OpenAI、Pika、Luma、Runway等

## 监控和日志

### 结构化日志
所有API调用都会记录结构化日志，包含：
- `traceId`: 请求追踪ID
- `userId`: 用户ID
- `productId`: 商品ID
- `personaId`: 人设ID
- `scriptId`: 脚本ID
- `jobId`: 任务ID
- `latencyMs`: 响应时间
- `cost`: 成本信息

### 性能指标
- 人设生成成功率: ≥99%
- 脚本生成成功率: ≥99%
- 端到端流程完成时间: ≤3分钟
- 视频任务排队时间: ≤30秒

## 故障排除

### 常见问题

1. **人设生成失败**
   - 检查AI API密钥配置
   - 确认推荐引擎服务运行正常
   - 查看日志中的具体错误信息

2. **脚本生成失败**
   - 确认人设数据完整
   - 检查Prompt模板是否存在
   - 验证商品信息是否完整

3. **视频任务失败**
   - 检查视频提供商API配置
   - 确认脚本数据格式正确
   - 查看任务日志和错误信息

### 调试模式
```bash
# 启用详细日志
DEBUG=* npm run dev

# 查看特定模块日志
DEBUG=video-generation:* npm run dev
```

## 扩展开发

### 添加新的视频提供商
1. 在 `src/services/ai/video/providers/` 下创建新的Provider类
2. 实现 `VideoGenerationProvider` 接口
3. 在 `video-worker.ts` 中注册新Provider

### 添加新的人设风格
1. 在 `app/api/admin/prompts/init-persona-templates/route.ts` 中添加新模板
2. 确保模板包含所有必需变量
3. 重新运行模板初始化脚本

### 添加新的脚本风格
1. 在 `app/api/admin/prompts/init-script-templates/route.ts` 中添加新模板
2. 确保输出格式符合Schema要求
3. 重新运行模板初始化脚本

## 总结

视频生成流程已完全按照PRD实现，包括：
- ✅ 9步向导式流程
- ✅ 商品库补全和Top5提取
- ✅ 人设和脚本生成系统
- ✅ 视频任务管理
- ✅ 前端集成和用户体验
- ✅ 完整的API接口
- ✅ 数据模型和存储
- ✅ 错误处理和监控

系统现在可以支持从商品输入到视频生成的完整流程，为电商UGC视频制作提供了强大的AI驱动解决方案。
