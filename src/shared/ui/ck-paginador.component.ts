import { Component, computed, input } from '@angular/core';
import { CkIconComponent } from './ck-icon.component';
import { Paginacion } from './paginacion';

@Component({
  selector: 'ck-paginador',
  imports: [CkIconComponent],
  template: `
    @if (p().total() > p().tam) {
      <nav class="ck-pager" aria-label="Paginación">
        <span class="ck-text-sm ck-text-muted">{{ desde() }}–{{ hasta() }} de {{ p().total() }}</span>
        <span class="ck-row">
          <button type="button" class="ck-icon-btn ck-icon-btn--soft" aria-label="Anterior" [disabled]="p().pagina() === 1" (click)="p().ir(p().pagina() - 1)"><ck-icon name="chevron-left" /></button>
          <span class="ck-text-sm">{{ p().pagina() }} / {{ p().paginas() }}</span>
          <button type="button" class="ck-icon-btn ck-icon-btn--soft" aria-label="Siguiente" [disabled]="p().pagina() === p().paginas()" (click)="p().ir(p().pagina() + 1)"><ck-icon name="chevron-forward" /></button>
        </span>
      </nav>
    }
  `,
})
export class CkPaginadorComponent {
  readonly p = input.required<Paginacion<unknown>>();
  protected readonly desde = computed(() => (this.p().pagina() - 1) * this.p().tam + 1);
  protected readonly hasta = computed(() => Math.min(this.p().pagina() * this.p().tam, this.p().total()));
}
