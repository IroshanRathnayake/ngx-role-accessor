/**
 * @fileoverview Advanced Route Guards for RBAC system
 * @author Iroshan Rathnayake
 * @version 1.0.0
 */

import { inject } from '@angular/core';
import { 
  CanActivateFn, 
  CanActivateChildFn, 
  CanDeactivateFn,
  CanMatchFn,
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree
} from '@angular/router';
import { Observable, of, combineLatest } from 'rxjs';
import { map, tap, catchError, switchMap } from 'rxjs/operators';

import { RoleService } from '../services/role.service';
import { RbacLogger } from '../utils/rbac-logger';
import { GuardConfig, RbacError, RbacErrorCode } from '../types/rbac.types';

/**
 * Interface for components that can be deactivated
 */
export interface CanComponentDeactivate {
  canDeactivate(): Observable<boolean> | Promise<boolean> | boolean;
}

/**
 * Configuration for guard functions
 */
interface GuardOptions {
  /** Roles required for access */
  roles?: string[];
  /** Permissions required for access */
  permissions?: string[];
  /** Whether to require ALL roles/permissions (AND logic) or ANY (OR logic) */
  requireAll?: boolean;
  /** Redirect URL when access is denied */
  redirectUrl?: string;
  /** Whether to throw error instead of redirecting */
  throwOnDenied?: boolean;
  /** Custom error message */
  errorMessage?: string;
  /** Include inherited roles in check */
  includeInherited?: boolean;
  /** Tenant context */
  tenantId?: string;
}

/**
 * Creates a role-based route guard
 * 
 * @param options - Guard configuration options
 * @returns CanActivateFn that checks for required roles
 * 
 * @example
 * ```typescript
 * // In your routes
 * {
 *   path: 'admin',
 *   canActivate: [createRoleGuard({ roles: ['admin'] })],
 *   loadComponent: () => import('./admin/admin.component')
 * }
 * 
 * // Multiple roles with OR logic
 * {
 *   path: 'dashboard',
 *   canActivate: [createRoleGuard({ 
 *     roles: ['admin', 'manager'], 
 *     requireAll: false 
 *   })],
 *   loadComponent: () => import('./dashboard/dashboard.component')
 * }
 * 
 * // With custom redirect
 * {
 *   path: 'premium',
 *   canActivate: [createRoleGuard({ 
 *     roles: ['premium'], 
 *     redirectUrl: '/upgrade' 
 *   })],
 *   loadComponent: () => import('./premium/premium.component')
 * }
 * ```
 */
