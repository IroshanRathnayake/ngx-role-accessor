# NGX Role Accessor - Advanced RBAC Library

<div align="center">

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![Angular](https://img.shields.io/badge/angular-16%2B-red.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![TypeScript](https://img.shields.io/badge/typescript-5.0%2B-blue.svg)
![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)

**🔐 Enterprise-grade Angular Role-Based Access Control (RBAC) Library with advanced features for large-scale applications**

[Installation](#installation) • [Features](#features) • [Documentation](#documentation) • [Examples](#examples) • [API Reference](#api-reference)

</div>

---

## ✨ Features

### 🚀 Core Features
- ✅ **Angular 16+ Standalone APIs** - Fully compatible with modern Angular
- ✅ **Hierarchical Role System** - Support for role inheritance and levels
- ✅ **Multi-tenant Architecture** - Built-in tenant isolation and context
- ✅ **Fine-grained Permissions** - Resource and action-based permissions
- ✅ **Reactive State Management** - RxJS-powered reactive updates
- ✅ **Performance Optimized** - LRU caching with TTL support

### 🏗️ Enterprise Features
- ✅ **Professional Logging** - Structured logging with multiple levels
- ✅ **Audit Trail** - Complete audit logging for compliance
- ✅ **Event-driven Architecture** - Real-time RBAC events
- ✅ **Type Safety** - Full TypeScript support with comprehensive types
- ✅ **Error Handling** - Graceful error handling with custom error types
- ✅ **Configuration Management** - Flexible configuration system

### 🎨 Developer Experience
- ✅ **Rich Directive Set** - Multiple structural directives for different scenarios
- ✅ **Pipe Support** - Template pipes for reactive access checks
- ✅ **Route Guards** - Ready-to-use guards for route protection
- ✅ **Comprehensive Testing** - Full test coverage with utilities
- ✅ **JSDoc Documentation** - Professional inline documentation
- ✅ **Accessibility Support** - ARIA attributes and screen reader support

---

## 📦 Installation

```bash
npm install ngx-role-accessor
```

---

## 🚀 Quick Start

### 1. Import and Configure

```typescript
import { bootstrapApplication } from '@angular/platform-browser';
import { RoleService, RBAC_CONFIG } from 'ngx-role-accessor';

bootstrapApplication(AppComponent, {
  providers: [
    {
      provide: RBAC_CONFIG,
      useValue: {
        enableRoleHierarchy: true,
        enableCaching: true,
        cacheTimeout: 300000,
        enableDebugLogging: true
      }
    }
  ]
});
```

### 2. Set User Context

```typescript
import { Component, inject } from '@angular/core';
import { RoleService, UserContext } from 'ngx-role-accessor';

@Component({
  selector: 'app-root',
  template: `<router-outlet></router-outlet>`
})
export class AppComponent {
  private roleService = inject(RoleService);

  ngOnInit() {
    const userContext: UserContext = {
      userId: 'user123',
      roles: [
        { id: 'admin', name: 'Administrator', active: true, level: 0 }
      ],
      permissions: [
        { id: 'read_reports', name: 'Read Reports', resource: 'reports', action: 'read', active: true }
      ],
      tenantId: 'tenant1',
      lastUpdated: new Date()
    };

    this.roleService.setUserContext(userContext);
  }
}
```

### 3. Use in Templates

```html
<!-- Role-based content -->
<div *hasRole="'admin'">Admin only content</div>
<div *hasAnyRole="['admin', 'manager']">Admin or manager content</div>

<!-- Permission-based content -->
<div *hasPermission="'read_reports'">Reports section</div>

<!-- With fallback templates -->
<div *hasRole="'premium'; else basicUser">Premium features</div>
<ng-template #basicUser>Upgrade to premium</ng-template>

<!-- Using pipes -->
<div *ngIf="'admin' | hasRole | async">Reactive admin check</div>
```

---

## 📖 Comprehensive API Documentation

### Directives

All directives support these common features:
- **Hierarchical role checking** with inheritance
- **Multi-tenant context** support
- **Fallback templates** for denied access
- **Animation support** for smooth transitions
- **Accessibility attributes** (ARIA)
- **CSS class management** based on access state
- **Debug logging** for development

#### *hasRole
Controls element visibility/state based on a single role.

```html
<!-- Basic usage -->
<div *hasRole="'admin'">Admin content</div>

<!-- With options -->
<div *hasRole="'manager'; includeInherited: true; tenantId: 'tenant1'">
  Manager content
</div>

<!-- Disable instead of hide -->
<button *hasRole="'editor'; mode: 'disabled'">Edit</button>

<!-- With animations and CSS classes -->
<div *hasRole="'vip'; animate: true; cssClasses: { granted: 'vip-style' }">
  VIP content
</div>
```

#### *hasAnyRole
Shows content if user has ANY of the specified roles (OR logic).

```html
<div *hasAnyRole="['admin', 'manager', 'supervisor']">
  Management content
</div>
```

#### *hasAllRoles
Shows content if user has ALL of the specified roles (AND logic).

```html
<div *hasAllRoles="['user', 'verified', 'premium']">
  Premium verified user content
</div>
```

#### *hasPermission
Controls element based on fine-grained permissions.

```html
<!-- Basic permission -->
<div *hasPermission="'CAN_VIEW_REPORTS'">Reports</div>

<!-- Resource-based permission -->
<button *hasPermission="'edit'; resource: 'document'; action: 'update'">
  Edit Document
</button>

<!-- With context -->
<div *hasPermission="'access'; context: { documentId: '123' }">
  Document-specific access
</div>
```

### Route Guards

```typescript
import { 
  createRoleGuard, 
  createPermissionGuard, 
  createRolePermissionGuard 
} from 'ngx-role-accessor';

const routes: Routes = [
  {
    path: 'admin',
    canActivate: [createRoleGuard({ 
      roles: ['admin'],
      redirectUrl: '/unauthorized' 
    })],
    loadChildren: () => import('./admin/admin.module')
  },
  {
    path: 'reports',
    canActivate: [createPermissionGuard({ 
      permissions: ['CAN_VIEW_REPORTS'] 
    })],
    component: ReportsComponent
  }
];
```

### Service API

```typescript
@Component({...})
export class MyComponent {
  constructor(private roleService: RoleService) {}

  async checkAccess() {
    // Role checks
    const isAdmin = await this.roleService.hasRole('admin').toPromise();
    const hasManagementRole = await this.roleService.hasAnyRole(['admin', 'manager']).toPromise();
    
    // Permission checks
    const canView = await this.roleService.hasPermission('CAN_VIEW_REPORTS').toPromise();
    
    // Get detailed results
    const result = await this.roleService.checkPermissionDetailed('role', 'admin').toPromise();
    
    // Service statistics and audit
    const stats = this.roleService.getStats();
    const auditLog = this.roleService.getAuditLog(50);
  }
}
```

### Pipes

```html
<!-- Role checks -->
<div>Has admin: {{ 'admin' | hasRole | async }}</div>
<div>Has any role: {{ ['admin', 'manager'] | hasAnyRole | async }}</div>
<div>Has all roles: {{ ['user', 'verified'] | hasAllRoles | async }}</div>

<!-- Permission checks -->
<div>Can edit: {{ 'CAN_EDIT' | hasPermission | async }}</div>
<div>Can read/write: {{ ['CAN_READ', 'CAN_WRITE'] | hasAnyPermission | async }}</div>

<!-- System state -->
<div>Authenticated: {{ '' | isAuthenticated | async }}</div>
<div>Current tenant: {{ '' | currentTenant | async }}</div>
```

---

## 🔧 Configuration

```typescript
import { RbacConfig, RBAC_CONFIG } from 'ngx-role-accessor';

const config: RbacConfig = {
  enableRoleHierarchy: true,     // Enable role inheritance
  enableCaching: true,           // Enable permission caching
  cacheTimeout: 300000,          // Cache TTL (5 minutes)
  maxCacheSize: 1000,           // Maximum cache entries
  enableDebugLogging: false,     // Debug logging
  strictMode: false,            // Throw errors vs return false
  defaultTenantId: undefined    // Default tenant context
};

// Provide configuration
bootstrapApplication(AppComponent, {
  providers: [
    { provide: RBAC_CONFIG, useValue: config }
  ]
});
```

---

## 🧪 Testing

### Component Testing

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RoleService } from 'ngx-role-accessor';
import { of } from 'rxjs';

describe('MyComponent', () => {
  let roleService: jasmine.SpyObj<RoleService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('RoleService', ['hasRole', 'hasPermission']);
    
    TestBed.configureTestingModule({
      providers: [{ provide: RoleService, useValue: spy }]
    });
    
    roleService = TestBed.inject(RoleService) as jasmine.SpyObj<RoleService>;
  });

  it('should show admin content for admin users', () => {
    roleService.hasRole.and.returnValue(of(true));
    // ... test implementation
  });
});
```

---

## 🚀 Advanced Features

### Event System
Listen to RBAC events for audit logging, analytics, or notifications:

```typescript
@Component({...})
export class AuditComponent {
  constructor(private roleService: RoleService) {}

