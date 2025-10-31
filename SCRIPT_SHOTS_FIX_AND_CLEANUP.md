# 视频脚本Shots修复与孤岛页面清理

## 📅 时间
2025-10-31

## 🎯 问题描述

用户报告在视频生成流程中，脚本的 `shots`（镜头分解）字段为空或不显示。

### 根本原因

1. **数据层问题**：`useVideoGenerationApi.ts` 在处理后端返回的脚本数据时，丢失了 `shots`、`technical`、`lines` 等完整字段，只保留了简化的 `structure`。

2. **类型层问题**：`video-generation.ts` 类型定义中缺少 `shots`、`technical`、`lines` 等字段的声明。

3. **UI层问题**：用户实际使用的组件 `components/video-generation/ScriptGenerator.tsx` 没有显示 `shots` 和 `technical` 参数。

4. **架构混乱**：存在多个孤岛页面（`app/video-generation/`, `app/video-generation-refactored/`, `app/test-video-generation/`），但用户实际路径是 `/dashboard` → 视频生成标签。

## ✅ 解决方案

### 1. 修复数据处理逻辑（方案1）

**文件**: `components/video-generation/hooks/useVideoGenerationApi.ts`

**修改内容**:
```typescript
// ✅ 保留完整的原始数据
return {
  id: scriptData.id || generateId('script'),
  productId: product.id,
  personaId: persona.id,
  angle: scriptData.angle || '产品展示',
  content,
  // ✅ 新增：保留完整字段
  lines: scriptData.lines,
  shots: scriptData.shots || [],  // ✅ 保留shots数组
  technical: scriptData.technical || {  // ✅ 保留technical参数
    orientation: 'vertical',
    filmingMethod: 'handheld',
    dominantHand: 'right',
    location: 'indoor',
    audioEnv: 'quiet'
  },
  durationSec: scriptData.durationSec || 15,
  energy: scriptData.energy || '紧凑',
  // 兼容旧格式（用于旧组件）
  structure: { ... },
  style: { ... }
}
```

### 2. 更新类型定义（方案2）

**文件**: `components/video-generation/types/video-generation.ts`

**修改内容**:
```typescript
export interface VideoScript {
  id: string
  productId: string
  personaId?: string
  angle: string
  content: string
  // ✅ 完整的脚本数据字段
  lines?: {
    open: string
    main: string
    close: string
  }
  shots?: Array<{
    second: number
    camera: string
    action: string
    visibility: string
    audio: string
  }>
  technical?: {
    orientation: string
    filmingMethod: string
    dominantHand: string
    location: string
    audioEnv: string
  }
  durationSec?: number
  energy?: string
  // 兼容旧格式
  structure: { ... }
  style: { ... }
}
```

### 3. 更新UI显示（方案3）

**文件**: `components/video-generation/ScriptGenerator.tsx`

**新增显示区块**:
```typescript
{/* 台词分解 */}
{script.lines && (
  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
    <h4 className="text-sm font-semibold text-blue-800 mb-3">💬 台词分解</h4>
    {/* 显示 open, main, close */}
  </div>
)}

{/* 镜头分解 */}
{script.shots && script.shots.length > 0 && (
  <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
    <h4 className="text-sm font-semibold text-purple-800 mb-3">🎬 镜头分解</h4>
    {script.shots.map((shot, index) => (
      <div key={index}>
        <Badge>{shot.second}s</Badge>
        {shot.camera} | {shot.action}
        📹 {shot.visibility} · 🔊 {shot.audio}
      </div>
    ))}
  </div>
)}

{/* Technical 参数 */}
{script.technical && (
  <div className="bg-gradient-to-br from-gray-50 to-slate-50 border border-gray-200 rounded-lg p-4">
    <h4 className="text-sm font-semibold text-gray-800 mb-3">🎥 拍摄参数</h4>
    {/* 显示 orientation, filmingMethod, location 等 */}
  </div>
)}
```

### 4. 清理孤岛页面

**删除的文件/目录**:
- ❌ `app/video-generation/` - 旧版独立页面（包含 page.tsx, components/, hooks/）
- ❌ `app/video-generation-refactored/` - 重构版独立页面
- ❌ `app/test-video-generation/` - 测试页面
- ❌ `components/VideoGenerationFlowEmbed.tsx` - 死代码（引用了已删除的旧组件）

**保留的组件**:
- ✅ `components/video-generation/` - 用户实际使用的组件目录
- ✅ `app/dashboard/page.tsx` - 用户真实入口（视频生成标签页）

## 📊 用户实际路径

```
用户登录
  ↓
/dashboard
  ↓
点击侧边栏"视频生成"按钮
  ↓
activeTab = 'video'
  ↓
渲染 VideoGenerationWorkflow 组件
  (来自 components/video-generation/)
  ↓
选择商品 → 分析 → 选人设 → 生成脚本 → 生成视频
```

