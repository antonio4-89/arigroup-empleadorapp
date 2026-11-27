import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { IonSearchbar } from '@ionic/angular';
import { IonBadge, IonButton, ModalController } from '@ionic/angular';
import { CLR_ESTADO_HOY, ChecadorApi, CkPageComponent, ETQ_ESTADO_HOY, ETQ_MODALIDAD, Empleado, EstadoHoy, Modalidad, PuedeDirective, CkPaginadorComponent, crearPaginacion, CkSelectComponent, CkOpcionComponent, CkIconComponent } from '@checador/shared';
import { ImportarEmpleadosSheet } from './importar-empleados.sheet';

@Component({
  selector: 'app-empleados',
  imports: [RouterLink, CkIconComponent, CkSelectComponent, CkOpcionComponent, IonSearchbar, CkPageComponent, CkPaginadorComponent, IonBadge, IonButton, PuedeDirective],
  templateUrl: './empleados.page.html' })
export class EmpleadosPage {
  private readonly api = inject(ChecadorApi);
  private readonly modales = inject(ModalController);
  private readonly router = inject(Router);
  protected readonly equiposPendientes = signal<ReadonlyMap<string, number>>(new Map());
  protected readonly todos = signal<Empleado[]>([]);
  protected readonly busqueda = signal('');
  protected readonly aviso = signal('');
  protected readonly etqModalidad = ETQ_MODALIDAD;
  protected readonly etqEstado = ETQ_ESTADO_HOY;
  protected readonly clrEstado = CLR_ESTADO_HOY;

  protected readonly sede = signal('');
  protected readonly estado = signal('');
  protected readonly modalidad = signal('');
  protected readonly modalidades = Object.entries(ETQ_MODALIDAD) as [Modalidad, string][];
  protected readonly estados = Object.entries(ETQ_ESTADO_HOY) as [EstadoHoy, string][];
  protected readonly sedes = computed(() => [...new Set(this.todos().map((e) => e.sede))].sort());

  protected readonly filtrados = computed(() => {
    const q = this.busqueda().trim().toLowerCase();
    return this.todos().filter((e) =>
      (!this.sede() || e.sede === this.sede()) && (!this.estado() || e.estadoHoy === this.estado()) && (!this.modalidad() || e.modalidad === this.modalidad())
      && (!q || `${e.nombre} ${e.numero} ${e.puesto}`.toLowerCase().includes(q)));
  });
  protected readonly pag = crearPaginacion(() => this.filtrados(), 25);
  protected buscar(v: string) { this.busqueda.set(v); this.pag.reiniciar(); }

  constructor() { this.cargar(); }
  ionViewWillEnter() { this.cargar(); }
  private async cargar() {
    const [empleados, equipos] = await Promise.all([this.api.empleados(), this.api.dispositivos()]);
    this.todos.set(empleados);
    const m = new Map<string, number>();
    for (const d of equipos.filter((x) => x.estado === 'Pendiente')) m.set(d.empleadoId, (m.get(d.empleadoId) ?? 0) + 1);
    this.equiposPendientes.set(m);
  }

  protected abrir(e: Empleado) { void this.router.navigate(['/empleados', e.id]); }

  protected async importar() {
    const m = await this.modales.create({ component: ImportarEmpleadosSheet, cssClass: 'ck-modal-wide' });
    await m.present();
    const { role, data } = await m.onDidDismiss();
    if (role === 'importado') {
      this.aviso.set(`Se importaron ${data} colaborador(es). Cada uno recibió una invitación por correo para activar su cuenta.`);
      await this.cargar();
    }
  }
}
