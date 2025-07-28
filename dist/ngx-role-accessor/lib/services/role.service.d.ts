import { Observable } from 'rxjs';
import * as i0 from "@angular/core";
export declare class RoleService {
    private roles$;
    private permissions$;
    private tenant$;
    setRoles(roles: string[]): void;
    setPermissions(permissions: string[]): void;
    setTenant(tenantId: string): void;
    hasRole(role: string): Observable<boolean>;
    hasAnyRole(rolesToCheck: string[]): Observable<boolean>;
    hasPermission(permission: string): Observable<boolean>;
    getTenant(): Observable<string | null>;
    static ɵfac: i0.ɵɵFactoryDeclaration<RoleService, never>;
    static ɵprov: i0.ɵɵInjectableDeclaration<RoleService>;
}
