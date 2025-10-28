## 预估模型（Estimation Model）实现总结

### 已完成工作

#### 1. 数据库架构 ✅
在 `prisma/schema.prisma` 中新增以下表：
- **EstimationModel** - 模型池（候选B）
- **EntityIndex** - 实体统一索引（支持A/B角色切换）
- **EntityFeature** - 实体特征快照
- **EntityEmbedding** - 实体向量（预留）
- **EntityMetricsDaily** - 实体日度指标
- **EstimationCandidateSet** - 候选集
- **EstimationCandidate** - 候选明细
- **EstimationDecision** - 决策记录
- **EstimationOutcome** - 结果反馈
- **EstimationFeedbackEvent** - 细粒度事件

#### 2. 核心服务层 ✅
在 `src/services/ai/estimation/` 目录下实现：

**基础模块**
- `types.ts` - TypeScript 类型定义（TaskInput, RankRequest, RankResponse, FeedbackRequest 等）
- `constants.ts` - 常量配置（默认值、阈值、权重、枚举）
- `errors.ts` - 错误码与异常处理

**业务模块**
- `models.ts` - 模型池管理（CRUD、状态更新、批量查询）
- `features.ts` - 实体特征管理（索引、特征快照、同步）
- `filters.ts` - 硬过滤（语言、窗口、成本、白/黑名单）
- `coarse.ts` - 粗排（轻量打分、Top-M 召回）
- `fine.ts` - 精排（段位指标、精细得分）
- `explore.ts` - 探索策略（ε-greedy、自适应、保护门槛）
- `fallback.ts` - 回退与熔断（LKG 缓存、熔断状态、回退链）
- `metrics.ts` - 指标聚合（段位统计、探索占比、回退率）
- `rank.ts` - 主排序服务（整合粗排/精排/探索/回退）

#### 3. API 路由 ✅
在 `app/api/ai/auto-select/` 目录下实现：

- **POST /api/ai/auto-select/rank** - 排序选型接口
  - 输入：task（任务需求）、context（环境）、constraints（约束）、options（选项）
  - 输出：decisionId、chosen（最优模型）、candidates（Top-K）、timings
  - 支持参数校验（Zod）、幂等（requestId）、错误码映射

- **POST /api/ai/auto-select/feedback** - 反馈接口
  - 输入：decisionId、qualityScore、editDistance、rejected、conversion、latency、cost 等
  - 输出：success、message
  - 支持幂等（更新已有 outcome）

- **GET /api/ai/auto-select/models** - 模型池查询接口
  - 输出：models 列表（id、provider、modelName、langs、price、status 等）

#### 4. 初始化脚本 ✅
在 `scripts/` 目录下新增：

- `init-estimation-models.js` - 初始化模型池
  - 从 `verified-models.json` 导入或使用默认模型
  - 支持 upsert（新增/更新）

- `sync-entity-features.js` - 同步实体特征
  - 从 `products` 和 `styles` 表提取特征
  - 生成 `ranking_minimal` 和 `ranking_full` 特征组

#### 5. Admin 监控页面 ✅
在 `app/admin/` 目录下新增：

- **estimation-monitor** - 监控看板
  - 决策统计（总数、24h、探索占比、回退率）
  - 模型池状态（provider、语言、价格、状态）
  - 段位指标（质量、成本、延迟、样本数）
  - 快捷操作（查看API、测试、清空熔断）

- **estimation-test** - 测试页面
  - 5个预设测试用例（基础、完整、中文、低成本、JSON模式）
  - 实时查看Rank响应（chosen、candidates、timings）
  - 一键发送模拟反馈

#### 6. Admin API ✅
在 `app/api/admin/estimation/` 目录下实现：

- `GET /api/admin/estimation/segment-metrics` - 段位指标聚合
- `GET /api/admin/estimation/decision-stats` - 决策统计
- `POST /api/admin/estimation/clear-circuit-breakers` - 清空熔断

#### 7. 文档 ✅
- `ESTIMATION_MODEL_DESIGN.md` - 设计文档（架构、API、数据模型、阈值、错误码、字段字典）
- `ESTIMATION_MODEL_USAGE.md` - 使用指南（快速开始、API 示例、集成方式、监控、故障排查）
- `ESTIMATION_MODEL_IMPLEMENTATION_SUMMARY.md` - 实现总结（本文档）

### 核心功能

#### 粗排 → 精排 → 探索 → 回退
1. **硬过滤**：按语言、成本、窗口、白/黑名单过滤候选
2. **粗排**：轻量线性打分（langMatch、categoryMatch、styleMatch 等），保留 Top-M
3. **精排**：加入段位指标（qualityScore、editRate、latency、cost），重排
4. **探索**：ε-greedy 在 Top-2/3 内小流量探索，支持保护门槛与自适应
5. **回退**：无候选或熔断时回退至 LKG（Last Known Good）

#### 熔断与稳定性
- 支持 provider 级和 model 级熔断
- 熔断触发条件：超时/错误率/质量异常
- 熔断时长：10 分钟（普通）/ 30 分钟（严重）
- 半开恢复：10% 放量试探

