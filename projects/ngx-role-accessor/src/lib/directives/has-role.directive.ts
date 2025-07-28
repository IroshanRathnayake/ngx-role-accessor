/**
 * @fileoverview Enhanced HasRole Directive for RBAC system
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
  ElementRef,
  Optional
} from '@angular/core';
import { Subscription, combineLatest, of } from 'rxjs';
import { distinctUntilChanged, startWith } from 'rxjs/operators';

import { RoleService } from '../services/role.service';
import { DirectiveOptions } from '../types/rbac.types';
import { RbacLogger } from '../utils/rbac-logger';

/**
 * Enhanced structural directive that conditionally shows/hides elements based on user roles
 * 
 * Features:
 * - Role hierarchy support
 * - Multi-tenant awareness
 * - Fallback template support
 * - Performance optimization with change detection
 * - Accessibility support
 * - Animation support
 * - Debug logging
 * 
 * @example
 * ```html
 * <!-- Basic usage -->
 * <div *hasRole="'admin'">Admin only content</div>
 * 
 * <!-- With options -->
 * <div *hasRole="'manager'; includeInherited: true; tenantId: 'tenant1'">
 *   Manager content
 * </div>
 * 
 * <!-- With fallback -->
 * <div *hasRole="'admin'; else noAccess">Admin content</div>
 * <ng-template #noAccess>Access denied</ng-template>
 * 
 * <!-- Disable instead of hide -->
 * <button *hasRole="'editor'; mode: 'disabled'">Edit Content</button>
 * ```
 */
@Directive({ 
  selector: '[hasRole]', 
  standalone: true 
})
export class HasRoleDirective implements OnInit, OnDestroy, OnChanges {
  
  /**
   * Role ID to check for
   */
  @Input('hasRole') roleId!: string;

  /**
   * Whether to include inherited roles in the check
   * @default true (follows service configuration)
   */
  @Input('hasRoleIncludeInherited') includeInherited?: boolean;

  /**
   * Specific tenant context for the role check
   */
  @Input('hasRoleTenantId') tenantId?: string;

  /**
   * Directive behavior mode
   * - 'visibility': Show/hide element (default)
   * - 'disabled': Enable/disable element
   */
  @Input('hasRoleMode') mode: 'visibility' | 'disabled' = 'visibility';

  /**
   * Fallback template to show when access is denied
   */
  @Input('hasRoleElse') elseTemplate?: TemplateRef<any>;

  /**
   * CSS classes to apply based on permission state
   */
  @Input('hasRoleCssClasses') cssClasses?: {
    granted?: string;
    denied?: string;
  };

  /**
   * Whether to use fade animation when showing/hiding
   */
  @Input('hasRoleAnimate') animate?: boolean = false;

  /**
   * Debug mode - logs directive activity
   */
  @Input('hasRoleDebug') debug?: boolean = false;

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

  /**
   * Component lifecycle: Initialize the directive
   */
  ngOnInit(): void {
    this.setupRoleCheck();
    this.isInitialized = true;
    
    if (this.debug) {
      this.logger.debug('HasRoleDirective initialized', {
        roleId: this.roleId,
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
      const criticalInputs = ['roleId', 'includeInherited', 'tenantId'];
      const hasCriticalChanges = criticalInputs.some(key => changes[key]);
      
      if (hasCriticalChanges) {
        this.setupRoleCheck();
        
        if (this.debug) {
          this.logger.debug('HasRoleDirective inputs changed', {
            changes: Object.keys(changes),
            roleId: this.roleId
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
      this.logger.debug('HasRoleDirective destroyed', {
        roleId: this.roleId
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
    if (!this.roleId) {
      this.logger.error('HasRoleDirective: roleId is required');
      this.handleAccessDenied('Role ID is required');
      return;
    }

    const endTimer = this.debug ? this.logger.time(`hasRole-${this.roleId}`) : () => {};

    // Set up reactive subscription
    this.subscription = this.roleService.hasRole(this.roleId, {
      includeInherited: this.includeInherited,
      tenantId: this.tenantId
    }).pipe(
      startWith(false), // Start with denied state
      distinctUntilChanged() // Only react to actual changes
    ).subscribe({
      next: (hasRole) => {
        this.hasAccess = hasRole;
        
        if (hasRole) {
          this.handleAccessGranted();
        } else {
          this.handleAccessDenied();
        }
        
        endTimer();
        
        if (this.debug) {
          this.logger.debug('HasRoleDirective access check completed', {
            roleId: this.roleId,
            hasAccess: hasRole,
            mode: this.mode
          });
        }
      },
      error: (error) => {
        this.logger.error('HasRoleDirective: Role check failed', error);
        this.handleAccessDenied('Role check failed');
        endTimer();
      }
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
      this.logger.warn('HasRoleDirective: Access denied', {
        roleId: this.roleId,
        reason
      });
    }
  }

  /**
   * Shows the element or fallback template
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
      
      // Remove visual disabled styling
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
      
      // Add visual disabled styling
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
      // Start with opacity 0
      this.renderer.setStyle(element, 'opacity', '0');
      this.renderer.setStyle(element, 'transition', 'opacity 0.2s ease-in-out');
      
      // Animate to opacity 1
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

    // Set aria-hidden for screen readers
    this.renderer.setAttribute(
      nativeElement, 
      'aria-hidden', 
      hasAccess ? 'false' : 'true'
    );

    // Add role-based aria-label
    const currentLabel = nativeElement.getAttribute('aria-label') || '';
    if (!currentLabel.includes('role-based')) {
      const accessText = hasAccess ? 'accessible' : 'restricted';
      this.renderer.setAttribute(
        nativeElement,
        'aria-label',
        `${currentLabel} (role-based access: ${accessText})`.trim()
      );
    }
  }
}