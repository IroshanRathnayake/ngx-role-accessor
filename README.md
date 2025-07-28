# NGX Role Accessor - Advanced RBAC Library

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Angular](https://img.shields.io/badge/angular-16%2B-red.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![TypeScript](https://img.shields.io/badge/typescript-5.0%2B-blue.svg)

**🔐 Enterprise-grade Angular Role-Based Access Control (RBAC) Library**

[Documentation](./projects/ngx-role-accessor/README.md) • [Examples](#examples) • [API Reference](#api-reference)

</div>

---

## ✨ Features

- ✅ **Angular 16+ Standalone APIs** - Modern Angular support
- ✅ **Hierarchical Role System** - Role inheritance and levels
- ✅ **Multi-tenant Architecture** - Built-in tenant isolation
- ✅ **Fine-grained Permissions** - Resource and action-based permissions
- ✅ **Performance Optimized** - LRU caching with TTL support
- ✅ **Professional Logging** - Structured logging and audit trail
- ✅ **Event-driven Architecture** - Real-time RBAC events
- ✅ **Rich Directive Set** - Multiple directives for all scenarios
- ✅ **Route Guards** - Ready-to-use guards for route protection
- ✅ **Comprehensive Testing** - Full test coverage and utilities

---

## 📦 Installation

```bash
npm install ngx-role-accessor
```

---

## 🚀 Quick Start

```typescript
import { Component, inject } from '@angular/core';
import { 
  HasRoleDirective, 
  HasAnyRoleDirective, 
  HasPermissionDirective,
  RoleService 
} from 'ngx-role-accessor';

@Component({
  standalone: true,
  selector: 'app-dashboard',
  imports: [HasRoleDirective, HasAnyRoleDirective, HasPermissionDirective],
  template: `
    <!-- Role-based access -->
    <div *hasRole="'admin'">Admin only content</div>
    <div *hasAnyRole="['admin', 'manager']">Management content</div>
    
    <!-- Permission-based access -->
    <div *hasPermission="'CAN_VIEW_REPORTS'">Reports section</div>
    
    <!-- With fallback -->
    <div *hasRole="'premium'; else basicUser">Premium features</div>
    <ng-template #basicUser>Upgrade to premium</ng-template>
  `
})
export class DashboardComponent {
  private roleService = inject(RoleService);

  ngOnInit() {
    // Set user context
    this.roleService.setUserContext({
      userId: 'user123',
      roles: [
        { id: 'admin', name: 'Administrator', active: true, level: 0 }
      ],
      permissions: [
        { id: 'CAN_VIEW_REPORTS', name: 'View Reports', resource: 'reports', action: 'view', active: true }
      ],
      tenantId: 'tenant1',
      lastUpdated: new Date()
    });
  }
}
```

---

## 🏗️ Project Structure

```
ngx-role-accessor/
├── projects/
│   └── ngx-role-accessor/          # Main library
│       ├── src/
│       │   ├── lib/
│       │   │   ├── services/       # Core RBAC service
│       │   │   ├── directives/     # Structural directives
│       │   │   ├── guards/         # Route guards
│       │   │   ├── pipes/          # Template pipes
│       │   │   ├── utils/          # Utility classes
│       │   │   ├── types/          # TypeScript definitions
│       │   │   └── config/         # Configuration
│       │   └── public-api.ts       # Public API exports
│       └── README.md               # Full documentation
├── angular.json                    # Angular CLI config
├── package.json                    # Dependencies
└── README.md                       # This file
```

---

## � Documentation

For complete documentation, examples, and API reference, see:
**[📚 Full Documentation](./projects/ngx-role-accessor/README.md)**

---

## 🔧 Development

### Build the Library

```bash
ng build ngx-role-accessor
```

### Run Tests

```bash
ng test ngx-role-accessor
```

### Run Demo

```bash
ng serve
```

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

```bash
git clone https://github.com/IroshanRathnayake/ngx-role-accessor.git
cd ngx-role-accessor
npm install
npm run build
npm run test
```

---

## 📄 License

MIT © [Iroshan Rathnayake](https://github.com/IroshanRathnayake)

---

<div align="center">
  <p>Made with ❤️ for the Angular community</p>
  <p>
    <a href="https://github.com/IroshanRathnayake/ngx-role-accessor">⭐ Star this project</a>
  </p>
</div>