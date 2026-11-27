import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonButton } from '@ionic/angular';
import {
  CLR_CONTROL, ChecadorApi, CkPageComponent, ControlCumplimiento, EstadoControl, ETQ_CHECADA, ETQ_CONTROL,
} from '@checador/shared';

@Component({
  selector: 'app-cumplimiento',
  imports: [CkPageComponent, IonButton, RouterLink],
  templateUrl: './cumplimiento.page.html',
})
export class CumplimientoPage {
  private readonly api = inject(ChecadorApi);
  protected readonly controles = signal<ControlCumplimiento[]>([]);
  protected readonly generado = signal('');
  protected readonly etq = ETQ_CONTROL;
  protected readonly clr = CLR_CONTROL;

  protected readonly cuenta = computed(() => ({
    cumple: this.controles().filter((c) => c.estado === 'Cumple').length,
    atencion: this.controles().filter((c) => c.estado === 'Atencion').length,
    pendiente: this.controles().filter((c) => c.estado === 'Pendiente').length,
  }));

  protected readonly porcentaje = computed(() => (this.controles().length ? Math.round((this.cuenta().cumple / this.controles().length) * 100) : 0));

  protected readonly filtro = signal<EstadoControl | 'Todos'>('Todos');
  protected readonly filtros: { valor: EstadoControl | 'Todos'; etiqueta: string }[] = [
    { valor: 'Todos', etiqueta: 'Todos' }, { valor: 'Atencion', etiqueta: 'Requieren atención' }, { valor: 'Pendiente', etiqueta: 'Pendientes' }, { valor: 'Cumple', etiqueta: 'Cumplen' },
  ];
  protected readonly conteo = computed<Record<EstadoControl | 'Todos', number>>(() => ({
    Todos: this.controles().length, Cumple: this.cuenta().cumple, Atencion: this.cuenta().atencion, Pendiente: this.cuenta().pendiente,
  }));

  /** Por área; dentro de cada una, primero lo que necesita acción. */
  protected readonly areas = computed(() => {
    const prioridad: Record<EstadoControl, number> = { Pendiente: 0, Atencion: 1, Cumple: 2 };
    const mapa = new Map<string, ControlCumplimiento[]>();
    for (const c of this.controles().filter((x) => this.filtro() === 'Todos' || x.estado === this.filtro())) mapa.set(c.area, [...(mapa.get(c.area) ?? []), c]);
    return [...mapa.entries()].map(([area, items]) => ({ area, items: items.sort((a, b) => prioridad[a.estado] - prioridad[b.estado]) }));
  });

  constructor() { this.cargar(); }
  ionViewWillEnter() { this.cargar(); }
  private async cargar() { this.controles.set(await this.api.cumplimiento()); }

  protected async exportar() {
    const checadas = await this.api.checadasRecientes();
    const cab = ['Folio', 'Fecha y hora', 'Colaborador', 'Registro', 'Lugar', 'Validacion', 'Origen', 'Sello', 'Sello anterior'];
    const filas = checadas.map((c) => [c.folio, c.horaServidor, c.empleado, ETQ_CHECADA[c.tipo], c.lugar, c.validacion, c.origen, c.sello, c.selloAnterior]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','));
    const blob = new Blob(['﻿' + [cab.join(','), ...filas].join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'expediente-inspeccion.csv';
    a.click();
    URL.revokeObjectURL(a.href);
    await this.api.registrarExportacion(`Descargó ${checadas.length} registros con sellos`);
    this.generado.set(`Se descargaron ${checadas.length} registros con su sello y quedó anotado en la bitácora.`);
  }

  protected imprimir() { window.print(); }
}