export function createRoleGuard(options: GuardOptions): CanActivateFn {
  return (route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> => {
    const roleService = inject(RoleService);
    const router = inject(Router);
    const logger = inject(RbacLogger);

    if (!options.roles?.length) {
      logger.warn('Role guard created without roles configuration');
      return of(true);
    }

    const endTimer = logger.time(`role-guard-${options.roles.join(',')}`);

    // Determine check method based on requireAll option
    const checkMethod = options.requireAll 
      ? roleService.hasAllRoles(options.roles, {
          includeInherited: options.includeInherited,
          tenantId: options.tenantId
        })
      : roleService.hasAnyRole(options.roles, {
          includeInherited: options.includeInherited,
          tenantId: options.tenantId
        });

    return checkMethod.pipe(
      map(hasAccess => {
        endTimer();
        
        if (hasAccess) {
          logger.debug('Route access granted', {
            path: state.url,
            roles: options.roles,
            requireAll: options.requireAll
          });
          return true;
        }

        logger.warn('Route access denied', {
          path: state.url,
          roles: options.roles,
          requireAll: options.requireAll,
          redirectUrl: options.redirectUrl
        });

        if (options.throwOnDenied) {
          throw new RbacError(
            options.errorMessage || `Access denied: missing required roles: ${options.roles?.join(', ') || 'unknown'}`,
            RbacErrorCode.ACCESS_DENIED,
            { 
              path: state.url, 
              requiredRoles: options.roles,
              requireAll: options.requireAll
            }
          );
        }

        // Redirect or return false
        if (options.redirectUrl) {
          return router.createUrlTree([options.redirectUrl], {
            queryParams: { returnUrl: state.url }
          });
        }

        return false;
      }),
      catchError(error => {
        endTimer();
        logger.error('Role guard error', error);
        
        if (options.redirectUrl) {
          return of(router.createUrlTree([options.redirectUrl]));
        }
        
        return of(false);
      })
    );
  };
}

/**
 * Creates a permission-based route guard
 * 
 * @param options - Guard configuration options
 * @returns CanActivateFn that checks for required permissions
 * 
 * @example
 * ```typescript
 * {
 *   path: 'reports',
 *   canActivate: [createPermissionGuard({ 
 *     permissions: ['CAN_VIEW_REPORTS'] 
 *   })],
 *   loadComponent: () => import('./reports/reports.component')
 * }
 * ```
 */
export function createPermissionGuard(options: GuardOptions): CanActivateFn {
  return (route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> => {
    const roleService = inject(RoleService);
    const router = inject(Router);
    const logger = inject(RbacLogger);

    if (!options.permissions?.length) {
      logger.warn('Permission guard created without permissions configuration');
      return of(true);
    }

    const endTimer = logger.time(`permission-guard-${options.permissions.join(',')}`);

    // Check permissions
    const checkMethod = options.permissions.length === 1
      ? roleService.hasPermission(options.permissions[0])
      : roleService.hasAnyPermission(options.permissions);

    return checkMethod.pipe(
      map(hasAccess => {
        endTimer();
        
        if (hasAccess) {
          logger.debug('Route access granted by permission', {
            path: state.url,
            permissions: options.permissions
          });
          return true;
        }

        logger.warn('Route access denied by permission', {
          path: state.url,
          permissions: options.permissions,
          redirectUrl: options.redirectUrl
        });

        if (options.throwOnDenied) {
          throw new RbacError(
            options.errorMessage || `Access denied: missing required permissions: ${options.permissions?.join(', ') || 'unknown'}`,
            RbacErrorCode.ACCESS_DENIED,
            { 
              path: state.url, 
              requiredPermissions: options.permissions
            }
          );
        }

        if (options.redirectUrl) {
          return router.createUrlTree([options.redirectUrl], {
            queryParams: { returnUrl: state.url }
          });
        }

        return false;
      }),
      catchError(error => {
        endTimer();
        logger.error('Permission guard error', error);
        
        if (options.redirectUrl) {
          return of(router.createUrlTree([options.redirectUrl]));
        }
        
        return of(false);
      })
    );
  };
}

/**
 * Creates a combined role and permission guard
 * 
 * @param options - Guard configuration options
 * @returns CanActivateFn that checks both roles and permissions
 * 
 * @example
 * ```typescript
 * {
 *   path: 'admin-reports',
 *   canActivate: [createRolePermissionGuard({ 
 *     roles: ['admin'], 
 *     permissions: ['CAN_VIEW_REPORTS'],
 *     requireAll: true // Must have admin role AND view reports permission
 *   })],
 *   loadComponent: () => import('./admin-reports/admin-reports.component')
 * }
 * ```
 */
export function createRolePermissionGuard(options: GuardOptions): CanActivateFn {
  return (route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> => {
    const roleService = inject(RoleService);
    const router = inject(Router);
    const logger = inject(RbacLogger);

    if (!options.roles?.length && !options.permissions?.length) {
      logger.warn('Role-permission guard created without configuration');
      return of(true);
    }

    const endTimer = logger.time(`role-permission-guard`);

    // Create observables for roles and permissions
    const roleCheck$ = options.roles?.length 
      ? (options.requireAll 
          ? roleService.hasAllRoles(options.roles, {
              includeInherited: options.includeInherited,
              tenantId: options.tenantId
            })
          : roleService.hasAnyRole(options.roles, {
              includeInherited: options.includeInherited,
              tenantId: options.tenantId
            }))
      : of(true);

    const permissionCheck$ = options.permissions?.length
      ? roleService.hasAnyPermission(options.permissions)
      : of(true);

    // Combine checks based on requireAll option
    return (options.requireAll 
      ? // Both role and permission checks must pass
        roleCheck$.pipe(
          switchMap((hasRole: boolean) => hasRole 
            ? permissionCheck$ 
            : of(false)
          )
        )
      : // Either role OR permission check must pass
        roleCheck$.pipe(
          switchMap((hasRole: boolean) => hasRole 
            ? of(true) 
            : permissionCheck$
          )
        )
    ).pipe(
      map(hasAccess => {
        endTimer();
        
        if (hasAccess) {
          logger.debug('Route access granted by role-permission guard', {
            path: state.url,
            roles: options.roles,
            permissions: options.permissions,
            requireAll: options.requireAll
          });
          return true;
        }

        logger.warn('Route access denied by role-permission guard', {
          path: state.url,
          roles: options.roles,
          permissions: options.permissions,
          requireAll: options.requireAll
        });

        if (options.throwOnDenied) {
          throw new RbacError(
            options.errorMessage || 'Access denied: insufficient roles or permissions',
            RbacErrorCode.ACCESS_DENIED,
            { 
              path: state.url, 
              requiredRoles: options.roles,
              requiredPermissions: options.permissions,
              requireAll: options.requireAll
            }
          );
        }

        if (options.redirectUrl) {
          return router.createUrlTree([options.redirectUrl], {
            queryParams: { returnUrl: state.url }
          });
        }

        return false;
      }),
      catchError(error => {
        endTimer();
        logger.error('Role-permission guard error', error);
        
        if (options.redirectUrl) {
          return of(router.createUrlTree([options.redirectUrl]));
        }
        
        return of(false);
      })
    );
  };
}

/**
 * Creates a child route guard with the same logic as the main guard
 * 
 * @param options - Guard configuration options
 * @returns CanActivateChildFn
 */
export function createChildRoleGuard(options: GuardOptions): CanActivateChildFn {
  const guard = createRoleGuard(options);
  return (childRoute: ActivatedRouteSnapshot, state: RouterStateSnapshot) => 
    guard(childRoute, state);
}

/**
 * Creates a deactivation guard that checks permissions before allowing navigation away
 * 
 * @param options - Guard configuration options
 * @returns CanDeactivateFn
 * 
 * @example
 * ```typescript
 * {
 *   path: 'edit',
 *   canDeactivate: [createDeactivateGuard({ 
 *     permissions: ['CAN_SAVE_DRAFT']  
 *   })],
 *   component: EditComponent
 * }
 * ```
 */
export function createDeactivateGuard(options: GuardOptions): CanDeactivateFn<CanComponentDeactivate> {
  return (
    component: CanComponentDeactivate,
    currentRoute: ActivatedRouteSnapshot,
    currentState: RouterStateSnapshot,
    nextState?: RouterStateSnapshot
  ): Observable<boolean> => {
    const roleService = inject(RoleService);
    const logger = inject(RbacLogger);

    // First check if component can deactivate
    const componentCanDeactivate = component.canDeactivate 
      ? component.canDeactivate() 
      : true;

    if (componentCanDeactivate === false) {
      return of(false);
    }

    // Then check permissions if specified
    if (!options.permissions?.length && !options.roles?.length) {
      return of(true);
    }

    logger.debug('Checking deactivation permissions', {
      currentPath: currentState.url,
      nextPath: nextState?.url,
      permissions: options.permissions,
      roles: options.roles
    });

    // For deactivation, we typically want to allow navigation if user has permission
    const checkObservable = options.roles?.length
      ? roleService.hasAnyRole(options.roles)
      : options.permissions?.length
        ? roleService.hasAnyPermission(options.permissions)
        : of(true);

    return checkObservable.pipe(
      catchError(error => {
        logger.error('Deactivation guard error', error);
        return of(true); // Allow navigation on error
      })
    );
  };
}

/**
 * Creates a route matching guard
 * 
 * @param options - Guard configuration options
 * @returns CanMatchFn
 */
export function createMatchGuard(options: GuardOptions): CanMatchFn {
  return (route, segments): Observable<boolean> => {
    const roleService = inject(RoleService);
    const logger = inject(RbacLogger);

    if (!options.roles?.length && !options.permissions?.length) {
      return of(true);
    }

    const path = segments.map(s => s.path).join('/');
    logger.debug('Checking route match permissions', {
      path,
      roles: options.roles,
      permissions: options.permissions
    });

    const checkObservable = options.roles?.length
      ? (options.requireAll 
          ? roleService.hasAllRoles(options.roles)
          : roleService.hasAnyRole(options.roles))
      : options.permissions?.length
        ? roleService.hasAnyPermission(options.permissions)
        : of(true);

    return checkObservable.pipe(
      tap(canMatch => {
        if (!canMatch) {
          logger.debug('Route match denied', { path, options });
        }
      }),
      catchError(error => {
        logger.error('Match guard error', error);
        return of(false);
      })
    );
  };
}
