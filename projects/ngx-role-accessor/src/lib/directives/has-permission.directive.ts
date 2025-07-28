/**
 * @fileoverview Enhanced HasPermission Directive for RBAC system
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
 * Enhanced structural directive that conditionally shows/hides elements based on user permissions
 * 
 * Features:
 * - Fine-grained permission checking
 * - Resource and action-based permissions
 * - Context-aware permission evaluation
 * - Fallback template support
 * - Performance optimization
 * - Debug logging
 * 
 * @example
 * ```html
 * <!-- Basic usage -->
 * <div *hasPermission="'CAN_VIEW_REPORTS'">Reports section</div>
 * 
 * <!-- With resource and action -->
 * <button *hasPermission="'documents'; resource: 'document'; action: 'delete'">
 *   Delete Document
 * </button>
 * 
 * <!-- With context -->
 * <div *hasPermission="'CAN_EDIT'; context: { documentId: '123' }">
 *   Edit content
 * </div>
 * 
 * <!-- With fallback -->
 * <div *hasPermission="'PREMIUM_FEATURE'; else upgradePrompt">
 *   Premium content
 * </div>
 * <ng-template #upgradePrompt>
 *   <div>Upgrade to access this feature</div>
 * </ng-template>
 * 
 * <!-- Disable instead of hide -->
 * <button *hasPermission="'CAN_APPROVE'; mode: 'disabled'">Approve</button>
 * ```
 */
@Directive({ 
  selector: '[hasPermission]', 
  standalone: true 
})
export class HasPermissionDirective implements OnInit, OnDestroy, OnChanges {
  
  /**
   * Permission ID to check for
   */
  @Input('hasPermission') permissionId!: string;

  /**
   * Resource the permission applies to
   */
  @Input('hasPermissionResource') resource?: string;

  /**
   * Action the permission allows
   */
  @Input('hasPermissionAction') action?: string;

  /**
   * Additional context for permission evaluation
   */
  @Input('hasPermissionContext') context?: Record<string, any>;

  /**
   * Directive behavior mode
   * - 'visibility': Show/hide element (default)
   * - 'disabled': Enable/disable element
   */
  @Input('hasPermissionMode') mode: 'visibility' | 'disabled' = 'visibility';

  /**
   * Fallback template to show when access is denied
   */
  @Input('hasPermissionElse') elseTemplate?: TemplateRef<any>;

  /**
   * CSS classes to apply based on permission state
   */
  @Input('hasPermissionCssClasses') cssClasses?: {
    granted?: string;
    denied?: string;
  };

  /**
   * Whether to use fade animation when showing/hiding
   */
  @Input('hasPermissionAnimate') animate?: boolean = false;

  /**
   * Debug mode - logs directive activity
   */
  @Input('hasPermissionDebug') debug?: boolean = false;

  /**
   * Whether to check permissions strictly (throws error on failure)
   */
  @Input('hasPermissionStrict') strict?: boolean = false;

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
  private lastCheckResult: any = null;

  /**
   * Component lifecycle: Initialize the directive
   */
  ngOnInit(): void {
    this.setupPermissionCheck();
    this.isInitialized = true;
    
    if (this.debug) {
      this.logger.debug('HasPermissionDirective initialized', {
        permissionId: this.permissionId,
        resource: this.resource,
        action: this.action,
        context: this.context,
        mode: this.mode
      });
    }
  }

