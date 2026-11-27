import { Component, computed, inject, signal } from '@angular/core';
import { IonSearchbar } from '@ionic/angular';
import { IonBadge, IonButton } from '@ionic/angular';
import { AccionAuditoria, CLR_ACCION, CLR_ROL, ETQ_ROL, ChecadorApi, CkPageComponent, CkPaginadorComponent, ETQ_ACCION, crearPaginacion, EventoAuditoria, FechaPipe, HoraPipe, ResultadoIntegridad, CkSelectComponent, CkOpcionComponent } from '@checador/shared';

@Component({
  selector: 'app-auditoria',
  imports: [CkSelectComponent, CkOpcionComponent, IonSearchbar, CkPageComponent, CkPaginadorComponent, IonBadge, IonButton, FechaPipe, HoraPipe],
  templateUrl: './auditoria.page.html' })
export class AuditoriaPage {
  private readonly api = inject(ChecadorApi);
  protected readonly integridad = signal<ResultadoIntegridad | null>(null);
  protected readonly eventos = signal<EventoAuditoria[]>([]);
  protected readonly filtro = signal<AccionAuditoria | 'todas'>('todas');
  protected readonly busqueda = signal('');
  protected readonly alterado = signal(false);
  protected readonly etq = ETQ_ACCION;
  protected readonly clr = CLR_ACCION;
  protected readonly clrRol = CLR_ROL;
  protected readonly etqRol = ETQ_ROL;
  protected readonly acciones = Object.keys(ETQ_ACCION) as AccionAuditoria[];

  protected readonly filtradas = computed(() => {
    const q = this.busqueda().trim().toLowerCase();
    return this.eventos().filter((e) =>
      (this.filtro() === 'todas' || e.accion === this.filtro()) && (!q || `${e.usuario} ${e.objeto} ${e.detalle}`.toLowerCase().includes(q)));
  });

  protected readonly pag = crearPaginacion(() => this.filtradas(), 20);
  protected cambiarFiltro(v: string) { this.filtro.set(v as AccionAuditoria | 'todas'); this.pag.reiniciar(); }
  protected buscar(v: string) { this.busqueda.set(v); this.pag.reiniciar(); }

  constructor() { this.cargar(); }
  ionViewWillEnter() { this.cargar(); }

  private async cargar() {
    const [i, e] = await Promise.all([this.api.verificarIntegridad(), this.api.auditoria()]);
    this.integridad.set(i);
    this.eventos.set(e);
  }

  protected verificar() { return this.cargar(); }

  protected async simular() {
    await this.api.simularAlteracion(false);
    this.alterado.set(true);
    await this.cargar();
  }

  protected async restaurar() {
    await this.api.simularAlteracion(true);
    this.alterado.set(false);
    await this.cargar();
  }
}
