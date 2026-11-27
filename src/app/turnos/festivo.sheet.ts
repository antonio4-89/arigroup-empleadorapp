import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { IonButton, ModalController } from '@ionic/angular';
import { ChecadorApi, CkInputComponent, Festivo } from '@checador/shared';

@Component({
  selector: 'app-festivo-sheet',
  imports: [CkInputComponent, IonButton],
  template: `
    <form class="ck-form-sheet" (submit)="$event.preventDefault(); guardar()">
      <header class="ck-form-sheet__head"><h2 class="ck-sheet__title">{{ festivo ? 'Editar festivo' : 'Nuevo festivo' }}</h2></header>
      <ck-input label="Fecha" type="date" [value]="fecha()" (cambio)="fecha.set($event)" />
      <ck-input label="Nombre" placeholder="Ej. Aniversario de la empresa" [maxlength]="80" [value]="nombre()" (cambio)="nombre.set($event)" />
      <ck-input label="Nota" placeholder="Ej. Descanso por contrato colectivo" [maxlength]="120" [value]="nota()" (cambio)="nota.set($event)" />
      @if (error()) { <p class="ck-notice ck-notice--error" role="alert">{{ error() }}</p> }
      <footer class="ck-form-sheet__actions">
        <ion-button fill="clear" color="medium" (click)="cancelar()">Cancelar</ion-button>
        <ion-button type="submit" [disabled]="guardando()">{{ festivo ? 'Guardar cambios' : 'Agregar festivo' }}</ion-button>
      </footer>
    </form>
  ` })
export class FestivoSheet implements OnInit {
  @Input() festivo: Festivo | null = null;
  @Input() fechaInicial = '';
  private readonly api = inject(ChecadorApi);
  private readonly ctrl = inject(ModalController);
  protected readonly fecha = signal('');
  protected readonly nombre = signal('');
  protected readonly nota = signal('');
  protected readonly error = signal('');
  protected readonly guardando = signal(false);

  ngOnInit() {
    this.fecha.set(this.festivo?.fecha ?? this.fechaInicial);
    this.nombre.set(this.festivo?.nombre ?? '');
    this.nota.set(this.festivo?.nota ?? '');
  }

  protected cancelar() { return this.ctrl.dismiss(null, 'cancelada'); }

  protected async guardar() {
    this.error.set('');
    this.guardando.set(true);
    const datos = { fecha: this.fecha(), nombre: this.nombre(), nota: this.nota() };
    try {
      if (this.festivo) await this.api.modificarFestivo(this.festivo.fecha, datos); else await this.api.crearFestivo(datos);
      await this.ctrl.dismiss({ fecha: datos.fecha, nombre: datos.nombre.trim(), nuevo: !this.festivo }, 'ok');
    } catch (e) {
      this.error.set((e as Error).message);
    } finally {
      this.guardando.set(false);
    }
  }
}
