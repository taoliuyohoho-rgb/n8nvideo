import type { Organization, User } from '@prisma/client';
import { PrismaClient } from '@prisma/client'
import { PermissionService, UserRole } from '../permission/permission.service'

const prisma = new PrismaClient()

export interface CreateOrganizationData {
  name: string
  description?: string
  adminUserId: string  // 改为选择已有用户ID
}

export interface UpdateOrganizationData {
  name?: string
  description?: string
  isActive?: boolean
}

export class OrganizationService {
  /**
   * 创建组织并分配管理员
   */
  static async createOrganization(
    data: CreateOrganizationData,
    createdBy: string
  ): Promise<{ organization: Organization; admin: User }> {
    // 检查创建者权限
    const creator = await prisma.user.findUnique({
      where: { id: createdBy }
    })
    
    if (!creator) {
      throw new Error('用户不存在')
    }
    
    // 对于临时用户，直接允许创建（开发环境）
    if (createdBy === 'temp_user_id') {
      // 开发环境，允许创建
    } else if (!PermissionService.isSuperAdmin(creator)) {
      throw new Error('只有超级管理员可以创建组织')
    }

    // 检查管理员用户是否存在
    const existingAdmin = await prisma.user.findUnique({
      where: { id: data.adminUserId }
    })

    if (!existingAdmin) {
      throw new Error('选择的用户不存在')
    }

    if (existingAdmin.organizationId) {
      throw new Error('该用户已经属于其他组织')
    }

    // 创建组织并分配管理员
    const result = await prisma.$transaction(async (tx) => {
      // 创建组织
      const organization = await tx.organization.create({
        data: {
          name: data.name,
          description: data.description,
          createdBy: createdBy
        }
      })

      // 更新用户为管理员并分配到组织
      const admin = await tx.user.update({
        where: { id: data.adminUserId },
        data: {
          role: UserRole.ADMIN,
          organizationId: organization.id
        }
      })

      return { organization, admin }
    })

    return result
  }

  /**
   * 获取组织列表
   */
  static async getOrganizations(user: User): Promise<Organization[]> {
    if (PermissionService.isSuperAdmin(user)) {
      // 超级管理员可以看到所有组织
      return await prisma.organization.findMany({
        where: { isActive: true },
        include: {
          users: {
            where: { role: UserRole.ADMIN },
            select: { id: true, email: true, name: true }
          },
          _count: {
            select: { users: true, products: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    }

    // 其他角色只能看到自己的组织
    if (!user.organizationId) {
      return []
    }

    return await prisma.organization.findMany({
      where: { 
        id: user.organizationId,
        isActive: true 
      },
      include: {
        users: {
          where: { role: UserRole.ADMIN },
          select: { id: true, email: true, name: true }
          },
        _count: {
          select: { users: true, products: true }
        }
      }
    })
  }

  /**
   * 获取组织详情
   */
  static async getOrganizationById(
    id: string,
    user: User
  ): Promise<Organization | null> {
    if (PermissionService.isSuperAdmin(user)) {
      return await prisma.organization.findUnique({
        where: { id },
        include: {
          users: {
            select: { id: true, email: true, name: true, role: true, isActive: true }
          },
          _count: {
            select: { users: true, products: true }
          }
        }
      })
    }

    // 其他角色只能查看自己的组织
    if (user.organizationId !== id) {
      return null
    }

    return await prisma.organization.findUnique({
      where: { id },
      include: {
        users: {
          select: { id: true, email: true, name: true, role: true, isActive: true }
        },
        _count: {
          select: { users: true, products: true }
        }
      }
    })
  }

  /**
   * 更新组织信息
   */
  static async updateOrganization(
    id: string,
    data: UpdateOrganizationData,
    user: User
  ): Promise<Organization> {
    // 检查权限
    if (!PermissionService.isSuperAdmin(user)) {
      throw new Error('只有超级管理员可以更新组织信息')
    }

    return await prisma.organization.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date()
      }
    })
  }

  /**
   * 分配管理员
   */
  static async assignAdmin(
    organizationId: string,
    adminEmail: string,
    adminName?: string,
    assignedBy?: string
  ): Promise<User> {
    // 检查组织是否存在
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId }
    })

    if (!organization) {
      throw new Error('组织不存在')
    }

    // 检查邮箱是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { email: adminEmail }
    })

    if (existingUser) {
      // 如果用户已存在，更新其角色和组织
      return await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          role: UserRole.ADMIN,
          organizationId: organizationId,
          name: adminName || existingUser.name
        }
      })
    }

    // 创建新用户
    return await prisma.user.create({
      data: {
        email: adminEmail,
        name: adminName || adminEmail.split('@')[0],
        role: UserRole.ADMIN,
        organizationId: organizationId,
        isActive: true
      }
    })
  }

  /**
   * 删除组织
   */
  static async deleteOrganization(
    id: string,
    user: User
  ): Promise<void> {
    // 检查权限
    if (!PermissionService.isSuperAdmin(user)) {
      throw new Error('只有超级管理员可以删除组织')
    }

    // 检查组织是否有管理员
    const admins = await prisma.user.count({
      where: {
        organizationId: id,
        role: UserRole.ADMIN,
        isActive: true
      }
    })

    if (admins > 0) {
      throw new Error('组织还有管理员，无法删除')
    }

    // 将组织的商品转移给超级管理员
    await prisma.product.updateMany({
      where: { organizationId: id },
      data: { organizationId: null }
    })

    // 删除组织
    await prisma.organization.delete({
      where: { id }
    })
  }

  /**
   * 获取组织统计信息
   */
  static async getOrganizationStats(organizationId: string, user: User) {
    // 检查权限
    if (!PermissionService.isSuperAdmin(user) && user.organizationId !== organizationId) {
      throw new Error('权限不足')
    }

    const [userCount, productCount, videoCount] = await Promise.all([
      prisma.user.count({
        where: { organizationId, isActive: true }
      }),
      prisma.product.count({
        where: { organizationId }
      }),
      prisma.video.count({
        where: {
          user: { organizationId }
        }
      })
    ])

    return {
      userCount,
      productCount,
      videoCount
    }
  }
}
