/**
 * @fileoverview Enhanced Role-Based Access Control (RBAC) Service
 * @author Iroshan Rathnayake
 * @version 2.0.0
 */

import { 
  Injectable, 
  Inject, 
  Optional, 
  OnDestroy,
  signal,
  computed,
  effect
} from '@angular/core';
import { 
  BehaviorSubject, 
  Observable, 
  combineLatest, 
  of,
  Subject,
  timer,
  EMPTY
} from 'rxjs';
import { 
  map, 
  distinctUntilChanged,
  shareReplay,
  switchMap,
  catchError,
  debounceTime,
  takeUntil,
  startWith
} from 'rxjs/operators';

import { 
  Role, 
  Permission, 
  UserContext, 
  RbacConfig, 
  PermissionCheckResult,
  AuditLogEntry,
  RbacEvent,
  RbacEventType,
  TenantConfig,
  RbacError,
  RbacErrorCode
} from '../types/rbac.types';
import { RBAC_CONFIG, DEFAULT_RBAC_CONFIG, CACHE_KEYS } from '../config/rbac.config';
import { LruCache } from '../utils/lru-cache';
import { RbacLogger } from '../utils/rbac-logger';
import { RoleHierarchyManager } from '../utils/role-hierarchy.manager';

/**
 * Enhanced Role Service for enterprise-grade RBAC implementation
 * 
 * Features:
 * - Hierarchical role inheritance
 * - Multi-tenant support
 * - Permission caching with TTL
 * - Audit logging
 * - Event-driven architecture
 * - Performance optimizations
 * - Reactive state management
 * 
 * @example
 * ```typescript
 * // Basic usage
 * const roleService = inject(RoleService);
 * 
 * // Set user context
 * roleService.setUserContext({
 *   userId: 'user123',
 *   roles: [adminRole, userRole],
 *   permissions: [readPermission, writePermission],
 *   tenantId: 'tenant1',
 *   sessionData: { loginTime: new Date() },
 *   lastUpdated: new Date()
 * });
 * 
 * // Check permissions reactively
 * roleService.hasRole('admin').subscribe(hasAdmin => {
 *   console.log('User is admin:', hasAdmin);
 * });
 * ```
 */
@Injectable({ 
  providedIn: 'root' 
})
export class RoleService implements OnDestroy {
  
  // Core state management using Angular signals
  private readonly userContext = signal<UserContext | null>(null);
  private readonly tenantConfig = signal<TenantConfig | null>(null);
  private readonly systemRoles = signal<Role[]>([]);
  private readonly systemPermissions = signal<Permission[]>([]);

  // Legacy BehaviorSubjects for backward compatibility
  private readonly roles$ = new BehaviorSubject<string[]>([]);
  private readonly permissions$ = new BehaviorSubject<string[]>([]);
  private readonly tenant$ = new BehaviorSubject<string | null>(null);

  // Event system
  private readonly eventSubject = new Subject<RbacEvent>();
  private readonly destroy$ = new Subject<void>();

  // Caching system
  private readonly permissionCache: LruCache<boolean>;
  private readonly contextCache: LruCache<PermissionCheckResult>;

  // Audit logging
  private readonly auditLog: AuditLogEntry[] = [];
  private readonly maxAuditLogSize = 10000;

  // Computed values using signals
  public readonly currentRoles = computed(() => 
    this.userContext()?.roles.map(r => r.id) || []
  );
  
  public readonly currentPermissions = computed(() => 
    this.userContext()?.permissions.map(p => p.id) || []
  );
  
  public readonly currentTenant = computed(() => 
    this.userContext()?.tenantId || null
  );

  // Public observables
  public readonly events$ = this.eventSubject.asObservable();
  public readonly isAuthenticated$ = combineLatest([
    this.roles$,
    this.permissions$
  ]).pipe(
    map(([roles, permissions]) => roles.length > 0 || permissions.length > 0),
    distinctUntilChanged(),
    shareReplay(1)
  );

  constructor(
    @Inject(RBAC_CONFIG) @Optional() private config: RbacConfig = DEFAULT_RBAC_CONFIG,
    private logger: RbacLogger,
    private hierarchyManager: RoleHierarchyManager
  ) {
    // Initialize caches
    this.permissionCache = new LruCache<boolean>(
      this.config.maxCacheSize,
      this.config.cacheTimeout
    );
    this.contextCache = new LruCache<PermissionCheckResult>(
      this.config.maxCacheSize,
      this.config.cacheTimeout
    );

    this.setupEffects();
    this.setupPeriodicCleanup();
    
    this.logger.info('RoleService initialized', { 
      config: this.config,
      cacheEnabled: this.config.enableCaching 
    });
  }

