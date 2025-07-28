# ngx-role-accessor

> 🔐 Lightweight Angular 16+ Standalone Role-Based Access Control (RBAC) Directives and Service with support for Roles, Permissions, and Tenant Context.

---

## ✨ Features

- ✅ Easy-to-use `*hasRole`, `*hasAnyRole`, `*hasPermission` structural directives
- ✅ Designed with Angular Standalone APIs (v16+)
- ✅ Reactive, dynamic, and context-aware access control
- ✅ Lightweight, framework-consistent, and customizable
- ✅ Supports multi-tenant SaaS-style applications

---

## 📦 Installation

```bash
npm install ngx-role-accessor
```

---

## 🚀 Usage

### 1. Import the Directives in Your Standalone Component

```ts
import {
  HasRoleDirective,
  HasAnyRoleDirective,
  HasPermissionDirective
} from 'ngx-role-accessor';

@Component({
  standalone: true,
  selector: 'app-dashboard',
  imports: [CommonModule, HasRoleDirective, HasAnyRoleDirective, HasPermissionDirective],
  template: `
    <button *hasRole="'ADMIN'">Admin Control</button>
    <div *hasAnyRole="['EDITOR', 'ADMIN']">Shared Access</div>
    <div *hasPermission="'CAN_VIEW_REPORTS'">Reports</div>
  `
})
export class DashboardComponent {
  constructor(private roleService: RoleService) {
    this.roleService.setRoles(['ADMIN']);
    this.roleService.setPermissions(['CAN_VIEW_REPORTS']);
    this.roleService.setTenant('tenant-001');
  }
}
```

---

## 🧠 API

### RoleService

```ts
setRoles(roles: string[]): void;
setPermissions(permissions: string[]): void;
setTenant(tenantId: string): void;

hasRole(role: string): Observable<boolean>;
hasAnyRole(roles: string[]): Observable<boolean>;
hasPermission(permission: string): Observable<boolean>;
getTenant(): Observable<string | null>;
```

### Directives

| Directive         | Input Type     | Description                                 |
|------------------|----------------|---------------------------------------------|
| `*hasRole`        | `string`       | Render if user has specific role            |
| `*hasAnyRole`     | `string[]`     | Render if user has one of given roles       |
| `*hasPermission`  | `string`       | Render if user has given permission         |

---

## 🔐 Route Guard Usage

You can create a custom `RoleGuard` like this:

```ts
import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { map } from 'rxjs/operators';
import { RoleService } from 'ngx-role-accessor';

export const adminOnlyGuard: CanActivateFn = () => {
  const roleService = inject(RoleService);
  return roleService.hasRole('ADMIN').pipe(map(has => has));
};
```

Then use it in your route:

```ts
{
  path: 'admin',
  canActivate: [adminOnlyGuard],
  loadComponent: () => import('./admin/admin.component').then(m => m.AdminComponent)
}
```

---

## 🧪 Running Unit Tests

From the project root:

```bash
ng test ngx-role-accessor
```

---

## 📄 License

MIT © [Iroshan Rathnayake](https://github.com/IroshanRathnayake)

---

## 🙌 Contributions

Contributions, issues and feature requests are welcome!  
Feel free to open a pull request or issue.