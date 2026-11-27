import { Component, computed, input, signal } from '@angular/core';
import { EstadoDia, ETQ_ESTADO_DIA, JornadaDia } from '@checador/shared';

const ANCHO = 760;
const ALTO = 280;
const M = { izq: 38, der: 10, arriba: 14, abajo: 44 };

interface Barra {
  i: number; x: number; ancho: number; clase: string; y: number; alto: number; yExtra: number; altoExtra: number;
  etiqueta: string; mostrarEtiqueta: boolean; fin: boolean; mes: string; j: JornadaDia;
}

/**
 * Asistencia día por día: cada barra son las horas trabajadas y su color dice cómo fue el día (a tiempo, retardo, falta…).
 * La línea punteada es la jornada esperada; lo que se pasa de ella aparece como horas extra.
 */
@Component({
  selector: 'app-asistencia-chart',
  template: `
    <div class="ck-asis">
      <svg [attr.viewBox]="'0 0 ' + ancho + ' ' + alto" role="img" [attr.aria-label]="resumenAccesible()" (mouseleave)="activo.set(null)">
        @for (t of ticks(); track t.valor) {
          <line [attr.x1]="m.izq" [attr.x2]="ancho - m.der" [attr.y1]="t.y" [attr.y2]="t.y" class="ck-asis__rejilla" />
          <text [attr.x]="m.izq - 8" [attr.y]="t.y + 4" text-anchor="end" class="ck-asis__eje">{{ t.valor }} h</text>
        }
        <line [attr.x1]="m.izq" [attr.x2]="ancho - m.der" [attr.y1]="yMeta()" [attr.y2]="yMeta()" class="ck-asis__meta" />
        <text [attr.x]="ancho - m.der" [attr.y]="yMeta() - 6" text-anchor="end" class="ck-asis__meta-texto">Jornada esperada · {{ meta() }} h</text>

        @for (b of barras(); track b.i) {
          <g class="ck-asis__dia" tabindex="0" [class.is-activo]="activo() === b.i" (mouseenter)="activo.set(b.i)" (focus)="activo.set(b.i)" (blur)="activo.set(null)">
            <rect [attr.x]="b.x - 2" [attr.y]="m.arriba" [attr.width]="b.ancho + 4" [attr.height]="alto - m.arriba - m.abajo" class="ck-asis__zona" />
            <rect [attr.x]="b.x" [attr.y]="b.y" [attr.width]="b.ancho" [attr.height]="b.alto" rx="3" [attr.class]="'ck-asis__barra ck-asis__barra--' + b.clase" />
            @if (b.altoExtra > 0) { <rect [attr.x]="b.x" [attr.y]="b.yExtra" [attr.width]="b.ancho" [attr.height]="b.altoExtra" rx="3" class="ck-asis__extra" /> }
            @if (b.mostrarEtiqueta) { <text [attr.x]="b.x + b.ancho / 2" [attr.y]="alto - M.abajo + 16" text-anchor="middle" class="ck-asis__eje">{{ b.etiqueta }}</text> }
            @if (b.mes) { <text [attr.x]="b.x + b.ancho / 2" [attr.y]="alto - M.abajo + 32" text-anchor="middle" class="ck-asis__mes">{{ b.mes }}</text> }
          </g>
        }
      </svg>

      @if (detalle(); as d) {
        <div class="ck-asis__tip" [style.left.%]="d.izq" role="status">
          <strong>{{ d.fecha }}</strong>
          <span>{{ d.estado }}</span>
          @if (d.marcas) { <span>{{ d.marcas }}</span> }
          @if (d.horas) { <span>{{ d.horas }}</span> }
          @if (d.retardo) { <span>{{ d.retardo }}</span> }
        </div>
      }

      <ul class="ck-asis__leyenda">
        <li><span class="ck-asis__llave ck-asis__llave--Normal"></span>A tiempo</li>
        <li><span class="ck-asis__llave ck-asis__llave--Retardo"></span>Retardo</li>
        <li><span class="ck-asis__llave ck-asis__llave--Falta"></span>Falta</li>
        <li><span class="ck-asis__llave ck-asis__llave--Vacaciones"></span>Vacaciones o incapacidad</li>
        <li><span class="ck-asis__llave ck-asis__llave--Descanso"></span>Descanso o festivo</li>
        <li><span class="ck-asis__llave ck-asis__llave--extra"></span>Horas extra</li>
      </ul>
    </div>
  `,
})
export class AsistenciaChartComponent {
  readonly jornadas = input.required<JornadaDia[]>();
  readonly meta = input(8);

