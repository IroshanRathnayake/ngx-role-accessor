/**
 * Public API Surface of ngx-role-accessor
 * 
 * @fileoverview Exports all public APIs for ngx-role-accessor library
 * @author Iroshan Rathnayake
 * @version 1.0.0
 */

// Core Service
export * from './lib/services/role.service';

// Types and Interfaces
export * from './lib/types/rbac.types';

// Configuration
export * from './lib/config/rbac.config';

// Directives
export * from './lib/directives/has-role.directive';
export * from './lib/directives/has-any-role.directive';
export * from './lib/directives/has-permission.directive';
export * from './lib/directives/has-all-roles.directive';
export * from './lib/directives/has-any-permission.directive';

// Guards
export * from './lib/guards/rbac.guards';

// Pipes
export * from './lib/pipes/rbac.pipes';

// Utilities
export * from './lib/utils/lru-cache';
export * from './lib/utils/rbac-logger';
export * from './lib/utils/role-hierarchy.manager';

// Main Component (for testing/demo purposes)
export * from './lib/ngx-role-accessor.component';