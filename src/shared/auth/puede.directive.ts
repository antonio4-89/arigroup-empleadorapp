import { Directive, EmbeddedViewRef, TemplateRef, ViewContainerRef, effect, inject, input } from '@angular/core';
import { Accion, PermisosService } from './permisos';

@Directive({ selector: '[ckPuede]' })
export class PuedeDirective {
  readonly ckPuede = input.required<Accion>();
  private readonly permisos = inject(PermisosService);
  private readonly plantilla = inject(TemplateRef<unknown>);
  private readonly contenedor = inject(ViewContainerRef);
  private vista?: EmbeddedViewRef<unknown>;

  constructor() {
    effect(() => {
      const permitido = this.permisos.puede(this.ckPuede());
      if (permitido && !this.vista) this.vista = this.contenedor.createEmbeddedView(this.plantilla);
      else if (!permitido && this.vista) { this.contenedor.clear(); this.vista = undefined; }
    });
  }
}
