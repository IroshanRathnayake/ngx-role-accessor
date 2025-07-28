import { OnInit, OnDestroy } from '@angular/core';
import * as i0 from "@angular/core";
export declare class HasPermissionDirective implements OnInit, OnDestroy {
    permission: string;
    private roleService;
    private tpl;
    private vcr;
    private sub;
    ngOnInit(): void;
    ngOnDestroy(): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<HasPermissionDirective, never>;
    static ɵdir: i0.ɵɵDirectiveDeclaration<HasPermissionDirective, "[hasPermission]", never, { "permission": { "alias": "hasPermission"; "required": false; }; }, {}, never, never, true, never>;
}
