import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AsistenciaHoy, Checada, ChecadorApi, CkAreaChartComponent, CkIconComponent, CkPageComponent, CkStatusComponent, ETQ_CHECADA, HoraPipe, PuntoTendencia, ResumenHoy, etiquetaTipoCont, CkSelectComponent, CkOpcionComponent } from '@checador/shared';

interface Atencion { ruta: string; texto: string; valor: number; tono: 'danger' | 'warning' | 'primary' }

@Component({
  selector: 'app-panel',
  imports: [CkSelectComponent, CkOpcionComponent, CkPageComponent, CkStatusComponent, CkIconComponent, CkAreaChartComponent, RouterLink, HoraPipe],
  templateUrl: './panel.page.html' })
export class PanelPage {
  private readonly api = inject(ChecadorApi);
  protected readonly resumen = signal<ResumenHoy | null>(null);
  protected readonly asistencia = signal<AsistenciaHoy | null>(null);
  protected readonly tendencia = signal<PuntoTendencia[]>([]);
  protected readonly porRevisar = signal<Checada[]>([]);
  protected readonly sede = signal('');
  protected readonly etqChecada = ETQ_CHECADA;
  protected readonly etqCont = etiquetaTipoCont;

  protected readonly atencion = computed<Atencion[]>(() => {
    const r = this.resumen();
    if (!r) return [];
    return ([
      { ruta: '/incidencias', texto: 'Ayuda urgente', valor: r.ayudaUrgente, tono: 'danger' },
      { ruta: '/incidencias', texto: 'Incidencias abiertas', valor: r.incidenciasAbiertas - r.ayudaUrgente, tono: 'warning' },
      { ruta: '/revision', texto: 'Checadas por revisar', valor: r.porRevisar, tono: 'warning' },
      { ruta: '/solicitudes', texto: 'Solicitudes', valor: r.solicitudesPendientes, tono: 'primary' },
      { ruta: '/correcciones', texto: 'Correcciones', valor: r.correccionesPendientes, tono: 'primary' },
      { ruta: '/correcciones', texto: 'Jornadas sin salida', valor: r.jornadasSinCierre, tono: 'warning' },
      { ruta: '/lugares', texto: 'Lugares por aprobar', valor: r.lugaresPendientes, tono: 'primary' },
      { ruta: '/empleados', texto: 'Equipos por vincular', valor: r.dispositivosPendientes, tono: 'primary' },
      { ruta: '/privacidad', texto: 'Solicitudes de datos', valor: r.arcoPendientes, tono: 'primary' },
    ] as Atencion[]).filter((a) => a.valor > 0);
  });

  protected readonly porAtender = computed(() => this.atencion().reduce((a, x) => a + x.valor, 0));
  protected readonly presentes = computed(() => { const a = this.asistencia(); return a ? a.aTiempo + a.enComida + a.retardos : 0; });
  protected readonly pct = computed(() => { const a = this.asistencia(); return a && a.total ? Math.round((this.presentes() / a.total) * 100) : 0; });
  protected readonly pctDe = (n: number, total: number) => (total ? Math.round((n / total) * 100) : 0);
  protected readonly valores = computed(() => this.tendencia().map((t) => t.pct));
  protected readonly etiquetas = computed(() => this.tendencia().map((t) => new Date(`${t.fecha}T12:00:00`).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })));

  constructor() {
    this.cargar();
  }
  ionViewWillEnter() { this.cargar(); }

  protected async cargar() {
    const [r, a, t, c] = await Promise.all([
      this.api.resumenHoy(), this.api.asistenciaHoy(this.sede() || undefined), this.api.tendenciaAsistencia(), this.api.checadasRecientes(true),
    ]);
    this.resumen.set(r);
    this.asistencia.set(a);
    this.tendencia.set(t);
    this.porRevisar.set(c.slice(0, 6));
  }

  protected async cambiarSede(v: string) {
    this.sede.set(v);
    this.asistencia.set(await this.api.asistenciaHoy(v || undefined));
  }
}
