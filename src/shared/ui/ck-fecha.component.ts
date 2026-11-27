import { Component, computed, input, output, signal } from '@angular/core';
import { IonButton, IonDatetime, IonModal } from '@ionic/angular';
import { CkCalendarioComponent } from './ck-calendario.component';
import { CkIconComponent } from './ck-icon.component';
import { fechaLocal } from './fechas';

@Component({
  selector: 'ck-fecha',
  imports: [IonButton, IonDatetime, IonModal, CkCalendarioComponent, CkIconComponent],
  template: `
    <button type="button" class="ck-field ck-select" [class.has-error]="!!error()" [attr.aria-invalid]="error() ? 'true' : null" aria-haspopup="dialog" [attr.aria-expanded]="abierto()" (click)="abrir()">
      <span class="ck-field__inner">
        <span class="ck-field__label">{{ label() }}</span>
        <span class="ck-field__value" [class.is-empty]="!valor()">{{ texto() }}</span>
      </span>
      <ck-icon class="ck-field__icon" [name]="presentacion() === 'time' ? 'clock' : 'calendar-days'" />
    </button>
    @if (error()) { <p class="ck-field__error" role="alert"><ck-icon name="circle-exclamation" />{{ error() }}</p> }

    <ion-modal class="ck-modal-date" [isOpen]="abierto()" (didDismiss)="abierto.set(false)">
      <ng-template>
        @if (presentacion() === 'time') {
          <ion-datetime presentation="time" [value]="valor() || null" locale="es-MX" [showDefaultButtons]="true" doneText="Listo" cancelText="Cancelar"
            (ionChange)="alCambiarHora($event.detail.value)" (ionCancel)="abierto.set(false)" />
        } @else {
          <div class="ck-fechapicker" role="dialog" [attr.aria-label]="label()">
            <header class="ck-fechapicker__hero">
              <span class="ck-fechapicker__etiqueta">{{ label() }}</span>
              <strong class="ck-fechapicker__fecha">{{ encabezado().principal }}</strong>
              <span class="ck-fechapicker__sub">{{ encabezado().secundario }}</span>
            </header>
            <ck-calendario [resumen]="false" [min]="min()" [max]="max()" [(mes)]="mesVista" [(seleccion)]="borrador" />
            <footer class="ck-fechapicker__acciones">
              @if (opcional() && valor()) { <button type="button" class="ck-link" (click)="quitar()">Quitar fecha</button> }
              <span class="ck-grow"></span>
              <ion-button fill="clear" (click)="abierto.set(false)">Cancelar</ion-button>
              <ion-button [disabled]="!borrador()" (click)="aplicar()">Aplicar</ion-button>
            </footer>
          </div>
        }
      </ng-template>
    </ion-modal>
  `,
})
export class CkFechaComponent {
  readonly label = input('');
  readonly valor = input('');
  readonly presentacion = input<'date' | 'time'>('date');
  readonly max = input('');
  readonly min = input('');
  readonly opcional = input(false);
  readonly error = input('');
  readonly cambia = output<string>();

  protected readonly abierto = signal(false);
  protected readonly mesVista = signal(fechaLocal().slice(0, 7));
  protected readonly borrador = signal<string | null>(null);

  protected readonly texto = computed(() => {
    const v = this.valor();
    if (!v) return this.presentacion() === 'time' ? 'Elegir hora' : 'Elegir fecha';
    if (this.presentacion() === 'time') return v;
    return this.aFecha(v).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }).replace(/\./g, '');
  });

  protected readonly encabezado = computed(() => {
    const b = this.borrador();
    if (!b) return { principal: 'Elige un día', secundario: 'Toca una fecha del calendario' };
    const f = this.aFecha(b);
    const mayuscula = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
    return {
      principal: mayuscula(f.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric' })),
      secundario: mayuscula(f.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })),
    };
  });

  protected abrir() {
    const inicial = this.valor() || null;
    this.borrador.set(inicial);
    this.mesVista.set((inicial ?? fechaLocal()).slice(0, 7));
    this.abierto.set(true);
  }

  protected aplicar() {
    const b = this.borrador();
    if (!b) return;
    this.abierto.set(false);
    this.cambia.emit(b);
  }

  protected quitar() {
    this.abierto.set(false);
    this.cambia.emit('');
  }

  protected alCambiarHora(v: unknown) {
    const t = Array.isArray(v) ? String(v[0]) : String(v ?? '');
    if (!t) return;
    this.abierto.set(false);
    this.cambia.emit(t.includes('T') ? t.slice(11, 16) : t.slice(0, 5));
  }

  private aFecha(iso: string): Date {
    const [a, m, d] = iso.split('-').map(Number);
    return new Date(a, m - 1, d);
  }
}
