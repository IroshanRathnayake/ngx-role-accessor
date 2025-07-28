/**
 * @fileoverview Role hierarchy utility for RBAC system
 * @author Iroshan Rathnayake
 * @version 1.0.0
 */

import { Injectable } from '@angular/core';
import { Role, RbacError, RbacErrorCode } from '../types/rbac.types';
import { RbacLogger } from './rbac-logger';

/**
 * Manages role hierarchies and inheritance
 * Provides functionality to resolve role hierarchies and check inherited permissions
 */
@Injectable({
  providedIn: 'root'
})
export class RoleHierarchyManager {
  private hierarchyCache = new Map<string, Role[]>();

  constructor(private logger: RbacLogger) {}

  /**
   * Resolves all roles in a hierarchy including inherited roles
   * 
   * @param userRoles - User's directly assigned roles
   * @param allRoles - All available roles in the system
   * @param tenantId - Optional tenant context
   * @returns Array of all roles including inherited ones
   * 
   * @example
   * ```typescript
   * const userRoles = [{ id: 'manager', level: 20, parentRoleId: 'admin' }];
   * const allRoles = [...]; // All system roles
   * const resolvedRoles = hierarchyManager.resolveHierarchy(userRoles, allRoles);
   * // Returns: [manager, admin, super-admin] (assuming hierarchy exists)
   * ```
   */
  resolveHierarchy(
    userRoles: Role[], 
    allRoles: Role[], 
    tenantId?: string
  ): Role[] {
    const cacheKey = this.generateCacheKey(userRoles, tenantId);
    
    // Check cache first
    if (this.hierarchyCache.has(cacheKey)) {
      const cached = this.hierarchyCache.get(cacheKey)!;
      this.logger.debug('Role hierarchy resolved from cache', { 
        cacheKey, 
        resolvedRolesCount: cached.length 
      });
      return cached;
    }

    const endTimer = this.logger.time('role-hierarchy-resolution');
    
    try {
      const resolvedRoles = new Set<Role>();
      const processedRoleIds = new Set<string>();

      // Process each user role
      for (const role of userRoles) {
        this.resolveRoleRecursively(
          role, 
          allRoles, 
          resolvedRoles, 
          processedRoleIds, 
          tenantId
        );
      }

      const result = Array.from(resolvedRoles);
      
      // Cache the result
      this.hierarchyCache.set(cacheKey, result);
      
      this.logger.debug('Role hierarchy resolved', {
        userRolesCount: userRoles.length,
        resolvedRolesCount: result.length,
        tenantId
      });

      return result;
    } catch (error) {
      this.logger.error('Failed to resolve role hierarchy', error);
      throw new RbacError(
        'Role hierarchy resolution failed',
        RbacErrorCode.HIERARCHY_ERROR,
        { userRoles: userRoles.map(r => r.id), tenantId, error }
      );
    } finally {
      endTimer();
    }
  }

  /**
   * Checks if a role has a specific inherited role
   * 
   * @param role - Role to check
   * @param targetRoleId - ID of the role to look for in hierarchy
   * @param allRoles - All available roles in the system
   * @returns True if the role inherits the target role
   */
  hasInheritedRole(role: Role, targetRoleId: string, allRoles: Role[]): boolean {
    const hierarchy = this.resolveHierarchy([role], allRoles);
    return hierarchy.some(r => r.id === targetRoleId);
  }

  /**
   * Gets all child roles of a given role
   * 
   * @param parentRoleId - ID of the parent role
   * @param allRoles - All available roles in the system
   * @returns Array of child roles
   */
  getChildRoles(parentRoleId: string, allRoles: Role[]): Role[] {
    return allRoles.filter(role => role.parentRoleId === parentRoleId);
  }

  /**
   * Gets the complete hierarchy path from a role to the root
   * 
   * @param role - Starting role
   * @param allRoles - All available roles in the system
   * @returns Array of roles from the given role up to the root
   */
  getHierarchyPath(role: Role, allRoles: Role[]): Role[] {
    const path: Role[] = [];
    let currentRole: Role | undefined = role;

    while (currentRole) {
      path.push(currentRole);
      
      if (currentRole.parentRoleId) {
        currentRole = allRoles.find(r => r.id === currentRole!.parentRoleId);
      } else {
        break;
      }
    }

    return path;
  }

  /**
   * Validates role hierarchy for circular dependencies and invalid references
   * 
   * @param roles - All roles to validate
   * @throws RbacError if validation fails
   */
  validateHierarchy(roles: Role[]): void {
    const roleMap = new Map(roles.map(r => [r.id, r]));
    
    for (const role of roles) {
      if (role.parentRoleId) {
        this.validateRoleHierarchyRecursively(
          role, 
          roleMap, 
          new Set([role.id])
        );
      }
    }
  }

  /**
   * Clears the hierarchy cache
   * 
   * @param tenantId - Optional tenant ID to clear cache for specific tenant
   */
  clearCache(tenantId?: string): void {
    if (tenantId) {
      // Clear cache entries for specific tenant
      for (const key of this.hierarchyCache.keys()) {
        if (key.includes(`tenant:${tenantId}`)) {
          this.hierarchyCache.delete(key);
        }
      }
    } else {
      // Clear all cache
      this.hierarchyCache.clear();
    }
    
    this.logger.debug('Role hierarchy cache cleared', { tenantId });
  }