  /**
   * Sets the complete user context
   * 
   * @param context - Complete user context including roles, permissions, and tenant
   * 
   * @example
   * ```typescript
   * roleService.setUserContext({
   *   userId: 'user123',
   *   roles: [{ id: 'admin', name: 'Administrator', active: true, level: 0 }],
   *   permissions: [{ id: 'read', name: 'Read', resource: 'document', action: 'read', active: true }],
   *   tenantId: 'tenant1',
   *   lastUpdated: new Date()
   * });
   * ```
   */
  setUserContext(context: UserContext): void {
    this.logger.debug('Setting user context', { 
      userId: context.userId,
      rolesCount: context.roles.length,
      permissionsCount: context.permissions.length,
      tenantId: context.tenantId
    });

    // Update signals
    this.userContext.set(context);

    // Update legacy observables for backward compatibility
    this.roles$.next(context.roles.map(r => r.id));
    this.permissions$.next(context.permissions.map(p => p.id));
    this.tenant$.next(context.tenantId || null);

    // Clear caches when context changes
    this.clearUserCache(context.userId);

    // Emit event
    this.emitEvent(RbacEventType.CONTEXT_UPDATED, {
      userId: context.userId,
      context
    });
  }

  /**
   * Legacy method: Sets user roles (for backward compatibility)
   * 
   * @deprecated Use setUserContext instead
   * @param roleIds - Array of role IDs
   */
  setRoles(roleIds: string[]): void {
    this.logger.warn('setRoles is deprecated, use setUserContext instead');
    
    const context = this.userContext();
    if (context) {
      const roles = roleIds.map(id => ({ 
        id, 
        name: id, 
        active: true 
      } as Role));
      
      this.setUserContext({
        ...context,
        roles,
        lastUpdated: new Date()
      });
    } else {
      // Create minimal context for backward compatibility
      this.setUserContext({
        userId: 'unknown',
        roles: roleIds.map(id => ({ id, name: id, active: true } as Role)),
        permissions: [],
        lastUpdated: new Date()
      });
    }
  }

  /**
   * Legacy method: Sets user permissions (for backward compatibility)
   * 
   * @deprecated Use setUserContext instead
   * @param permissionIds - Array of permission IDs
   */
  setPermissions(permissionIds: string[]): void {
    this.logger.warn('setPermissions is deprecated, use setUserContext instead');
    
    const context = this.userContext();
    if (context) {
      const permissions = permissionIds.map(id => ({ 
        id, 
        name: id, 
        resource: 'unknown',
        action: 'unknown',
        active: true 
      } as Permission));
      
      this.setUserContext({
        ...context,
        permissions,
        lastUpdated: new Date()
      });
    } else {
      // Create minimal context for backward compatibility
      this.setUserContext({
        userId: 'unknown',
        roles: [],
        permissions: permissionIds.map(id => ({ 
          id, 
          name: id, 
          resource: 'unknown', 
          action: 'unknown', 
          active: true 
        } as Permission)),
        lastUpdated: new Date()
      });
    }
  }

  /**
   * Legacy method: Sets tenant ID (for backward compatibility)
   * 
   * @deprecated Use setUserContext instead
   * @param tenantId - Tenant ID
   */
  setTenant(tenantId: string): void {
    this.logger.warn('setTenant is deprecated, use setUserContext instead');
    
    const context = this.userContext();
    if (context) {
      this.setUserContext({
        ...context,
        tenantId,
        lastUpdated: new Date()
      });
    } else {
      // Create minimal context for backward compatibility
      this.setUserContext({
        userId: 'unknown',
        roles: [],
        permissions: [],
        tenantId,
        lastUpdated: new Date()
      });
    }
  }

  /**
   * Checks if the user has a specific role
   * 
   * @param roleId - Role ID to check
   * @param options - Additional options for the check
   * @returns Observable that emits true if user has the role
   * 
   * @example
   * ```typescript
   * roleService.hasRole('admin').subscribe(isAdmin => {
   *   if (isAdmin) {
   *     console.log('User has admin privileges');
   *   }
   * });
   * ```
   */
  hasRole(roleId: string, options?: { 
    includeInherited?: boolean;
    tenantId?: string;
  }): Observable<boolean> {
    return this.performPermissionCheck('role', roleId, options).pipe(
      map(result => result.granted)
    );
  }

