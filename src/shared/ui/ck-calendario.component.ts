import { Component, computed, input, model, signal } from '@angular/core';
import { CkIconComponent } from './ck-icon.component';

export interface MarcaCalendario { fecha: string; titulo: string }

interface Celda { iso: string; dia: number; otroMes: boolean; finde: boolean; bloqueado: boolean; marca?: MarcaCalendario; etiqueta: string }

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const DIAS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

const dos = (n: number) => String(n).padStart(2, '0');
const aIso = (d: Date) => `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`;

/**
 * Calendario mensual (semana de lunes a domingo) con días marcados.
 * `mes` ("AAAA-MM") y `seleccion` ("AAAA-MM-DD") se pueden enlazar con [(mes)] y [(seleccion)].
 * Estilos en `shared/styles/_calendario.scss`.
 */
@Component({
  selector: 'ck-calendario',
  imports: [CkIconComponent],
  template: `
    <div class="ck-cal">
      <div class="ck-cal__head">
        <h3 class="ck-cal__titulo" aria-live="polite">
          <button type="button" class="ck-cal__titulo-btn" [attr.aria-expanded]="verMeses()" (click)="verMeses.set(!verMeses())">
            {{ verMeses() ? anio() : mesTexto() }} @if (!verMeses()) { <span>{{ anio() }}</span> }
            <ck-icon class="ck-cal__caret" [class.is-abierto]="verMeses()" name="chevron-down" />
          </button>
        </h3>
        <button type="button" class="ck-cal__hoy" (click)="irHoy()">Hoy</button>
        <button type="button" class="ck-cal__flecha" [attr.aria-label]="verMeses() ? 'Año anterior' : 'Mes anterior'" (click)="mover(-1)"><ck-icon name="chevron-left" /></button>
        <button type="button" class="ck-cal__flecha" [attr.aria-label]="verMeses() ? 'Año siguiente' : 'Mes siguiente'" (click)="mover(1)"><ck-icon name="chevron-right" /></button>
      </div>
      @if (verMeses()) {
        <div class="ck-cal__meses">
          @for (m of meses; track m; let i = $index) {
            <button type="button" class="ck-cal__mes" [class.is-sel]="i === mesActual()" (click)="irMes(i)">{{ m.slice(0, 3) }}</button>
          }
        </div>
      } @else {
        <div class="ck-cal__semana" aria-hidden="true">
          @for (d of dias; track $index) { <span>{{ d }}</span> }
        </div>
        <div class="ck-cal__grid">
          @for (c of celdas(); track c.iso) {
            @if (c.otroMes) {
              <span class="ck-cal__vacio" aria-hidden="true"></span>
            } @else {
              <button type="button" class="ck-cal__dia" [disabled]="c.bloqueado" [class.is-finde]="c.finde" [class.is-marca]="!!c.marca" [class.is-hoy]="c.iso === hoy"
                [class.is-sel]="c.iso === seleccion()" [attr.title]="c.marca?.titulo ?? null" [attr.aria-label]="c.etiqueta"
                [attr.aria-pressed]="c.iso === seleccion()" (click)="elegir(c)"><span>{{ c.dia }}</span></button>
            }
          }
        </div>
      }
      @if (resumen() && !verMeses()) {
        <p class="ck-cal__resumen">
          <i class="ck-cal__punto"></i>
          @if (marcasDelMes() === 0) { Sin {{ leyendaPlural() }} este mes }
          @else { {{ marcasDelMes() }} {{ marcasDelMes() === 1 ? leyenda() : leyendaPlural() }} este mes }
        </p>
      }
    </div>
  `,
})
export class CkCalendarioComponent {
  readonly marcas = input<MarcaCalendario[]>([]);
  /** Cómo se llama un día marcado, en singular y plural (para el resumen del mes). */
  readonly leyenda = input('día marcado');
  readonly leyendaPlural = input('días marcados');
  readonly min = input('');
  readonly max = input('');
  readonly resumen = input(true);
  readonly mes = model(aIso(new Date()).slice(0, 7));
  readonly seleccion = model<string | null>(null);

  protected readonly dias = DIAS;
  protected readonly meses = MESES;
  protected readonly verMeses = signal(false);
  protected readonly hoy = aIso(new Date());

  protected readonly mesTexto = computed(() => MESES[Number(this.mes().split('-')[1]) - 1]);
  protected readonly mesActual = computed(() => Number(this.mes().split('-')[1]) - 1);
  protected readonly anio = computed(() => this.mes().split('-')[0]);
  protected readonly marcasDelMes = computed(() => this.marcas().filter((m) => m.fecha.startsWith(this.mes())).length);

  protected readonly celdas = computed<Celda[]>(() => {
    const [a, m] = this.mes().split('-').map(Number);
    const marcas = new Map(this.marcas().map((x) => [x.fecha, x]));
    const inicio = (new Date(a, m - 1, 1).getDay() + 6) % 7;
    const total = Math.ceil((inicio + new Date(a, m, 0).getDate()) / 7) * 7;
    return Array.from({ length: total }, (_, i) => {
      const d = new Date(a, m - 1, 1 - inicio + i);
      const iso = aIso(d);
      const marca = marcas.get(iso);
      const largo = d.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
      return { iso, dia: d.getDate(), otroMes: d.getMonth() !== m - 1, finde: d.getDay() === 0 || d.getDay() === 6, bloqueado: (!!this.min() && iso < this.min()) || (!!this.max() && iso > this.max()), marca, etiqueta: marca ? `${largo}: ${marca.titulo}` : largo };
    });
  });

  protected mover(delta: number) {
    const [a, m] = this.mes().split('-').map(Number);
    const d = new Date(a, m - 1 + (this.verMeses() ? delta * 12 : delta), 1);
    this.mes.set(aIso(d).slice(0, 7));
  }

  protected irMes(i: number) {
    this.mes.set(`${this.anio()}-${dos(i + 1)}`);
    this.verMeses.set(false);
  }

  protected irHoy() {
    this.verMeses.set(false);
    this.mes.set(this.hoy.slice(0, 7));
    const bloqueado = (!!this.min() && this.hoy < this.min()) || (!!this.max() && this.hoy > this.max());
    if (!bloqueado) this.seleccion.set(this.hoy);
  }

  protected elegir(c: Celda) {
    if (c.bloqueado) return;
    this.seleccion.set(c.iso);
    if (c.otroMes) this.mes.set(c.iso.slice(0, 7));
  }
}
