# 人设业务模块 PRD

## 1. 业务概述

**模块名称**: 人设生成 (Persona Generation)  
**业务目标**: 为视频生成提供统一的创作者角色，确保视频脚本风格一致性和真实性

## 2. 核心概念

**人设 (Persona)**: 系统中固定的创作者角色，用于在生成视频prompt时统一风格和调性

## 3. 人设字段结构 (参考UGC Generator优化)

### 3.1 商品相关字段 (Product-related) - 必填
- **商品名称** (Product Name) - 必填，用于匹配对应商品
- **商品类目** (Product Category) - 必填，与商品库对齐
- **目标受众** (Target Audience) - 必填
- **目标市场** (Target Market) - 必填
- **商品描述** (Product Description) - 必填

### 3.2 具体设定字段 (Persona Details) - 参考UGC Generator
- **核心身份** (Core Identity)
  - 姓名 (Name)
  - 年龄 (Age) - 具体数字
  - 性别 (Sex/Gender)
  - 位置 (Location) - 贴合目标市场的真实生活环境
  - 职业 (Occupation) - 具体到工种/场景

- **外在形象** (Physical Appearance & Personal Style)
  - 整体外观 (General Appearance)
  - 发型 (Hair) - 颜色、风格、典型状态
  - 服装风格 (Clothing Aesthetic) - 描述性标签
  - 标志性细节 (Signature Details) - 小特征

- **性格与沟通** (Personality & Communication)
  - 核心性格特征 (Key Personality Traits) - 5-7个形容词
  - 举止与能量水平 (Demeanor & Energy Level)
  - 沟通风格 (Communication Style)

- **生活方式与世界观** (Lifestyle & Worldview)
  - 兴趣爱好 (Hobbies & Interests)
  - 价值观与优先级 (Values & Priorities)
  - 日常困扰/痛点 (Daily Frustrations / Pain Points)
  - 家庭环境 (Home Environment)

- **可信度来源** (Core Credibility)
  - 为什么TA对该品类可信 (1-2句说明)

### 3.3 人设风格字段 (Persona Style)
- **内容风格** (Content Style) - 兴奋发现/随意推荐/即时演示
- **表达能量** (Energy Level) - 兴奋/冷静/实事求是/咖啡因/半醒
- **语言习惯** (Language Patterns) - 使用"like"、"literally"等填充词
- **视觉风格** (Visual Style) - 手持摇晃/自然移动/真实照明

## 4. 功能需求

### 4.1 管理员功能 (Admin页面)
- **人设管理**: 在admin页面管理人设库
- **人设创建**: 手动创建和编辑人设
- **人设编辑**: 修改现有人设信息
- **人设删除**: 删除不需要的人设

### 4.2 用户功能 (Workbench)
- **自动推荐**: 输入商品信息后，推荐引擎自动推荐合适的人设
- **手动生成**: 提供"生成人设"按钮，复用admin的人设创建模块
- **人设选择**: 从推荐结果中选择人设
- **人设应用**: 将选中的人设应用到视频生成流程

### 4.3 推荐引擎集成
- **人设推荐**: 根据商品类目、目标受众等推荐合适人设
- **模型推荐**: 推荐最适合的AI模型生成人设
- **Prompt推荐**: 推荐最适合的人设生成prompt

## 5. 数据流程

```
用户输入商品信息 → 推荐引擎分析 → 自动推荐人设候选 → 用户选择/手动生成 → 应用到视频生成
```

## 6. 界面设计

### 6.1 业务模块概览
- 添加"人设生成"标签卡
- 显示输入字段、输出格式、输出规则、模板数量

### 6.2 Admin页面
- 将"风格库"重命名为"人设表"
- 添加人设管理功能
- 支持人设的CRUD操作

### 6.3 Workbench集成
- 在视频生成流程中集成人设选择
- 提供"生成人设"按钮，复用admin创建模块
- 人设生成后自动保存到人设表

## 7. 技术实现

### 7.1 数据库设计
- 创建 `Persona` 表
- 字段包括商品相关、具体设定、人设风格三大类
- 与商品库建立关联关系

### 7.2 API设计
- `/api/personas` - 人设CRUD
- `/api/personas/recommend` - 人设推荐
- `/api/personas/generate` - 人设生成

### 7.3 推荐系统集成
- 扩展推荐引擎支持人设推荐
- 基于商品特征匹配人设特征

## 8. 验收标准

1. ✅ 业务模块概览显示人设生成标签卡
2. ✅ Admin页面有人设管理功能（重命名风格库为人设表）
3. ✅ 推荐引擎能推荐合适的人设
4. ✅ 用户能在workbench中选择人设
5. ✅ 用户能通过"生成人设"按钮手动创建人设
6. ✅ 生成的人设自动保存到人设表
7. ✅ 人设数据能正确存储和查询

## 9. 参考文件

- UGC Generator JSON: 参考人设字段结构和生成逻辑
- 现有商品分析模块: 参考界面设计和交互流程
- 推荐系统: 参考推荐引擎集成方式

## 10. 开发优先级

1. **P0**: 创建Persona数据模型和基础API
2. **P0**: 更新业务模块概览页面
3. **P0**: Admin页面人设管理功能
4. **P1**: 推荐引擎集成
5. **P1**: Workbench人设选择和生成功能
6. **P2**: 人设模板优化和扩展