## 🧪 测试验证

运行测试脚本验证修复效果：

```bash
npx tsx test-shots-fix.ts
```

**测试结果**:
```
✅ 处理后的脚本数据:

📊 完整字段检查:
  ✓ lines: 存在
  ✓ shots: 3 个  ← 成功保留！
  ✓ technical: 存在  ← 成功保留！
  ✓ durationSec: 15
  ✓ energy: 紧凑

🎬 Shots详情:
  [1] 0s - 特写 - Show induction cooktop's panel & function buttons
  [2] 5s - 半身 - Demo switch + spill cleanup
  [3] 10s - 特写 - Show energy label (level 3) & multi-function menu

✅ Shots数据完整保留！前端可以正常显示！
```

## 📝 修改文件清单

### 修改的文件
1. `components/video-generation/hooks/useVideoGenerationApi.ts` - 保留完整脚本数据
2. `components/video-generation/types/video-generation.ts` - 添加类型定义
3. `components/video-generation/ScriptGenerator.tsx` - 添加 shots 和 technical 显示及编辑功能
4. `src/services/ai/video/VideoPromptBuilder.ts` - 修复模板渲染时 shots 和 technical 的访问 ✨ **新增**

### 删除的文件
1. `app/video-generation/` - 整个目录
2. `app/video-generation-refactored/` - 整个目录
3. `app/test-video-generation/` - 整个目录
4. `components/VideoGenerationFlowEmbed.tsx` - 单个文件

## 🎯 效果

### 修复前
- ❌ 脚本中 `shots` 为空或未显示
- ❌ `technical` 参数丢失
- ❌ `lines` 完整结构丢失
- ❌ 每次生成的钩子和CTA看起来像是写死的
- ❌ 存在多个孤岛页面，架构混乱

### 修复后
- ✅ 完整显示 3+ 个镜头分解（时间点、机位、动作、可见性、音频）
- ✅ 显示所有拍摄参数（方向、拍摄方式、主导手、位置、音频环境）
- ✅ 显示台词分解（开场、主体、结尾）
- ✅ 每次生成的内容都由AI动态生成，不是写死的
- ✅ 清理了所有孤岛页面，架构清晰
- ✅ 用户路径唯一：dashboard → 视频生成标签

## 🔍 架构清理结果

### 清理前
```
视频生成入口（混乱）:
- /dashboard（视频生成标签）✅ 实际在用
- /video-generation ❌ 孤岛
- /video-generation-refactored ❌ 孤岛
- /test-video-generation ❌ 孤岛

组件（重复）:
- components/video-generation/ ✅ 实际在用
- app/video-generation/components/ ❌ 死代码
- components/VideoGenerationFlowEmbed.tsx ❌ 死代码
```

### 清理后
```
视频生成入口（唯一）:
- /dashboard（视频生成标签）✅

组件（统一）:
- components/video-generation/ ✅
```

## 📖 相关文档

- [Persona未知字段修复](./PERSONA_UNKNOWN_FIELDS_FIX.md)
- [脚本Shots空值修复](./SCRIPT_SHOTS_EMPTY_FIX.md)
- [项目规则](./docs/PROJECT_RULES.md)

## ✅ 验收标准

- [x] `shots` 数组包含至少 3 个镜头
- [x] 每个镜头有完整的字段（second, camera, action, visibility, audio）
- [x] `technical` 参数完整显示
- [x] `technical` 参数支持人工编辑 ✨ **新增**
- [x] `lines` 结构完整（open, main, close）
- [x] UI 美观，使用渐变色块区分不同区域
- [x] 无类型错误
- [x] 孤岛页面全部清理
- [x] 用户路径唯一清晰

## 🎨 新功能：拍摄参数编辑

### 功能说明

在脚本生成完成后，用户可以手动编辑拍摄参数（Technical Parameters），实现更精细的控制。

### 使用方法

1. 生成脚本后，在 **🎥 拍摄参数** 区块右上角点击 **"编辑"** 按钮
2. 进入编辑模式，修改以下字段：
   - **方向**：竖屏、横屏等
   - **拍摄方式**：手持、三脚架、稳定器等
   - **主导手**：右手、左手
   - **位置**：室内、室外、厨房等具体场景
   - **音频环境**：安静、嘈杂等
3. 点击 **"保存"** 按钮确认修改，或点击 **"取消"** 放弃修改
4. 修改后的参数会自动同步到脚本数据中

### 技术实现

**文件**: `components/video-generation/ScriptGenerator.tsx`

