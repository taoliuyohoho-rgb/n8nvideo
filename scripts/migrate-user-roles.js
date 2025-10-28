const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrateUserRoles() {
  console.log('开始迁移用户角色...');

  try {
    // 将所有非admin角色统一改为operator
    const result = await prisma.user.updateMany({
      where: {
        role: {
          not: 'admin'
        }
      },
      data: {
        role: 'operator'
      }
    });

    console.log(`✅ 成功迁移 ${result.count} 个用户角色为"运营"`);

    // 显示迁移后的用户列表
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log('\n📋 迁移后的用户列表:');
    users.forEach(user => {
      console.log(`- ${user.name} (${user.email}): ${user.role === 'admin' ? '管理员' : '运营'}`);
    });

  } catch (error) {
    console.error('❌ 迁移失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateUserRoles();
