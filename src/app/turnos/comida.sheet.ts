import { Component, Input, OnInit, computed, inject, signal } from '@angular/core';
import { IonButton, IonSearchbar, ModalController } from '@ionic/angular';
import { ChecadorApi, CkInputComponent, Empleado, Turno } from '@checador/shared';

@Component({
  selector: 'app-comida-sheet',
  imports: [CkInputComponent, IonButton, IonSearchbar],
  template: `
    <form class="ck-form-sheet" (submit)="$event.preventDefault(); guardar()">
      <header class="ck-form-sheet__head">
        <h2 class="ck-sheet__title">{{ elegido() ? 'Comida de ' + elegido()!.nombre : 'Agregar comida pactada' }}</h2>
        <span class="ck-text-sm ck-text-muted">Para quien tiene una comida distinta a la de su turno por contrato individual o convenio.</span>
      </header>

      @if (elegido(); as e) {
        <div class="ck-form-sheet__ctx">
          <span>No. {{ e.numero }} · {{ e.departamento }}</span>
          <span>Turno {{ turnoDe(e)?.nombre }}: comida de {{ turnoDe(e)?.comidaMin }} min y {{ turnoDe(e)?.toleranciaComidaMin }} min de tolerancia de regreso.</span>
        </div>
        <div class="ck-chips" role="radiogroup" aria-label="Minutos de comida">
          @for (m of opciones; track m) {
            <button type="button" class="ck-chip" role="radio" [attr.aria-checked]="minutos() === m" [attr.aria-pressed]="minutos() === m" (click)="minutos.set(m)">{{ m }} min</button>
          }
        </div>
        <ck-input label="Fundamento" placeholder="Contrato individual, cláusula 6 / Convenio por escrito del 3 de marzo" [value]="fundamento()" (cambio)="fundamento.set($event)" />
      } @else {
        <ion-searchbar placeholder="Buscar colaborador por nombre o número" aria-label="Buscar colaborador" [debounce]="150" (ionInput)="q.set($any($event.detail.value ?? ''))" />
        @if (candidatos().length) {
          <ul class="ck-menu-list">
            @for (e of candidatos(); track e.id) {
              <li><button type="button" class="ck-menu-list__item" (click)="elegir(e)">
                <span class="ck-grow"><strong>{{ e.nombre }}</strong><small>No. {{ e.numero }} · {{ e.departamento }} · comida actual {{ e.comidaPactada?.minutos ?? turnoDe(e)?.comidaMin }} min</small></span>
              </button></li>
            }
          </ul>
        } @else if (q().trim().length >= 2) {
          <p class="ck-text-sm ck-text-muted">No encontramos a nadie con ese nombre o número.</p>
        } @else {
          <p class="ck-text-sm ck-text-muted">Escribe al menos 2 letras del nombre o el número del colaborador.</p>
        }
      }

      @if (error()) { <p class="ck-notice ck-notice--error" role="alert">{{ error() }}</p> }
      <footer class="ck-form-sheet__actions">
        <ion-button fill="clear" color="medium" (click)="cancelar()">Cancelar</ion-button>
        @if (elegido()) { <ion-button type="submit" [disabled]="guardando()">Guardar</ion-button> }
      </footer>
    </form>
  ` })
export class ComidaSheet implements OnInit {
  @Input({ required: true }) empleados: Empleado[] = [];
  @Input({ required: true }) turnos: Turno[] = [];
  @Input() empleado: Empleado | null = null;
  private readonly api = inject(ChecadorApi);
  private readonly ctrl = inject(ModalController);
  protected readonly opciones = [30, 45, 60, 75, 90, 120];
  protected readonly q = signal('');
  protected readonly elegido = signal<Empleado | null>(null);
  protected readonly minutos = signal(45);
  protected readonly fundamento = signal('');
  protected readonly error = signal('');
  protected readonly guardando = signal(false);
  protected readonly candidatos = computed(() => {
    const q = this.q().trim().toLowerCase();
    if (q.length < 2) return [];
    return this.empleados.filter((e) => `${e.nombre} ${e.numero}`.toLowerCase().includes(q)).slice(0, 6);
  });

  ngOnInit() { if (this.empleado) this.elegir(this.empleado); }

  protected turnoDe(e: Empleado) { return this.turnos.find((t) => t.id === e.turnoId); }

  protected elegir(e: Empleado) {
    this.elegido.set(e);
    this.minutos.set(e.comidaPactada?.minutos ?? this.turnoDe(e)?.comidaMin ?? 60);
    this.fundamento.set(e.comidaPactada?.fundamento ?? '');
  }

  protected cancelar() { return this.ctrl.dismiss(null, 'cancelada'); }

  protected async guardar() {
    const e = this.elegido();
    if (!e) return;
    this.error.set('');
    this.guardando.set(true);
    try {
      await this.api.pactarComida(e.id, this.minutos(), this.fundamento());
      await this.ctrl.dismiss({ nombre: e.nombre, minutos: this.minutos() }, 'ok');
    } catch (x) {
      this.error.set((x as Error).message);
    } finally {
      this.guardando.set(false);
    }
  }
}
