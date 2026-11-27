import { Component, computed, inject, signal } from '@angular/core';
import { IonSearchbar } from '@ionic/angular';
import { IonBadge, IonButton } from '@ionic/angular';
import {
  CLR_ESTADO_INCIDENCIA, ChecadorApi, CkIconComponent, CkPageComponent, CkPaginadorComponent, ETQ_ESTADO_INCIDENCIA, ETQ_INCIDENCIA, FechaPipe, HoraPipe,
  ICO_INCIDENCIA, Incidencia, PuedeDirective, crearPaginacion,
} from '@checador/shared';
import { MotivoService } from '../comun/motivo.service';

type Filtro = 'abiertas' | 'todas';

@Component({
  selector: 'app-incidencias',
  imports: [IonSearchbar, CkPageComponent, CkIconComponent, CkPaginadorComponent, IonBadge, IonButton, FechaPipe, HoraPipe, PuedeDirective],
  templateUrl: './incidencias.page.html',
})
export class IncidenciasPage {
  private readonly api = inject(ChecadorApi);
  private readonly motivo = inject(MotivoService);
  protected readonly lista = signal<Incidencia[]>([]);
  protected readonly filtro = signal<Filtro>('abiertas');
  protected readonly busqueda = signal('');
  protected readonly etq = ETQ_INCIDENCIA;
  protected readonly ico = ICO_INCIDENCIA;
  protected readonly etqEstado = ETQ_ESTADO_INCIDENCIA;
  protected readonly clrEstado = CLR_ESTADO_INCIDENCIA;

  protected readonly filtradas = computed(() => {
    const q = this.busqueda().trim().toLowerCase();
    return this.lista().filter((i) =>
      (this.filtro() === 'todas' || i.estado !== 'Atendida') && (!q || `${i.empleado} ${i.descripcion} ${i.lugar}`.toLowerCase().includes(q)));
  });
  protected readonly pag = crearPaginacion(() => this.filtradas(), 12);
  protected readonly abiertas = computed(() => this.lista().filter((i) => i.estado !== 'Atendida').length);

  constructor() {
    this.cargar();
  }
  ionViewWillEnter() { this.cargar(); }
  private async cargar() { this.lista.set(await this.api.incidencias()); }

  protected cambiar(f: Filtro) { this.filtro.set(f); this.pag.reiniciar(); }
  protected buscar(v: string) { this.busqueda.set(v); this.pag.reiniciar(); }
  protected urgente(i: Incidencia) { return i.requiereAyuda && i.estado !== 'Atendida'; }

  protected async responder(i: Incidencia) {
    const r = await this.motivo.pedir({
      titulo: 'Responder incidencia',
      subtitulo: `${i.empleado} · ${this.etq[i.tipo]}`,
      detalle: [i.descripcion, `${i.lugar} · ${new Date(i.creada).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })}`],
      etiqueta: 'Respuesta para el colaborador',
      sugerencias: i.requiereAyuda ? ['Voy en camino', 'Llamo ahora mismo', 'Se envió apoyo'] : ['Enterado', 'Se justificó el retardo', 'Resuelto, gracias'],
      obligatorio: true,
      textoPrincipal: 'Responder y cerrar',
      textoSecundario: i.estado === 'EnAtencion' ? undefined : 'Tomar caso',
    });
    if (!r) return;
    await this.api.atenderIncidencia(i.id, r.texto || 'En atención', r.accion === 'principal');
    await this.cargar();
  }
}