  protected readonly ancho = ANCHO;
  protected readonly alto = ALTO;
  protected readonly m = M;
  protected readonly M = M;
  protected readonly activo = signal<number | null>(null);

  private readonly yMax = computed(() => {
    const mayor = Math.max(this.meta(), ...this.jornadas().map((j) => j.horasOrdinarias + j.extraDobles + j.extraTriples));
    return Math.max(4, Math.ceil((mayor + 0.5) / 2) * 2);
  });
  private readonly y = (h: number) => M.arriba + (1 - h / this.yMax()) * (ALTO - M.arriba - M.abajo);
  protected readonly yMeta = computed(() => this.y(this.meta()));

  protected readonly ticks = computed(() => {
    const paso = this.yMax() > 12 ? 4 : 2;
    return Array.from({ length: Math.floor(this.yMax() / paso) + 1 }, (_, k) => k * paso).map((valor) => ({ valor, y: this.y(valor) }));
  });

  protected readonly barras = computed<Barra[]>(() => {
    const lista = this.jornadas();
    const n = Math.max(lista.length, 1);
    const banda = (ANCHO - M.izq - M.der) / n;
    const ancho = Math.min(banda * 0.62, 26);
    const base = ALTO - M.abajo;
    const paso = n > 20 ? 5 : n > 10 ? 2 : 1;
    let mesAnterior = '';
    return lista.map((j, i) => {
      const fecha = new Date(`${j.fecha}T12:00:00`);
      const mes = fecha.toLocaleDateString('es-MX', { month: 'short' }).replace('.', '');
      const trabajo = j.horasOrdinarias > 0 || j.extraDobles > 0;
      const horas = trabajo ? j.horasOrdinarias : 0;
      const extra = j.extraDobles + j.extraTriples;
      // Los días sin horas llevan una marca baja del color del día, para que no parezcan datos faltantes.
      const marca = !trabajo ? 0.5 : 0;
      const alto = Math.max(base - this.y(horas || marca), trabajo ? 2 : 6);
      const x = M.izq + i * banda + (banda - ancho) / 2;
      const nuevoMes = mes !== mesAnterior;
      mesAnterior = mes;
      const mostrar = i % paso === 0 || i === n - 1;
      return {
        i, x, ancho, clase: this.clase(j.estado), y: base - alto, alto,
        yExtra: this.y(horas + extra), altoExtra: extra > 0 ? this.y(horas) - this.y(horas + extra) : 0,
        etiqueta: String(fecha.getDate()), mostrarEtiqueta: mostrar, fin: i === n - 1, mes: nuevoMes && mostrar ? mes : '', j,
      };
    });
  });

  protected readonly detalle = computed(() => {
    const i = this.activo();
    const b = i == null ? null : this.barras()[i];
    if (!b) return null;
    const j = b.j;
    const hh = (h: number) => `${Math.floor(h)} h ${String(Math.round((h % 1) * 60)).padStart(2, '0')} min`;
    const extra = j.extraDobles + j.extraTriples;
    return {
      izq: Math.min(Math.max(((b.x + b.ancho / 2) / ANCHO) * 100, 14), 86),
      fecha: new Date(`${j.fecha}T12:00:00`).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' }),
      estado: ETQ_ESTADO_DIA[j.estado],
      marcas: j.entrada ? `Entrada ${j.entrada}${j.salida ? ` · salida ${j.salida}` : ' · sin salida registrada'}` : '',
      horas: j.horasOrdinarias > 0 ? `${hh(j.horasOrdinarias)}${extra > 0 ? ` + ${hh(extra)} extra` : ''}` : '',
      retardo: j.minutosRetardo > 0 ? `Llegó ${j.minutosRetardo} min tarde` : '',
    };
  });

  protected readonly resumenAccesible = computed(() => {
    const l = this.jornadas();
    return `Gráfica de ${l.length} días: ${l.filter((j) => j.estado === 'Normal').length} a tiempo, ${l.filter((j) => j.estado === 'Retardo').length} con retardo, ${l.filter((j) => j.estado === 'Falta').length} faltas.`;
  });

  private clase(e: EstadoDia) {
    return e === 'Incapacidad' ? 'Vacaciones' : e === 'Festivo' ? 'Descanso' : e;
  }
}
