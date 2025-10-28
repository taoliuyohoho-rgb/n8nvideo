# 竞品分析统一架构测试计划

## 测试目标
验证竞品分析模块已统一，推荐引擎能正确选择AI模型和Prompt模板。

## 测试环境
- 已运行 `node scripts/init-competitor-prompts.js` 初始化Prompt模板
- 数据库已有AI模型配置（`estimation_models`表）
- 数据库已有商品数据

## 测试场景

### 场景1：纯文本竞品分析
**输入**：
- 商品：蓝牙耳机
- 竞品文本：
```
降噪蓝牙耳机，40小时超长续航，HiFi音质
支持蓝牙5.3，快速配对，低延迟游戏模式
入耳式设计，佩戴舒适，防水防汗IPX7
适合通勤、运动、办公等多场景
```

**期望输出**：
- 卖点：["降噪功能", "40小时超长续航", "HiFi音质", "蓝牙5.3快速配对", "低延迟游戏模式", "IPX7防水"]
- 痛点：["通勤噪音干扰", "续航不足", "音质差"]
- 目标受众："通勤/运动/办公人群"
- AI模型：`gemini/gemini-pro` 或其他文本模型
- Prompt：`竞品分析-标准模板`

**验证点**：
- ✅ AI模型根据输入类型（text）选择
- ✅ Prompt从数据库召回（默认模板）
- ✅ 卖点/痛点去重合并到商品库
- ✅ 前端显示使用的模型和Prompt

### 场景2：图片竞品分析
**输入**：
- 商品：蓝牙耳机
- 竞品图片：商详主图（模拟）

**期望输出**：
- 卖点：从图片提取（如"紧凑外观", "USB-C充电", "触控按键"）
- AI模型：`gemini/gemini-pro-vision`（多模态）
- Prompt：`竞品分析-标准模板`

**验证点**：
- ✅ AI模型自动选择支持图片的模型（Gemini）
- ✅ Prompt正确填充 `{{hasImages}}` 和 `{{imageCount}}`

### 场景3：多模态竞品分析（文本+图片）
**输入**：
- 商品：蓝牙耳机
- 竞品文本：简短描述
- 竞品图片：商详图

**期望输出**：
- 卖点：综合文本和图片提取
- AI模型：`gemini/gemini-pro-vision`
- Prompt：`竞品分析-标准模板`

**验证点**：
- ✅ AI模型选择多模态模型
- ✅ 结合文本和图片分析

### 场景4：链接输入（降级处理）
**输入**：
- 商品：蓝牙耳机
- 竞品链接：`https://tiktok.com/xxx`

**期望输出**：
- 错误提示：`链接解析失败：大多数平台不允许爬取。建议复制商品详情文本或截图粘贴。`

**验证点**：
- ✅ 链接解析失败时给出明确提示
- ✅ 建议用户使用文本或图片

### 场景5：推荐引擎选择最优Prompt
**前置条件**：
- 创建两个Prompt模板：
  - 模板A：`performance=0.90, successRate=0.95`
  - 模板B：`performance=0.80, successRate=0.85`（当前默认）

**输入**：
- 商品：蓝牙耳机
- 竞品文本：任意

**期望输出**：
- Prompt：模板A（因为性能更高）

**验证点**：
- ✅ 推荐引擎正确排序Prompt
- ✅ 选择性能最优的模板

### 场景6：AI解析失败降级
**模拟**：
- AI返回非JSON格式或解析失败

**期望输出**：
- 降级：简单文本提取（按标点符号分割）
- 仍然返回部分卖点

**验证点**：
- ✅ AI失败时不抛出错误
- ✅ 降级逻辑生效

## 测试步骤

### 步骤1：初始化环境
```bash
# 初始化Prompt模板
node scripts/init-competitor-prompts.js

# 确认模板已创建
sqlite3 prisma/dev.db "SELECT id, name, performance, successRate FROM prompt_templates WHERE businessModule='competitor-analysis';"
```

### 步骤2：前端测试（Dashboard）
1. 访问 `http://localhost:3000/dashboard?tab=video`
2. 选择商品："蓝牙耳机"
3. 点击竞品分析卡片，切换到"文本输入"
4. 输入场景1的竞品文本
5. 点击"AI解析"
6. 观察：
   - 解析成功提示
   - 卖点/痛点标签显示
   - Alert显示使用的模型和Prompt

### 步骤3：API测试
```bash
# 场景1：纯文本
curl -X POST http://localhost:3000/api/competitor/parse \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "<商品ID>",
    "input": "降噪蓝牙耳机，40小时超长续航...",
    "images": [],
    "isUrl": false
  }'

# 场景4：链接（应失败）
curl -X POST http://localhost:3000/api/competitor/parse \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "<商品ID>",
    "input": "https://tiktok.com/xxx",
    "images": [],
    "isUrl": true
  }'
```

### 步骤4：验证数据库
```bash
# 查看商品的卖点/痛点是否更新
sqlite3 prisma/dev.db "SELECT name, sellingPoints, painPoints FROM products WHERE name='蓝牙耳机';"

# 查看推荐决策记录
sqlite3 prisma/dev.db "SELECT * FROM reco_decisions ORDER BY createdAt DESC LIMIT 5;"
```

### 步骤5：验证推荐引擎日志
查看终端日志，确认：
- 模型推荐过程
- Prompt选择过程
- AI调用参数

## 验收标准

### ✅ 功能验收
- [ ] 文本分析正常工作
- [ ] 图片分析正常工作（Gemini）
- [ ] 多模态分析正常工作
- [ ] 链接解析给出正确提示
- [ ] 卖点/痛点去重合并
- [ ] 前端显示模型和Prompt信息

### ✅ 推荐引擎验收
- [ ] 根据输入类型选择正确模型
- [ ] 根据性能排序选择Prompt
- [ ] 推荐决策记录到数据库
- [ ] 候选集和候选项正确记录

### ✅ 错误处理验收
- [ ] AI解析失败时降级
- [ ] 链接解析失败时提示
- [ ] 商品不存在时报错
- [ ] 输入为空时报错

## 已知问题和限制
1. **链接解析**：大多数平台不允许爬取，建议用户复制文本
2. **图片解析**：仅Gemini支持，其他模型会被过滤
3. **多模态成本**：Gemini Vision价格较高，需控制使用频率

## 下一步优化
1. 实现反馈闭环：收集解析成功率，更新Prompt性能分数
2. A/B测试：对比不同Prompt模板效果
3. 探索策略：10%概率选择新模板
4. 成本优化：根据任务复杂度选择不同价格的模型
5. 视频竞品分析也接入推荐引擎

