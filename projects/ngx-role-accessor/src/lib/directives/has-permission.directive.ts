import {
  Directive,
  Input,
  TemplateRef,
  ViewContainerRef,
  OnInit,
  OnDestroy,
  inject
} from '@angular/core';
import { RoleService } from '../services/role.service';
import { Subscription } from 'rxjs';

@Directive({ selector: '[hasPermission]', standalone: true })
export class HasPermissionDirective implements OnInit, OnDestroy {
  @Input('hasPermission') permission!: string;
  private roleService = inject(RoleService);
  private tpl = inject(TemplateRef);
  private vcr = inject(ViewContainerRef);
  private sub!: Subscription;

  ngOnInit(): void {
    this.sub = this.roleService.hasPermission(this.permission).subscribe(has => {
      this.vcr.clear();
      if (has) this.vcr.createEmbeddedView(this.tpl);
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}