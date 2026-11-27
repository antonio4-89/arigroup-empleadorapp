import { Component, computed, inject, signal } from '@angular/core';
import { IonSearchbar } from '@ionic/angular';
import { IonBadge, IonButton } from '@ionic/angular';
import { ConfirmarService, CLR_ESTADO_SOLICITUD, ChecadorApi, CkPageComponent, CkPaginadorComponent, ETQ_ESTADO_SOLICITUD, ETQ_SOLICITUD, FechaPipe, PuedeDirective, Solicitud, TipoSolicitud, crearPaginacion, CkSelectComponent, CkOpcionComponent } from '@checador/shared';
import { MotivoService } from '../comun/motivo.service';

type Filtro = 'pendientes' | 'todas';

@Component({
  selector: 'app-solicitudes',
  imports: [CkSelectComponent, CkOpcionComponent, IonSearchbar, CkPageComponent, CkPaginadorComponent, IonBadge, IonButton, FechaPipe, PuedeDirective],
  templateUrl: './solicitudes.page.html' })
export class SolicitudesPage {
  private readonly api = inject(ChecadorApi);
  private readonly confirmar = inject(ConfirmarService);
  private readonly motivo = inject(MotivoService);
  protected readonly todas = signal<Solicitud[]>([]);
  protected readonly filtro = signal<Filtro>('pendientes');
  protected readonly tipo = signal<TipoSolicitud | ''>('');
  protected readonly busqueda = signal('');
  protected readonly etqTipo = ETQ_SOLICITUD;
  protected readonly etqEstado = ETQ_ESTADO_SOLICITUD;
  protected readonly clrEstado = CLR_ESTADO_SOLICITUD;
  protected readonly tipos = Object.entries(ETQ_SOLICITUD) as [TipoSolicitud, string][];

  protected readonly filtradas = computed(() => {
    const q = this.busqueda().trim().toLowerCase();
    return this.todas().filter((s) =>
      (this.filtro() === 'todas' || s.estado === 'Pendiente') && (!this.tipo() || s.tipo === this.tipo()) && (!q || s.empleado.toLowerCase().includes(q)));
  });
  protected readonly pag = crearPaginacion(() => this.filtradas(), 20);
  protected readonly pendientes = computed(() => this.todas().filter((s) => s.estado === 'Pendiente').length);

  constructor() {
    this.cargar();
  }
  ionViewWillEnter() { this.cargar(); }
  private async cargar() { this.todas.set(await this.api.solicitudes()); }

  protected cambiar(f: Filtro) { this.filtro.set(f); this.pag.reiniciar(); }
  protected cambiarTipo(v: string) { this.tipo.set(v as TipoSolicitud | ''); this.pag.reiniciar(); }
  protected buscar(v: string) { this.busqueda.set(v); this.pag.reiniciar(); }

  protected async aprobar(s: Solicitud) {
    const r = await this.confirmar.pedir({
      icono: 'checkmark-circle', titulo: '¿Deseas autorizar\nesta solicitud?',
      descripcion: `${this.etqTipo[s.tipo]} de ${s.empleado}. Se le avisará y quedará registrada tu decisión.`, textoAceptar: 'Autorizar' });
    if (!r) return;
    await this.api.resolverSolicitud(s.id, true, 'Autorizado');
    await this.cargar();
  }

  protected async rechazar(s: Solicitud) {
    const r = await this.motivo.pedir({
      titulo: 'Rechazar solicitud', subtitulo: `${s.empleado} · ${this.etqTipo[s.tipo]}`, detalle: [s.motivo],
      etiqueta: 'Motivo', sugerencias: ['Sin cobertura esos días', 'Falta comprobante', 'Fuera de política'], obligatorio: true,
      textoPrincipal: 'Rechazar', colorPrincipal: 'danger' });
    if (!r) return;
    await this.api.resolverSolicitud(s.id, false, r.texto);
    await this.cargar();
  }
}
