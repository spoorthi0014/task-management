export enum AuditAction {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  LOGIN = 'login',
  LOGOUT = 'logout',
}

export interface IAuditLog {
  id: string;
  action: AuditAction;
  resource: string;
  resourceId?: string;
  userId: string;
  organizationId: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface IAuditLogWithUser extends IAuditLog {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}
