import { Component, contentChildren, computed, input, output, signal } from '@angular/core';
import { IonModal } from '@ionic/angular';
import { CkIconComponent } from './ck-icon.component';

/** Opción de un `<ck-select>`: `<ck-opcion valor="x" etiqueta="Texto" />`. No dibuja nada por sí sola. */
@Component({ selector: 'ck-opcion', template: '' })
export class CkOpcionComponent {
  readonly valor = input.required<unknown>();
  readonly etiqueta = input.required<string>();
}

/**
 * Selector con el diseño de los campos de la app: caja con etiqueta flotante y lista en una tarjeta centrada.
 * Estilos en `shared/styles/_forms.scss`.
 *
 *   <ck-select label="Tipo" [value]="tipo()" (cambio)="tipo.set($event)">
 *     <ck-opcion valor="A" etiqueta="Opción A" />
 *   </ck-select>
 */
@Component({
  selector: 'ck-select',
  imports: [IonModal, CkIconComponent],
  template: `
    <button type="button" class="ck-field ck-select" [class.has-error]="!!error()" [attr.aria-invalid]="error() ? 'true' : null" [disabled]="disabled()" aria-haspopup="listbox"
      [attr.aria-expanded]="abierto()" [attr.aria-label]="etiquetaAccesible()" (click)="abrir()">
      <span class="ck-field__inner">
        @if (label()) { <span class="ck-field__label">{{ label() }}</span> }
        <span class="ck-field__value" [class.is-empty]="!seleccion()">{{ seleccion()?.etiqueta() || placeholder() }}</span>
      </span>
      <ck-icon class="ck-field__icon" name="chevron-down" />
    </button>
    @if (error()) { <p class="ck-field__error" role="alert"><ck-icon name="circle-exclamation" />{{ error() }}</p> }

    <ion-modal class="ck-select-modal" [isOpen]="abierto()" (didDismiss)="abierto.set(false)">
      <ng-template>
        <div class="ck-select-sheet" role="listbox" [attr.aria-label]="etiquetaAccesible()">
          <div class="ck-select-sheet__head">
            <span class="ck-select-sheet__title">{{ label() || ariaLabel() }}</span>
            <button type="button" class="ck-field__action" aria-label="Cerrar" (click)="abierto.set(false)"><ck-icon name="xmark" /></button>
          </div>
          @for (o of opciones(); track $index) {
            <button type="button" role="option" class="ck-select-sheet__option" [class.is-selected]="o === seleccion()"
              [attr.aria-selected]="o === seleccion()" (click)="elegir(o)">{{ o.etiqueta() }}</button>
          }
        </div>
      </ng-template>
    </ion-modal>
  `,
})
export class CkSelectComponent {
  readonly label = input('');
  readonly placeholder = input('');
  readonly value = input<any>(null);
  readonly disabled = input(false);
  readonly error = input('');
  readonly ariaLabel = input('', { alias: 'aria-label' });
  readonly cambio = output<any>();

  protected readonly opciones = contentChildren(CkOpcionComponent, { descendants: true });
  protected readonly abierto = signal(false);
  protected readonly seleccion = computed(() => this.opciones().find((o) => o.valor() === this.value()) ?? null);
  protected readonly etiquetaAccesible = computed(() => this.ariaLabel() || this.label());

  protected abrir() { if (!this.disabled()) this.abierto.set(true); }

  protected elegir(o: CkOpcionComponent) {
    this.abierto.set(false);
    if (o.valor() !== this.value()) this.cambio.emit(o.valor());
  }
}