  /**
   * Component lifecycle: Handle input changes
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (this.isInitialized) {
      // Re-setup permission check if critical inputs changed
      const criticalInputs = ['permissionId', 'resource', 'action', 'context'];
      const hasCriticalChanges = criticalInputs.some(key => changes[key]);
      
      if (hasCriticalChanges) {
        this.setupPermissionCheck();
        
        if (this.debug) {
          this.logger.debug('HasPermissionDirective inputs changed', {
            changes: Object.keys(changes),
            permissionId: this.permissionId
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
      this.logger.debug('HasPermissionDirective destroyed', {
        permissionId: this.permissionId
      });
    }
  }

  /**
   * Sets up the permission checking subscription
   * 
   * @private
   */
  private setupPermissionCheck(): void {
    // Clean up existing subscription
    this.subscription?.unsubscribe();

    // Validate required inputs
    if (!this.permissionId) {
      const errorMsg = 'HasPermissionDirective: permissionId is required';
      this.logger.error(errorMsg);
      
      if (this.strict) {
        throw new Error(errorMsg);
      }
      
      this.handleAccessDenied('Permission ID is required');
      return;
    }

    const endTimer = this.debug ? this.logger.time(`hasPermission-${this.permissionId}`) : () => {};

    // Build permission check options
    const options: Record<string, any> = {};
    if (this.resource) options['resource'] = this.resource;
    if (this.action) options['action'] = this.action;
    if (this.context) options['context'] = this.context;

    // Set up reactive subscription
    this.subscription = this.roleService.hasPermission(this.permissionId, options).pipe(
      startWith(false), // Start with denied state
      distinctUntilChanged() // Only react to actual changes
    ).subscribe({
      next: (hasPermission) => {
        this.hasAccess = hasPermission;
        
        if (hasPermission) {
          this.handleAccessGranted();
        } else {
          this.handleAccessDenied();
        }
        
        endTimer();
        
        if (this.debug) {
          this.logger.debug('HasPermissionDirective access check completed', {
            permissionId: this.permissionId,
            resource: this.resource,
            action: this.action,
            hasAccess: hasPermission,
            mode: this.mode
          });
        }
      },
      error: (error) => {
        this.logger.error('HasPermissionDirective: Permission check failed', error);
        
        if (this.strict) {
          throw error;
        }
        
        this.handleAccessDenied('Permission check failed');
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
    this.updateAccessibilityAttributes(true);
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
    this.updateAccessibilityAttributes(false);

    if (this.debug && reason) {
      this.logger.warn('HasPermissionDirective: Access denied', {
        permissionId: this.permissionId,
        resource: this.resource,
        action: this.action,
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
      
      // Remove any tooltips that might explain why it was disabled
      this.renderer.removeAttribute(nativeElement, 'title');
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
      
      // Add helpful tooltip
      const tooltipText = this.resource && this.action 
        ? `Requires ${this.action} permission on ${this.resource}`
        : `Requires ${this.permissionId} permission`;
      this.renderer.setAttribute(nativeElement, 'title', tooltipText);
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
   * Updates accessibility attributes
   * 
   * @private
   * @param hasAccess - Whether access is granted
   */
  private updateAccessibilityAttributes(hasAccess: boolean): void {
    const nativeElement = this.elementRef.nativeElement;
    if (!nativeElement) return;

    // Set aria-hidden for screen readers
    this.renderer.setAttribute(
      nativeElement, 
      'aria-hidden', 
      hasAccess ? 'false' : 'true'
    );

    // Update aria-label with permission information
    const currentLabel = nativeElement.getAttribute('aria-label') || '';
    if (!currentLabel.includes('permission-based')) {
      const accessText = hasAccess ? 'accessible' : 'restricted';
      const permissionInfo = this.resource && this.action 
        ? ` (${this.action} on ${this.resource})`
        : ` (${this.permissionId})`;
      
      this.renderer.setAttribute(
        nativeElement,
        'aria-label',
        `${currentLabel} (permission-based access: ${accessText}${permissionInfo})`.trim()
      );
    }

    // Set role attribute for better screen reader support
    if (this.mode === 'disabled' && !hasAccess) {
      this.renderer.setAttribute(nativeElement, 'role', 'button');
      this.renderer.setAttribute(nativeElement, 'aria-describedby', 'rbac-disabled-tooltip');
    }
  }

  /**
   * Gets detailed information about the current permission check
   * 
   * @returns Object containing permission check details
   */
  getPermissionDetails(): {
    permissionId: string;
    resource?: string;
    action?: string;
    context?: Record<string, any>;
    hasAccess: boolean;
    mode: string;
  } {
    return {
      permissionId: this.permissionId,
      resource: this.resource,
      action: this.action,
      context: this.context,
      hasAccess: this.hasAccess,
      mode: this.mode
    };
  }
}