  ngOnInit() {
    this.roleService.events$.subscribe(event => {
      switch (event.type) {
        case RbacEventType.ACCESS_DENIED:
          this.logSecurityEvent(event);
          break;
        case RbacEventType.CONTEXT_UPDATED:
          this.trackUserActivity(event);
          break;
      }
    });
  }
}
```

### Multi-tenant Support
Built-in support for multi-tenant applications:

```typescript
// Switch tenant context
switchTenant(tenantId: string) {
  const context = this.roleService.getUserContext();
  if (context) {
    this.roleService.setUserContext({
      ...context,
      tenantId,
      lastUpdated: new Date()
    });
  }
}
```

### Performance Monitoring
Monitor and optimize RBAC performance:

```typescript
// Get performance statistics
const stats = this.roleService.getStats();
console.log('Cache hit rate:', stats.cacheStats);

// Clear caches when needed
if (stats.cacheStats.permissionCacheSize > 1000) {
  this.roleService.clearAllCaches();
}
```

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

---

## 📄 License

MIT © [Iroshan Rathnayake](https://github.com/IroshanRathnayake)

---

## �‍♂️ Support

- 📖 [Documentation](https://github.com/IroshanRathnayake/ngx-role-accessor/wiki)
- 🐛 [Issues](https://github.com/IroshanRathnayake/ngx-role-accessor/issues)
- 💬 [Discussions](https://github.com/IroshanRathnayake/ngx-role-accessor/discussions)