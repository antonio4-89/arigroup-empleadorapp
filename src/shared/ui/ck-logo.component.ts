import { Component, computed, input } from '@angular/core';

export type VarianteLogo = 'completo' | 'simbolo';
export type TonoLogo = 'auto' | 'claro';

/**
 * Logotipo 1ari en SVG (trazos del archivo original en /Logo).
 * - variante "completo": símbolo + "ari"; "simbolo": solo el 1.
 * - tono "auto": el texto toma el color del tema; "claro": texto blanco para fondos oscuros.
 */
@Component({
  selector: 'ck-logo',
  host: { class: 'ck-logo', '[class.ck-logo--claro]': "tono() === 'claro'", '[class.ck-logo--simbolo]': "variante() === 'simbolo'" },
  template: `
    <svg xmlns="http://www.w3.org/2000/svg" [attr.viewBox]="viewBox()" role="img" [attr.aria-label]="etiqueta()" focusable="false">
      <path class="ck-logo__morado" d="M18 11H101L71 41H50V116H102V149H18Z" />
      <path class="ck-logo__menta" d="M124 11H158V149H126V41H94Z" />
      @if (variante() === 'completo') {
        <g class="ck-logo__texto">
          <path d="M258 127.8A52 51 0 1 1 295 79V130H275V79A32 31 0 1 0 258 106.4Z" />
          <path d="M319 130V31H338V43C342 37 350 33 360 33H373V48H363C352 48 344 54 340 64C338.6 68 338 74 338 80V130Z" />
          <path d="M396 31H416V130H396Z" />
        </g>
      }
    </svg>
  `,
})
export class CkLogoComponent {
  readonly variante = input<VarianteLogo>('completo');
  readonly tono = input<TonoLogo>('auto');
  readonly etiqueta = input('1ari');
  protected readonly viewBox = computed(() => (this.variante() === 'simbolo' ? '14 7 148 146' : '6 1 422 158'));
}
