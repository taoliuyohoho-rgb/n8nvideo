# 视频生成流程 PRD（UGC 电商短视频）

- 文档版本：v0.1
- 所有者：产品/研发联席（Owner: Admin）
- 更新日期：2025-10-28
- 关联文档：`docs/PRD.md`、`docs/RECOMMENDATION_ENGINE.md`、`docs/RECOMMENDATION_IMPLICIT_FEEDBACK.md`

## 1. 目标与范围
- 目标：基于“商品名 → 商品库补全 → 人设 → 脚本 → 视频/下载”的可控流水线，低成本批量生产真实感 UGC 电商短视频。
- 范围（P0）：
  - 向导式流程（9 步）
  - 商品库自动补全与规则引擎 Top5 提取
  - 推荐引擎挑选模型与 Prompt（可人工修订）
  - 人设与脚本结构化生成与校验
  - AI 视频生成（可选）与下载
  - 手动复制脚本的分支
- 非目标（P0 不做）：复杂剪辑/字幕/多镜头拼接、付费/结算、版权与投放渠道打通。

## 2. 用户与场景
- 角色：Admin/Operator
- 核心场景：电商运营快速产出符合平台风格的短视频内容，用于投放或自然流。

## 3. 用户流程（九步）
1) 用户填写商品名称
2) 系统自动从商品库补全：商品描述/卖点/痛点/目标受众/国家；当卖点/痛点过多时，规则引擎自动选出 Top5（可见理由）
3) 可选的“用户自填商品分析”：写入备选池；用户可选择采纳；采纳后更新到商品库
4) 推荐引擎根据任务与上下文（国家/平台/预算/时效）选择“模型+Prompt 模板”用于生成人设
5) 展示人设并允许用户确认/修改；最终人设入库（版本化）
6) 推荐引擎选择“模型+Prompt 模板”生成脚本（默认 1 条变体）
7) 展示脚本并允许用户确认/修改；最终脚本入库（版本化）
8) 用户选择：
   - 仅复制脚本手动制作
   - 或选择 AI 直接生成视频（进入异步任务）
9) 视频可视化进度与结果页：完成后可预览/下载；失败可重试/降级

## 4. 交互与信息架构（UX）
- 路由：`工作台/视频生成`（基于现有页面优化，保留步骤式 UI 与右侧抽屉）
- 关键页面/状态：
  - 商品输入 → 自动补全卡片（含“来自商品库/AI补全”的标识）
  - 备选分析池（可勾选；点击“应用”并可编辑）
  - 人设卡（结构化呈现，支持一键改写/随机名/地区语气）
  - 脚本详情（默认 1 条，展示“角度/能量/时间轴/镜头拆分”）
  - 生成方式选择（复制/AI 生成）
  - 任务中心卡片（状态：queued/running/succeeded/failed/cancelled，进度条，预计耗时）
  - 结果页（视频播放器、下载按钮、成本与模型信息）
- 空态/加载/错误：提供明确提示与降级（如视频生成不可用 → 仅提供复制脚本）。

## 5. 架构与模块
- 前端：`app/**`、`components/**`（无副作用组件；向导页拆分步骤组件）
- 后端：`app/api/**`（所有接口必须校验输入与返回码）
- 服务：`src/services/**`（AI 路由、推荐、规则引擎、任务编排）
- 工人：`workers/video-worker.ts`（统一视频任务执行/轮询/回调封装）
- 数据：`prisma/**`（商品/人设/脚本/视频任务 4 大主实体，版本化）
- 观测：结构化日志 + requestId/userId/模块/耗时 + 任务事件流

## 6. 数据模型（拟）
> 仅定义关键字段，最终以 `prisma/schema.prisma` 为准（新增字段遵循“新增不破坏、附带迁移/索引/唯一约束”）。

- Product（商品主实体）
  - id, name, description, images[], country[], targetAudiences[]
  - sellingPoints[], painPoints[]（源与置信度）
  - metadata: { source: catalog|ai|user, lastSyncedAt }

- Persona（人设）
  - id, productId, version, coreIdentity{name, age, gender, location, occupation}
  - look, vibe, context, why, createdBy, createdAt, modelUsed

