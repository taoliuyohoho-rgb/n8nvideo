# 权限系统更新说明

## 📋 更新概述

本次更新调整了系统的权限体系，明确区分了**超级管理员（super_admin）**和**普通管理员（admin）**的权限：

- **超级管理员（super_admin）**：拥有完整的系统管理权限，可以访问管理后台
- **普通管理员（admin）**：只能访问仪表板（dashboard），无法进入管理后台

## 🔐 账号信息

### 超级管理员账号
```
邮箱: superadmin@126.com
密码: dongnanyaqifei
角色: super_admin
权限: 可访问管理后台 (/admin) 和仪表板 (/dashboard)
```

### 普通管理员账号
```
邮箱: admin@126.com
密码: dongnanyaqifei
角色: admin
权限: 只能访问仪表板 (/dashboard)，无法访问管理后台
```

## 📝 修改内容

### 1. 首页跳转逻辑 (`app/page.tsx`)

**修改前：**
```typescript
// 管理员用户直接跳转到admin页面
if (user.role === 'admin' || user.role === 'super_admin') {
  router.push('/admin')
}
```

**修改后：**
```typescript
// 只有超管可以跳转到admin页面
if (user.role === 'super_admin') {
  router.push('/admin')
} else {
  // 其他用户（包括admin）跳转到dashboard
  router.push('/dashboard')
}
```

### 2. Dashboard 管理后台入口 (`app/dashboard/components/HomeContent.tsx`)

**修改前：**
```typescript
{user.role === 'admin' && (
  <Button onClick={() => window.open('/admin', '_blank')}>
    管理后台
  </Button>
)}
```

**修改后：**
```typescript
{user.role === 'super_admin' && (
  <Button onClick={() => window.open('/admin', '_blank')}>
    管理后台
  </Button>
)}
```

### 3. 管理后台权限检查 (`app/admin/page.tsx`)

**修改前：**
```typescript
// 检查用户权限
if (user && user.role !== 'admin' && user.role !== 'super_admin') {
  // 显示无权限页面
}
```

**修改后：**
```typescript
// 只有超管可以访问
if (user && user.role !== 'super_admin') {
  // 显示无权限页面：只有超级管理员才能访问管理后台
}
```

### 4. 登录接口更新

#### `/app/api/auth/login/route.ts`
新增超级管理员账号验证逻辑，保留原有管理员账号但角色为 `admin`

#### `/app/api/auth/simple-login/route.ts`
同步更新简单登录接口的验证逻辑

## 🎯 权限矩阵

| 功能/页面 | super_admin | admin | manager | operator | viewer |
|----------|-------------|-------|---------|----------|--------|
| 登录系统 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 仪表板 (/dashboard) | ✅ | ✅ | ✅ | ✅ | ✅ |
| 管理后台 (/admin) | ✅ | ❌ | ❌ | ❌ | ❌ |
| 查看管理后台入口 | ✅ | ❌ | ❌ | ❌ | ❌ |
| 查看组织使用统计 | ✅ | ✅ | ❌ | ❌ | ❌ |
| 视频生成 | ✅ | ✅ | ✅ | ✅ | ⚠️ |
| 商品管理 | ✅ | ✅ | ✅ | ⚠️ | ❌ |
| AI配置管理 | ✅ | ❌ | ❌ | ❌ | ❌ |
| 用户管理 | ✅ | ❌ | ❌ | ❌ | ❌ |
| Prompt管理 | ✅ | ❌ | ❌ | ❌ | ❌ |
| 人设管理 | ✅ | ❌ | ❌ | ❌ | ❌ |

> ⚠️ 表示部分权限（如只读或受限操作）

## 🧪 测试步骤

### 测试 1: 超级管理员登录
1. 访问 `http://localhost:3000/login`
2. 使用超管账号登录：`superadmin@126.com` / `dongnanyaqifei`
3. **预期结果**：
   - 自动跳转到 `/admin` 管理后台
   - 可以看到所有管理功能标签页
   - 可以正常使用所有功能

### 测试 2: 普通管理员登录
1. 访问 `http://localhost:3000/login`
2. 使用admin账号登录：`admin@126.com` / `dongnanyaqifei`
3. **预期结果**：
   - 自动跳转到 `/dashboard` 仪表板
   - **看不到**"管理后台"按钮
   - 可以正常使用仪表板所有功能
   - 可以查看组织使用统计

### 测试 3: 直接访问管理后台（admin账号）
1. 使用admin账号登录后
2. 手动访问 `http://localhost:3000/admin`
3. **预期结果**：
   - 显示"无权限访问"页面
   - 提示"只有超级管理员才能访问管理后台"
   - 自动重定向到首页

### 测试 4: 未登录访问
1. 清除浏览器localStorage中的用户信息
2. 访问 `http://localhost:3000/admin`
3. **预期结果**：
   - 检测到未登录
   - 自动重定向到登录页面

## 🔄 回滚方案

如果需要回滚到之前的权限系统（admin也可以访问管理后台），修改以下文件：

1. `app/page.tsx`: 将 `user.role === 'super_admin'` 改回 `user.role === 'admin' || user.role === 'super_admin'`
2. `app/dashboard/components/HomeContent.tsx`: 将 `user.role === 'super_admin'` 改回 `user.role === 'admin'`
3. `app/admin/page.tsx`: 将两处 `user.role !== 'super_admin'` 改回 `user.role !== 'admin' && user.role !== 'super_admin'`

## 📌 注意事项

1. **数据库role字段**：确保数据库中用户的 `role` 字段正确设置为 `super_admin` 或 `admin`
2. **环境变量**：权限检查不依赖环境变量，直接从用户数据的 `role` 字段判断
3. **前后端一致性**：前端路由和UI显示都基于localStorage中的用户role，与后端API权限保持一致
4. **安全性**：重要的后端API（如 `/api/admin/*`）应该也加上权限检查中间件（后续待完善）

## 🚀 后续优化建议

1. **统一权限中间件**：创建一个统一的权限检查中间件，用于所有管理后台API
2. **权限枚举**：将角色名称改为枚举类型，避免字符串硬编码
3. **细粒度权限**：考虑实现基于资源和操作的RBAC权限系统
4. **权限配置化**：将权限矩阵配置化，便于灵活调整
5. **审计日志**：记录所有权限相关的操作日志，便于追溯

## 📅 更新日期

2025年10月31日

