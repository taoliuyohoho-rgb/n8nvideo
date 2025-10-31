/**
 * 管理后台相关类型定义
 */

export interface NotificationState {
  type: 'success' | 'error' | 'info'
  message: string
}

export interface UserFormData {
  name: string
  email: string
  password?: string
  role: 'super_admin' | 'admin' | 'operator'
  organizationId?: string | null
}

export interface Organization {
  id: string
  name: string
}

export interface ProductManagementState {
  selectedProducts: string[]
  managedCategories: string[]
  managedSubcategories: string[]
  managedCountries: string[]
  setSelectedProducts: (products: string[]) => void
  setManagedCategories: (categories: string[]) => void
  setManagedSubcategories: (subcategories: string[]) => void
  setManagedCountries: (countries: string[]) => void
}

export interface ProductManagementActions {
  handleDeleteProduct: (productId: string) => Promise<void>
  handleSelectProduct: (productId: string, selected: boolean) => void
  handleSelectAll: (selected: boolean) => void
  handleRefresh: () => Promise<void>
  handleProductSave: (productData: any) => Promise<void>
  handleProductUpdate: (productId: string, productData: any) => Promise<void>
  handleBulkUploadFile: (file: File) => Promise<void>
  refreshCategoriesConfig: () => Promise<{ success: boolean; error?: string }>
}

export interface UserManagementActions {
  handleAddUser: () => Promise<void>
  handleEditUser: (user: any) => Promise<void>
  handleDeleteUser: (userId: string) => Promise<void>
  // 模态框状态
  isAddModalOpen: boolean
  setIsAddModalOpen: (open: boolean) => void
  isEditModalOpen: boolean
  setIsEditModalOpen: (open: boolean) => void
  editingUser: any | null
  setEditingUser: (user: any | null) => void
  // 表单提交处理
  handleAddUserSubmit: (formData: UserFormData) => Promise<void>
  handleEditUserSubmit: (formData: UserFormData) => Promise<void>
}

export interface PersonaManagementActions {
  handleDeletePersona: (personaId: string) => Promise<void>
  handleRefreshPersonas: () => Promise<void>
}

export interface NotificationActions {
  showSuccess: (message: string) => void
  showError: (message: string) => void
  showInfo: (message: string) => void
  hide: () => void
}
