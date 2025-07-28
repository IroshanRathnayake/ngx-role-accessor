/**
 * @fileoverview Enhanced HasAnyRole Directive for RBAC system
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
 * Enhanced structural directive that conditionally shows/hides elements based on any of multiple user roles
 * 
 * Features:
 * - Multiple role checking with OR logic
 * - Role hierarchy support
 * - Multi-tenant awareness
 * - Fallback template support
 * - Performance optimization
 * - Debug logging
 * 
 * @example
 * ```html
 * <!-- Basic usage -->
 * <div *hasAnyRole="['admin', 'manager']">Admin or Manager content</div>
 * 
 * <!-- With options -->
 * <div *hasAnyRole="['editor', 'author']; includeInherited: true; tenantId: 'tenant1'">
 *   Editor or Author content
 * </div>
 * 
 * <!-- With fallback -->
 * <div *hasAnyRole="['premium', 'vip']; else basicUser">Premium content</div>
 * <ng-template #basicUser>Basic user content</ng-template>
 * 
 * <!-- Disable instead of hide -->
 * <button *hasAnyRole="['moderator', 'admin']; mode: 'disabled'">Moderate</button>
 * ```
 */
@Directive({ 
  selector: '[hasAnyRole]', 
  standalone: true 
})
export class HasAnyRoleDirective implements OnInit, OnDestroy, OnChanges {
  
  /**
   * Array of role IDs to check for (OR logic)
   */
  @Input('hasAnyRole') roleIds!: string[];

  /**
   * Whether to include inherited roles in the check
   * @default true (follows service configuration)
   */
  @Input('hasAnyRoleIncludeInherited') includeInherited?: boolean;

  /**
   * Specific tenant context for the role check
   */
  @Input('hasAnyRoleTenantId') tenantId?: string;

  /**
   * Directive behavior mode
   * - 'visibility': Show/hide element (default)
   * - 'disabled': Enable/disable element
   */
  @Input('hasAnyRoleMode') mode: 'visibility' | 'disabled' = 'visibility';

  /**
   * Fallback template to show when access is denied
   */
  @Input('hasAnyRoleElse') elseTemplate?: TemplateRef<any>;

  /**
   * CSS classes to apply based on permission state
   */
  @Input('hasAnyRoleCssClasses') cssClasses?: {
    granted?: string;
    denied?: string;
  };

  /**
   * Whether to use fade animation when showing/hiding
   */
  @Input('hasAnyRoleAnimate') animate?: boolean = false;

  /**
   * Debug mode - logs directive activity
   */
  @Input('hasAnyRoleDebug') debug?: boolean = false;

  // Injected dependencies
  private readonly roleService = inject(RoleService);
  private readonly templateRef = inject(TemplateRef);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly renderer = inject(Renderer2);
  private readonly elementRef = inject(ElementRef);
  private readonly logger = inject(RbacLogger);

  // State management
  private subscription?: Subscription;
  private currentView: any = null;
  private hasAccess = false;
  private isInitialized = false;
  private grantingRoles: string[] = [];

  /**
   * Component lifecycle: Initialize the directive
   */
  ngOnInit(): void {
    this.setupRoleCheck();
    this.isInitialized = true;
    
    if (this.debug) {
      this.logger.debug('HasAnyRoleDirective initialized', {
        roleIds: this.roleIds,
        includeInherited: this.includeInherited,
        tenantId: this.tenantId,
        mode: this.mode
      });
    }
  }

