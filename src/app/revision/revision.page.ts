import { Component, computed, inject, signal } from '@angular/core';
import { IonSearchbar } from '@ionic/angular';
import {
  Checada, ChecadorApi, ClaseRetardo, CkPageComponent, CkPaginadorComponent, CkStatusComponent, DESCANSO_MINIMO_MIN, ETQ_CHECADA, ETQ_MOTIVO_RETARDO, FechaPipe,
  HoraPipe, crearPaginacion,
} from '@checador/shared';

type Filtro = 'revisar' | 'retardos' | 'todas';
type Lugar = '' | 'casa' | 'sede';
type Clase = '' | ClaseRetardo | 'Corta';

@Component({
  selector: 'app-revision',
  imports: [IonSearchbar, CkPageComponent, CkPaginadorComponent, CkStatusComponent, HoraPipe, FechaPipe],
  templateUrl: './revision.page.html',
})
export class RevisionPage {
  private readonly api = inject(ChecadorApi);
  protected readonly todas = signal<Checada[]>([]);
  protected readonly filtro = signal<Filtro>('revisar');
  protected readonly lugar = signal<Lugar>('');
  protected readonly clase = signal<Clase>('');
  protected readonly busqueda = signal('');
  protected readonly etqChecada = ETQ_CHECADA;
  protected readonly etqMotivo = ETQ_MOTIVO_RETARDO;

  private readonly esCorta = (c: Checada) => c.descansoMin !== undefined && c.descansoMin < DESCANSO_MINIMO_MIN;

  /** En la pestaña Retardos: entradas tarde, comidas excedidas y descansos menores al mínimo legal. */
  private readonly enRetardos = (c: Checada) => !!c.retardo || this.esCorta(c);

  protected readonly filtradas = computed(() => {
    const q = this.busqueda().trim().toLowerCase();
    const f = this.filtro();
    const l = this.lugar();
    const k = this.clase();
    return this.todas()
      .filter((c) => f === 'todas' || (f === 'revisar' ? c.validacion !== 'Valida' : this.enRetardos(c)))
      .filter((c) => f !== 'retardos' || !l || (l === 'casa') === !!c.retardo?.desdeCasa)
      .filter((c) => f !== 'retardos' || !k || (k === 'Corta' ? this.esCorta(c) : c.retardo?.clase === k))
      .filter((c) => !q || `${c.empleado} ${c.lugar}`.toLowerCase().includes(q))
      .sort((a, b) => (f === 'retardos' ? Number(!!a.retardo?.motivo) - Number(!!b.retardo?.motivo) || (b.retardo?.minutos ?? 0) - (a.retardo?.minutos ?? 0) : 0));
  });
  protected readonly pag = crearPaginacion(() => this.filtradas(), 25);
  protected readonly porRevisar = computed(() => this.todas().filter((c) => c.validacion !== 'Valida').length);
  protected readonly retardos = computed(() => {
    const rs = this.todas().filter((c) => !!c.retardo);
    return {
      total: this.todas().filter(this.enRetardos).length,
      entradas: rs.filter((c) => c.retardo!.clase === 'Entrada').length,
      comidas: rs.filter((c) => c.retardo!.clase === 'Comida').length,
      cortas: this.todas().filter(this.esCorta).length,
      sinJustificar: rs.filter((c) => !c.retardo!.motivo).length,
      desdeCasa: rs.filter((c) => c.retardo!.desdeCasa).length,
      equipoEmpresa: rs.filter((c) => c.retardo!.motivo === 'FallaEquipoEmpresa').length,
    };
  });

  protected cambiarClase(k: Clase) { this.clase.set(this.clase() === k ? '' : k); this.pag.reiniciar(); }

  constructor() {
    this.cargar();
  }
  ionViewWillEnter() { this.cargar(); }
  private async cargar() { this.todas.set(await this.api.checadasRecientes()); }

  protected cambiar(f: Filtro) { this.filtro.set(f); this.pag.reiniciar(); }
  protected cambiarLugar(l: Lugar) { this.lugar.set(this.lugar() === l ? '' : l); this.pag.reiniciar(); }
  protected buscar(v: string) { this.busqueda.set(v); this.pag.reiniciar(); }

  protected motivo(c: Checada) { return c.motivos[0] || '—'; }
}
