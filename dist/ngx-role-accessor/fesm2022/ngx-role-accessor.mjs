import * as i0 from '@angular/core';
import { Injectable, inject, TemplateRef, ViewContainerRef, Input, Directive } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';

class RoleService {
    roles$ = new BehaviorSubject([]);
    permissions$ = new BehaviorSubject([]);
    tenant$ = new BehaviorSubject(null);
    setRoles(roles) {
        this.roles$.next(roles);
    }
    setPermissions(permissions) {
        this.permissions$.next(permissions);
    }
    setTenant(tenantId) {
        this.tenant$.next(tenantId);
    }
    hasRole(role) {
        return this.roles$.pipe(map(roles => roles.includes(role)));
    }
    hasAnyRole(rolesToCheck) {
        return this.roles$.pipe(map(userRoles => rolesToCheck.some(role => userRoles.includes(role))));
    }
    hasPermission(permission) {
        return this.permissions$.pipe(map(perms => perms.includes(permission)));
    }
    getTenant() {
        return this.tenant$.asObservable();
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.2.14", ngImport: i0, type: RoleService, deps: [], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "19.2.14", ngImport: i0, type: RoleService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.2.14", ngImport: i0, type: RoleService, decorators: [{
            type: Injectable,
            args: [{ providedIn: 'root' }]
        }] });

class HasRoleDirective {
    role;
    roleService = inject(RoleService);
    tpl = inject(TemplateRef);
    vcr = inject(ViewContainerRef);
    sub;
    ngOnInit() {
        this.sub = this.roleService.hasRole(this.role).subscribe(has => {
            this.vcr.clear();
            if (has)
                this.vcr.createEmbeddedView(this.tpl);
        });
    }
    ngOnDestroy() {
        this.sub?.unsubscribe();
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.2.14", ngImport: i0, type: HasRoleDirective, deps: [], target: i0.ɵɵFactoryTarget.Directive });
    static ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "19.2.14", type: HasRoleDirective, isStandalone: true, selector: "[hasRole]", inputs: { role: ["hasRole", "role"] }, ngImport: i0 });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.2.14", ngImport: i0, type: HasRoleDirective, decorators: [{
            type: Directive,
            args: [{ selector: '[hasRole]', standalone: true }]
        }], propDecorators: { role: [{
                type: Input,
                args: ['hasRole']
            }] } });

class HasAnyRoleDirective {
    roles;
    roleService = inject(RoleService);
    tpl = inject(TemplateRef);
    vcr = inject(ViewContainerRef);
    sub;
    ngOnInit() {
        this.sub = this.roleService.hasAnyRole(this.roles).subscribe(has => {
            this.vcr.clear();
            if (has)
                this.vcr.createEmbeddedView(this.tpl);
        });
    }
    ngOnDestroy() {
        this.sub?.unsubscribe();
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.2.14", ngImport: i0, type: HasAnyRoleDirective, deps: [], target: i0.ɵɵFactoryTarget.Directive });
    static ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "19.2.14", type: HasAnyRoleDirective, isStandalone: true, selector: "[hasAnyRole]", inputs: { roles: ["hasAnyRole", "roles"] }, ngImport: i0 });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.2.14", ngImport: i0, type: HasAnyRoleDirective, decorators: [{
            type: Directive,
            args: [{ selector: '[hasAnyRole]', standalone: true }]
        }], propDecorators: { roles: [{
                type: Input,
                args: ['hasAnyRole']
            }] } });

class HasPermissionDirective {
    permission;
    roleService = inject(RoleService);
    tpl = inject(TemplateRef);
    vcr = inject(ViewContainerRef);
    sub;
    ngOnInit() {
        this.sub = this.roleService.hasPermission(this.permission).subscribe(has => {
            this.vcr.clear();
            if (has)
                this.vcr.createEmbeddedView(this.tpl);
        });
    }
    ngOnDestroy() {
        this.sub?.unsubscribe();
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.2.14", ngImport: i0, type: HasPermissionDirective, deps: [], target: i0.ɵɵFactoryTarget.Directive });
    static ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "19.2.14", type: HasPermissionDirective, isStandalone: true, selector: "[hasPermission]", inputs: { permission: ["hasPermission", "permission"] }, ngImport: i0 });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.2.14", ngImport: i0, type: HasPermissionDirective, decorators: [{
            type: Directive,
            args: [{ selector: '[hasPermission]', standalone: true }]
        }], propDecorators: { permission: [{
                type: Input,
                args: ['hasPermission']
            }] } });

/*
 * Public API Surface of ngx-role-accessor
 */

/**
 * Generated bundle index. Do not edit.
 */

export { HasAnyRoleDirective, HasPermissionDirective, HasRoleDirective, RoleService };
//# sourceMappingURL=ngx-role-accessor.mjs.map
