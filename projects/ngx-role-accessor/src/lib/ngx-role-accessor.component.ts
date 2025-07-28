/**
 * @fileoverview Demo Component for ngx-role-accessor library
 * @author Iroshan Rathnayake
 * @version 2.0.0
 */

import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Import all directives
import {
  HasAnyRoleDirective,
  HasPermissionDirective,
  HasRoleDirective,
  HasAllRolesDirective,
  HasAnyPermissionDirective,
  RoleService,
  Role,
  Permission,
  UserContext,
  RbacEventType
} from '../public-api';

// Import pipes
import {
  HasRolePipe,
  HasAnyRolePipe,
  HasAllRolesPipe,
  HasPermissionPipe,
  HasAnyPermissionPipe,
  CurrentTenantPipe,
  IsAuthenticatedPipe
} from './pipes/rbac.pipes';

/**
 * Demo component showcasing all RBAC features
 * This component demonstrates the usage of directives, pipes, and service methods
 * 
 * @example
 * ```html
 * <lib-ngx-role-accessor></lib-ngx-role-accessor>
 * ```
 */
@Component({
  selector: 'lib-ngx-role-accessor',
  standalone: true,
  imports: [
    CommonModule,
    HasRoleDirective,
    HasAnyRoleDirective,
    HasPermissionDirective,
    HasAllRolesDirective,
    HasAnyPermissionDirective,
    HasRolePipe,
    HasAnyRolePipe,
    HasAllRolesPipe,
    HasPermissionPipe,
    HasAnyPermissionPipe,
    CurrentTenantPipe,
    IsAuthenticatedPipe
  ],
  template: `
    <div class="rbac-demo">
      <h2>NGX Role Accessor Demo</h2>
      
      <!-- Authentication Status -->
      <div class="auth-status">
        <p><strong>Authenticated:</strong> {{ '' | isAuthenticated | async }}</p>
        <p><strong>Current Tenant:</strong> {{ ('' | currentTenant | async) || 'None' }}</p>
      </div>

      <!-- User Context Controls -->
      <div class="user-controls">
        <h3>User Context Controls</h3>
        <button (click)="setAdminUser()">Set Admin User</button>
        <button (click)="setManagerUser()">Set Manager User</button>
        <button (click)="setRegularUser()">Set Regular User</button>
        <button (click)="clearUser()">Clear User</button>
      </div>

      <!-- Role-based Directives Demo -->
      <div class="directive-demo">
        <h3>Directive Examples</h3>
        
        <!-- Single Role -->
        <div *hasRole="'ADMIN'" class="demo-section admin-section">
          <h4>Admin Only Section</h4>
          <p>This content is only visible to admins</p>
        </div>

        <!-- Any Role -->
        <div *hasAnyRole="['ADMIN', 'MANAGER']" class="demo-section manager-section">
          <h4>Admin or Manager Section</h4>
          <p>This content is visible to admins or managers</p>
        </div>

        <!-- All Roles -->
        <div *hasAllRoles="['USER', 'VERIFIED']" class="demo-section verified-user-section">
          <h4>Verified User Section</h4>
          <p>User must have both USER and VERIFIED roles</p>
        </div>

        <!-- Permission-based -->
        <div *hasPermission="'CAN_VIEW_REPORTS'" class="demo-section reports-section">
          <h4>Reports Section</h4>
          <p>This content requires CAN_VIEW_REPORTS permission</p>
        </div>

        <!-- Any Permission -->
        <div *hasAnyPermission="['CAN_READ', 'CAN_WRITE']" class="demo-section rw-section">
          <h4>Read/Write Section</h4>
          <p>User needs either read or write permission</p>
        </div>

        <!-- Disabled mode example -->
        <button *hasRole="'ADMIN'; mode: 'disabled'" class="demo-button">
          Admin Action (disabled if not admin)
        </button>

        <!-- With fallback template -->
        <div *hasRole="'PREMIUM'; else basicUser" class="demo-section premium-section">
          <h4>Premium Content</h4>
          <p>Premium features available here</p>
        </div>
        <ng-template #basicUser>
          <div class="demo-section basic-section">
            <h4>Basic Content</h4>
            <p>Upgrade to premium for more features</p>
          </div>
        </ng-template>
      </div>

      <!-- Pipe Examples -->
      <div class="pipe-demo">
        <h3>Pipe Examples</h3>
        <ul>
          <li>Has Admin Role: {{ 'ADMIN' | hasRole | async }}</li>
          <li>Has Any Manager Role: {{ ['ADMIN', 'MANAGER'] | hasAnyRole | async }}</li>
          <li>Has All Roles: {{ ['USER', 'VERIFIED'] | hasAllRoles | async }}</li>
          <li>Can View Reports: {{ 'CAN_VIEW_REPORTS' | hasPermission | async }}</li>
          <li>Can Read or Write: {{ ['CAN_READ', 'CAN_WRITE'] | hasAnyPermission | async }}</li>
        </ul>
      </div>

      <!-- Service Methods Demo -->
      <div class="service-demo">
        <h3>Service Methods</h3>
        <button (click)="checkAdminRole()">Check Admin Role</button>
        <button (click)="checkMultipleRoles()">Check Multiple Roles</button>
        <button (click)="checkPermission()">Check Permission</button>
        <button (click)="getStats()">Get Service Stats</button>
        
        <div *ngIf="demoResult" class="demo-result">
          <h4>Result:</h4>
          <pre>{{ demoResult | json }}</pre>
        </div>
      </div>

      <!-- Event Log -->
      <div class="event-log" *ngIf="eventLog.length > 0">
        <h3>Event Log</h3>
        <div class="log-entries">
          <div *ngFor="let event of eventLog.slice(-5)" class="log-entry">
            <span class="event-type">{{ event.type }}</span>
            <span class="event-time">{{ event.timestamp | date:'medium' }}</span>
            <pre class="event-payload">{{ event.payload | json }}</pre>
          </div>
        </div>
        <button (click)="clearEventLog()">Clear Log</button>
      </div>
    </div>
  `,
  styles: [`
    .rbac-demo {
      padding: 20px;
      font-family: Arial, sans-serif;
    }

    .auth-status {
      background: #f0f0f0;
      padding: 15px;
      border-radius: 5px;
      margin-bottom: 20px;
    }

    .user-controls {
      margin-bottom: 20px;
    }

    .user-controls button {
      margin-right: 10px;
      padding: 8px 15px;
      background: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }

    .user-controls button:hover {
      background: #0056b3;
    }

    .demo-section {
      margin: 10px 0;
      padding: 15px;
      border-radius: 5px;
      border-left: 4px solid #007bff;
    }

    .admin-section { border-left-color: #dc3545; background: #f8d7da; }
    .manager-section { border-left-color: #fd7e14; background: #fff3cd; }
    .verified-user-section { border-left-color: #28a745; background: #d4edda; }
    .reports-section { border-left-color: #17a2b8; background: #d1ecf1; }
    .rw-section { border-left-color: #6f42c1; background: #e2d9f3; }
    .premium-section { border-left-color: #ffc107; background: #fff3cd; }
    .basic-section { border-left-color: #6c757d; background: #f8f9fa; }

    .demo-button {
      padding: 10px 20px;
      margin: 10px 0;
      background: #28a745;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }

    .demo-button:disabled {
      background: #6c757d;
      cursor: not-allowed;
    }

    .pipe-demo ul {
      list-style-type: none;
      padding: 0;
    }

    .pipe-demo li {
      padding: 5px 0;
      border-bottom: 1px solid #eee;
    }

    .service-demo button {
      margin: 5px;
      padding: 8px 15px;
      background: #17a2b8;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }

    .demo-result {
      margin-top: 15px;
      padding: 15px;
      background: #f8f9fa;
      border-radius: 5px;
    }

    .event-log {
      margin-top: 20px;
      padding: 15px;
      background: #f8f9fa;
      border-radius: 5px;
    }

    .log-entries {
      max-height: 300px;
      overflow-y: auto;
    }

    .log-entry {
      margin: 10px 0;
      padding: 10px;
      background: white;
      border-radius: 3px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .event-type {
      font-weight: bold;
      color: #007bff;
    }

    .event-time {
      font-size: 0.8em;
      color: #6c757d;
      float: right;
    }

    .event-payload {
      margin: 5px 0 0 0;
      font-size: 0.8em;
      color: #495057;
    }

    .rbac-disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  `]
})
export class NgxRoleAccessorComponent implements OnInit, OnDestroy {
  
