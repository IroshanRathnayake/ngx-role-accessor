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

@Directive({ selector: '[hasRole]', standalone: true })
export class HasRoleDirective implements OnInit, OnDestroy {
  @Input('hasRole') role!: string;
  private roleService = inject(RoleService);
  private tpl = inject(TemplateRef);
  private vcr = inject(ViewContainerRef);
  private sub!: Subscription;

  ngOnInit(): void {
    this.sub = this.roleService.hasRole(this.role).subscribe(has => {
      this.vcr.clear();
      if (has) this.vcr.createEmbeddedView(this.tpl);
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}