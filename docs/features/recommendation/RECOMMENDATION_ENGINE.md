# 推荐引擎 - 架构、接口与埋点

本文档描述当前推荐引擎的运行逻辑、数据模型、API 契约、埋点事件、数据导出与中期模型规划，便于后续持续迭代。

## 1. 运行逻辑

- 场景：`product->style` | `task->model` | `task->prompt`
- 流程：粗排（规则/统计特征） → 精排（规则/特征） → 在线探索（epsilon-greedy） → 持久化候选与决策
- 返回：`decisionId`、`candidateSetId`、Top-K 及多路备选（fineTop2/coarse/oop）

核心代码：
- `src/services/recommendation/recommend.ts`（统一 Rank 入口与探索）
- `src/services/recommendation/index.ts`（场景 → Scorer 注册）
- `src/services/recommendation/scorers/*`（各场景打分器）

## 2. AI 路由（执行阶段）

推荐引擎本身不使用 LLM 做评分，AI 用于后续执行生成：
- 文本默认：Gemini（可被 env 覆盖）
- 视觉优先：Doubao（无则回退 Gemini/DeepSeek）
- 严格 JSON：优先 Gemini/OpenAI JSON 模式

参考：`src/services/ai/rules.ts`、`src/services/ai/AiExecutor.ts`

## 3. 数据模型（Prisma）

- `RecommendationCandidateSet` / `RecommendationCandidate`
- `RecommendationDecision`（含 `exploreFlags`）
- `RecommendationEvent`（expose/select/execute_*/implicit_*）
- `RecommendationOutcome`（latencyMs/costActual/qualityScore/conversion/...）
- `RecommendationSetting`（epsilon、mCoarse、kFine、segment 模板等）

定义见：`prisma/schema.prisma`

## 4. API 契约

### 4.1 获取推荐
- `POST /api/recommend/rank`
  - 入参：`{ scenario, task, context?, constraints?, options? }`
  - 出参：`{ success, decisionId, candidateSetId, chosen, topK, alternatives }`

### 4.2 反馈/事件/结果
- `POST /api/recommend/feedback`
  - 功能：记录事件（expose/auto_select/select/execute_*），可同时 Upsert Outcome
  - 请求示例：
    ```json
    {
      "decisionId": "clxxx",
      "eventType": "expose",
      "payload": { "candidates": [{"id":"x","bucket":"top1"}] },
      "latencyMs": 2300,
      "qualityScore": 0.9
    }
    ```
  - 响应：`{ success, data: { feedback?, event, outcome? } }`

（仍兼容）
- `POST /api/admin/recommendation/feedback`
- `POST /api/admin/recommendation/outcome`

## 5. 前端埋点

组件：`components/RecommendationSelector.tsx`
- 拉取推荐后：发送 `expose`（包含候选分桶与分数）与 `auto_select`
- 用户改选：发送 `select` + 显式反馈（user_override）

事件类型与载荷类型：`src/services/recommendation/feedback-types.ts`

## 6. 服务端埋点（执行）

示例：`app/api/ai/generate-prompt/route.ts`
- 执行前：`execute_start`
- 执行后：`execute_complete`（记录 latencyMs，必要时附带 outcome 字段）

## 7. 数据导出（训练集）

脚本：`scripts/export-reco-datasets.ts`
- LTR（Learning-to-Rank）导出：候选级样本，列含 label、coarseScore、fineScore
- Reranker（Cross-Encoder）导出：`{ query, document, label }` JSONL
- 运行：`ts-node scripts/export-reco-datasets.ts ./out`

## 8. 中期模型规划

- 精排序引入 Cross-Encoder 重排（bge-reranker）
- 离线 LTR（LightGBM/XGBoost Rank）替代手工权重
- 保持在线探索与隐式反馈闭环

## 9. 指标与看板

- 改选率、执行率、隐式分数、探索率、平均延迟/成本
- 分段（segmentKey）维度：类目/语言/渠道/区域
- 后续对接管理端看板 API（已有 admin 端接口可复用/扩展）

## 10. 变更记录（本次）

- 新增 `POST /api/recommend/rank`
- 新增 `POST /api/recommend/feedback`（统一事件与结果）
- 前端 `RecommendationSelector` 补充 expose/auto_select/select 埋点
- 服务端 `generate-prompt` 补充 execute_* 埋点
- 新增 `feedback-types.ts` 类型定义
- 新增 `export-reco-datasets.ts` 训练数据导出脚本


