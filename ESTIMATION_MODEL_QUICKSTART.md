## 预估模型 - 5分钟快速上手

### 步骤1：查看已初始化的模型池（已完成✅）

数据库已迁移，模型池已初始化，包含5个模型：
- ✅ OpenAI GPT-4o
- ✅ OpenAI GPT-4o-mini
- ✅ Doubao Pro 32k
- ✅ Claude 3.5 Sonnet
- ✅ OpenAI GPT-3.5 Turbo

### 步骤2：访问监控页面

启动开发服务器后，访问：

```
http://localhost:3000/admin/estimation-monitor
```

监控页面包含：
- 📊 决策统计（总数、24h、探索占比、回退率）
- 🤖 模型池状态（5个模型的详细信息）
- 📈 段位指标（按类目×地区×渠道聚合）
- ⚡ 快捷操作（测试、清空熔断等）

### 步骤3：测试Rank功能

访问测试页面：

```
http://localhost:3000/admin/estimation-test
```

点击任意测试用例（推荐先点"基础测试"），会：
1. 调用 `/api/ai/auto-select/rank`
2. 显示选中的模型
3. 显示Top-K候选列表
4. 显示耗时（粗排/精排/总计）

### 步骤4：发送反馈

在测试页面Rank成功后，点击"发送模拟反馈"按钮，会：
1. 调用 `/api/ai/auto-select/feedback`
2. 记录质量得分、成本、延迟等指标
3. 数据将用于后续优化

### 步骤5：在业务中集成

在你的生成代码中（如视频脚本生成）：

```typescript
// 1. 调用预估模型选择最优模型
const rankResponse = await fetch('/api/ai/auto-select/rank', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    task: {
      lang: 'ms',           // 马来语
      category: 'beauty',   // 美妆类目
    },
  }),
});

const { decisionId, chosen } = await rankResponse.json();

// 2. 使用选中的模型生成
const result = await generateWithModel(
  chosen.provider,    // e.g., 'openai'
  chosen.modelName,   // e.g., 'gpt-4o-mini'
  yourPrompt
);

// 3. 反馈结果（异步，不阻塞业务）
fetch('/api/ai/auto-select/feedback', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    decisionId,
    qualityScore: 0.85,     // 质量评分 0-1
    latencyMs: 3500,        // 实际延迟
    costActual: 0.025,      // 实际成本
    rejected: false,        // 是否被拒
  }),
}).catch(console.error);
```

### API端点总览

#### 核心API
- `POST /api/ai/auto-select/rank` - 选择最优模型
- `POST /api/ai/auto-select/feedback` - 反馈结果
- `GET /api/ai/auto-select/models` - 查看模型池

#### 监控API
- `GET /api/admin/estimation/segment-metrics` - 段位指标
- `GET /api/admin/estimation/decision-stats` - 决策统计
- `POST /api/admin/estimation/clear-circuit-breakers` - 清空熔断

### 常用操作

#### 查看模型池
```bash
curl http://localhost:3000/api/ai/auto-select/models | jq
```

#### 测试Rank（最小参数）
```bash
curl -X POST http://localhost:3000/api/ai/auto-select/rank \
  -H "Content-Type: application/json" \
  -d '{"task":{"lang":"ms","category":"beauty"}}' | jq
```

#### 查看决策统计
```bash
curl http://localhost:3000/api/admin/estimation/decision-stats | jq
```

### 监控指标说明

- **探索占比**：5-10%为正常，过高说明模型不稳定
- **回退率**：<15%为正常，过高说明熔断频繁或无可用候选
- **质量得分**：>0.8为优秀，0.6-0.8为良好，<0.6需优化
- **拒稿率**：<20%为正常，>20%需调整模型或prompt

### 下一步

1. **灰度接入**：选择一个生成入口（如视频脚本），接入预估模型，灰度5%流量
2. **收集数据**：运行1-2周，收集质量/成本/延迟数据
3. **对比基线**：与"固定使用某个模型"的基线对比
4. **调优**：根据监控数据调整权重、探索参数、阈值
5. **扩大范围**：逐步接入更多生成入口

### 故障排查

#### 问题：Rank返回空候选
- 检查硬过滤条件（语言、成本、白名单）
- 查看熔断状态（监控页面 → 快捷操作 → 清空熔断）

#### 问题：探索占比为0
- 检查 `options.explore` 是否为 `true`
- 查看段位质量是否触发保护门槛

#### 问题：延迟过高
- 查看 `timings` 中的粗排/精排耗时
- 精排耗时高可能是段位指标查询慢（样本多时需优化）

### 文档链接

- **设计文档**：`ESTIMATION_MODEL_DESIGN.md` - 完整架构与原理
- **使用指南**：`ESTIMATION_MODEL_USAGE.md` - 详细API说明
- **实现总结**：`ESTIMATION_MODEL_IMPLEMENTATION_SUMMARY.md` - 技术细节

### 联系与支持

有问题？
1. 查看监控页面的实时状态
2. 使用测试页面复现问题
3. 查看日志（控制台或服务器日志）
4. 参考设计文档的错误码说明

祝使用愉快！🚀














