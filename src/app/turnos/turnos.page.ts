import { Component, computed, inject, signal } from '@angular/core';
import { IonButton, IonSearchbar, ModalController } from '@ionic/angular';
import { IonBadge, IonLabel, IonSegment, IonSegmentButton } from '@ionic/angular';
import { CambiosTurno, ChecadorApi, ConfirmarService, CkPageComponent, CkPaginadorComponent, Empleado, FechaPipe, Festivo, PermisosService, PuedeDirective, Turno, crearPaginacion, CkSelectComponent, CkOpcionComponent, CkCalendarioComponent, fechaLocal } from '@checador/shared';

import { ComidaSheet } from './comida.sheet';
import { FestivoSheet } from './festivo.sheet';
import { TurnoSheet } from './turno.sheet';

type Vista = 'general' | 'comida' | 'asignacion';

@Component({
  selector: 'app-turnos',
  imports: [CkCalendarioComponent, CkSelectComponent, CkOpcionComponent, 
    IonSearchbar, IonButton, CkPageComponent, CkPaginadorComponent, IonBadge, IonLabel, IonSegment, IonSegmentButton,
    FechaPipe, PuedeDirective,
  ],
  templateUrl: './turnos.page.html' })
export class TurnosPage {
  private readonly api = inject(ChecadorApi);
  private readonly modales = inject(ModalController);
  private readonly confirmar = inject(ConfirmarService);
  protected readonly permisos = inject(PermisosService);
  protected readonly vista = signal<Vista>('general');
  protected readonly turnos = signal<Turno[]>([]);
  protected readonly empleados = signal<Empleado[]>([]);
  protected readonly festivos = signal<Festivo[]>([]);
  protected readonly error = signal('');
  protected readonly aviso = signal('');
  protected readonly busqueda = signal('');
  protected readonly filtrados = computed(() => {
    const q = this.busqueda().trim().toLowerCase();
    return this.empleados().filter((e) => !q || `${e.nombre} ${e.numero} ${e.departamento}`.toLowerCase().includes(q));
  });
  protected readonly pag = crearPaginacion(() => this.filtrados(), 20);
  protected buscar(v: string) { this.busqueda.set(v); this.pag.reiniciar(); }
  protected readonly hoy = fechaLocal();

