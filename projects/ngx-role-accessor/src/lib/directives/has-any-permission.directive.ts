/**
 * @fileoverview HasAnyPermission Directive for RBAC system
 * @author Iroshan Rathnayake
 * @version 1.0.0
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
 * Structural directive that conditionally shows/hides elements based on any of multiple permissions (OR logic)
 * 
 * @example
 * ```html
 * <!-- User needs ANY of these permissions -->
 * <div *hasAnyPermission="['CAN_READ', 'CAN_WRITE', 'CAN_ADMIN']">Content</div>
 * 
 * <!-- With resource context -->
 * <div *hasAnyPermission="['READ', 'WRITE']; resource: 'document'">Document actions</div>
 * ```
 */
@Directive({ 
  selector: '[hasAnyPermission]', 
  standalone: true 
})
export class HasAnyPermissionDirective implements OnInit, OnDestroy, OnChanges {
  
  @Input('hasAnyPermission') permissionIds!: string[];
  @Input('hasAnyPermissionResource') resource?: string;
  @Input('hasAnyPermissionAction') action?: string;
  @Input('hasAnyPermissionContext') context?: Record<string, any>;
  @Input('hasAnyPermissionMode') mode: 'visibility' | 'disabled' = 'visibility';
  @Input('hasAnyPermissionElse') elseTemplate?: TemplateRef<any>;
  @Input('hasAnyPermissionDebug') debug?: boolean = false;

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
    this.setupPermissionCheck();
    this.isInitialized = true;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.isInitialized) {
      const criticalInputs = ['permissionIds', 'resource', 'action', 'context'];
      const hasCriticalChanges = criticalInputs.some(key => changes[key]);
      
      if (hasCriticalChanges) {
        this.setupPermissionCheck();
      }
    }
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  private setupPermissionCheck(): void {
    this.subscription?.unsubscribe();

    if (!this.permissionIds || !Array.isArray(this.permissionIds) || this.permissionIds.length === 0) {
      this.logger.error('HasAnyPermissionDirective: permissionIds array is required and must not be empty');
      this.handleAccessDenied();
      return;
    }

    const options: Record<string, any> = {};
    if (this.resource) options['resource'] = this.resource;
    if (this.action) options['action'] = this.action;
    if (this.context) options['context'] = this.context;

    this.subscription = this.roleService.hasAnyPermission(this.permissionIds, options).pipe(
      startWith(false),
      distinctUntilChanged()
    ).subscribe({
      next: (hasAnyPermission) => {
        if (hasAnyPermission) {
          this.handleAccessGranted();
        } else {
          this.handleAccessDenied();
        }

        if (this.debug) {
          this.logger.debug('HasAnyPermissionDirective access check completed', {
            permissionIds: this.permissionIds,
            resource: this.resource,
            action: this.action,
            hasAccess: hasAnyPermission
          });
        }
      },
      error: (error) => {
        this.logger.error('HasAnyPermissionDirective: Permission check failed', error);
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