- Script（脚本）
  - id, productId, personaId, version, angle, energy, durationSec(=15)
  - lines{open, main, close}, shots[second:[0..15), camera, action, visibility, audio]
  - technical{orientation, filmingMethod, dominantHand, location, audioEnv}
  - modelUsed, evidenceIds[], createdBy

- VideoJob（视频任务）
  - id, idempotencyKey, productId, personaId, scriptId
  - provider(OpenAI|Pika|Luma|Runway|Custom), model, status, progress, errorCode, errorMessage
  - params{seconds,size,inputReferenceRef,extras}
  - result{fileUrl, thumbnailUrl, providerRaw}
  - cost{promptTokens, outputTokens, credits}
  - createdAt, updatedAt, createdBy

- AnalysisCandidate（备选分析池）
  - id, productId, content, source(user|ai), adopted(boolean), createdAt

## 7. 推荐引擎接入
- 入口：步骤 4 与步骤 6 调用推荐引擎，结合上下文（商品品类、目标国家/渠道、历史反馈、时延/成本阈值）
- 实现参考：`src/services/recommendation/**`、`taskToModel.ts`（为 task 选择模型与 Prompt 模板）
- 反馈闭环：结合 `docs/RECOMMENDATION_IMPLICIT_FEEDBACK.md`，采集点击/复制/下载/成功率/失败率等弱监督信号，用于精排调权与影子实验。

## 8. AI 调用与路由
- 路由入口：统一走 `src/services/ai/rules.ts`（chooseModel/callModel）
- 模型优先级（遵循项目规则）：
  - 视觉/视频理解优先“豆包”，其次 DeepSeek/Gemini
  - 纯文本默认 Gemini，可由环境变量覆盖
  - 视频生成走专用入口（非文本执行器），由 `video-worker` 统一编排
- JSON 严格输出：统一 `contract.callWithSchema` 强校验；失败自动修复一次；仍失败返回可诊断错误（不泄露内部堆栈）
- 证据模式：Prompt 注入“证据（商品库字段/人设/脚本上下文）”；缺证据则输出空结构，不得臆造
- Verified Providers：仅使用 `verified-models.json` 中标记为可用的 Provider/Model
- 断路器/重试：复用 `AiExecutor` 策略；必要时降级模型/模板

## 9. 规则引擎（Top5 提取）
- 输入：卖点/痛点全集（含权重/出现频次/来源/最近转化率）
- 策略（示例）：分数 = tfidfWeight + recencyBoost + conversionLift - redundancyPenalty
- 约束：去重合并语义相近项；保留覆盖不同受众/使用场景的多样性
- 输出：Top5 列表 + 选中理由（可见）

## 10. 接口设计（`app/api/**`）
> 所有接口：
> - 校验输入（Zod/Valibot）
> - 统一错误码与错误消息（不暴露堆栈）
> - 幂等：支持 `Idempotency-Key`（创建/生成类）
> - 速率限制与权限校验（Admin/Operator）

- POST `/api/video-gen/init`
  - 入参：{ productName: string }
  - 出参：{ product: {...}, top5: { sellingPoints: string[], painPoints: string[], reasons: string[] } }

- POST `/api/product/analyze`（可选，写入备选池）
  - 入参：{ productId: string, analysisText: string }
  - 出参：{ candidateId: string }

- GET `/api/product/analysis-candidates?productId=...`
  - 出参：{ items: AnalysisCandidate[] }

- POST `/api/persona/generate`
  - 入参：{ productId: string, overrides?: Partial<Persona> } （可带 Idempotency-Key）
  - 出参：{ persona: Persona, modelUsed }

- POST `/api/persona/confirm`
  - 入参：{ persona: Persona }
  - 出参：{ personaId: string }

- POST `/api/script/generate`
  - 入参：{ productId: string, personaId: string, variants?: number (default 1) }
  - 出参：{ scripts: Script[], modelUsed }

- POST `/api/script/confirm`
  - 入参：{ scripts: Script[] }
  - 出参：{ scriptIds: string[] }

