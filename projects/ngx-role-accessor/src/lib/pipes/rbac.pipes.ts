/**
 * @fileoverview RBAC Pipes for template usage
 * @author Iroshan Rathnayake
 * @version 1.0.0
 */

import { Pipe, PipeTransform, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { RoleService } from '../services/role.service';

/**
 * Pipe for checking if user has a specific role
 * 
 * @example
 * ```html
 * <div>{{ 'admin' | hasRole | async }}</div>
 * <button [disabled]="!('manager' | hasRole | async)">Manage</button>
 * ```
 */
@Pipe({ 
  name: 'hasRole', 
  standalone: true 
})
export class HasRolePipe implements PipeTransform {
  private readonly roleService = inject(RoleService);

  transform(roleId: string, options?: { 
    includeInherited?: boolean; 
    tenantId?: string; 
  }): Observable<boolean> {
    if (!roleId) {
      throw new Error('HasRolePipe: roleId is required');
    }

    return this.roleService.hasRole(roleId, options);
  }
}

/**
 * Pipe for checking if user has any of the specified roles
 * 
 * @example
 * ```html
 * <div>{{ ['admin', 'manager'] | hasAnyRole | async }}</div>
 * ```
 */
@Pipe({ 
  name: 'hasAnyRole', 
  standalone: true 
})
export class HasAnyRolePipe implements PipeTransform {
  private readonly roleService = inject(RoleService);

  transform(roleIds: string[], options?: { 
    includeInherited?: boolean; 
    tenantId?: string; 
  }): Observable<boolean> {
    if (!roleIds || !Array.isArray(roleIds) || roleIds.length === 0) {
      throw new Error('HasAnyRolePipe: roleIds array is required');
    }

    return this.roleService.hasAnyRole(roleIds, options);
  }
}

/**
 * Pipe for checking if user has all of the specified roles
 * 
 * @example
 * ```html
 * <div>{{ ['admin', 'manager'] | hasAllRoles | async }}</div>
 * ```
 */
@Pipe({ 
  name: 'hasAllRoles', 
  standalone: true 
})
export class HasAllRolesPipe implements PipeTransform {
  private readonly roleService = inject(RoleService);

  transform(roleIds: string[], options?: { 
    includeInherited?: boolean; 
    tenantId?: string; 
  }): Observable<boolean> {
    if (!roleIds || !Array.isArray(roleIds) || roleIds.length === 0) {
      throw new Error('HasAllRolesPipe: roleIds array is required');
    }

    return this.roleService.hasAllRoles(roleIds, options);
  }
}

/**
 * Pipe for checking if user has a specific permission
 * 
 * @example
 * ```html
 * <div>{{ 'CAN_VIEW_REPORTS' | hasPermission | async }}</div>
 * <button [disabled]="!('CAN_EDIT' | hasPermission:{ resource: 'document', action: 'edit' } | async)">
 *   Edit
 * </button>
 * ```
 */
@Pipe({ 
  name: 'hasPermission', 
  standalone: true 
})
export class HasPermissionPipe implements PipeTransform {
  private readonly roleService = inject(RoleService);

  transform(permissionId: string, options?: { 
    resource?: string; 
    action?: string; 
    context?: Record<string, any>; 
  }): Observable<boolean> {
    if (!permissionId) {
      throw new Error('HasPermissionPipe: permissionId is required');
    }

    return this.roleService.hasPermission(permissionId, options);
  }
}

/**
 * Pipe for checking if user has any of the specified permissions
 * 
 * @example
 * ```html
 * <div>{{ ['CAN_READ', 'CAN_WRITE'] | hasAnyPermission | async }}</div>
 * ```
 */
@Pipe({ 
  name: 'hasAnyPermission', 
  standalone: true 
})
export class HasAnyPermissionPipe implements PipeTransform {
  private readonly roleService = inject(RoleService);

  transform(permissionIds: string[], options?: { 
    resource?: string; 
    action?: string; 
    context?: Record<string, any>; 
  }): Observable<boolean> {
    if (!permissionIds || !Array.isArray(permissionIds) || permissionIds.length === 0) {
      throw new Error('HasAnyPermissionPipe: permissionIds array is required');
    }

    return this.roleService.hasAnyPermission(permissionIds, options);
  }
}

/**
 * Pipe for getting current tenant ID
 * 
 * @example
 * ```html
 * <div>Current tenant: {{ '' | currentTenant | async }}</div>
 * ```
 */
@Pipe({ 
  name: 'currentTenant', 
  standalone: true 
})
export class CurrentTenantPipe implements PipeTransform {
  private readonly roleService = inject(RoleService);

  transform(value: any): Observable<string | null> {
    return this.roleService.getTenant();
  }
}

/**
 * Pipe for checking authentication status
 * 
 * @example
 * ```html
 * <div *ngIf="'' | isAuthenticated | async">Welcome, authenticated user!</div>
 * ```
 */
@Pipe({ 
  name: 'isAuthenticated', 
  standalone: true 
})
export class IsAuthenticatedPipe implements PipeTransform {
  private readonly roleService = inject(RoleService);

  transform(value: any): Observable<boolean> {
    return this.roleService.isAuthenticated$;
  }
}
