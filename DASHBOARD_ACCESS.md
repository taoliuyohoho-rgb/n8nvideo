# Dashboard 访问说明

## 问题说明

如果直接访问 `/dashboard` 页面显示"加载中..."，这是正常行为，因为该页面需要用户登录后才能访问。

## 访问步骤

1. **访问登录页面**
   ```
   http://localhost:3000/login
   ```

2. **使用以下凭证登录**
   - 邮箱：`admin@126.com`
   - 密码：`dongnanyaqifei`

3. **登录成功后**
   - 系统会自动将用户信息保存到 localStorage
   - 自动跳转到 `/dashboard` 页面
   - Dashboard 页面会正常显示内容

## 技术说明

### 为什么直接访问 Dashboard 会一直加载？

1. **服务端渲染（SSR）**
   - Next.js 首先在服务端渲染页面
   - 服务端无法访问 localStorage（浏览器API）
   - 因此初始状态为 `loading = true`

2. **客户端水合（Hydration）**
   - 浏览器加载页面后，React 客户端代码开始执行
   - `useEffect` 检查 localStorage 中是否有用户数据
   - 如果没有用户数据，会尝试跳转到登录页面

3. **Loading 状态**
   - 在客户端JavaScript加载和执行期间，页面显示"加载中..."
   - 这是正常的Next.js行为

### 已修复的问题

1. ✅ **ServiceDiscovery.ts 的TypeScript错误**
   - 修复了 `chosenName` 可能为 `undefined` 的问题
   - 修复了使用不存在的属性的问题

2. ✅ **缺失的API端点**
   - 创建了 `/api/admin/history` API端点
   - 使用正确的Prisma模型（Video）

3. ✅ **useEffect无限循环**
   - 移除了 `router` 依赖，避免无限重新渲染

4. ✅ **TypeScript导入错误**
   - 添加了缺失的 `useEffect` 导入

## 测试方法

### 方法1：使用浏览器访问（推荐）

1. 打开浏览器访问 `http://localhost:3000/login`
2. 输入登录凭证并登录
3. 自动跳转到dashboard页面

### 方法2：使用curl测试（仅用于测试API）

```bash
# 测试登录API
curl -X POST http://localhost:3000/api/auth/simple-login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@126.com","password":"dongnanyaqifei"}'

# 测试history API
curl http://localhost:3000/api/admin/history

# 测试其他API
curl http://localhost:3000/api/admin/users
curl http://localhost:3000/api/products
```

## 常见问题

### Q: 为什么直接访问dashboard一直显示"加载中"？
A: 因为用户没有登录，localStorage中没有用户数据。需要先登录。

### Q: 如何登录？
A: 访问 `/login` 页面，使用上述凭证登录。

### Q: 登录后如何访问dashboard？
A: 登录成功后会自动跳转，或者直接访问 `/dashboard`。

### Q: 如何退出登录？
A: 在dashboard页面中点击"退出登录"按钮，或者手动清除localStorage。

## 相关文件

- 登录页面：`app/login/page.tsx`
- Dashboard页面：`app/dashboard/page.tsx`
- Dashboard数据Hook：`app/dashboard/hooks/useDashboardData.ts`
- 登录API：`app/api/auth/simple-login/route.ts`
- History API：`app/api/admin/history/route.ts`

