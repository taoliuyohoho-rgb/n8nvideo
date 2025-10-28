# 工程技术与开发节奏手册

## 1. 架构总览
- 分层：Domain（实体/DTO）、Service（业务）、Integrations（平台）、API（接口）、Workers（异步）、Analytics（指标）。
- 前后端分离友好：前端仅调 REST API；服务层持有业务逻辑；Contract-first（Zod/OpenAPI）。
- 可扩展：Recommendation Engine、AI Executor、Integrations 皆为插件化接口。

## 2. 目录结构（建议）
- src/core：domain types、contracts（Zod/OpenAPI）、feature flags、i18n keys
- src/services：
  - recommendation：召回/精排、权重、影子实验
  - ai：AI Executor（providers、超时/重试/兜底/审计）
  - integrations：tiktok（先）、shopee（后）、存储
  - analytics：指标聚合、看板查询
  - task：任务与队列（状态机、并发、重试）
- src/api：REST 控制器，仅编排
- workers/：异步 worker（任务中心支撑）

## 3. 数据与模型
- 数据库：开发 SQLite，可切换生产 Postgres。
- 主实体：AdminProduct；店铺商品通过 ProductMapping 映射聚合。
- Metrics：按日/小时分表聚合，记录来源与更新时间。
- 日志：统一 traceId、结构化日志（context + level + message + meta）。

## 4. AI Executor（统一AI调用）
- Provider 驱动：Gemini/Claude/豆包等；超时、重试、指数退避、fallback 链路。
- 输入输出审计：脱敏存储；保存 prompt 模板、变量、快照（便于回放）。
- Feature Flag：未成熟 provider 默认关闭或灰度。

## 5. Recommendation Engine（推荐引擎）
- 粗排+精排：可插拔特征（商品、受众、国家、脚本结构、语调、历史表现）。
- 置信度门控：低于阈值自动回退至“风格确认”。
- 决策日志：记录特征→打分→选择；质量分/反馈率/延迟监控。
- 权重调优：安全范围滑块、影子实验（只评估不生效）。

## 6. 任务中心与异步
- 状态机：pending→running→completed/failed；并发/重试/限流策略。
- 可观测：traceId 贯穿；失败原因与重放；结果可复用与导出。

## 7. 接口契约与DoD
- Contract-first：所有 API 定义 Zod Schema 与 OpenAPI 描述。
- DoD（Definition of Done）：
  - 有示例请求与快照测试（固定响应片段）。
  - 关键服务有契约测试（契约变更需版本号）。
  - 未完成功能由 Feature Flag 隐藏，避免“UI先行、功能缺失”。

## 8. 信息架构与导航规范
- 路由：/workbench/... 与 /admin/...，所有功能从导航可达，禁止“孤岛URL”。
- 列表为主、抽屉编辑为辅；支持密度切换、搜索、列筛选、多选批量操作、保存视图、列配置。
- 长流程全部进入任务中心，避免 UI 卡死；可重试、回放、复制结果。

## 9. 国际化与权限
- i18n：文案表统一管理，语言切换（中/英）。
- 权限：RBAC 起步（Admin/Operator），可扩展角色与策略；最小操作日志。

## 10. 数据采集（P2 准备）
- TikTok 优先：日级自动采集为硬要求；凭证就绪后近实时（高频轮询/Webhook）。
- 数据健康：展示来源与更新时间；失败重试与告警。

## 11. 迭代节奏与发布
- 周迭代：每周交付一个纵向切片（UI+API+数据）。
- 双周里程碑：P0→P1→P2。
- 环境：Dev→Staging→Prod；灰度/回滚；配置与 Schema 版本化。

## 12. 最小实施计划（P0）
- 切片1：商品库预填 API + 前端接入；
- 切片2：风格召回（Top-N + 理由）与确认；
- 切片3：Prompt 生成 + 任务中心打通；
- 切片4：极速模式 + 置信度门控回退；
- 切片5：推荐监控最小看板（质量分/延迟/失败率）。


