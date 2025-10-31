# 导航优化 - 孤岛页面整合

## 更新时间
2025-10-31

## 背景
排查发现多个功能完善的页面缺少导航入口，成为"孤岛页面"。本次更新将这些页面集成到管理后台的统一导航中。

## 变更内容

### 1. 清理测试页面 ✅
删除了以下测试页面，减少代码冗余：
- `/app/test-progress/page.tsx`
- `/app/test-persona/page.tsx`
- `/app/test-page/page.tsx`

### 2. 新增"数据分析"Tab ✅
在 `/app/admin/page.tsx` 中新增"数据分析"tab，集成以下功能：

#### 2.1 数据看板
- **路径**: `/admin/dashboard`
- **功能**: 广告表现数据分析
- **维度**: 商品/国家/平台/店铺四个维度
- **特性**: 支持下钻分析、时间范围筛选、数据导出
- **集成方式**: iframe嵌入
- **操作**: 可在新窗口打开独立访问

#### 2.2 视频分析中心
- **路径**: `/admin/video-analysis`
- **功能**: 
  - 视频上传分析
  - URL视频分析
  - 竞品视频分析
  - 参考视频管理
- **集成方式**: iframe嵌入
- **操作**: 可在新窗口打开独立访问

#### 2.3 商品映射管理
- **路径**: `/admin/mapping`
- **功能**: 
  - 管理商品与广告平台的映射关系
  - AI推荐映射的确认/拒绝
  - 支持搜索和多维度筛选（状态、平台）
- **集成方式**: iframe嵌入
- **操作**: 可在新窗口打开独立访问

### 3. 修复推荐系统监控集成 ✅
- **路径**: `/admin/recommend/monitor`
- **位置**: 任务管理tab → 推荐系统监控部分
- **功能**: 
  - 实时监控推荐引擎性能指标
  - 红线告警（Fallback率、延迟）
  - 场景拆分分析
  - 5秒自动刷新
- **集成方式**: iframe嵌入到TaskManagement组件

### 4. 保留的独立页面
以下页面保留为独立访问点，未集成到导航：
- `/admin/dashboard-simple` - 数据看板简化版（备选方案）
- `/persona-generation` - 独立人设生成工作流

## 导航结构（更新后）

```
管理后台 (/admin)
├── 商品管理 (products)
├── 任务管理 (tasks)
│   ├── 任务监控
│   ├── 预估模型监控
│   ├── 预估模型测试
│   └── 推荐系统监控 [NEW FIX]
├── 数据分析 (analytics) [NEW]
│   ├── 数据看板
│   ├── 视频分析中心
│   └── 商品映射管理
├── 人设管理 (personas)
├── 用户管理 (users)
├── AI配置 (ai-config)
└── 提示词管理 (prompts)
```

## 技术实现

### Tab配置
```typescript
// TabsList 从 grid-cols-6 改为 grid-cols-7
<TabsList className="grid w-full grid-cols-7">
  {/* 新增数据分析tab */}
  <TabsTrigger value="analytics">
    <LineChart className="h-4 w-4" />
    数据分析
  </TabsTrigger>
</TabsList>
```

### iframe集成方案
使用iframe嵌入的优势：
- ✅ 不影响现有页面逻辑
- ✅ 保持页面独立性，可单独访问
- ✅ 简化集成复杂度
- ✅ 提供"在新窗口打开"选项

```typescript
<div className="border rounded-lg overflow-hidden" style={{ height: '70vh' }}>
  <iframe
    src="/admin/dashboard"
    style={{ width: '100%', height: '100%' }}
    title="数据看板"
  />
</div>
```

## 用户体验改进
1. **统一入口**: 所有功能从管理后台统一访问
2. **灵活切换**: 支持tab内查看或新窗口打开
3. **清晰组织**: 按功能分类（商品、任务、分析、配置）
4. **避免孤岛**: 消除需要手动输入URL才能访问的页面

## 验收标准
- [x] 测试页面已删除
- [x] 数据分析tab添加成功
- [x] 三个功能页面可通过iframe正常访问
- [x] 推荐监控在任务管理中正常显示
- [x] "在新窗口打开"功能正常
- [x] PRD文档已更新
- [x] 无TypeScript/ESLint错误

## 后续优化建议

### 短期
1. 为iframe页面添加loading状态
2. 优化iframe通信（如需要）
3. 添加页面访问权限控制

### 长期
1. 考虑将常用功能从iframe改为原生组件集成
2. 统一页面样式和交互体验
3. 添加使用数据埋点，分析功能使用率

## 相关文档
- PRD: `/docs/core/PRD.md` - 已更新管理台功能列表
- 项目规则: `/docs/core/PROJECT_RULES.md`
- 用户规则: `/docs/project-management/rules/CURSOR_USER_RULES.md`