  /**
   * Checks if the user has any of the specified roles
   * 
   * @param roleIds - Array of role IDs to check
   * @param options - Additional options for the check
   * @returns Observable that emits true if user has any of the roles
   */
  hasAnyRole(roleIds: string[], options?: { 
    includeInherited?: boolean;
    tenantId?: string;
  }): Observable<boolean> {
    if (!roleIds.length) {
      return of(false);
    }

    const checkPromises = roleIds.map(roleId => 
      this.performPermissionCheck('role', roleId, options).pipe(
        map(result => result.granted)
      )
    );

    return combineLatest(checkPromises).pipe(
      map(results => results.some(result => result)),
      distinctUntilChanged()
    );
  }

  /**
   * Checks if the user has all of the specified roles
   * 
   * @param roleIds - Array of role IDs to check
   * @param options - Additional options for the check
   * @returns Observable that emits true if user has all roles
   */
  hasAllRoles(roleIds: string[], options?: { 
    includeInherited?: boolean;
    tenantId?: string;
  }): Observable<boolean> {
    if (!roleIds.length) {
      return of(true);
    }

    const checkPromises = roleIds.map(roleId => 
      this.performPermissionCheck('role', roleId, options).pipe(
        map(result => result.granted)
      )
    );

    return combineLatest(checkPromises).pipe(
      map(results => results.every(result => result)),
      distinctUntilChanged()
    );
  }

  /**
   * Checks if the user has a specific permission
   * 
   * @param permissionId - Permission ID to check
   * @param options - Additional options for the check
   * @returns Observable that emits true if user has the permission
   */
  hasPermission(permissionId: string, options?: { 
    resource?: string;
    action?: string;
    context?: Record<string, any>;
  }): Observable<boolean> {
    return this.performPermissionCheck('permission', permissionId, options).pipe(
      map(result => result.granted)
    );
  }

  /**
   * Checks if the user has any of the specified permissions
   * 
   * @param permissionIds - Array of permission IDs to check
   * @param options - Additional options for the check
   * @returns Observable that emits true if user has any of the permissions
   */
  hasAnyPermission(permissionIds: string[], options?: { 
    resource?: string;
    action?: string;
    context?: Record<string, any>;
  }): Observable<boolean> {
    if (!permissionIds.length) {
      return of(false);
    }

    const checkPromises = permissionIds.map(permissionId => 
      this.performPermissionCheck('permission', permissionId, options).pipe(
        map(result => result.granted)
      )
    );

    return combineLatest(checkPromises).pipe(
      map(results => results.some(result => result)),
      distinctUntilChanged()
    );
  }

  /**
   * Gets the current tenant information
   * 
   * @returns Observable of current tenant ID
   */
  getTenant(): Observable<string | null> {
    return this.tenant$.asObservable();
  }

  /**
   * Gets detailed permission check result
   * 
   * @param type - Type of check ('role' or 'permission')
   * @param identifier - Role or permission identifier
   * @param options - Additional options
   * @returns Observable of detailed permission check result
   */
  checkPermissionDetailed(
    type: 'role' | 'permission',
    identifier: string,
    options?: Record<string, any>
  ): Observable<PermissionCheckResult> {
    return this.performPermissionCheck(type, identifier, options);
  }

  /**
   * Gets all effective roles (including inherited ones)
   * 
   * @returns Observable of all effective roles
   */
  getEffectiveRoles(): Observable<Role[]> {
    return combineLatest([
      of(this.userContext()),
      of(this.systemRoles())
    ]).pipe(
      map(([context, allRoles]) => {
        if (!context?.roles.length) {
          return [];
        }

        if (this.config.enableRoleHierarchy) {
          return this.hierarchyManager.resolveHierarchy(
            context.roles,
            allRoles,
            context.tenantId
          );
        }

        return context.roles;
      }),
      shareReplay(1)
    );
  }

  /**
   * Gets all effective permissions (from roles and direct assignments)
   * 
   * @returns Observable of all effective permissions
   */
  getEffectivePermissions(): Observable<Permission[]> {
    return combineLatest([
      this.getEffectiveRoles(),
      of(this.userContext())
    ]).pipe(
      map(([roles, context]) => {
        const permissions = new Set<Permission>();

        // Add direct permissions
        context?.permissions.forEach(p => permissions.add(p));

        // Add role-based permissions (would need role-permission mapping)
        // This is a simplified implementation
        roles.forEach(role => {
          // In a real implementation, you'd look up permissions for each role
          // from a role-permission mapping service
        });

        return Array.from(permissions);
      }),
      shareReplay(1)
    );
  }

