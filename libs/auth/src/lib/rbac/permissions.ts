export enum Permission {
  // Task permissions
  TASK_CREATE = 'task:create',
  TASK_READ = 'task:read',
  TASK_UPDATE = 'task:update',
  TASK_DELETE = 'task:delete',
  
  // Task ownership permissions
  TASK_READ_OWN = 'task:read:own',
  TASK_UPDATE_OWN = 'task:update:own',
  TASK_DELETE_OWN = 'task:delete:own',
  
  // Organization scope permissions
  TASK_READ_ORG = 'task:read:org',
  TASK_UPDATE_ORG = 'task:update:org',
  TASK_DELETE_ORG = 'task:delete:org',
  
  // Audit permissions
  AUDIT_READ = 'audit:read',
  
  // User management
  USER_READ = 'user:read',
  USER_CREATE = 'user:create',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',
}

import { Role } from '@task-management/data';

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.OWNER]: [
    Permission.TASK_CREATE,
    Permission.TASK_READ,
    Permission.TASK_UPDATE,
    Permission.TASK_DELETE,
    Permission.TASK_READ_OWN,
    Permission.TASK_UPDATE_OWN,
    Permission.TASK_DELETE_OWN,
    Permission.TASK_READ_ORG,
    Permission.TASK_UPDATE_ORG,
    Permission.TASK_DELETE_ORG,
    Permission.AUDIT_READ,
    Permission.USER_READ,
    Permission.USER_CREATE,
    Permission.USER_UPDATE,
    Permission.USER_DELETE,
  ],
  [Role.ADMIN]: [
    Permission.TASK_CREATE,
    Permission.TASK_READ_OWN,
    Permission.TASK_UPDATE_OWN,
    Permission.TASK_DELETE_OWN,
    Permission.TASK_READ_ORG,
    Permission.TASK_UPDATE_ORG,
    Permission.AUDIT_READ,
    Permission.USER_READ,
  ],
  [Role.VIEWER]: [
    Permission.TASK_READ_OWN,
    Permission.TASK_READ_ORG,
  ],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function getPermissions(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}
