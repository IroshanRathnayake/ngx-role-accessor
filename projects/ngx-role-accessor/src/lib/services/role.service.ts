import { Injectable, inject, computed, signal } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class RoleService {
  private roles$ = new BehaviorSubject<string[]>([]);
  private permissions$ = new BehaviorSubject<string[]>([]);
  private tenant$ = new BehaviorSubject<string | null>(null);

  setRoles(roles: string[]): void {
    this.roles$.next(roles);
  }

  setPermissions(permissions: string[]): void {
    this.permissions$.next(permissions);
  }

  setTenant(tenantId: string): void {
    this.tenant$.next(tenantId);
  }

  hasRole(role: string): Observable<boolean> {
    return this.roles$.pipe(map(roles => roles.includes(role)));
  }

  hasAnyRole(rolesToCheck: string[]): Observable<boolean> {
    return this.roles$.pipe(
      map(userRoles => rolesToCheck.some(role => userRoles.includes(role)))
    );
  }

  hasPermission(permission: string): Observable<boolean> {
    return this.permissions$.pipe(map(perms => perms.includes(permission)));
  }

  getTenant(): Observable<string | null> {
    return this.tenant$.asObservable();
  }
}