- POST `/api/video/jobs`
  - 入参：{ scriptId: string, providerPref?: string[], seconds?: number, size?: string }
  - 出参：{ jobId: string, status: 'queued' }

- GET `/api/video/jobs/:id`
  - 出参：{ job: VideoJob }

- GET `/api/video/jobs/:id/result`
  - 出参：`video/mp4` 或 { fileUrl: string }

示例响应（片段；Schema 受控）：
```json
{
  "persona": {
    "coreIdentity": { "name": "Maya", "age": 27, "gender": "female", "location": "Austin suburb", "occupation": "Pediatric Nurse" },
    "vibe": { "traits": ["pragmatic","nurturing","observant"], "communicationStyle": "clear, like a trusted friend" },
    "why": "As a busy nurse, her advice on convenience feels可信"
  },
  "modelUsed": { "provider": "Gemini", "model": "gemini-2.5-pro" }
}
```

## 11. Prompt 规范（摘要）
- 人设生成 Prompt：角色=Casting Director & Consumer Psychologist；输入=商品证据；输出=Persona Schema；严禁创作脚本
- 脚本生成 Prompt：目标=15 秒 UGC；输出=1 条脚本；包含时间轴与镜头拆分；遵守证据约束与真实性；输出受 Schema 约束
- 视频生成：不直接在文本执行器中调用，交由 `video-worker` 适配不同 Provider；参考图像/首帧可选

### 11.1 Prompt 模版管理（新增：人设生成）
- 模块位置：`Admin/Prompt 管理`
- 新增模版类型：`persona.generate`
- 字段：`id`、`name`、`language`、`market`、`templateText`、`variables`（如 productName、country、audiences、sellingPoints、painPoints）
- 人设模版内置 5 个实例（可直接使用/克隆）：
  1) 北美日常风：贴近生活、轻专家、人设可信度来源=职业/日常痛点
  2) 美妆护肤风：强调肤质/作息/场景，口吻亲和，真实性优先
  3) 健身健康风：注重习惯/饮食/训练场景，强调前后对比“可信”
  4) 科技极客风：讲究效率/设计/数据，语言更理性与克制
  5) 家居实用风：收纳/清洁/省时，细节与家庭场景结合
- 变量注入规则：通过 `contract.callWithSchema` 的 evidenceMode 注入商品库证据，缺证据不臆造

内置基础模版（Base Template，供克隆）：
```text
// ROLE & GOAL
你是一名 Casting Director 与 Consumer Psychologist，专注理解人与产品的真实连接。仅输出“理想 UGC 创作者人设”，不要写广告脚本或金句。

// INPUT
Product Name: {{productName}}
Country/Market: {{country}}
Target Audiences: {{targetAudiences}}
Top-5 Selling Points: {{sellingPointsTop5}}
Top-5 Pain Points: {{painPointsTop5}}

// REQUIRED OUTPUT STRUCTURE
I. Core Identity
- Name:
- Age: (具体数字)
- Sex/Gender:
- Location: (贴合 {{country}} 的真实生活环境描述)
- Occupation: (具体到工种/场景)

II. Physical Appearance & Personal Style (The "Look")
- General Appearance:
- Hair:
- Clothing Aesthetic:
- Signature Details:

III. Personality & Communication (The "Vibe")
- Key Personality Traits (5-7 个形容词):
- Demeanor & Energy Level:
- Communication Style:

IV. Lifestyle & Worldview (The "Context")
- Hobbies & Interests:
- Values & Priorities:
- Daily Frustrations / Pain Points: (与 {{painPointsTop5}} 呼应但不直说产品)
- Home Environment:

V. The "Why" (Persona Justification)
- Core Credibility: (1-2 句，说明为什么 TA 对该品类可信；可引用 {{sellingPointsTop5}} 的“为何在意”角度)

// RULES
- 严禁臆造品牌与功能；缺证据则留空或用更通用且可信的表述。
- 仅输出人设结构，不输出脚本。
```

