# 清除浏览器缓存指南

## 🔧 已完成的服务器端修复

✅ 已删除 `.next` 缓存目录
✅ 已重启开发服务器
✅ 已修改代码移除进度API调用
✅ 服务器运行在 http://localhost:3000

## 🌐 浏览器缓存清除步骤

### 方法1：硬刷新（推荐）

#### macOS
1. 打开浏览器访问 http://localhost:3000
2. 按 **Cmd + Shift + R**（强制刷新）
3. 或按 **Cmd + Option + R**（清空缓存并刷新）

#### Windows/Linux
1. 打开浏览器访问 http://localhost:3000  
2. 按 **Ctrl + Shift + R**（强制刷新）
3. 或按 **Ctrl + F5**（清空缓存并刷新）

### 方法2：手动清除缓存

#### Chrome/Edge
1. 打开开发者工具（F12）
2. 右键点击刷新按钮
3. 选择 "清空缓存并硬性重新加载"

#### Firefox
1. 打开开发者工具（F12）
2. 右键点击刷新按钮
3. 选择 "清空缓存并硬性刷新"

#### Safari
1. 按 **Cmd + Option + E** 清空缓存
2. 按 **Cmd + R** 刷新页面

### 方法3：无痕模式测试

1. 打开浏览器的无痕/隐私模式
2. 访问 http://localhost:3000
3. 测试功能是否正常

## ✅ 验证修复成功

刷新后，检查浏览器开发者工具（F12）的 Console 标签：

**修复前**（会看到）：
```
GET http://localhost:3000/api/progress/update?id=script_xxx 404 (Not Found)
```

**修复后**（不应该看到）：
- ✅ 没有404错误
- ✅ 脚本生成功能正常
- ✅ 进度条正常显示（使用本地模拟）

## 🔍 如果问题仍然存在

1. **完全关闭浏览器**，然后重新打开
2. **检查是否有多个标签页**打开了应用
3. **检查浏览器扩展**是否干扰了加载
4. **使用另一个浏览器**测试
5. **查看终端日志**：
   ```bash
   tail -f /tmp/n8nvideo-dev.log
   ```

## 📝 修复内容总结

### 修改的文件
1. ✅ `components/video-generation/ScriptGenerator.tsx`
   - 移除API轮询
   - 改为本地模拟进度

2. ✅ `components/video-generation/hooks/useVideoGenerationApi.ts`
   - 改用 `/api/script/generate` API
   - 移除 Template 依赖

3. ✅ `app/api/ai/generate-prompt/route.ts`
   - 禁用进度回调
   - 改为console.log

### 技术原理
- **问题**：前端每500ms轮询不存在的 `/api/progress/update` API
- **修复**：改为本地模拟进度，不再请求服务器
- **效果**：消除404错误，减少网络请求，保持用户体验

## 🎯 后续测试

清除缓存并刷新后，请测试：
1. ✅ 视频生成页面加载正常
2. ✅ 选择商品 → 选择人设 → 生成脚本
3. ✅ 控制台无404错误
4. ✅ 进度条正常显示
5. ✅ 脚本成功生成

---

**最后更新**：2025-10-30

