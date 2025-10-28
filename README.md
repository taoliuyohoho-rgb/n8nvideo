# 跨境电商运营OS

一个专为跨境电商团队设计的内部运营系统，聚焦"提效+提质"。优先落地视频制作（P0），架构可扩展至商品管理、数据监测、营销、订单、进货、客服等模块。

## 📋 核心文档
- **[产品需求文档（PRD）](docs/PRD.md)**：愿景、范围、用例、验收标准、里程碑
- **[工程技术手册](docs/ENGINEERING.md)**：架构、规范、DoD、迭代节奏
- **[P0 切片测试](docs/P0_SLICE_1_TESTING.md)**：当前开发进度与测试用例

## 🚀 功能特性

### 核心功能
- **智能商品选择**: 从商品库中选择商品，避免选择未在售商品
- **AI风格匹配**: 两阶段匹配算法（粗排+精排）为商品匹配合适的视频风格
- **Sora Prompt生成**: 基于匹配的风格生成专业的Sora视频提示词
- **反馈学习**: 收集视频表现数据，持续优化匹配算法

### 管理功能
- **商品库管理**: 管理员维护商品信息、卖点、SKU图片等
- **风格库管理**: 管理视频风格，支持上传视频分析风格特征
- **竞品分析**: 自动解析竞品信息，提取卖点和营销策略
- **数据分析**: 视频表现数据统计和分析

## 🏗️ 技术架构

### 前端技术栈
- **Next.js 14**: React全栈框架
- **TypeScript**: 类型安全
- **Tailwind CSS**: 现代化UI设计
- **Radix UI**: 无障碍组件库
- **Lucide React**: 图标库

### 后端技术栈
- **Prisma**: 数据库ORM
- **SQLite**: 轻量级数据库（开发环境）
- **Next.js API Routes**: 服务端API

### 数据库设计
- **用户表**: 用户信息管理
- **商品表**: 商品库管理
- **风格表**: 视频风格库
- **视频生成记录表**: 生成历史追踪
- **反馈数据表**: 视频表现数据收集
- **竞品分析表**: 竞品信息存储

## 📦 安装和运行

### 环境要求
- Node.js 18+
- npm 或 yarn
- Google Cloud 账户
- Google Sheets API 访问权限

### 安装依赖
```bash
npm install
```

### Google Cloud 配置
1. 在Google Cloud Console创建服务账户
2. 下载服务账户密钥文件到 `credentials/google-service-account.json`
3. 启用Google Sheets API
4. 将服务账户邮箱添加到你的Google Sheet的共享权限中

### 环境变量配置
```bash
# 复制环境变量模板
cp env.example .env.local

# 编辑环境变量
nano .env.local
```

### 数据库设置
```bash
# 生成Prisma客户端
npm run db:generate

# 推送数据库结构
npm run db:push

# 运行种子数据
npm run db:seed
```

### 启动开发服务器
```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

## 🎯 使用流程

### 用户使用流程
1. **商品信息输入**: 选择商品、上传图片、填写卖点等
2. **目标市场设置**: 选择目标国家、设置目标人群
3. **AI风格匹配**: 系统自动匹配合适的视频风格
4. **生成Sora Prompt**: 基于匹配结果生成专业的视频提示词
5. **视频生成**: 复制prompt到Sora进行视频生成
6. **反馈数据收集**: 上传视频表现数据，优化算法

### 管理员功能
- 访问 `/admin` 进入管理控制台
- 管理商品库和风格库
- 查看数据分析和统计

## 🔧 API接口

### 风格匹配API
```
POST /api/ai/match-style
```
根据商品信息匹配最合适的视频风格

### Prompt生成API
```
POST /api/ai/generate-prompt
```
基于匹配的风格生成Sora视频提示词

## 📊 数据模型

### 商品信息
- 商品名称、描述、类目
- 卖点、SKU图片
- 目标国家列表

### 风格信息
- 风格名称、描述、类目
- 语调、脚本结构
- 视觉风格、目标受众

### 匹配算法
- **粗排阶段**: 基于类目、国家等基础字段筛选
- **精排阶段**: 基于语调、受众、脚本结构等深度匹配

## 🚧 开发计划

### 第一阶段（当前）
- ✅ 基础架构搭建
- ✅ 商品库管理
- ✅ 风格库管理
- ✅ AI风格匹配
- ✅ Sora prompt生成

### 第二阶段
- [ ] 用户认证系统
- [ ] 视频上传和存储
- [ ] 竞品链接解析
- [ ] 反馈数据收集

### 第三阶段
- [ ] 与TikTok/虾皮店铺集成
- [ ] 自动化视频生成
- [ ] 高级分析功能
- [ ] 多语言支持

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📞 联系方式

如有问题或建议，请通过以下方式联系：
- 项目Issues: [GitHub Issues](https://github.com/your-repo/issues)
- 邮箱: your-email@example.com

---

**注意**: 这是一个演示项目，实际部署时请配置生产环境数据库和必要的环境变量。
