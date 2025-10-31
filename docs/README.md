# n8nvideo 项目文档

## 📚 文档导航

### 核心文档
- [产品需求文档 (PRD)](./core/PRD.md) - 项目整体产品规划和需求
- [工程技术手册](./core/ENGINEERING.md) - 技术架构和开发规范
- [项目规则](./core/PROJECT_RULES.md) - 开发协作和代码规范

### 功能模块

#### 🎬 视频生成
- [视频生成 PRD](./features/video-generation/PRD_VIDEO_GENERATION.md) - 视频生成功能需求
- [视频生成实现](./features/video-generation/VIDEO_GENERATION_IMPLEMENTATION.md) - 实现细节
- [视频生成 UI 更新](./features/video-generation/VIDEO_GENERATION_UI_UPDATE.md) - UI 优化

#### 🔍 竞品分析
- [竞品分析统一架构](./features/competitor-analysis/COMPETITOR_ANALYSIS_UNIFIED.md) - 核心架构
- [竞品分析更新](./features/competitor-analysis/COMPETITOR_ANALYSIS_UPDATE.md) - 功能更新
- [竞品反馈循环](./features/competitor-analysis/COMPETITOR_FEEDBACK_LOOP.md) - 反馈机制
- [竞品分析测试](./features/competitor-analysis/COMPETITOR_ANALYSIS_TEST.md) - 测试相关
- [竞品分析修复](./features/competitor-analysis/COMPETITOR_FINAL_FIX.md) - 问题修复
- [竞品 UI 优化](./features/competitor-analysis/COMPETITOR_UI_OPTIMIZATION.md) - UI 改进

#### 🎯 推荐引擎
- [推荐引擎设计](./features/recommendation/RECOMMENDATION_ENGINE.md) - 核心设计
- [推荐引擎隐式反馈](./features/recommendation/RECOMMENDATION_IMPLICIT_FEEDBACK.md) - 反馈机制

#### 📦 商品管理
- [商品管理重构 PRD](./features/product-management/ProductManagement_Refactoring_PRD.md) - 重构需求
- [Prompts Tab 重构](./features/product-management/PRD_PromptsTab_Refactoring.md) - Tab 重构

#### 👤 用户角色
- [用户角色生成 PRD](./features/persona/PRD_PERSONA_GENERATION.md) - 角色生成需求
- [用户角色实现完成](./features/persona/PERSONA_IMPLEMENTATION_COMPLETE.md) - 实现状态

### 技术文档

#### 🐛 错误处理
- [错误处理总览](./error/README.md) - 错误处理指南
- [运行时错误](./error/runtime-errors.md) - 运行时错误处理
- [TypeScript 错误](./error/typescript-errors.md) - TS 错误处理
- [UI 错误](./error/ui-errors.md) - UI 错误处理

#### 📝 TypeScript
- [TypeScript 错误修复指南](./technical/typescript/TYPESCRIPT_ERROR_GUIDE.md) - 修复指南
- [TypeScript 错误日志](./technical/typescript/TYPESCRIPT_ERROR_LOG.md) - 错误记录

#### 🛠️ 实现指南
- [最终实现文档](./technical/implementation/FINAL_IMPLEMENTATION.md) - 实现总结
- [实现检查清单](./technical/implementation/IMPLEMENTATION_CHECKLIST.md) - 检查项
- [P0 切片1 测试](./technical/implementation/P0_SLICE_1_TESTING.md) - 测试文档
- [P0 切片1 V4 最终版](./technical/implementation/P0_SLICE_1_V4_FINAL.md) - 最终版本

### 项目管理

#### 🧪 测试
- 测试相关文档（待补充）

#### 🚀 部署
- 部署相关文档（待补充）

#### 📋 规则
- [Cursor 用户规则](./project-management/rules/CURSOR_USER_RULES.md) - 开发协作规则

### 数据与集成
- [批量抓取设计](./data-integration/SCRAPING_BATCH_DESIGN.md) - 数据抓取方案

## 📖 快速开始

1. **新开发者**：先阅读 [核心文档](#核心文档) 了解项目整体架构
2. **功能开发**：查看对应 [功能模块](#功能模块) 的 PRD 和实现文档
3. **问题排查**：参考 [技术文档](#技术文档) 中的错误处理指南
4. **代码规范**：遵循 [项目规则](./core/PROJECT_RULES.md) 和 [用户规则](./project-management/rules/CURSOR_USER_RULES.md)

## 🔄 文档更新

- 新增功能时，请在对应分类下创建文档
- 重要变更需要更新相关文档
- 定期清理过时和重复的文档

## 📝 文档规范

- 使用 Markdown 格式
- 文件名使用大写字母和下划线
- 重要文档需要包含版本信息和更新日期
- 提供清晰的目录结构和导航链接
