# 🎬 AI视频生成工具使用指南

## 概述

这是一个专为跨境电商设计的AI视频生成工具，能够根据商品信息自动生成适合Sora的prompt，帮助商家快速创建高质量的产品推广视频。

## 🚀 快速开始

### 1. 环境准备

```bash
# 安装依赖
npm install

# 配置环境变量
cp env.example .env.local
# 编辑 .env.local 文件，填入必要的配置
```

### 2. 数据库初始化

```bash
# 生成Prisma客户端
npx prisma generate

# 运行数据库迁移
npx prisma db push

# 初始化示例数据
node scripts/init-db.js
```

### 3. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000 开始使用！

## 📋 核心功能

### 1. 商品信息输入
- **商品名称** (必填): 从商品库选择或手动输入
- **商品图片** (可选): 上传商品图片
- **卖点描述**: 详细描述商品卖点
- **营销信息**: 促销活动、优惠信息等

### 2. 目标市场设置
- **目标国家**: 选择推广目标国家
- **目标人群**: AI自动生成，可手动调整
- **竞品链接**: 提供竞品链接进行对比分析
- **参考视频**: 上传参考视频进行风格分析

### 3. AI风格匹配
- **粗排阶段**: 基于类目、国家、历史数据快速筛选
- **精排阶段**: 使用脚本结构、语调等维度精确匹配
- **匹配分数**: 显示AI匹配的置信度

### 4. Sora Prompt生成
- **智能生成**: 基于匹配的风格和商品信息生成专业prompt
- **AI配置**: 显示使用的AI服务配置
- **一键复制**: 方便复制到Sora使用

## 🛠️ 管理功能

### 1. 数据同步
- **Google Sheets集成**: 从Google Sheets同步模板数据
- **去重检测**: 自动检测相似模板，避免重复
- **批量处理**: 支持批量同步和更新

### 2. 数据分析
- **多维度看板**: 支持Overview -> Product -> Platform -> Template/Shop的钻取分析
- **广告表现**: 展示GMV、花费、播放、CTR、订单等关键指标
- **用户画像**: 分析目标受众特征

### 3. AI配置管理
- **全局配置**: 设置默认的AI服务
- **模板级配置**: 为特定模板配置专用AI服务
- **A/B测试**: 支持不同AI组合的效果对比

## 🔧 技术架构

### 数据库设计
```
Product -> Template -> Video -> AdData
```

- **Product**: 商品信息
- **Template**: 视频模板
- **Video**: 生成的视频记录
- **AdData**: 广告表现数据

### API接口

#### 风格匹配
```http
POST /api/ai/match-style
Content-Type: application/json

{
  "productName": "无线蓝牙耳机",
  "category": "电子产品",
  "targetCountry": "US",
  "sellingPoints": "降噪技术, 长续航",
  "targetAudience": "年轻专业人士"
}
```

#### Prompt生成
```http
POST /api/ai/generate-prompt
Content-Type: application/json

{
  "productName": "无线蓝牙耳机",
  "sellingPoints": "降噪技术, 长续航",
  "marketingInfo": "限时优惠",
  "targetCountry": "US",
  "targetAudience": "年轻专业人士",
  "selectedStyleId": "template_id"
}
```

## 📊 使用流程

### 1. 用户操作流程
```
商品信息输入 → 目标市场设置 → AI风格匹配 → Sora Prompt生成 → 复制使用
```

### 2. 管理员操作流程
```
Google Sheets数据同步 → 模板去重处理 → AI配置管理 → 数据分析查看
```

## 🧪 测试

### 运行测试脚本
```bash
# 测试完整的视频生成流程
node scripts/test-video-generation.js
```

### 测试内容
- ✅ AI风格匹配功能
- ✅ Sora prompt生成
- ✅ 数据库存储
- ✅ API接口响应

## 🔮 未来扩展

### 计划功能
- **视频生成API**: 直接调用Sora API生成视频
- **批量处理**: 支持批量生成多个视频
- **A/B测试**: 不同prompt的效果对比
- **性能优化**: 基于历史数据优化匹配算法

### 架构扩展
- **微服务架构**: 支持独立部署和扩展
- **插件系统**: 支持新的AI服务和数据源
- **事件驱动**: 支持异步处理和实时更新

## 🐛 故障排除

### 常见问题

1. **数据库连接失败**
   ```bash
   # 检查数据库配置
   npx prisma db push
   ```

2. **Google Sheets同步失败**
   ```bash
   # 检查环境变量配置
   echo $GOOGLE_APPLICATION_CREDENTIALS
   ```

3. **AI服务调用失败**
   ```bash
   # 检查API密钥配置
   echo $GEMINI_API_KEY
   ```

## 📞 支持

如有问题，请检查：
1. 环境变量配置是否正确
2. 数据库连接是否正常
3. Google Sheets API是否已启用
4. AI服务API密钥是否有效

---

🎉 现在你可以开始使用AI视频生成工具了！祝你的跨境电商业务蒸蒸日上！