**核心逻辑**:
```typescript
// 1. 编辑状态管理
const [isEditingTechnical, setIsEditingTechnical] = useState(false)
const [editedTechnical, setEditedTechnical] = useState<any>(null)

// 2. 开始编辑
const handleEditTechnical = () => {
  if (script?.technical) {
    setEditedTechnical({ ...script.technical })
    setIsEditingTechnical(true)
  }
}

// 3. 保存修改
const handleSaveTechnical = () => {
  if (script && editedTechnical) {
    const updatedScript = {
      ...script,
      technical: editedTechnical
    }
    setScript(updatedScript)
    onScriptGenerated(updatedScript)  // 通知父组件
    setIsEditingTechnical(false)
  }
}

// 4. 字段更新
const handleTechnicalFieldChange = (field: string, value: string) => {
  setEditedTechnical((prev: any) => ({
    ...prev,
    [field]: value
  }))
}
```

**UI 交互**:
- 显示模式：静态卡片展示各参数
- 编辑模式：输入框可修改各参数
- 按钮状态：
  - 显示模式：显示 "编辑" 按钮
  - 编辑模式：显示 "保存"（绿色）和 "取消" 按钮

### 用户价值

1. **灵活性**：AI 生成后可根据实际拍摄条件调整
2. **精准控制**：针对特定场景优化拍摄参数
3. **无损编辑**：可随时取消，不影响原始数据
4. **即时生效**：修改后立即应用到后续流程

## 🔧 新修复：视频Prompt生成时shots缺失

### 问题描述

在生成视频Prompt时，虽然脚本数据包含完整的shots，但生成的Prompt中 "Shots:" 后面是空的：

```
Shots:


Technical: vertical, ring light, mirror shot...
```

### 根本原因

**文件**: `src/services/ai/video/VideoPromptBuilder.ts`

在模板渲染部分（第143-145行），代码直接访问 `params.script.shots`，没有使用前面定义的 `safeShots` fallback逻辑：

```typescript
// ❌ 问题代码（第143-145行）
const shotsList = params.script.shots
  .map((shot) => `- t=${shot.second}s | camera=${shot.camera} | ...`)
  .join('\n')
```

**同样的问题**也存在于 technical 参数（第163-167行）。

当 `params.script` 来自数据库且 `shots` 字段为 `null` 或 `undefined` 时，`.map()` 调用会失败或返回空结果。

### 解决方案

**修改内容**:
```typescript
// ✅ 修复后（第143-146行）
// 使用 safeShots 而不是直接访问 params.script.shots
const shotsList = safeShots
  .map((shot) => `- t=${shot.second}s | camera=${shot.camera} | action=${shot.action} | visibility=${shot.visibility} | audio=${shot.audio}`)
  .join('\n')

// ✅ 修复 technical 参数（第164-169行）
// 使用 tech 变量（已包含fallback）而不是直接访问
'{{tech_orientation}}': tech.orientation,
'{{tech_filmingMethod}}': tech.filmingMethod,
'{{tech_dominantHand}}': tech.dominantHand,
'{{tech_location}}': tech.location,
'{{tech_audioEnv}}': tech.audioEnv,
```

**核心改进**:
1. **统一使用 `safeShots`**：无论是fallback prompt还是模板渲染，都使用相同的安全数据源
2. **统一使用 `tech`**：确保technical参数始终有默认值
3. **防御性编程**：避免直接访问可能不存在的嵌套属性

### 效果对比

**修复前**:
```
Shots:


Technical: vertical, ring light, mirror shot...
```

**修复后**:
```
Shots:
- t=0s | camera=特写 | action=Show induction cooktop's panel & function buttons | visibility=主体清晰可见 | audio=旁白+轻快BGM
- t=5s | camera=半身 | action=Demo switch + spill cleanup | visibility=关键信息可读 | audio=旁白+环境声
- t=10s | camera=特写 | action=Show energy label (level 3) & multi-function menu | visibility=数据/证明清晰 | audio=旁白

Technical: orientation=竖屏; filming=手持; dominantHand=右手; location=家庭厨房; audioEnv=安静室内.
```

## 🎉 总结

通过修复数据层、类型层、UI层和Prompt生成层的四层问题，并清理孤岛页面，成功实现：

### 核心修复
1. **完整保留**后端返回的所有脚本数据（数据层）
2. **正确显示** shots、technical、lines 等关键信息（UI层）
3. **正确生成** 包含完整shots和technical的视频Prompt（Prompt层）✨ **新增**
4. **架构清晰**，唯一用户路径
5. **代码简洁**，无死代码和孤岛页面

### 新增功能
6. **可编辑** 拍摄参数，支持人工精细调整 ✨ **新增**
7. **防御性编程**，所有数据访问都有fallback保护 ✨ **新增**

### 完整数据流

```
脚本生成API
  ↓ (包含 shots, technical, lines)
useVideoGenerationApi
  ↓ (保留完整数据)
ScriptGenerator UI
  ↓ (显示 + 可编辑)
视频生成
  ↓ (使用编辑后的脚本)
VideoPromptBuilder
  ↓ (使用 safeShots 和 tech fallback)
最终视频Prompt
  ✅ 包含完整的 shots 和 technical 信息
```

