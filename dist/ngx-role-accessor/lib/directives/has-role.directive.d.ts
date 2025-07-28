import { OnInit, OnDestroy } from '@angular/core';
import * as i0 from "@angular/core";
export declare class HasRoleDirective implements OnInit, OnDestroy {
    role: string;
    private roleService;
    private tpl;
    private vcr;
    private sub;
    ngOnInit(): void;
    ngOnDestroy(): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<HasRoleDirective, never>;
    static ɵdir: i0.ɵɵDirectiveDeclaration<HasRoleDirective, "[hasRole]", never, { "role": { "alias": "hasRole"; "required": false; }; }, {}, never, never, true, never>;
}
