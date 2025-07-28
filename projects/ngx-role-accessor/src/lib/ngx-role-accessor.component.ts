import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
  HasAnyRoleDirective,
  HasPermissionDirective,
  HasRoleDirective,
  RoleService,
} from '../public-api';

@Component({
  selector: 'lib-ngx-role-accessor',
  imports: [
    CommonModule,
    HasRoleDirective,
    HasAnyRoleDirective,
    HasPermissionDirective,
  ],
  template: ` <button *hasRole="'ADMIN'">Admin Control</button>
    <div *hasAnyRole="['EDITOR', 'ADMIN']">Shared Access</div>
    <div *hasPermission="'CAN_VIEW_REPORTS'">Reports</div>`,
})
export class NgxRoleAccessorComponent {
  constructor(private roleService: RoleService) {
    this.roleService.setRoles(['ADMIN']);
    this.roleService.setPermissions(['CAN_VIEW_REPORTS']);
    this.roleService.setTenant('tenant-123');
  }
}
