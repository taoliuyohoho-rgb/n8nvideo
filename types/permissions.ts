/**
 * 权限相关类型定义
 */

export enum Resource {
  ORGANIZATIONS = 'organizations',
  USERS = 'users',
  PRODUCTS = 'products',
  VIDEOS = 'videos',
  ANALYTICS = 'analytics'
}

export enum Action {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  MANAGE = 'manage'
}
