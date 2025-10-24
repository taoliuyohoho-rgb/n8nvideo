# 账号体系和产品痛点分析功能

## 🎯 功能概述

本次更新为系统添加了两个重要功能：

1. **账号体系** - 管理员可以添加和管理用户
2. **产品痛点分析** - 从虾皮、TikTok等平台爬取评论并进行AI分析

## 👥 账号体系功能

### 用户角色
- **管理员 (admin)** - 完全权限
- **经理 (manager)** - 管理权限
- **操作员 (operator)** - 操作权限
- **查看者 (viewer)** - 只读权限

### 功能特性
- ✅ 管理员在后台添加用户
- ✅ 用户角色管理
- ✅ 用户状态控制（启用/禁用）
- ✅ 密码加密存储
- ✅ 用户视频数量统计

### API接口
```
GET /api/admin/users - 获取用户列表
POST /api/admin/users - 创建用户
GET /api/admin/users/[id] - 获取用户详情
PUT /api/admin/users/[id] - 更新用户
DELETE /api/admin/users/[id] - 删除用户
```

## 🔍 产品痛点分析功能

### 核心特性
- ✅ 多平台评论爬取（Shopee、TikTok、Amazon、Facebook）
- ✅ AI智能痛点分析
- ✅ 情感分析（正面/负面/中性）
- ✅ 严重程度评估（高/中/低）
- ✅ 关键词提取
- ✅ 频次统计

### 数据流程
1. **选择产品** → 2. **配置爬取参数** → 3. **启动爬取任务** → 4. **AI分析评论** → 5. **生成痛点报告**

### 支持的平台
- 🛒 **Shopee** - 东南亚电商平台
- 📱 **TikTok** - 短视频社交平台
- 🛍️ **Amazon** - 全球电商平台
- 📘 **Facebook** - 社交媒体平台

### API接口
```
GET /api/admin/pain-points - 获取痛点分析列表
POST /api/admin/pain-points - 创建痛点分析
POST /api/admin/scraping - 创建爬取任务
POST /api/admin/ai-analyze - AI分析痛点
```

## 🗄️ 数据库结构

### 新增数据表

#### 用户表 (User)
```sql
- id: 用户ID
- email: 邮箱（唯一）
- name: 姓名
- password: 密码哈希
- role: 角色
- isActive: 是否激活
```

#### 产品痛点表 (ProductPainPoint)
```sql
- id: 痛点ID
- productId: 产品ID
- platform: 平台
- painPoints: 痛点列表（JSON）
- severity: 严重程度
- frequency: 频次
- sentiment: 情感分析
- aiAnalysis: AI分析结果（JSON）
```

#### 产品评论表 (ProductComment)
```sql
- id: 评论ID
- painPointId: 痛点ID
- platform: 平台
- content: 评论内容
- rating: 评分
- author: 作者
- sentiment: 情感分析
```

#### 爬取任务表 (CommentScrapingTask)
```sql
- id: 任务ID
- productId: 产品ID
- platform: 目标平台
- status: 任务状态
- progress: 进度
- maxComments: 最大评论数
```

## 🚀 使用方法

### 1. 用户管理
1. 进入管理员控制台 `/admin`
2. 点击"用户管理"标签
3. 点击"添加用户"按钮
4. 填写用户信息并选择角色
5. 保存用户

### 2. 痛点分析
1. 进入"痛点分析"标签
2. 点击"开始爬取"按钮
3. 选择产品和目标平台
4. 配置爬取参数
5. 启动爬取任务
6. 等待AI分析完成
7. 查看分析结果

### 3. 手动添加痛点
1. 点击"手动添加"按钮
2. 选择产品和平台
3. 输入痛点信息
4. 设置严重程度和情感
5. 保存数据

## 🔧 技术实现

### 前端组件
- 用户管理界面
- 痛点分析界面
- 爬取配置模态框
- 用户表单组件

### 后端服务
- 用户管理API
- 痛点分析API
- 爬取服务
- AI分析服务

### 数据库
- Prisma ORM
- SQLite数据库
- 数据关系映射

## 📊 分析结果示例

### 痛点分析报告
```json
{
  "painPoints": [
    "音质不够清晰",
    "电池续航短",
    "连接不稳定"
  ],
  "severity": "high",
  "sentiment": "negative",
  "frequency": 15,
  "keywords": ["音质", "电池", "连接", "续航"],
  "aiAnalysis": {
    "summary": "用户最关心的是产品质量",
    "insights": [
      "用户最关心的是产品质量",
      "价格敏感度较高",
      "对售后服务有较高期望"
    ],
    "recommendations": [
      "提升产品质量控制",
      "优化价格策略",
      "加强售后服务"
    ]
  }
}
```

## 🔮 未来扩展

### 计划功能
- [ ] 更多平台支持（Instagram、YouTube等）
- [ ] 实时爬取监控
- [ ] 自动报告生成
- [ ] 竞品对比分析
- [ ] 趋势预测

### 技术优化
- [ ] 分布式爬取
- [ ] 缓存机制
- [ ] 性能监控
- [ ] 错误重试
- [ ] 数据清洗

## 🛡️ 安全考虑

- 密码加密存储
- 用户权限控制
- API访问限制
- 数据隐私保护
- 爬取频率控制

## 📝 注意事项

1. **爬取合规性** - 请确保遵守各平台的使用条款
2. **数据隐私** - 保护用户评论数据的隐私
3. **频率控制** - 避免过于频繁的爬取请求
4. **错误处理** - 妥善处理爬取失败的情况
5. **存储管理** - 定期清理过期的爬取数据

## 🎉 总结

通过这次更新，系统现在具备了完整的账号管理功能和强大的产品痛点分析能力。管理员可以轻松管理用户，同时通过AI分析深入了解产品在各大平台的表现，为产品优化和营销策略提供数据支持。