  public demoResult: any = null;
  public eventLog: any[] = [];
  
  private destroy$ = new Subject<void>();

  // Sample roles and permissions
  private sampleRoles: Role[] = [
    { id: 'ADMIN', name: 'Administrator', active: true, level: 0 },
    { id: 'MANAGER', name: 'Manager', active: true, level: 10, parentRoleId: 'ADMIN' },
    { id: 'USER', name: 'User', active: true, level: 20 },
    { id: 'VERIFIED', name: 'Verified User', active: true, level: 25 },
    { id: 'PREMIUM', name: 'Premium User', active: true, level: 30 }
  ];

  private samplePermissions: Permission[] = [
    { id: 'CAN_VIEW_REPORTS', name: 'View Reports', resource: 'reports', action: 'view', active: true },
    { id: 'CAN_EDIT_CONTENT', name: 'Edit Content', resource: 'content', action: 'edit', active: true },
    { id: 'CAN_DELETE_USERS', name: 'Delete Users', resource: 'users', action: 'delete', active: true },
    { id: 'CAN_READ', name: 'Read Access', resource: 'general', action: 'read', active: true },
    { id: 'CAN_WRITE', name: 'Write Access', resource: 'general', action: 'write', active: true }
  ];

  constructor(private roleService: RoleService) {}

