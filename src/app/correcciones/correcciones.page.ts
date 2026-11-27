import { Component, computed, inject, signal } from '@angular/core';
import { IonSearchbar } from '@ionic/angular';
import { IonBadge, IonButton } from '@ionic/angular';
import { ConfirmarService,
  CLR_ESTADO_SOLICITUD, ChecadorApi, CkPageComponent, CkPaginadorComponent, Correccion, ETQ_CHECADA, ETQ_ESTADO_SOLICITUD, FechaPipe, JornadaAbierta,
  PuedeDirective, crearPaginacion,
} from '@checador/shared';
import { MotivoService } from '../comun/motivo.service';

type Filtro = 'pendientes' | 'todas';

@Component({
  selector: 'app-correcciones',
  imports: [IonSearchbar, CkPageComponent, CkPaginadorComponent, IonBadge, IonButton, FechaPipe, PuedeDirective],
  templateUrl: './correcciones.page.html',
})
export class CorreccionesPage {
  private readonly api = inject(ChecadorApi);
  private readonly confirmar = inject(ConfirmarService);
  private readonly motivo = inject(MotivoService);
  protected readonly todas = signal<Correccion[]>([]);
  protected readonly abiertas = signal<JornadaAbierta[]>([]);
  protected readonly filtro = signal<Filtro>('pendientes');
  protected readonly busqueda = signal('');
  protected readonly etqChecada = ETQ_CHECADA;
  protected readonly etqEstado = ETQ_ESTADO_SOLICITUD;
  protected readonly clrEstado = CLR_ESTADO_SOLICITUD;

  protected readonly filtradas = computed(() => {
    const q = this.busqueda().trim().toLowerCase();
    return this.todas().filter((c) => (this.filtro() === 'todas' || c.estado === 'Pendiente') && (!q || c.empleado.toLowerCase().includes(q)));
  });
  protected readonly pag = crearPaginacion(() => this.filtradas(), 15);
  protected readonly pagAbiertas = crearPaginacion(() => this.abiertas(), 8);
  protected readonly pendientes = computed(() => this.todas().filter((c) => c.estado === 'Pendiente').length);

  constructor() {
    this.cargar();
  }
  ionViewWillEnter() { this.cargar(); }

  protected cambiar(f: Filtro) { this.filtro.set(f); this.pag.reiniciar(); }
  protected buscar(v: string) { this.busqueda.set(v); this.pag.reiniciar(); }

  private async cargar() {
    const [c, a] = await Promise.all([this.api.correcciones(), this.api.jornadasPorCerrar()]);
    this.todas.set(c);
    this.abiertas.set(a);
  }

  protected async aprobar(c: Correccion) {
    const r = await this.confirmar.pedir({
      icono: 'checkmark-circle', titulo: '¿Deseas autorizar\nesta corrección?',
      descripcion: `${this.etqChecada[c.tipo]} de ${c.empleado}. Se actualizará su registro y quedará registrada tu decisión.`, textoAceptar: 'Autorizar' });
    if (!r) return;
    await this.api.resolverCorreccion(c.id, true, 'Autorizada');
    await this.cargar();
  }

  protected async rechazar(c: Correccion) {
    const r = await this.motivo.pedir({
      titulo: 'Rechazar corrección', subtitulo: `${c.empleado} · ${this.etqChecada[c.tipo]}`, detalle: [c.motivo],
      sugerencias: ['Sin evidencia', 'La hora no coincide', 'Fuera de plazo'], obligatorio: true, textoPrincipal: 'Rechazar', colorPrincipal: 'danger', etiqueta: 'Motivo',
    });
    if (!r) return;
    await this.api.resolverCorreccion(c.id, false, r.texto);
    await this.cargar();
  }

  protected async pedir(j: JornadaAbierta) {
    await this.api.pedirCierre(j.id);
    await this.cargar();
  }
}
