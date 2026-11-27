import { Component, input } from '@angular/core';

@Component({
  selector: 'ck-stat',
  template: `
    <div class="ck-stat" [class]="'ck-stat ck-stat--' + tono()">
      <span class="ck-stat__value">{{ valor() }}</span>
      <span class="ck-stat__label">{{ etiqueta() }}</span>
    </div>
  `,
})
export class CkStatComponent {
  readonly valor = input.required<string | number>();
  readonly etiqueta = input.required<string>();
  readonly tono = input<'neutral' | 'success' | 'warning' | 'danger' | 'primary'>('neutral');
}
