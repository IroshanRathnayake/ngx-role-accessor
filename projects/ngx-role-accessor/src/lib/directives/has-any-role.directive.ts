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

@Directive({ selector: '[hasAnyRole]', standalone: true })
export class HasAnyRoleDirective implements OnInit, OnDestroy {
  @Input('hasAnyRole') roles!: string[];
  private roleService = inject(RoleService);
  private tpl = inject(TemplateRef);
  private vcr = inject(ViewContainerRef);
  private sub!: Subscription;

  ngOnInit(): void {
    this.sub = this.roleService.hasAnyRole(this.roles).subscribe(has => {
      this.vcr.clear();
      if (has) this.vcr.createEmbeddedView(this.tpl);
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