  /**
   * Gets hierarchy statistics
   * 
   * @param roles - All roles to analyze
   * @returns Statistics about the role hierarchy
   */
  getHierarchyStats(roles: Role[]): {
    totalRoles: number;
    rootRoles: number;
    maxDepth: number;
    circularDependencies: string[];
    orphanedRoles: string[];
  } {
    const roleMap = new Map(roles.map(r => [r.id, r]));
    const rootRoles = roles.filter(r => !r.parentRoleId);
    const circularDependencies: string[] = [];
    const orphanedRoles: string[] = [];

    let maxDepth = 0;

    // Check for circular dependencies and calculate max depth
    for (const role of roles) {
      try {
        if (role.parentRoleId) {
          this.validateRoleHierarchyRecursively(
            role, 
            roleMap, 
            new Set([role.id])
          );
          
          // Calculate depth
          const depth = this.calculateRoleDepth(role, roleMap);
          maxDepth = Math.max(maxDepth, depth);
        }
      } catch (error) {
        if (error instanceof RbacError && error.code === RbacErrorCode.HIERARCHY_ERROR) {
          circularDependencies.push(role.id);
        }
      }

      // Check for orphaned roles
      if (role.parentRoleId && !roleMap.has(role.parentRoleId)) {
        orphanedRoles.push(role.id);
      }
    }

    return {
      totalRoles: roles.length,
      rootRoles: rootRoles.length,
      maxDepth,
      circularDependencies,
      orphanedRoles
    };
  }

  /**
   * Recursively resolves a role and its parent roles
   * 
   * @private
   */
  private resolveRoleRecursively(
    role: Role,
    allRoles: Role[],
    resolvedRoles: Set<Role>,
    processedRoleIds: Set<string>,
    tenantId?: string
  ): void {
    // Prevent infinite recursion
    if (processedRoleIds.has(role.id)) {
      throw new RbacError(
        `Circular dependency detected in role hierarchy: ${role.id}`,
        RbacErrorCode.HIERARCHY_ERROR,
        { roleId: role.id, processedRoles: Array.from(processedRoleIds) }
      );
    }

    // Filter by tenant if specified
    if (tenantId && role.tenantId && role.tenantId !== tenantId) {
      return;
    }

    processedRoleIds.add(role.id);
    resolvedRoles.add(role);

    // Process parent role if exists
    if (role.parentRoleId) {
      const parentRole = allRoles.find(r => r.id === role.parentRoleId);
      
      if (parentRole) {
        this.resolveRoleRecursively(
          parentRole, 
          allRoles, 
          resolvedRoles, 
          processedRoleIds, 
          tenantId
        );
      } else {
        this.logger.warn('Parent role not found', {
          roleId: role.id,
          parentRoleId: role.parentRoleId
        });
      }
    }

    processedRoleIds.delete(role.id);
  }

  /**
   * Validates role hierarchy recursively for circular dependencies
   * 
   * @private
   */
  private validateRoleHierarchyRecursively(
    role: Role,
    roleMap: Map<string, Role>,
    visited: Set<string>
  ): void {
    if (!role.parentRoleId) {
      return;
    }

    if (visited.has(role.parentRoleId)) {
      throw new RbacError(
        `Circular dependency detected in role hierarchy: ${Array.from(visited).join(' -> ')} -> ${role.parentRoleId}`,
        RbacErrorCode.HIERARCHY_ERROR,
        { 
          circularPath: Array.from(visited), 
          conflictingRole: role.parentRoleId 
        }
      );
    }

    const parentRole = roleMap.get(role.parentRoleId);
    if (!parentRole) {
      throw new RbacError(
        `Parent role not found: ${role.parentRoleId}`,
        RbacErrorCode.INVALID_ROLE,
        { roleId: role.id, parentRoleId: role.parentRoleId }
      );
    }

    visited.add(role.parentRoleId);
    this.validateRoleHierarchyRecursively(parentRole, roleMap, visited);
    visited.delete(role.parentRoleId);
  }

  /**
   * Calculates the depth of a role in the hierarchy
   * 
   * @private
   */
  private calculateRoleDepth(role: Role, roleMap: Map<string, Role>): number {
    let depth = 1;
    let currentRole = role;

    while (currentRole.parentRoleId) {
      const parentRole = roleMap.get(currentRole.parentRoleId);
      if (!parentRole) {
        break;
      }
      depth++;
      currentRole = parentRole;
    }

    return depth;
  }

  /**
   * Generates a cache key for role hierarchy
   * 
   * @private
   */
  private generateCacheKey(roles: Role[], tenantId?: string): string {
    const roleIds = roles.map(r => r.id).sort().join(',');
    const tenant = tenantId ? `tenant:${tenantId}` : 'no-tenant';
    return `${roleIds}:${tenant}`;
  }
}
