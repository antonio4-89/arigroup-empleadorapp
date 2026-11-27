import { Component, computed, input } from '@angular/core';

const W = 640;
const H = 220;
const M = { l: 40, r: 40, t: 32, b: 28 };

@Component({
  selector: 'ck-area-chart',
  template: `
    <svg class="ck-chart" [attr.viewBox]="'0 0 ' + W + ' ' + H" role="img" [attr.aria-label]="descripcion()">
      <defs>
        <linearGradient id="ck-area-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="var(--ck-color-primary)" stop-opacity="0.35" />
          <stop offset="100%" stop-color="var(--ck-color-primary)" stop-opacity="0" />
        </linearGradient>
      </defs>
      @for (g of rejilla(); track g.y) {
        <line class="ck-chart__grid" [attr.x1]="m.l" [attr.x2]="W - m.r" [attr.y1]="g.y" [attr.y2]="g.y" />
        <text class="ck-chart__tick" [attr.x]="m.l - 8" [attr.y]="g.y + 4" text-anchor="end">{{ g.texto }}</text>
      }
      <path [attr.d]="area()" fill="url(#ck-area-grad)" />
      <path class="ck-chart__line" [attr.d]="linea()" fill="none" />
      @for (p of puntos(); track p.x) { <circle class="ck-chart__dot" [attr.cx]="p.x" [attr.cy]="p.y" r="3" /> }
      @if (ultimo(); as u) {
        <g>
          <rect class="ck-chart__tip" [attr.x]="u.x - 34" [attr.y]="u.y - 34" width="68" height="24" rx="8" />
          <text class="ck-chart__tiptext" [attr.x]="u.x" [attr.y]="u.y - 18" text-anchor="middle">{{ u.texto }}</text>
        </g>
      }
      <text class="ck-chart__tick" [attr.x]="m.l" [attr.y]="H - 6">{{ etiquetas()[0] }}</text>
      <text class="ck-chart__tick" [attr.x]="W - m.r" [attr.y]="H - 6" text-anchor="end">{{ etiquetas()[etiquetas().length - 1] }}</text>
    </svg>
  `,
})
export class CkAreaChartComponent {
  readonly valores = input.required<number[]>();
  readonly etiquetas = input<string[]>([]);
  readonly sufijo = input('%');
  readonly descripcion = input('Gráfica');
  protected readonly W = W;
  protected readonly H = H;
  protected readonly m = M;

  private readonly rango = computed(() => {
    const v = this.valores();
    return { min: 0, max: Math.max(100, ...v) };
  });

  protected readonly puntos = computed(() => {
    const v = this.valores();
    const { min, max } = this.rango();
    const paso = v.length > 1 ? (W - M.l - M.r) / (v.length - 1) : 0;
    return v.map((val, i) => ({ x: M.l + i * paso, y: M.t + (1 - (val - min) / (max - min)) * (H - M.t - M.b), val }));
  });

  protected readonly linea = computed(() => this.puntos().map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' '));
  protected readonly area = computed(() => {
    const p = this.puntos();
    return p.length ? `${this.linea()} L${p[p.length - 1].x},${H - M.b} L${p[0].x},${H - M.b} Z` : '';
  });
  protected readonly ultimo = computed(() => {
    const p = this.puntos();
    const u = p[p.length - 1];
    return u ? { x: u.x, y: u.y, texto: `${u.val}${this.sufijo()}` } : null;
  });
  protected readonly rejilla = computed(() => {
    const { min, max } = this.rango();
    return [0, 0.25, 0.5, 0.75, 1].map((f) => ({ y: M.t + (1 - f) * (H - M.t - M.b), texto: `${Math.round(min + f * (max - min))}${this.sufijo()}` }));
  });
}
