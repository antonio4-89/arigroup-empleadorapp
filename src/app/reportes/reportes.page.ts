import { Component, computed, inject, signal } from '@angular/core';
import { IonSearchbar } from '@ionic/angular';
import { IonButton } from '@ionic/angular';
import {
  AcuseEmpleado, ChecadorApi, CkPageComponent, CkPaginadorComponent, CkStatComponent, FechaPipe, FilaReporte, crearPaginacion,
} from '@checador/shared';

type Vista = 'semana' | 'limites' | 'constancias';

@Component({
  selector: 'app-reportes',
  imports: [IonSearchbar, CkPageComponent, CkPaginadorComponent, CkStatComponent, IonButton, FechaPipe],
  templateUrl: './reportes.page.html',
})
export class ReportesPage {
  private readonly api = inject(ChecadorApi);
  protected readonly filas = signal<FilaReporte[]>([]);
  protected readonly acuses = signal<AcuseEmpleado[]>([]);
  protected readonly vista = signal<Vista>('semana');
  protected readonly busqueda = signal('');
  protected readonly soloAlertas = signal(false);
  protected readonly soloPendientes = signal(true);
  protected readonly limiteSemana = 9;
  protected readonly limiteDias = 3;
  protected readonly vistas: { id: Vista; texto: string }[] = [
    { id: 'semana', texto: 'Semana' }, { id: 'limites', texto: 'Límites de horas extra' }, { id: 'constancias', texto: 'Constancias' },
  ];

  protected readonly totales = computed(() => {
    const f = this.filas();
    const s = (k: keyof FilaReporte) => f.reduce((a, x) => a + (x[k] as number), 0);
    return { extra: s('extraDobles') + s('extraTriples'), sinAutorizar: s('extraSinAutorizar'), retardos: s('retardos'), faltas: s('faltas'), alertas: s('alertas') };
  });

  protected readonly filtradas = computed(() => {
    const q = this.busqueda().trim().toLowerCase();
    return this.filas().filter((f) => (!this.soloAlertas() || f.alertas > 0 || f.faltas > 0 || f.retardos > 0) && (!q || f.empleado.toLowerCase().includes(q)));
  });
  protected readonly pag = crearPaginacion(() => this.filtradas(), 25);

  protected readonly cercanos = computed(() =>
    this.filas().filter((f) => f.extraDobles + f.extraTriples > 0).sort((a, b) => (b.extraDobles + b.extraTriples) - (a.extraDobles + a.extraTriples)));
  protected readonly pagLimites = crearPaginacion(() => this.cercanos(), 15);

  protected readonly acusesFiltrados = computed(() => this.acuses().filter((a) => !this.soloPendientes() || a.estado !== 'Firmada'));
  protected readonly pagAcuses = crearPaginacion(() => this.acusesFiltrados(), 20);
  protected readonly firmadas = computed(() => this.acuses().filter((a) => a.estado === 'Firmada').length);

  constructor() {
    this.api.reporteSemana().then((f) => this.filas.set(f));
    this.api.acuses().then((a) => this.acuses.set(a));
  }

  protected buscar(v: string) { this.busqueda.set(v); this.pag.reiniciar(); }
  protected alternarAlertas() { this.soloAlertas.update((v) => !v); this.pag.reiniciar(); }
  protected alternarPendientes() { this.soloPendientes.update((v) => !v); this.pagAcuses.reiniciar(); }
  protected cerca(f: FilaReporte) { return f.extraDobles + f.extraTriples >= this.limiteSemana * 0.66 || f.diasConExtra >= this.limiteDias; }
  protected pct(f: FilaReporte) { return Math.min(100, Math.round(((f.extraDobles + f.extraTriples) / this.limiteSemana) * 100)); }

  protected exportarCsv() {
    const cab = ['Colaborador', 'Dias', 'Horas ordinarias', 'Horas extra', 'Extra sin autorizar', 'Retardos', 'Faltas', 'Alertas'];
    const lineas = this.filas().map((f) => [f.empleado, f.diasTrabajados, f.horasOrdinarias, f.extraDobles + f.extraTriples, f.extraSinAutorizar, f.retardos, f.faltas, f.alertas].join(','));
    const blob = new Blob(['﻿' + [cab.join(','), ...lineas].join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'reporte-semanal.csv';
    a.click();
    URL.revokeObjectURL(a.href);
    this.api.registrarExportacion('Descargó el reporte semanal en CSV');
  }
}