  /**
   * Component lifecycle: Handle input changes
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (this.isInitialized) {
      // Re-setup role check if critical inputs changed
      const criticalInputs = ['roleIds', 'includeInherited', 'tenantId'];
      const hasCriticalChanges = criticalInputs.some(key => changes[key]);
      
      if (hasCriticalChanges) {
        this.setupRoleCheck();
        
        if (this.debug) {
          this.logger.debug('HasAnyRoleDirective inputs changed', {
            changes: Object.keys(changes),
            roleIds: this.roleIds
          });
        }
      }
    }
  }

  /**
   * Component lifecycle: Cleanup
   */
  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    
    if (this.debug) {
      this.logger.debug('HasAnyRoleDirective destroyed', {
        roleIds: this.roleIds
      });
    }
  }

  /**
   * Sets up the role checking subscription
   * 
   * @private
   */
  private setupRoleCheck(): void {
    // Clean up existing subscription
    this.subscription?.unsubscribe();

    // Validate required inputs
    if (!this.roleIds || !Array.isArray(this.roleIds) || this.roleIds.length === 0) {
      this.logger.error('HasAnyRoleDirective: roleIds array is required and must not be empty');
      this.handleAccessDenied('Role IDs array is required');
      return;
    }

    const endTimer = this.debug ? this.logger.time(`hasAnyRole-${this.roleIds.join(',')}`) : () => {};

    // Set up reactive subscription
    this.subscription = this.roleService.hasAnyRole(this.roleIds, {
      includeInherited: this.includeInherited,
      tenantId: this.tenantId
    }).pipe(
      startWith(false), // Start with denied state
      distinctUntilChanged() // Only react to actual changes
    ).subscribe({
      next: (hasAnyRole) => {
        this.hasAccess = hasAnyRole;
        
        if (hasAnyRole) {
          this.identifyGrantingRoles();
          this.handleAccessGranted();
        } else {
          this.grantingRoles = [];
          this.handleAccessDenied();
        }
        
        endTimer();
        
        if (this.debug) {
          this.logger.debug('HasAnyRoleDirective access check completed', {
            roleIds: this.roleIds,
            hasAccess: hasAnyRole,
            grantingRoles: this.grantingRoles,
            mode: this.mode
          });
        }
      },
      error: (error) => {
        this.logger.error('HasAnyRoleDirective: Role check failed', error);
        this.handleAccessDenied('Role check failed');
        endTimer();
      }
    });
  }

  /**
   * Identifies which roles are granting access
   * 
   * @private
   */
  private identifyGrantingRoles(): void {
    this.grantingRoles = [];
    
    // Check each role individually to identify which ones grant access
    // This is done for debugging and audit purposes
    this.roleIds.forEach(roleId => {
      this.roleService.hasRole(roleId, {
        includeInherited: this.includeInherited,
        tenantId: this.tenantId
      }).subscribe(hasRole => {
        if (hasRole && !this.grantingRoles.includes(roleId)) {
          this.grantingRoles.push(roleId);
        }
      });
    });
  }

  /**
   * Handles access granted scenario
   * 
   * @private
   */
  private handleAccessGranted(): void {
    if (this.mode === 'visibility') {
      this.showElement();
    } else if (this.mode === 'disabled') {
      this.enableElement();
    }

    this.applyCssClasses(true);
  }

  /**
   * Handles access denied scenario
   * 
   * @private
   * @param reason - Optional reason for access denial
   */
  private handleAccessDenied(reason?: string): void {
    if (this.mode === 'visibility') {
      this.hideElement();
    } else if (this.mode === 'disabled') {
      this.disableElement();
    }

    this.applyCssClasses(false);

    if (this.debug && reason) {
      this.logger.warn('HasAnyRoleDirective: Access denied', {
        roleIds: this.roleIds,
        reason
      });
    }
  }

  /**
   * Shows the element
   * 
   * @private
   */
  private showElement(): void {
    this.viewContainer.clear();

    if (this.animate) {
      this.createAnimatedView(this.templateRef);
    } else {
      this.currentView = this.viewContainer.createEmbeddedView(this.templateRef);
    }

    // Set ARIA attributes for accessibility
    this.setAriaAttributes(true);
  }

  /**
   * Hides the element and shows fallback if available
   * 
   * @private
   */
  private hideElement(): void {
    this.viewContainer.clear();
    this.currentView = null;

    if (this.elseTemplate) {
      if (this.animate) {
        this.createAnimatedView(this.elseTemplate);
      } else {
        this.currentView = this.viewContainer.createEmbeddedView(this.elseTemplate);
      }
    }

    // Set ARIA attributes for accessibility
    this.setAriaAttributes(false);
  }

  /**
   * Enables the element (removes disabled attribute)
   * 
   * @private
   */
  private enableElement(): void {
    const nativeElement = this.elementRef.nativeElement;
    
    if (nativeElement) {
      this.renderer.removeAttribute(nativeElement, 'disabled');
      this.renderer.removeAttribute(nativeElement, 'aria-disabled');
      this.renderer.removeClass(nativeElement, 'rbac-disabled');
    }
  }

  /**
   * Disables the element (adds disabled attribute)
   * 
   * @private
   */
  private disableElement(): void {
    const nativeElement = this.elementRef.nativeElement;
    
    if (nativeElement) {
      this.renderer.setAttribute(nativeElement, 'disabled', 'true');
      this.renderer.setAttribute(nativeElement, 'aria-disabled', 'true');
      this.renderer.addClass(nativeElement, 'rbac-disabled');
    }
  }

  /**
   * Creates an animated view with fade effect
   * 
   * @private
   * @param template - Template to animate
   */
  private createAnimatedView(template: TemplateRef<any>): void {
    const view = this.viewContainer.createEmbeddedView(template);
    const element = view.rootNodes[0] as HTMLElement;
    
    if (element && element.style) {
      this.renderer.setStyle(element, 'opacity', '0');
      this.renderer.setStyle(element, 'transition', 'opacity 0.2s ease-in-out');
      
      setTimeout(() => {
        this.renderer.setStyle(element, 'opacity', '1');
      }, 10);
    }
    
    this.currentView = view;
  }

  /**
   * Applies CSS classes based on access state
   * 
   * @private
   * @param hasAccess - Whether access is granted
   */
  private applyCssClasses(hasAccess: boolean): void {
    if (!this.cssClasses) return;

    const nativeElement = this.elementRef.nativeElement;
    if (!nativeElement) return;

    // Remove both classes first
    if (this.cssClasses.granted) {
      this.renderer.removeClass(nativeElement, this.cssClasses.granted);
    }
    if (this.cssClasses.denied) {
      this.renderer.removeClass(nativeElement, this.cssClasses.denied);
    }

    // Apply appropriate class
    const classToApply = hasAccess ? this.cssClasses.granted : this.cssClasses.denied;
    if (classToApply) {
      this.renderer.addClass(nativeElement, classToApply);
    }
  }

  /**
   * Sets ARIA attributes for accessibility
   * 
   * @private
   * @param hasAccess - Whether access is granted
   */
  private setAriaAttributes(hasAccess: boolean): void {
    const nativeElement = this.elementRef.nativeElement;
    if (!nativeElement) return;

    this.renderer.setAttribute(
      nativeElement, 
      'aria-hidden', 
      hasAccess ? 'false' : 'true'
    );

    // Add role-based aria-label with role information
    const currentLabel = nativeElement.getAttribute('aria-label') || '';
    if (!currentLabel.includes('role-based')) {
      const accessText = hasAccess ? 'accessible' : 'restricted';
      const roleInfo = hasAccess ? ` (granted by: ${this.grantingRoles.join(', ')})` : '';
      this.renderer.setAttribute(
        nativeElement,
        'aria-label',
        `${currentLabel} (role-based access: ${accessText}${roleInfo})`.trim()
      );
    }
  }
}