#### 反馈闭环
- 收集质量得分、编辑距离、拒稿、转化、延迟、成本等信号
- 按 segmentKey（category|region|channel）聚合指标
- 驱动探索参数自适应与 LKG 更新

### 使用示例

#### 最小调用
```typescript
const response = await fetch('/api/ai/auto-select/rank', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    task: {
      lang: 'ms',
      category: 'beauty',
    },
  }),
});

const { decisionId, chosen } = await response.json();
console.log(`Chosen: ${chosen.provider}/${chosen.modelName}`);
```

#### 完整流程
```typescript
// 1. Rank - 选择最优模型
const rankResponse = await rank({
  task: { lang: 'ms', category: 'beauty', style: 'youthful' },
  context: { region: 'MY', channel: 'tiktok' },
  options: { requestId: 'req_12345', explore: true },
});

// 2. Generate - 使用选中模型生成
const result = await generateWithModel(
  rankResponse.chosen.provider,
  rankResponse.chosen.modelName,
  prompt
);

// 3. Feedback - 反馈结果
await fetch('/api/ai/auto-select/feedback', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    decisionId: rankResponse.decisionId,
    qualityScore: 0.85,
    latencyMs: 4100,
    costActual: 0.028,
  }),
});
```

### 下一步（MVP 验证后）

#### V1 快速迭代
- [ ] 在一个生成入口（如视频脚本生成）接入 Rank
- [ ] 灰度 5% → 20% → 全量
- [ ] 收集 1-2 周数据
- [ ] 对比基线（默认模型）的质量/成本/延迟

#### V2 升级
- [ ] LTR 精排（LambdaMART/GBDT，离线训练）
- [ ] pgvector/ES 粗排（向量相似度加速）
- [ ] 自动权重更新与漂移监控
- [ ] 看板页面（`app/admin/estimation-dashboard`）
- [ ] 告警集成（Slack/钉钉）

#### V3 高级
- [ ] 多目标优化（质量 vs 成本 vs 延迟，Pareto）
- [ ] 个性化（用户/账户维度）
- [ ] 跨渠道迁移学习
- [ ] 自动特征选择与工程
- [ ] 分布式存储（Redis for LKG/熔断，ClickHouse for metrics）

### 文件清单

#### 新增文件
```
prisma/schema.prisma                         (修改：新增预估模型表)
src/services/ai/estimation/
  ├── types.ts                               (类型定义)
  ├── constants.ts                           (常量配置)
  ├── errors.ts                              (错误码)
  ├── models.ts                              (模型池管理)
  ├── features.ts                            (实体特征)
  ├── filters.ts                             (硬过滤)
  ├── coarse.ts                              (粗排)
  ├── fine.ts                                (精排)
  ├── explore.ts                             (探索)
  ├── fallback.ts                            (回退与熔断)
  ├── metrics.ts                             (指标聚合)
  └── rank.ts                                (主排序服务)
app/api/ai/auto-select/
  ├── rank/route.ts                          (Rank API)
  ├── feedback/route.ts                      (Feedback API)
  └── models/route.ts                        (Models API)
app/api/admin/estimation/
  ├── segment-metrics/route.ts               (段位指标API)
  ├── decision-stats/route.ts                (决策统计API)
  └── clear-circuit-breakers/route.ts        (清空熔断API)
app/admin/
  ├── estimation-monitor/page.tsx            (监控看板)
  └── estimation-test/page.tsx               (测试页面)
scripts/
  ├── init-estimation-models.js              (初始化模型池)
  └── sync-entity-features.js                (同步实体特征)
ESTIMATION_MODEL_DESIGN.md                   (设计文档)
ESTIMATION_MODEL_USAGE.md                    (使用指南)
ESTIMATION_MODEL_IMPLEMENTATION_SUMMARY.md   (本文档)
```

### 技术栈
- **框架**：Next.js 14 (App Router)
- **ORM**：Prisma (SQLite，可迁移 Postgres)
- **校验**：Zod
- **语言**：TypeScript
- **存储**：内存（LKG/熔断）+ 数据库（决策/指标）

### 性能指标（设计目标）
- Rank 端到端：≤ 150ms（不含生成）
- 粗排：≤ 50ms
- 精排：≤ 80ms
- 探索占比：5-10%
- 回退率：< 15%

### 验收标准（MVP）
- [x] Prisma schema 通过 `npx prisma db push`
- [x] 初始化脚本成功导入 5+ 个模型
- [x] Rank API 返回有效候选与 decisionId
- [x] Feedback API 成功记录结果
- [x] 硬过滤、粗排、精排、探索、回退逻辑可测试
- [x] 文档齐全（设计文档、使用指南、实现总结）

### 备注
- 当前使用 SQLite，生产环境建议迁移至 Postgres（支持 pgvector）
- LKG 和熔断状态存内存，重启丢失；生产环境建议用 Redis
- 指标聚合为实时计算，大规模场景建议预聚合或接入 ClickHouse
- 探索参数（epsilon）当前为全局静态，后续可按段位动态调整

---

**实现完成时间**：2025-10-24  
**版本**：MVP v1.0  
**状态**：✅ 已完成，待验证与灰度