  /**
   * Clears all cached permissions for a user
   * 
   * @param userId - User ID to clear cache for
   */
  clearUserCache(userId: string): void {
    const pattern = new RegExp(`^${CACHE_KEYS.ROLE_CHECK}${userId}:|^${CACHE_KEYS.PERMISSION_CHECK}${userId}:`);
    
    const removedCount = this.permissionCache.invalidatePattern(pattern) +
                        this.contextCache.invalidatePattern(pattern);

    this.logger.debug('User cache cleared', { userId, removedCount });
  }

  /**
   * Clears all caches
   */
  clearAllCaches(): void {
    this.permissionCache.clear();
    this.contextCache.clear();
    this.hierarchyManager.clearCache();
    
    this.emitEvent(RbacEventType.CACHE_CLEARED, {});
    this.logger.info('All caches cleared');
  }

  /**
   * Gets service statistics
   * 
   * @returns Object containing service statistics
   */
  getStats(): {
    cacheStats: {
      permissionCacheSize: number;
      contextCacheSize: number;
    };
    auditLogSize: number;
    currentUserContext: UserContext | null;
  } {
    return {
      cacheStats: {
        permissionCacheSize: this.permissionCache.keys().length,
        contextCacheSize: this.contextCache.keys().length
      },
      auditLogSize: this.auditLog.length,
      currentUserContext: this.userContext()
    };
  }

  /**
   * Gets recent audit log entries
   * 
   * @param limit - Maximum number of entries to return
   * @returns Array of recent audit log entries
   */
  getAuditLog(limit: number = 100): AuditLogEntry[] {
    return this.auditLog.slice(-limit);
  }

  /**
   * Configures the service
   * 
   * @param newConfig - New configuration to merge
   */
  configure(newConfig: Partial<RbacConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    this.logger.info('Service reconfigured', { config: this.config });
    this.emitEvent(RbacEventType.CONTEXT_UPDATED, { config: this.config });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.eventSubject.complete();
    
    this.logger.info('RoleService destroyed');
  }

  /**
   * Core permission check logic
   * 
   * @private
   */
  private performPermissionCheck(
    type: 'role' | 'permission',
    identifier: string,
    options?: Record<string, any>
  ): Observable<PermissionCheckResult> {
    const context = this.userContext();
    
    if (!context) {
      const result: PermissionCheckResult = {
        granted: false,
        reason: 'No user context available'
      };
      
      this.logAudit('anonymous', `check_${type}`, identifier, result);
      return of(result);
    }

    const cacheKey = this.generateCacheKey(type, identifier, context.userId, options);
    
    // Check cache first
    if (this.config.enableCaching) {
      const cached = this.contextCache.get(cacheKey);
      if (cached) {
        this.logger.debug('Permission check served from cache', { cacheKey });
        return of(cached);
      }
    }

    // Perform actual check
    return this.executePermissionCheck(type, identifier, context, options).pipe(
      map(result => {
        // Cache the result
        if (this.config.enableCaching) {
          this.contextCache.set(cacheKey, result);
        }

        // Log the check
        this.logAudit(context.userId, `check_${type}`, identifier, result);

        // Emit event
        this.emitEvent(
          result.granted ? RbacEventType.ACCESS_GRANTED : RbacEventType.ACCESS_DENIED,
          {
            type,
            identifier,
            userId: context.userId,
            result
          }
        );

        return result;
      }),
      catchError(error => {
        this.logger.error('Permission check failed', error);
        
        const result: PermissionCheckResult = {
          granted: false,
          reason: `Check failed: ${error.message}`
        };
        
        this.logAudit(context.userId, `check_${type}`, identifier, result);
        
        if (this.config.strictMode) {
          throw error;
        }
        
        return of(result);
      })
    );
  }

  /**
   * Executes the actual permission check logic
   * 
   * @private
   */
  private executePermissionCheck(
    type: 'role' | 'permission',
    identifier: string,
    context: UserContext,
    options?: Record<string, any>
  ): Observable<PermissionCheckResult> {
    if (type === 'role') {
      return this.checkRoleAccess(identifier, context, options);
    } else {
      return this.checkPermissionAccess(identifier, context, options);
    }
  }

