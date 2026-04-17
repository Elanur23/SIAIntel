/**
 * RBAC PERMISSIONS - Centralized Permission Definitions
 * 
 * All permissions are defined here to avoid scattered hardcoded checks.
 * Each permission represents a specific action that can be granted to roles.
 */

export type Permission =
  // Admin Panel Access
  | 'access_admin_panel'
  
  // Content Management
  | 'publish_content'
  | 'delete_content'
  | 'bulk_delete'
  | 'edit_content'
  | 'view_content'
  
  // Settings & Configuration
  | 'update_settings'
  | 'manage_security'
  | 'manage_integrations'
  
  // User & Role Management
  | 'manage_users'
  | 'manage_roles'
  | 'view_users'
  
  // Audit & Analytics
  | 'view_audit_logs'
  | 'view_analytics'
  | 'export_data'
  
  // Distribution System
  | 'manage_distribution'
  | 'view_distribution'
  
  // 2FA Management
  | 'manage_2fa'
  | 'disable_user_2fa'

export type Role = 
  | 'super_admin'
  | 'admin'
  | 'editor'
  | 'analyst'
  | 'viewer'

/**
 * Role-Permission Matrix
 * Defines which permissions each role has
 */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  super_admin: [
    // Full access to everything
    'access_admin_panel',
    'publish_content',
    'delete_content',
    'bulk_delete',
    'edit_content',
    'view_content',
    'update_settings',
    'manage_security',
    'manage_integrations',
    'manage_users',
    'manage_roles',
    'view_users',
    'view_audit_logs',
    'view_analytics',
    'export_data',
    'manage_distribution',
    'view_distribution',
    'manage_2fa',
    'disable_user_2fa',
  ],
  
  admin: [
    // Most permissions except user/role management
    'access_admin_panel',
    'publish_content',
    'delete_content',
    'bulk_delete',
    'edit_content',
    'view_content',
    'update_settings',
    'manage_integrations',
    'view_users',
    'view_audit_logs',
    'view_analytics',
    'export_data',
    'manage_distribution',
    'view_distribution',
    'manage_2fa',
  ],
  
  editor: [
    // Content management only
    'access_admin_panel',
    'publish_content',
    'edit_content',
    'view_content',
    'view_analytics',
    'view_distribution',
  ],
  
  analyst: [
    // Read-only analytics and audit
    'access_admin_panel',
    'view_content',
    'view_audit_logs',
    'view_analytics',
    'export_data',
    'view_distribution',
  ],
  
  viewer: [
    // Minimal read-only access
    'access_admin_panel',
    'view_content',
    'view_analytics',
  ],
}

/**
 * Check if a role has a specific permission
 */
export function roleHasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission)
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role]
}

/**
 * Get role hierarchy level (for comparison)
 */
export function getRoleLevel(role: Role): number {
  const levels: Record<Role, number> = {
    super_admin: 100,
    admin: 80,
    editor: 60,
    analyst: 40,
    viewer: 20,
  }
  return levels[role]
}

/**
 * Check if role A can manage role B
 * (Higher level roles can manage lower level roles)
 */
export function canManageRole(actorRole: Role, targetRole: Role): boolean {
  return getRoleLevel(actorRole) > getRoleLevel(targetRole)
}

/**
 * Permission descriptions for UI
 */
export const PERMISSION_DESCRIPTIONS: Record<Permission, string> = {
  access_admin_panel: 'Access admin panel',
  publish_content: 'Publish articles and content',
  delete_content: 'Delete individual articles',
  bulk_delete: 'Bulk delete multiple articles',
  edit_content: 'Edit existing content',
  view_content: 'View content and articles',
  update_settings: 'Update system settings',
  manage_security: 'Manage security settings',
  manage_integrations: 'Manage third-party integrations',
  manage_users: 'Create, edit, and delete users',
  manage_roles: 'Assign and modify user roles',
  view_users: 'View user list and details',
  view_audit_logs: 'View security audit logs',
  view_analytics: 'View analytics and reports',
  export_data: 'Export data and reports',
  manage_distribution: 'Manage content distribution',
  view_distribution: 'View distribution status',
  manage_2fa: 'Manage own 2FA settings',
  disable_user_2fa: 'Disable 2FA for other users',
}

/**
 * Role descriptions for UI
 */
export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  super_admin: 'Full system access including user and role management',
  admin: 'Administrative access to content, settings, and analytics',
  editor: 'Content creation and publishing',
  analyst: 'Read-only access to analytics and audit logs',
  viewer: 'Basic read-only access',
}
