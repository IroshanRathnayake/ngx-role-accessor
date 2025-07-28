/**
 * @fileoverview Default configuration and constants for the RBAC system
 * @author Iroshan Rathnayake
 * @version 2.0.0
 */

import { InjectionToken } from '@angular/core';
import { RbacConfig } from '../types/rbac.types';

/**
 * Injection token for RBAC configuration
 */
export const RBAC_CONFIG = new InjectionToken<RbacConfig>('RBAC_CONFIG');

/**
 * Default configuration for the RBAC system
 */
export const DEFAULT_RBAC_CONFIG: RbacConfig = {
  enableRoleHierarchy: true,
  enableCaching: true,
  cacheTimeout: 300000, // 5 minutes
  enableDebugLogging: false,
  maxCacheSize: 1000,
  strictMode: false,
  defaultTenantId: undefined
};

/**
 * Standard role levels for hierarchical RBAC
 */
export const ROLE_LEVELS = {
  SUPER_ADMIN: 0,
  ADMIN: 10,
  MANAGER: 20,
  USER: 30,
  GUEST: 40
} as const;

/**
 * Common permission actions
 */
export const PERMISSION_ACTIONS = {
  CREATE: 'create',
  READ: 'read', 
  UPDATE: 'update',
  DELETE: 'delete',
  MANAGE: 'manage',
  VIEW: 'view',
  EDIT: 'edit',
  APPROVE: 'approve',
  REJECT: 'reject',
  PUBLISH: 'publish',
  ARCHIVE: 'archive'
} as const;

/**
 * Common resource types
 */
export const RESOURCE_TYPES = {
  USER: 'user',
  ROLE: 'role',
  PERMISSION: 'permission',
  TENANT: 'tenant',
  REPORT: 'report',
  DASHBOARD: 'dashboard',
  SETTINGS: 'settings',
  AUDIT_LOG: 'audit_log',
  FILE: 'file',
  API: 'api'
} as const;

/**
 * Cache key prefixes
 */
export const CACHE_KEYS = {
  ROLE_CHECK: 'rbac:role:',
  PERMISSION_CHECK: 'rbac:permission:',
  USER_CONTEXT: 'rbac:context:',
  ROLE_HIERARCHY: 'rbac:hierarchy:',
  TENANT_CONFIG: 'rbac:tenant:'
} as const;

/**
 * Event names for RBAC system events
 */
export const RBAC_EVENTS = {
  ROLE_CHANGED: 'rbac:role:changed',
  PERMISSION_CHANGED: 'rbac:permission:changed',
  CONTEXT_UPDATED: 'rbac:context:updated',
  TENANT_SWITCHED: 'rbac:tenant:switched',
  CONFIG_UPDATED: 'rbac:config:updated',
  CACHE_INVALIDATED: 'rbac:cache:invalidated'
} as const;

/**
 * Default animation durations (in milliseconds)
 */
export const ANIMATION_DURATIONS = {
  FADE_IN: 200,
  FADE_OUT: 150,
  SLIDE_IN: 300,
  SLIDE_OUT: 250
} as const;

/**
 * Maximum values for various system limits
 */
export const SYSTEM_LIMITS = {
  MAX_ROLES_PER_USER: 100,
  MAX_PERMISSIONS_PER_ROLE: 1000,
  MAX_CACHE_ENTRIES: 10000,
  MAX_AUDIT_LOG_ENTRIES: 100000,
  MAX_TENANT_DEPTH: 10
} as const;
