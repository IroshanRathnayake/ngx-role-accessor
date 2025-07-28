import { OnInit, OnDestroy } from '@angular/core';
import * as i0 from "@angular/core";
export declare class HasAnyRoleDirective implements OnInit, OnDestroy {
    roles: string[];
    private roleService;
    private tpl;
    private vcr;
    private sub;
    ngOnInit(): void;
    ngOnDestroy(): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<HasAnyRoleDirective, never>;
    static ɵdir: i0.ɵɵDirectiveDeclaration<HasAnyRoleDirective, "[hasAnyRole]", never, { "roles": { "alias": "hasAnyRole"; "required": false; }; }, {}, never, never, true, never>;
}