  ngOnInit(): void {
    // Set up initial demo user
    this.setRegularUser();

    // Subscribe to RBAC events for demo purposes
    this.roleService.events$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(event => {
      this.eventLog.push(event);
      
      // Keep only last 20 events
      if (this.eventLog.length > 20) {
        this.eventLog = this.eventLog.slice(-20);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Sets an admin user context
   */
  setAdminUser(): void {
    const context: UserContext = {
      userId: 'admin-001',
      roles: [
        this.sampleRoles.find(r => r.id === 'ADMIN')!,
        this.sampleRoles.find(r => r.id === 'USER')!,
        this.sampleRoles.find(r => r.id === 'VERIFIED')!
      ],
      permissions: this.samplePermissions,
      tenantId: 'demo-tenant',
      sessionData: { loginTime: new Date() },
      lastUpdated: new Date()
    };

    this.roleService.setUserContext(context);
    this.demoResult = { message: 'Admin user context set', context };
  }

  /**
   * Sets a manager user context
   */
  setManagerUser(): void {
    const context: UserContext = {
      userId: 'manager-001',
      roles: [
        this.sampleRoles.find(r => r.id === 'MANAGER')!,
        this.sampleRoles.find(r => r.id === 'USER')!,
        this.sampleRoles.find(r => r.id === 'VERIFIED')!
      ],
      permissions: [
        this.samplePermissions.find(p => p.id === 'CAN_VIEW_REPORTS')!,
        this.samplePermissions.find(p => p.id === 'CAN_EDIT_CONTENT')!,
        this.samplePermissions.find(p => p.id === 'CAN_READ')!,
        this.samplePermissions.find(p => p.id === 'CAN_WRITE')!
      ],
      tenantId: 'demo-tenant',
      sessionData: { loginTime: new Date() },
      lastUpdated: new Date()
    };

    this.roleService.setUserContext(context);
    this.demoResult = { message: 'Manager user context set', context };
  }

  /**
   * Sets a regular user context
   */
  setRegularUser(): void {
    const context: UserContext = {
      userId: 'user-001',
      roles: [
        this.sampleRoles.find(r => r.id === 'USER')!
      ],
      permissions: [
        this.samplePermissions.find(p => p.id === 'CAN_READ')!
      ],
      tenantId: 'demo-tenant',
      sessionData: { loginTime: new Date() },
      lastUpdated: new Date()
    };

    this.roleService.setUserContext(context);
    this.demoResult = { message: 'Regular user context set', context };
  }

  /**
   * Clears user context
   */
  clearUser(): void {
    // Create empty context
    const context: UserContext = {
      userId: 'anonymous',
      roles: [],
      permissions: [],
      lastUpdated: new Date()
    };

    this.roleService.setUserContext(context);
    this.demoResult = { message: 'User context cleared' };
  }

  /**
   * Demonstrates role checking
   */
  checkAdminRole(): void {
    this.roleService.hasRole('ADMIN').subscribe(hasRole => {
      this.demoResult = {
        method: 'hasRole',
        role: 'ADMIN',
        result: hasRole
      };
    });
  }

  /**
   * Demonstrates multiple role checking
   */
  checkMultipleRoles(): void {
    this.roleService.hasAnyRole(['ADMIN', 'MANAGER', 'PREMIUM']).subscribe(hasAnyRole => {
      this.demoResult = {
        method: 'hasAnyRole',
        roles: ['ADMIN', 'MANAGER', 'PREMIUM'],
        result: hasAnyRole
      };
    });
  }

  /**
   * Demonstrates permission checking
   */
  checkPermission(): void {
    this.roleService.hasPermission('CAN_VIEW_REPORTS').subscribe(hasPermission => {
      this.demoResult = {
        method: 'hasPermission',
        permission: 'CAN_VIEW_REPORTS',
        result: hasPermission
      };
    });
  }

  /**
   * Gets service statistics
   */
  getStats(): void {
    const stats = this.roleService.getStats();
    this.demoResult = {
      method: 'getStats',
      result: stats
    };
  }

  /**
   * Clears the event log
   */
  clearEventLog(): void {
    this.eventLog = [];
  }
}
