import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { IonButton, ModalController } from '@ionic/angular';
import { ChecadorApi, CkInputComponent, CkOpcionComponent, CkSelectComponent, PatronSemanal, TipoJornada, Turno } from '@checador/shared';

@Component({
  selector: 'app-turno-sheet',
  imports: [CkInputComponent, CkSelectComponent, CkOpcionComponent, IonButton],
  template: `
    <form class="ck-form-sheet" (submit)="$event.preventDefault(); guardar()">
      <header class="ck-form-sheet__head">
        <h2 class="ck-sheet__title">{{ turno ? 'Editar turno' : 'Nuevo turno' }}</h2>
        @if (turno && turno.empleados) { <span class="ck-text-sm ck-text-muted">Los cambios aplican a los {{ turno.empleados }} colaboradores que lo tienen, de aquí en adelante.</span> }
      </header>
      <ck-input label="Nombre" placeholder="Ej. Ventas fin de semana" [maxlength]="60" [value]="nombre()" (cambio)="nombre.set($event)" />
      <div class="ck-grid">
        <ck-input label="Entrada" type="time" [value]="entrada()" (cambio)="entrada.set($event)" />
        <ck-input label="Salida" type="time" [value]="salida()" (cambio)="salida.set($event)" />
        <ck-select label="Tipo de jornada" [value]="tipo()" (cambio)="tipo.set($any($event))">
          <ck-opcion valor="Diurna" etiqueta="Diurna" />
          <ck-opcion valor="Mixta" etiqueta="Mixta" />
          <ck-opcion valor="Nocturna" etiqueta="Nocturna" />
        </ck-select>
        <ck-select label="Días laborales" [value]="patron()" (cambio)="patron.set($any($event))">
          <ck-opcion valor="LunesAViernes" etiqueta="Lunes a viernes" />
          <ck-opcion valor="LunesASabado" etiqueta="Lunes a sábado" />
        </ck-select>
        <ck-select label="Comida" [value]="comida()" (cambio)="comida.set(+$event)">
          @for (m of opcionesComida; track m) { <ck-opcion [valor]="m" etiqueta="{{ m }} min" /> }
        </ck-select>
        <ck-select label="Tolerancia de entrada" [value]="tolerancia()" (cambio)="tolerancia.set(+$event)">
          @for (m of [0, 5, 10, 15, 20, 30]; track m) { <ck-opcion [valor]="m" etiqueta="{{ m }} min" /> }
        </ck-select>
        <ck-select label="Tolerancia de regreso" [value]="toleranciaComida()" (cambio)="toleranciaComida.set(+$event)">
          @for (m of [0, 5, 10, 15]; track m) { <ck-opcion [valor]="m" etiqueta="{{ m }} min" /> }
        </ck-select>
      </div>
      @if (error()) { <p class="ck-notice ck-notice--error" role="alert">{{ error() }}</p> }
      <footer class="ck-form-sheet__actions">
        <ion-button fill="clear" color="medium" (click)="cancelar()">Cancelar</ion-button>
        <ion-button type="submit" [disabled]="guardando()">{{ turno ? 'Guardar cambios' : 'Crear turno' }}</ion-button>
      </footer>
    </form>
  ` })
export class TurnoSheet implements OnInit {
  @Input() turno: Turno | null = null;
  private readonly api = inject(ChecadorApi);
  private readonly ctrl = inject(ModalController);
  protected readonly opcionesComida = [30, 45, 60, 75, 90, 120];
  protected readonly nombre = signal('');
  protected readonly tipo = signal<TipoJornada>('Diurna');
  protected readonly entrada = signal('09:00');
  protected readonly salida = signal('18:00');
  protected readonly patron = signal<PatronSemanal>('LunesAViernes');
  protected readonly comida = signal(60);
  protected readonly tolerancia = signal(10);
  protected readonly toleranciaComida = signal(5);
  protected readonly error = signal('');
  protected readonly guardando = signal(false);

  ngOnInit() {
    const t = this.turno;
    if (!t) return;
    this.nombre.set(t.nombre);
    this.tipo.set(t.tipo);
    this.entrada.set(t.entrada);
    this.salida.set(t.salida);
    this.patron.set(t.diasLaborales === 'Lun a sáb' ? 'LunesASabado' : 'LunesAViernes');
    this.comida.set(t.comidaMin);
    this.tolerancia.set(t.toleranciaMin);
    this.toleranciaComida.set(t.toleranciaComidaMin);
  }

  protected cancelar() { return this.ctrl.dismiss(null, 'cancelada'); }

  protected async guardar() {
    this.error.set('');
    this.guardando.set(true);
    const datos = {
      nombre: this.nombre(), tipo: this.tipo(), entrada: this.entrada(), salida: this.salida(), patron: this.patron(),
      comidaMin: this.comida(), toleranciaMin: this.tolerancia(), toleranciaComidaMin: this.toleranciaComida(),
    };
    try {
      if (this.turno) await this.api.configurarTurno(this.turno.id, datos); else await this.api.crearTurno(datos);
      await this.ctrl.dismiss({ nombre: datos.nombre.trim(), nuevo: !this.turno }, 'ok');
    } catch (e) {
      this.error.set((e as Error).message);
    } finally {
      this.guardando.set(false);
    }
  }
}
