import { Component, OnDestroy, inject, signal } from '@angular/core';
import { AlertController, IonBadge, IonButton, IonLabel, IonSegment, IonSegmentButton, ModalController } from '@ionic/angular';
import { ConfirmarService, CLR_APROBACION, Checada, ChecadorApi, CkPageComponent, ETQ_APROBACION, ETQ_LUGAR, LugarPermitido, SolicitudLugar, PuedeDirective, UbicacionColaborador, UbicacionLugar } from '@checador/shared';
import { MotivoService } from '../comun/motivo.service';
import { LugarSheet } from './lugar.sheet';
import { MapaLugaresComponent } from './mapa-lugares.component';

@Component({
  selector: 'app-lugares',
  imports: [CkPageComponent, IonBadge, IonButton, IonLabel, IonSegment, IonSegmentButton, PuedeDirective, MapaLugaresComponent],
  templateUrl: './lugares.page.html',
})
export class LugaresPage implements OnDestroy {
  private readonly api = inject(ChecadorApi);
  private readonly confirmar = inject(ConfirmarService);
  private readonly motivo = inject(MotivoService);
  private readonly alertas = inject(AlertController);
  private readonly modales = inject(ModalController);
  protected readonly aviso = signal('');
  protected readonly error = signal('');
  protected readonly lugares = signal<LugarPermitido[]>([]);
  protected readonly solicitudes = signal<SolicitudLugar[]>([]);
  protected readonly checadas = signal<Checada[]>([]);
  protected readonly ubicaciones = signal<UbicacionColaborador[]>([]);
  protected readonly actualizado = signal('');
  private refresco?: ReturnType<typeof setInterval>;
  protected readonly vista = signal<'lista' | 'mapa'>('lista');
  protected readonly etq = ETQ_LUGAR;
  protected readonly etqEstado = ETQ_APROBACION;
  protected readonly clrEstado = CLR_APROBACION;

  constructor() {
    this.cargar();
    this.refresco = setInterval(() => { if (this.vista() === 'mapa') void this.cargar(); }, 60_000);
  }
  ionViewWillEnter() { this.cargar(); }
  ngOnDestroy() { clearInterval(this.refresco); }

  protected actualizar() { return this.cargar(); }

  protected async abrirLugar(lugar: LugarPermitido | null) {
    const m = await this.modales.create({ component: LugarSheet, componentProps: { lugar }, cssClass: 'ck-modal-full' });
    await m.present();
    const { role, data } = await m.onDidDismiss<{ nombre: string; nuevo: boolean }>();
    if (role !== 'ok' || !data) return;
    this.error.set('');
    this.aviso.set(`Lugar “${data.nombre}” ${data.nuevo ? 'creado' : 'actualizado'}.`);
    await this.cargar();
  }

  protected async eliminarLugar(l: LugarPermitido) {
    const otros = this.lugares().filter((x) => x.id !== l.id);
    const hay = l.empleadosAsignados > 0;
    if (hay && !otros.length) { this.error.set('Crea otro lugar antes de eliminar este: tiene colaboradores asignados.'); return; }
    const r = await this.confirmar.pedir({
      peligro: true,
      icono: hay ? 'right-left' : 'trash',
      titulo: hay ? `“${l.nombre}” tiene ${l.empleadosAsignados} colaborador${l.empleadosAsignados === 1 ? '' : 'es'}` : '¿Deseas eliminar\neste lugar?',
      descripcion: hay
        ? 'Elige el lugar al que pasarán. Se les avisará del cambio. Las checadas ya registradas conservan este lugar.'
        : `Se dará de baja “${l.nombre}”. Las checadas ya registradas lo conservan.`,
      textoAceptar: hay ? 'Pasar y eliminar' : 'Eliminar',
      eleccion: hay ? { etiqueta: 'Lugar nuevo', opciones: otros.map((x) => ({ valor: x.id, etiqueta: x.nombre })) } : undefined,
    });
    if (!r) return;
    this.error.set('');
    try {
      const { movidos } = await this.api.eliminarLugar(l.id, r.valor);
      this.aviso.set(movidos ? `Lugar “${l.nombre}” eliminado; ${movidos} colaborador${movidos === 1 ? '' : 'es'} pasaron al nuevo lugar.` : `Lugar “${l.nombre}” eliminado.`);
    } catch (e) {
      this.error.set((e as Error).message);
    }
    await this.cargar();
  }

  private async cargar() {
    const [l, s, u, c] = await Promise.all([this.api.lugares(), this.api.solicitudesLugar(), this.api.ubicacionesColaboradores(), this.api.checadasRecientes()]);
    this.lugares.set(l);
    this.solicitudes.set(s);
    this.ubicaciones.set(u);
    this.checadas.set(c);
    this.actualizado.set(new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  }

  protected async aprobar(s: SolicitudLugar) {
    let ubicacion: UbicacionLugar | undefined;
    if (!this.lugares().some((l) => l.nombre === s.nombre)) {
      ubicacion = await this.pedirUbicacion(s);
      if (!ubicacion) return;
    } else {
      const r = await this.confirmar.pedir({
        icono: 'checkmark-circle', titulo: '¿Deseas aprobar\neste lugar?',
        descripcion: `${s.empleado} podrá checar en “${s.nombre}”. Quedará registrada tu decisión.`, textoAceptar: 'Aprobar' });
      if (!r) return;
    }
    await this.api.resolverSolicitudLugar(s.id, true, 'Aprobado', ubicacion);
    await this.cargar();
  }

  /** Un lugar nuevo necesita coordenadas para validar las checadas; se sugieren las de la última checada de la persona. */
  private async pedirUbicacion(s: SolicitudLugar): Promise<UbicacionLugar | undefined> {
    const sugerida = this.checadas().find((c) => c.empleadoId === s.empleadoId && c.posicion)?.posicion;
    const alerta = await this.alertas.create({
      header: 'Aprobar lugar', subHeader: `${s.empleado} · ${s.nombre}`, message: 'Indica dónde está, para validar sus checadas.',
      inputs: [
        { name: 'latitud', type: 'number', placeholder: 'Latitud (ej. 19.4326)', value: sugerida?.latitud },
        { name: 'longitud', type: 'number', placeholder: 'Longitud (ej. -99.1332)', value: sugerida?.longitud },
        { name: 'radioMetros', type: 'number', placeholder: 'Radio en metros', value: 100 },
      ],
      buttons: [{ text: 'Cancelar', role: 'cancel' }, { text: 'Aprobar', role: 'confirm' }],
    });
    await alerta.present();
    const { data, role } = await alerta.onDidDismiss();
    if (role !== 'confirm') return undefined;
    const valores = data.values as Record<string, string>;
    return { latitud: Number(valores['latitud']), longitud: Number(valores['longitud']), radioMetros: Number(valores['radioMetros']) };
  }

  protected async rechazar(s: SolicitudLugar) {
    const r = await this.motivo.pedir({
      titulo: 'Rechazar lugar', subtitulo: `${s.empleado} · ${s.nombre}`, detalle: [s.motivo],
      sugerencias: ['No se autorizan lugares de terceros', 'Usa tu home office o la sede'], obligatorio: true, textoPrincipal: 'Rechazar', colorPrincipal: 'danger', etiqueta: 'Motivo',
    });
    if (!r) return;
    await this.api.resolverSolicitudLugar(s.id, false, r.texto);
    await this.cargar();
  }
}