实例模版 1（北美日常风）：
```text
在 Base 基础上，语气更口语、生活化；Location 贴近北美城市周边社区；Occupation 偏常见职业（护士、教师、咖啡店经理等）；
Vibe 强调“务实、体贴、讲效率”；Why 侧重“忙碌的日常让 TA 对 {{sellingPointsTop5}} 的这些点格外敏感”。
```

实例模版 2（美妆护肤风）：
```text
在 Base 基础上，Look 中细化肤质/作息；Vibe 偏温柔、安抚；Context 中加入晨晚护肤节奏；
Why 侧重“长期稳定使用者视角”，避免宣传功效用语，强调“体验可信”。
```

实例模版 3（健身健康风）：
```text
在 Base 基础上，Context 加入训练/通勤/饮食场景；Vibe 更自律但不严格；
Why 结合“节省时间/提升坚持度/便携”等与 {{sellingPointsTop5}} 相呼应的可信理由。
```

实例模版 4（科技极客风）：
```text
在 Base 基础上，Communication Style 更简洁、数据化；Look 简约；
Why 强调“效率/设计/一致性/可维护性”类信任来源，避免营销语。
```

实例模版 5（家居实用风）：
```text
在 Base 基础上，Home Environment 更细；Context 融入家庭成员/宠物/收纳；
Why 强调“减少杂乱/省时/好打理”，与 {{painPointsTop5}} 的家庭痛点贴合。
```

## 12. 任务与幂等/重试
- 创建/生成类接口必须接受 `Idempotency-Key`；重复请求返回同一 job/结果（24 小时窗口）
- 轮询上限：最长 8 分钟或 15 次（每 20–30 秒），超时返回明确错误码（可重试）
- 失败分支：区分可重试（429/5xx/超时）与不可重试（4xx/鉴权/配额不足）
- 视频并发：每用户最多 5 个并发任务；队列采用 FIFO + 优先级（Admin 权重更高）

## 13. 可观测性与成本
- 结构化日志：traceId、userId、productId、personaId、scriptId、jobId、provider、model、耗时、成本
- 指标：成功率、P50/P95 时延、均次成本、失败原因分布
- 审计：保留 Prompt/证据摘要（脱敏）与模型决策日志（推荐引擎），遵守最小留存

## 14. 安全与合规
- 鉴权：Admin/Operator；接口按最小权限
- 速率限制：读类 60 rpm、写/生成类 10 rpm（可配置）
- 输入安全：校验文件类型与大小（如图片 ≤5MB）、防注入/XSS、外链白名单
- 秘钥管理：仅环境变量；不入库；不写日志

## 15. 验收标准（P0）
- 从输入商品名到获得“已确认脚本”≤ 3 分钟
- 人设/脚本 JSON 通过 Schema 校验率 ≥ 99%
- 规则引擎 Top5 与理由可解释，编辑后可保存
- 视频任务：排队→完成可下载；失败有明确原因与一键重试
- 推荐引擎输出“模型+模板”与理由可见；可手动覆盖
- 观测：每次任务均可溯源（traceId）与成本可见

## 16. 里程碑
- M0（~1 周）：商品补全 + 规则 Top5 + 人设/脚本生成（确认/版本化）
- M1（~1 周）：视频任务编排（队列/轮询/结果页）+ 幂等/限流/观测
- M2（~1 周）：推荐引擎打通与质量面板、影子实验

## 17. 风险与降级
- 视频 Provider 可用性不稳定：多提供商适配；首选 Verified；不可用时回退为“仅复制脚本”
- 成本失控：配额/预算守护；超限熔断
- JSON 不合规：自动修复一次；失败给出编辑入口

## 18. 待决问题（需评审）
- 视频 Provider 首选顺序与定价策略（OpenAI/Pika/Luma/Runway）
- 是否需要存储 Provider 原始响应用于追责/优化（脱敏范围）
- 脚本/人设多语言支持策略（输入国家/语言映射）
- 任务回调 vs 轮询：是否开放 Webhook 与第三方集成

---

附：最小 API 示例（创建视频任务）
```http
POST /api/video/jobs
Idempotency-Key: {{uuid}}
{
  "scriptId": "scr_123",
  "providerPref": ["OpenAI","Pika"],
  "seconds": 15,
  "size": "720x1280"
}
```
