// 简单的认证实现，实际项目中应该使用更安全的认证方式
export async function getCurrentUser(request?: any) {
  // 这里应该从 session 或 token 中获取用户信息
  // 现在返回一个模拟用户
  return {
    id: 'user-1',
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'admin',
    organizationId: 'org-1'
  };
}
