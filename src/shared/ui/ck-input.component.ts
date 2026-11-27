import { Component, computed, input, numberAttribute, output, signal } from '@angular/core';
import { CkIconComponent } from './ck-icon.component';

let secuencia = 0;

/**
 * Campo de texto con el diseño de la app: caja con etiqueta arriba, botón para borrar y, en contraseñas, para ver/ocultar.
 * Con `rows` > 0 se convierte en área de texto. Estilos en `shared/styles/_forms.scss`.
 *
 *   <ck-input label="Correo" type="email" [value]="correo()" (cambio)="correo.set($event)" />
 */
@Component({
  selector: 'ck-input',
  imports: [CkIconComponent],
  template: `
    <div class="ck-field" [class.ck-field--area]="rows() > 0" [class.is-readonly]="readonly()" [class.has-error]="!!error()" [attr.data-variante]="variante()">
      <label class="ck-field__inner" [attr.for]="id">
        @if (label()) { <span class="ck-field__label">{{ label() }}</span> }
        @if (rows() > 0) {
          <textarea class="ck-field__control" [id]="id" [rows]="rows()" [value]="value()" [placeholder]="placeholder()" [readOnly]="readonly()"
            [attr.maxlength]="maxlength() || null" [attr.aria-label]="ariaLabel() || null" [attr.aria-describedby]="descripcion()" [attr.aria-invalid]="error() ? 'true' : null"
            (input)="escribir($event)"></textarea>
        } @else {
          <input class="ck-field__control" [id]="id" [type]="tipoReal()" [value]="value()" [placeholder]="placeholder()" [readOnly]="readonly()"
            [attr.inputmode]="inputmode() || null" [attr.maxlength]="maxlength() || null" [attr.min]="min() || null" [attr.max]="max() || null"
            [attr.step]="step() || null" [attr.autocomplete]="autocomplete() || null" [attr.autocapitalize]="autocapitalize() || null"
            [attr.aria-label]="ariaLabel() || null" [attr.aria-describedby]="descripcion()" [attr.aria-invalid]="error() ? 'true' : null" (input)="escribir($event)" />
        }
      </label>
      @if (puedeBorrar()) {
        <button type="button" class="ck-field__action" aria-label="Borrar" tabindex="-1" (click)="cambio.emit('')"><ck-icon name="xmark" /></button>
      }
      @if (type() === 'password') {
        <button type="button" class="ck-field__action" [attr.aria-label]="ver() ? 'Ocultar contraseña' : 'Mostrar contraseña'" [attr.aria-pressed]="ver()"
          (click)="ver.set(!ver())"><ck-icon [name]="ver() ? 'eye-slash' : 'eye'" /></button>
      }
    </div>
    @if (error()) {
      <p class="ck-field__error" role="alert" [id]="id + '-error'"><ck-icon name="circle-exclamation" />{{ error() }}</p>
    } @else if (helper()) { <p class="ck-field__helper" [id]="id + '-ayuda'">{{ helper() }}</p> }
  `,
})
export class CkInputComponent {
  readonly label = input('');
  readonly type = input<'text' | 'email' | 'password' | 'number' | 'time' | 'date'>('text');
  readonly value = input<string | number | null>('');
  readonly placeholder = input('');
  readonly helper = input('');
  readonly error = input('');
  readonly rows = input(0, { transform: numberAttribute });
  readonly variante = input<'normal' | 'codigo' | 'mono'>('normal');
  readonly readonly = input(false);
  readonly inputmode = input('');
  readonly maxlength = input(0, { transform: numberAttribute });
  readonly min = input('');
  readonly max = input('');
  readonly step = input('');
  readonly autocomplete = input('');
  readonly autocapitalize = input('');
  /** Descarta todo lo que no sea número (código postal, teléfono). */
  readonly soloDigitos = input(false);
  readonly ariaLabel = input('', { alias: 'aria-label' });
  readonly cambio = output<string>();

  protected readonly id = `ck-input-${++secuencia}`;
  protected readonly ver = signal(false);
  protected readonly descripcion = computed(() => (this.error() ? this.id + '-error' : this.helper() ? this.id + '-ayuda' : null));
  protected readonly tipoReal = computed(() => (this.type() === 'password' && this.ver() ? 'text' : this.type()));
  protected readonly puedeBorrar = computed(
    () => !!this.value() && !this.readonly() && this.rows() === 0 && this.type() !== 'password' && this.type() !== 'number' && this.type() !== 'time' && this.type() !== 'date' && this.variante() !== 'codigo',
  );

  protected escribir(e: Event) {
    const campo = e.target as HTMLInputElement | HTMLTextAreaElement;
    if (this.soloDigitos()) {
      const limpio = campo.value.replace(/\D/g, '');
      if (limpio !== campo.value) campo.value = limpio;
    }
    this.cambio.emit(campo.value);
  }
}