  /**
   * Checks role access
   * 
   * @private
   */
  private checkRoleAccess(
    roleId: string,
    context: UserContext,
    options?: Record<string, any>
  ): Observable<PermissionCheckResult> {
    const includeInherited = options?.['includeInherited'] ?? this.config.enableRoleHierarchy;
    const tenantId = options?.['tenantId'] ?? context.tenantId;

    // Filter roles by tenant if specified
    let rolesToCheck = context.roles;
    if (tenantId) {
      rolesToCheck = rolesToCheck.filter(r => !r.tenantId || r.tenantId === tenantId);
    }

    // Direct role check
    const hasDirectRole = rolesToCheck.some(r => r.id === roleId && r.active);
    
    if (hasDirectRole) {
      return of({
        granted: true,
        reason: 'Direct role assignment',
        grantingRoles: [roleId]
      });
    }

    // Hierarchical role check if enabled
    if (includeInherited) {
      const allRoles = this.systemRoles();
      const effectiveRoles = this.hierarchyManager.resolveHierarchy(
        rolesToCheck,
        allRoles,
        tenantId
      );

      const hasInheritedRole = effectiveRoles.some(r => r.id === roleId && r.active);
      
      if (hasInheritedRole) {
        const grantingRoles = effectiveRoles
          .filter(r => r.id === roleId)
          .map(r => r.id);

        return of({
          granted: true,
          reason: 'Inherited role assignment',
          grantingRoles
        });
      }
    }

    return of({
      granted: false,
      reason: `Role '${roleId}' not found in user's roles`
    });
  }

  /**
   * Checks permission access
   * 
   * @private
   */
  private checkPermissionAccess(
    permissionId: string,
    context: UserContext,
    options?: Record<string, any>
  ): Observable<PermissionCheckResult> {
    const resource = options?.['resource'];
    const action = options?.['action'];

    // Direct permission check
    const hasDirectPermission = context.permissions.some(p => {
      if (!p.active) return false;
      if (p.id === permissionId) return true;
      
      // Check resource and action if specified
      if (resource && action) {
        return p.resource === resource && p.action === action;
      }
      
      return false;
    });

    if (hasDirectPermission) {
      const grantingPermissions = context.permissions
        .filter(p => p.id === permissionId || 
                    (resource && action && p.resource === resource && p.action === action))
        .map(p => p.id);

      return of({
        granted: true,
        reason: 'Direct permission assignment',
        grantingPermissions
      });
    }

    // Role-based permission check would go here
    // This would require a role-permission mapping service

    return of({
      granted: false,
      reason: `Permission '${permissionId}' not found`
    });
  }

  /**
   * Sets up reactive effects
   * 
   * @private
   */
  private setupEffects(): void {
    // Clear cache when user context changes
    effect(() => {
      const context = this.userContext();
      if (context) {
        this.clearUserCache(context.userId);
      }
    });
  }

  /**
   * Sets up periodic cleanup
   * 
   * @private
   */
  private setupPeriodicCleanup(): void {
    // Clean up expired cache entries every 5 minutes
    timer(300000, 300000).pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      const removedCount = this.permissionCache.cleanup() + this.contextCache.cleanup();
      if (removedCount > 0) {
        this.logger.debug('Periodic cache cleanup completed', { removedCount });
      }
    });

    // Trim audit log if it gets too large
    timer(600000, 600000).pipe( // Every 10 minutes
      takeUntil(this.destroy$)
    ).subscribe(() => {
      if (this.auditLog.length > this.maxAuditLogSize) {
        const removedCount = this.auditLog.length - this.maxAuditLogSize;
        this.auditLog.splice(0, removedCount);
        this.logger.debug('Audit log trimmed', { removedCount });
      }
    });
  }

  /**
   * Generates cache key for permission checks
   * 
   * @private
   */
  private generateCacheKey(
    type: string,
    identifier: string,
    userId: string,
    options?: Record<string, any>
  ): string {
    const optionsStr = options ? JSON.stringify(options) : '';
    const prefix = type === 'role' ? CACHE_KEYS.ROLE_CHECK : CACHE_KEYS.PERMISSION_CHECK;
    return `${prefix}${userId}:${identifier}:${optionsStr}`;
  }

  /**
   * Logs audit entry
   * 
   * @private
   */
  private logAudit(
    userId: string,
    action: string,
    resource: string,
    result: PermissionCheckResult
  ): void {
    const entry: AuditLogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      action,
      resource,
      result,
      timestamp: new Date(),
      context: this.userContext()?.sessionData
    };

    this.auditLog.push(entry);
  }

  /**
   * Emits RBAC event
   * 
   * @private
   */
  private emitEvent(type: RbacEventType, payload: any): void {
    const event: RbacEvent = {
      type,
      payload,
      timestamp: new Date(),
      userContext: this.userContext() || undefined
    };

    this.eventSubject.next(event);
  }
}
