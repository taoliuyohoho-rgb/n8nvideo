# P0 切片 1 测试文档

## 功能概述
商品预填功能：用户在视频制作表单输入商品名，点击"一键填充"，系统从商品库查询并自动填充卖点、目标国家、痛点等字段。

## API 测试

### 测试用例 1：精确匹配商品
```bash
curl -X POST http://localhost:3000/api/products/prefill \
  -H "Content-Type: application/json" \
  -d '{"productName": "电磁炉"}'
```

预期响应：
```json
{
  "success": true,
  "data": {
    "found": true,
    "product": {
      "id": "...",
      "name": "电磁炉",
      "description": "...",
      "sellingPoints": ["..."],
      "targetCountries": ["..."]
    },
    "needsAI": {
      "description": false,
      "sellingPoints": false,
      ...
    },
    "candidates": []
  }
}
```

### 测试用例 2：模糊匹配
```bash
curl -X POST http://localhost:3000/api/products/prefill \
  -H "Content-Type: application/json" \
  -d '{"productName": "电磁"}'
```

预期响应：返回候选列表（fuzzy matches）

### 测试用例 3：未找到商品
```bash
curl -X POST http://localhost:3000/api/products/prefill \
  -H "Content-Type: application/json" \
  -d '{"productName": "不存在的商品xyz123"}'
```

预期响应：
```json
{
  "success": true,
  "data": {
    "found": false,
    "needsAI": { "name": true, "description": true, ... },
    "candidates": []
  }
}
```

## 前端测试

### 测试步骤（新交互）
1. 启动开发服务器：`npm run dev`
2. 登录系统（`/login`）
3. 进入 Dashboard（`/dashboard`）
4. 点击"视频生成"标签
5. 点击或聚焦"商品名称"输入框
6. 输入"电磁"（模糊搜索）
7. 从下拉列表选择商品

### 预期结果
- **实时过滤**：输入时下拉列表实时显示匹配商品（最多10条）
- **自动填充**：选择商品后
  - 输入框显示完整商品名
  - 加载动画显示（右侧spinner）
  - 表单字段自动填充：卖点、痛点、目标国家
  - 显示绿色确认条："✓ 已选择：电磁炉"，带"重新选择"按钮
- **点击外部关闭**：点击输入框外部，下拉列表自动关闭
- **重新选择**：点击"重新选择"，清空所有字段

### 边界测试
- 空输入：显示全部商品（下拉列表）
- 无匹配：下拉显示"未找到匹配商品"
- 已选择后再输入：下拉重新打开，可切换商品

## 验收标准
- ✅ API响应时间 < 500ms（100条商品以内）
- ✅ 前端交互流畅，无卡顿
- ✅ 错误提示友好清晰
- ✅ 字段自动填充准确，不覆盖用户已输入内容（营销信息、目标受众保留）

## 下一步（切片 2）
- 风格召回与确认（Top-N + 理由）
- 置信度门控与回退逻辑

