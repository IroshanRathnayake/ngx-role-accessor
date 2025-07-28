/**
 * @fileoverview HasAllRoles Directive for RBAC system
 * @author Iroshan Rathnayake
 * @version 2.0.0
 */

import {
  Directive,
  Input,
  TemplateRef,
  ViewContainerRef,
  OnInit,
  OnDestroy,
  inject,
  OnChanges,
  SimpleChanges,
  Renderer2,
  ElementRef
} from '@angular/core';
import { Subscription } from 'rxjs';
import { distinctUntilChanged, startWith } from 'rxjs/operators';

import { RoleService } from '../services/role.service';
import { RbacLogger } from '../utils/rbac-logger';

/**
 * Structural directive that conditionally shows/hides elements based on ALL specified user roles (AND logic)
 * 
 * @example
 * ```html
 * <!-- User must have BOTH admin AND manager roles -->
 * <div *hasAllRoles="['admin', 'manager']">Super admin content</div>
 * 
 * <!-- With options -->
 * <div *hasAllRoles="['editor', 'reviewer']; includeInherited: true">
 *   Content for users with both editor and reviewer roles
 * </div>
 * ```
 */
@Directive({ 
  selector: '[hasAllRoles]', 
  standalone: true 
})
export class HasAllRolesDirective implements OnInit, OnDestroy, OnChanges {
  
  @Input('hasAllRoles') roleIds!: string[];
  @Input('hasAllRolesIncludeInherited') includeInherited?: boolean;
  @Input('hasAllRolesTenantId') tenantId?: string;
  @Input('hasAllRolesMode') mode: 'visibility' | 'disabled' = 'visibility';
  @Input('hasAllRolesElse') elseTemplate?: TemplateRef<any>;
  @Input('hasAllRolesDebug') debug?: boolean = false;

  private readonly roleService = inject(RoleService);
  private readonly templateRef = inject(TemplateRef);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly renderer = inject(Renderer2);
  private readonly elementRef = inject(ElementRef);
  private readonly logger = inject(RbacLogger);

  private subscription?: Subscription;
  private currentView: any = null;
  private isInitialized = false;

  ngOnInit(): void {
    this.setupRoleCheck();
    this.isInitialized = true;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.isInitialized) {
      const criticalInputs = ['roleIds', 'includeInherited', 'tenantId'];
      const hasCriticalChanges = criticalInputs.some(key => changes[key]);
      
      if (hasCriticalChanges) {
        this.setupRoleCheck();
      }
    }
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  private setupRoleCheck(): void {
    this.subscription?.unsubscribe();

    if (!this.roleIds || !Array.isArray(this.roleIds) || this.roleIds.length === 0) {
      this.logger.error('HasAllRolesDirective: roleIds array is required and must not be empty');
      this.handleAccessDenied();
      return;
    }

    this.subscription = this.roleService.hasAllRoles(this.roleIds, {
      includeInherited: this.includeInherited,
      tenantId: this.tenantId
    }).pipe(
      startWith(false),
      distinctUntilChanged()
    ).subscribe({
      next: (hasAllRoles) => {
        if (hasAllRoles) {
          this.handleAccessGranted();
        } else {
          this.handleAccessDenied();
        }

        if (this.debug) {
          this.logger.debug('HasAllRolesDirective access check completed', {
            roleIds: this.roleIds,
            hasAccess: hasAllRoles
          });
        }
      },
      error: (error) => {
        this.logger.error('HasAllRolesDirective: Role check failed', error);
        this.handleAccessDenied();
      }
    });
  }

  private handleAccessGranted(): void {
    if (this.mode === 'visibility') {
      this.showElement();
    } else if (this.mode === 'disabled') {
      this.enableElement();
    }
  }

  private handleAccessDenied(): void {
    if (this.mode === 'visibility') {
      this.hideElement();
    } else if (this.mode === 'disabled') {
      this.disableElement();
    }
  }

  private showElement(): void {
    this.viewContainer.clear();
    this.currentView = this.viewContainer.createEmbeddedView(this.templateRef);
  }

  private hideElement(): void {
    this.viewContainer.clear();
    this.currentView = null;

    if (this.elseTemplate) {
      this.currentView = this.viewContainer.createEmbeddedView(this.elseTemplate);
    }
  }

  private enableElement(): void {
    const nativeElement = this.elementRef.nativeElement;
    if (nativeElement) {
      this.renderer.removeAttribute(nativeElement, 'disabled');
      this.renderer.removeAttribute(nativeElement, 'aria-disabled');
    }
  }

  private disableElement(): void {
    const nativeElement = this.elementRef.nativeElement;
    if (nativeElement) {
      this.renderer.setAttribute(nativeElement, 'disabled', 'true');
      this.renderer.setAttribute(nativeElement, 'aria-disabled', 'true');
    }
  }
}
