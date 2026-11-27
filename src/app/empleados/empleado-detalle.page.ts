import { Component, computed, inject, input, signal } from '@angular/core';
import { IonBadge, IonButton } from '@ionic/angular';
import {
  CLR_DISPOSITIVO, CLR_ESTADO_HOY, CLR_VALIDACION, ChecadorApi, CkIconComponent, CkPageComponent, ConfirmarService, DispositivoDetalle, ETQ_CHECADA,
  ETQ_DISPOSITIVO, ETQ_ESTADO_HOY, ETQ_MODALIDAD, ETQ_VALIDACION, Empleado, FechaPipe, HoraPipe, ICO_PLATAFORMA, JornadaDia, PuedeDirective, Turno, fechaLocal,
} from '@checador/shared';
import { MotivoService } from '../comun/motivo.service';
import { AsistenciaChartComponent } from './asistencia-chart.component';

type Rango = 7 | 14 | 30;

@Component({
  selector: 'app-empleado-detalle',
  imports: [CkPageComponent, CkIconComponent, IonBadge, IonButton, FechaPipe, HoraPipe, PuedeDirective, AsistenciaChartComponent],
  templateUrl: './empleado-detalle.page.html',
})
export class EmpleadoDetallePage {
  readonly id = input.required<string>();
  private readonly api = inject(ChecadorApi);
  private readonly confirmar = inject(ConfirmarService);
  private readonly motivo = inject(MotivoService);

  protected readonly empleado = signal<Empleado | null>(null);
  protected readonly turno = signal<Turno | null>(null);
  protected readonly equipos = signal<DispositivoDetalle[]>([]);
  protected readonly jornadas = signal<JornadaDia[]>([]);
  protected readonly rango = signal<Rango>(30);
  protected readonly rangos: Rango[] = [7, 14, 30];
  protected readonly abiertos = signal<ReadonlySet<string>>(new Set());
  protected readonly cargado = signal(false);
  protected readonly error = signal('');
  protected readonly aviso = signal('');

  protected readonly etqModalidad = ETQ_MODALIDAD;
  protected readonly etqHoy = ETQ_ESTADO_HOY;
  protected readonly clrHoy = CLR_ESTADO_HOY;
  protected readonly etqEquipo = ETQ_DISPOSITIVO;
  protected readonly clrEquipo = CLR_DISPOSITIVO;
  protected readonly icoPlataforma = ICO_PLATAFORMA;
  protected readonly etqChecada = ETQ_CHECADA;
  protected readonly etqValidacion = ETQ_VALIDACION;
  protected readonly clrValidacion = CLR_VALIDACION;

  /** Horas que se espera trabajar al día: el horario del turno menos la comida. */
  protected readonly metaHoras = computed(() => {
    const t = this.turno();
    if (!t) return 8;
    const min = (h: string) => { const [a, b] = h.split(':').map(Number); return (a ?? 0) * 60 + (b ?? 0); };
    const total = (min(t.salida) - min(t.entrada) + 1440) % 1440;
    return Math.round(((total - t.comidaMin) / 60) * 10) / 10;
  });

  protected readonly resumen = computed(() => {
    const l = this.jornadas();
    const trabajados = l.filter((j) => j.horasOrdinarias > 0 || j.extraDobles > 0);
    const retardos = l.filter((j) => j.estado === 'Retardo');
    const aTiempo = l.filter((j) => j.estado === 'Normal').length;
    const horas = trabajados.reduce((s, j) => s + j.horasOrdinarias + j.extraDobles + j.extraTriples, 0);
    return {
      trabajados: trabajados.length,
      retardos: retardos.length,
      minutosRetardo: retardos.reduce((s, j) => s + j.minutosRetardo, 0),
      faltas: l.filter((j) => j.estado === 'Falta').length,
      horas: Math.round(horas * 10) / 10,
      puntualidad: aTiempo + retardos.length ? Math.round((aTiempo / (aTiempo + retardos.length)) * 100) : null,
    };
  });

  protected readonly pendientes = computed(() => this.equipos().filter((e) => e.estado === 'Pendiente').length);

  constructor() {
    queueMicrotask(() => this.cargar());
  }

  ionViewWillEnter() { if (this.cargado()) void this.cargar(); }

  private async cargar() {
    const id = this.id();
    const [todos, turnos] = await Promise.all([this.api.empleados(), this.api.turnos()]);
    const e = todos.find((x) => x.id === id) ?? null;
    this.empleado.set(e);
    this.turno.set(turnos.find((t) => t.id === e?.turnoId) ?? null);
    await Promise.all([this.cargarEquipos(), this.cargarHistorial()]);
    this.cargado.set(true);
  }

  private async cargarEquipos() { this.equipos.set(await this.api.dispositivosDe(this.id())); }

  private async cargarHistorial() {
    const hoy = new Date();
    const desde = new Date(hoy.getTime() - (this.rango() - 1) * 86_400_000);
    this.jornadas.set(await this.api.historialDe(this.id(), fechaLocal(desde), fechaLocal(hoy)));
  }

  protected async cambiarRango(r: Rango) { this.rango.set(r); await this.cargarHistorial(); }

  protected alternar(id: string) {
    const s = new Set(this.abiertos());
    if (!s.delete(id)) s.add(id);
    this.abiertos.set(s);
  }

  protected iniciales(n: string) { return n.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join(''); }

  protected async vincular(d: DispositivoDetalle) {
    const nuevo = d.estado === 'Pendiente';
    const r = await this.confirmar.pedir({
      icono: 'mobile-screen', titulo: nuevo ? '¿Deseas vincular\neste equipo?' : '¿Deseas restablecer\neste equipo?',
      descripcion: `${d.empleado} · ${d.nombre}. Quedará registrada tu decisión.`, textoAceptar: nuevo ? 'Vincular' : 'Restablecer' });
    if (!r) return;
    await this.resolver(() => this.api.resolverDispositivo(d.id, true, 'Vinculado por RH'), nuevo ? `“${d.nombre}” quedó vinculado.` : `“${d.nombre}” se restableció.`);
  }

  protected async revocar(d: DispositivoDetalle) {
    const r = await this.motivo.pedir({
      titulo: d.estado === 'Pendiente' ? 'Rechazar equipo' : 'Revocar equipo', subtitulo: `${d.empleado} · ${d.nombre}`,
      sugerencias: ['Equipo perdido', 'Equipo no reconocido', 'Cambio de teléfono'], obligatorio: true, textoPrincipal: 'Confirmar', colorPrincipal: 'danger', etiqueta: 'Motivo',
    });
    if (!r) return;
    await this.resolver(() => this.api.resolverDispositivo(d.id, false, r.texto), d.estado === 'Pendiente' ? `“${d.nombre}” fue rechazado.` : `“${d.nombre}” fue revocado.`);
  }

  private async resolver(accion: () => Promise<unknown>, mensaje: string) {
    this.error.set('');
    this.aviso.set('');
    try { await accion(); this.aviso.set(mensaje); } catch (e) { this.error.set((e as Error).message); }
    await this.cargarEquipos();
  }
}
