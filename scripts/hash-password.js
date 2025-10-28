#!/usr/bin/env node

/**
 * 密码哈希生成工具
 * 
 * 用途：为生产环境生成安全的 bcrypt 密码哈希
 * 
 * 使用方式：
 *   node scripts/hash-password.js "your-password"
 */

const bcrypt = require('bcryptjs');

// 从命令行参数获取密码
const password = process.argv[2];

if (!password) {
  console.error('❌ 错误：请提供要哈希的密码');
  console.log('\n使用方式：');
  console.log('  node scripts/hash-password.js "your-password"');
  console.log('\n示例：');
  console.log('  node scripts/hash-password.js "MySecurePassword123!"');
  process.exit(1);
}

// 生成哈希
const saltRounds = 10;
const hash = bcrypt.hashSync(password, saltRounds);

console.log('\n✅ 密码哈希生成成功！\n');
console.log('将以下哈希值添加到环境变量 ADMIN_PASSWORD_HASH：\n');
console.log('─'.repeat(80));
console.log(hash);
console.log('─'.repeat(80));
console.log('\n在 .env.production 或云平台环境变量中设置：');
console.log(`ADMIN_PASSWORD_HASH="${hash}"`);
console.log('\n⚠️  警告：不要将此哈希提交到 Git 仓库！\n');

// 验证哈希
const isValid = bcrypt.compareSync(password, hash);
console.log(`✓ 哈希验证: ${isValid ? '通过' : '失败'}`);

