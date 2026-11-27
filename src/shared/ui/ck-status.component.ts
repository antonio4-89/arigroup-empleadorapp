import { Component, computed, input } from '@angular/core';
import { Validacion } from '../models/models';
import { CLS_VALIDACION, ETQ_VALIDACION } from './etiquetas';

@Component({
  selector: 'ck-status',
  template: `<span class="ck-status" [class]="'ck-status ck-status--' + clase()">{{ texto() }}</span>`,
})
export class CkStatusComponent {
  readonly validacion = input.required<Validacion>();
  protected readonly clase = computed(() => CLS_VALIDACION[this.validacion()]);
  protected readonly texto = computed(() => ETQ_VALIDACION[this.validacion()]);
}