  protected readonly excepciones = computed(() => this.empleados().filter((e) => !!e.comidaPactada).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')));
  protected async abrirTurno(turno: Turno | null) {
    const m = await this.modales.create({ component: TurnoSheet, componentProps: { turno }, cssClass: 'ck-modal-form' });
    await m.present();
    const { role, data } = await m.onDidDismiss<{ nombre: string; nuevo: boolean }>();
    if (role !== 'ok' || !data) return;
    this.error.set('');
    this.aviso.set(data.nuevo ? `Turno “${data.nombre}” creado. Asígnalo a sus colaboradores en la pestaña Asignación.` : `Turno “${data.nombre}” actualizado.`);
    await this.cargar();
  }

  protected async eliminarTurno(t: Turno) {
    const otros = this.turnos().filter((x) => x.id !== t.id);
    if (!otros.length) { this.error.set('Debe quedar al menos un turno.'); return; }
    const hay = t.empleados > 0;
    const r = await this.confirmar.pedir({
      peligro: true,
      icono: hay ? 'right-left' : 'trash',
      titulo: hay ? `“${t.nombre}” tiene ${t.empleados} colaborador${t.empleados === 1 ? '' : 'es'}` : '¿Deseas eliminar\neste turno?',
      descripcion: hay
        ? 'Elige el turno al que pasarán. Se les avisará del cambio y quedará registrado de qué turno vienen.'
        : `Se eliminará “${t.nombre}”. Esta acción no se puede deshacer.`,
      textoAceptar: hay ? 'Pasar y eliminar' : 'Eliminar',
      eleccion: hay ? { etiqueta: 'Turno nuevo', opciones: otros.map((x) => ({ valor: x.id, etiqueta: `${x.nombre} (${x.entrada}–${x.salida})` })) } : undefined,
    });
    if (!r) return;
    let movidos = 0;
    const ok = await this.ejecutar(async () => { movidos = (await this.api.eliminarTurno(t.id, r.valor)).movidos; });
    if (ok) this.aviso.set(movidos ? `Turno “${t.nombre}” eliminado; ${movidos} colaborador${movidos === 1 ? '' : 'es'} pasaron al nuevo turno.` : `Turno “${t.nombre}” eliminado.`);
  }

  protected async abrirFestivo(festivo: Festivo | null) {
    const m = await this.modales.create({
      component: FestivoSheet, cssClass: 'ck-modal-form',
      componentProps: { festivo, fechaInicial: !festivo && this.dia() && !this.festivoDelDia() ? this.dia() : '' } });
    await m.present();
    const { role, data } = await m.onDidDismiss<{ fecha: string; nombre: string; nuevo: boolean }>();
    if (role !== 'ok' || !data) return;
    this.error.set('');
    this.aviso.set(`Festivo “${data.nombre}” ${data.nuevo ? 'agregado' : 'actualizado'}.`);
    this.dia.set(data.fecha);
    this.mes.set(data.fecha.slice(0, 7));
    await this.cargar();
  }

  protected async quitarFestivo(f: Festivo) {
    const r = await this.confirmar.pedir({
      peligro: true,
      titulo: '¿Deseas quitar\neste festivo?',
      descripcion: `Se quitará “${f.nombre}” del calendario.`,
      textoAceptar: 'Quitar',
    });
    if (!r) return;
    const ok = await this.ejecutar(async () => { await this.api.eliminarFestivo(f.fecha); });
    if (ok) { this.aviso.set(`Festivo “${f.nombre}” quitado.`); this.dia.set(null); }
  }

  constructor() { this.cargar(); }
  ionViewWillEnter() { this.cargar(); }

  private async cargar() {
    const [t, e, f] = await Promise.all([this.api.turnos(), this.api.empleados(), this.api.festivos()]);
    this.turnos.set(t);
    this.empleados.set(e);
    this.festivos.set(f);
  }

  protected readonly mes = signal(this.hoy.slice(0, 7));
  protected readonly dia = signal<string | null>(null);
  protected readonly marcas = computed(() => this.festivos().map((f) => ({ fecha: f.fecha, titulo: f.nombre })));
  protected readonly festivoDelDia = computed(() => this.festivos().find((f) => f.fecha === this.dia()) ?? null);

  protected mesCorto(f: Festivo) { return new Date(`${f.fecha}T12:00:00`).toLocaleDateString('es-MX', { month: 'short' }).replace('.', ''); }
  protected verFestivo(f: Festivo) { this.dia.set(f.fecha); this.mes.set(f.fecha.slice(0, 7)); }
  protected turnoDe(e: Empleado) { return this.turnos().find((t) => t.id === e.turnoId); }

  protected async ajustar(t: Turno, cambios: CambiosTurno) {
    await this.ejecutar(async () => { await this.api.configurarTurno(t.id, cambios); });
  }

  protected async asignar(e: Empleado, turnoId: string) {
    const nuevo = this.turnos().find((t) => t.id === turnoId);
    if (!nuevo || turnoId === e.turnoId) return;
    const r = await this.confirmar.pedir({
      icono: 'right-left',
      titulo: '¿Deseas cambiar\nel turno?',
      descripcion: `${e.nombre} pasará de ${this.turnoDe(e)?.nombre ?? 'su turno actual'} a ${nuevo.nombre} (${nuevo.entrada}–${nuevo.salida}). Quedará registrado el cambio.`,
      textoAceptar: 'Cambiar turno',
    });
    if (!r) { await this.cargar(); return; }
    const ok = await this.ejecutar(async () => { await this.api.asignarTurno(e.id, turnoId); });
    if (ok) this.aviso.set(`${e.nombre} ahora tiene el turno ${nuevo.nombre}.`);
  }

  protected async abrirComida(empleado: Empleado | null) {
    const m = await this.modales.create({
      component: ComidaSheet, cssClass: 'ck-modal-form',
      componentProps: { empleado, empleados: this.empleados(), turnos: this.turnos() } });
    await m.present();
    const { role, data } = await m.onDidDismiss<{ nombre: string; minutos: number }>();
    if (role !== 'ok' || !data) return;
    this.error.set('');
    this.aviso.set(`Comida de ${data.minutos} min pactada para ${data.nombre}.`);
    await this.cargar();
  }

  protected async quitarExcepcion(e: Empleado) {
    const r = await this.confirmar.pedir({
      peligro: true,
      titulo: '¿Deseas quitar la\ncomida pactada?',
      descripcion: `${e.nombre} volverá a la comida de su turno (${this.turnoDe(e)?.comidaMin ?? '—'} min). Se perderá el fundamento registrado.`,
      textoAceptar: 'Quitar',
    });
    if (!r) return;
    const ok = await this.ejecutar(async () => { await this.api.pactarComida(e.id, null, ''); });
    if (ok) this.aviso.set(`${e.nombre} vuelve a la comida de su turno.`);
  }

  private async ejecutar(fn: () => Promise<void>): Promise<boolean> {
    this.error.set('');
    this.aviso.set('');
    try { await fn(); return true; } catch (x) { this.error.set((x as Error).message); return false; } finally { await this.cargar(); }
  }
}
