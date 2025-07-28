/**
 * @fileoverview Type definitions for Role-Based Access Control (RBAC) system
 * @author Iroshan Rathnayake
 * @version 2.0.0
 */

/**
 * Represents a user role within the system
 */
export interface Role {
  /** Unique identifier for the role */
  id: string;
  /** Human-readable name of the role */
  name: string;
  /** Brief description of the role's purpose */
  description?: string;
  /** Hierarchical level of the role (0 = highest authority) */
  level?: number;
  /** Parent role ID for hierarchical role structures */
  parentRoleId?: string;
  /** Whether this role is active */
  active: boolean;
  /** Tenant/organization ID this role belongs to */
  tenantId?: string;
  /** Additional metadata for the role */
  metadata?: Record<string, any>;
}

/**
 * Represents a permission within the system
 */
export interface Permission {
  /** Unique identifier for the permission */
  id: string;
  /** Human-readable name of the permission */
  name: string;
  /** Brief description of what this permission allows */
  description?: string;
  /** Resource this permission applies to */
  resource: string;
  /** Action this permission allows on the resource */
  action: string;
  /** Additional conditions for the permission */
  conditions?: Record<string, any>;
  /** Whether this permission is active */
  active: boolean;
  /** Tenant/organization ID this permission belongs to */
  tenantId?: string;
}

/**
 * Represents a user's context within the application
 */
export interface UserContext {
  /** User's unique identifier */
  userId: string;
  /** User's assigned roles */
  roles: Role[];
  /** User's direct permissions */
  permissions: Permission[];
  /** Current tenant/organization context */
  tenantId?: string;
  /** User's session metadata */
  sessionData?: Record<string, any>;
  /** Timestamp when the context was last updated */
  lastUpdated: Date;
}

/**
 * Configuration options for the RBAC system
 */
export interface RbacConfig {
  /** Enable hierarchical role checking */
  enableRoleHierarchy: boolean;
  /** Enable permission caching */
  enableCaching: boolean;
  /** Cache timeout in milliseconds */
  cacheTimeout: number;
  /** Enable debug logging */
  enableDebugLogging: boolean;
  /** Custom role hierarchy resolver */
  roleHierarchyResolver?: RoleHierarchyResolver;
  /** Custom permission resolver */
  permissionResolver?: PermissionResolver;
  /** Default tenant ID */
  defaultTenantId?: string;
  /** Maximum cache size */
  maxCacheSize: number;
  /** Enable strict mode (throws errors instead of returning false) */
  strictMode: boolean;
}

/**
 * Cache entry for storing computed permissions
 */
export interface CacheEntry<T> {
  /** Cached value */
  value: T;
  /** Timestamp when cached */
  timestamp: number;
  /** Time-to-live in milliseconds */
  ttl: number;
  /** Cache key */
  key: string;
}

/**
 * Result of a permission check operation
 */
export interface PermissionCheckResult {
  /** Whether permission is granted */
  granted: boolean;
  /** Reason for the result */
  reason?: string;
  /** Roles that granted this permission */
  grantingRoles?: string[];
  /** Direct permissions that granted access */
  grantingPermissions?: string[];
  /** Additional metadata about the check */
  metadata?: Record<string, any>;
}

/**
 * Audit log entry for permission checks
 */
export interface AuditLogEntry {
  /** Unique identifier for the log entry */
  id: string;
  /** User who performed the action */
  userId: string;
  /** Action that was attempted */
  action: string;
  /** Resource that was accessed */
  resource: string;
  /** Result of the permission check */
  result: PermissionCheckResult;
  /** Timestamp of the action */
  timestamp: Date;
  /** Additional context */
  context?: Record<string, any>;
}

/**
 * Function type for resolving role hierarchies
 */
export type RoleHierarchyResolver = (role: Role, allRoles: Role[]) => Role[];

/**
 * Function type for resolving permissions
 */
export type PermissionResolver = (
  roles: Role[],
  permissions: Permission[],
  context?: Record<string, any>
) => Permission[];

/**
 * Event types emitted by the RBAC system
 */
export enum RbacEventType {
  ROLE_ADDED = 'role_added',
  ROLE_REMOVED = 'role_removed',
  PERMISSION_ADDED = 'permission_added',
  PERMISSION_REMOVED = 'permission_removed',
  CONTEXT_UPDATED = 'context_updated',
  TENANT_CHANGED = 'tenant_changed',
  CACHE_CLEARED = 'cache_cleared',
  ACCESS_DENIED = 'access_denied',
  ACCESS_GRANTED = 'access_granted'
}

/**
 * Event emitted by the RBAC system
 */
export interface RbacEvent {
  /** Type of the event */
  type: RbacEventType;
  /** Event payload */
  payload: any;
  /** Timestamp when event occurred */
  timestamp: Date;
  /** User context when event occurred */
  userContext?: Partial<UserContext>;
}

/**
 * Options for directive behavior
 */
export interface DirectiveOptions {
  /** Whether to show/hide element or just disable it */
  mode: 'visibility' | 'disabled';
  /** Fallback template to show when access is denied */
  fallbackTemplate?: any;
  /** Whether to use animations for show/hide */
  animate?: boolean;
  /** Custom CSS classes to apply based on permission state */
  cssClasses?: {
    granted?: string;
    denied?: string;
  };
}

/**
 * Guard configuration options
 */
export interface GuardConfig {
  /** Redirect URL when access is denied */
  redirectUrl?: string;
  /** Whether to throw error or redirect */
  throwOnDenied?: boolean;
  /** Custom error message */
  errorMessage?: string;
  /** Whether to log access attempts */
  logAttempts?: boolean;
}

/**
 * Multi-tenant configuration
 */
export interface TenantConfig {
  /** Tenant unique identifier */
  tenantId: string;
  /** Tenant display name */
  name: string;
  /** Tenant-specific settings */
  settings?: Record<string, any>;
  /** Whether tenant is active */
  active: boolean;
  /** Parent tenant ID for hierarchical tenants */
  parentTenantId?: string;
}

/**
 * Represents an error in the RBAC system
 */
export class RbacError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = 'RbacError';
  }
}

/**
 * Standard RBAC error codes
 */
export enum RbacErrorCode {
  INVALID_ROLE = 'INVALID_ROLE',
  INVALID_PERMISSION = 'INVALID_PERMISSION',
  INVALID_TENANT = 'INVALID_TENANT',
  ACCESS_DENIED = 'ACCESS_DENIED',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  CACHE_ERROR = 'CACHE_ERROR',
  HIERARCHY_ERROR = 'HIERARCHY_ERROR'
}
