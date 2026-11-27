import { AfterViewInit, Component, ElementRef, OnDestroy, computed, effect, input, output, signal, viewChild } from '@angular/core';
import * as L from 'leaflet';
import { ETQ_CHECADA, ETQ_LUGAR, EstadoUbicacion, LugarPermitido, UbicacionColaborador } from '@checador/shared';

type Filtro = EstadoUbicacion | 'Todos';

const ETQ_ESTADO: Record<EstadoUbicacion, string> = {
  EnSuLugar: 'En su lugar', FueraDeLugar: 'Fuera de su lugar', SinUbicacion: 'Sin ubicación', Salio: 'Ya salió', SinChecada: 'Sin checar hoy',
};
const FILTROS: Filtro[] = ['Todos', 'EnSuLugar', 'FueraDeLugar', 'SinUbicacion', 'Salio', 'SinChecada'];
const CENTRO_MEXICO: L.LatLngExpression = [23.6345, -102.5528];

const escapar = (t: string) => t.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const hora = (iso: string) => new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
const distancia = (m: number) => (m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`);

@Component({
  selector: 'app-mapa-lugares',
  template: `
    <div class="ck-geo">
      <section class="ck-geo__mapa-col" aria-label="Mapa de lugares y colaboradores">
        <div class="ck-chips" role="group" aria-label="Filtrar por estado">
          @for (f of filtros; track f) {
            <button type="button" class="ck-chip" [attr.aria-pressed]="filtro() === f" (click)="filtro.set(f)">
              {{ f === 'Todos' ? 'Todos' : etqEstado[f] }} <strong>{{ conteo()[f] }}</strong>
            </button>
          }
        </div>
        <div #mapa class="ck-geo__mapa" role="application" aria-label="Mapa interactivo"></div>
        <ul class="ck-geo__leyenda">
          <li><span class="ck-geo__zona"></span>Lugar aprobado y su radio permitido</li>
          <li><span class="ck-geo__punto ck-geo__punto--EnSuLugar"></span>En su lugar</li>
          <li><span class="ck-geo__punto ck-geo__punto--FueraDeLugar"></span>Fuera de su lugar</li>
          <li><span class="ck-geo__punto ck-geo__punto--SinUbicacion"></span>Sin ubicación</li>
          <li><span class="ck-geo__punto ck-geo__punto--Salio"></span>Ya salió</li>
        </ul>
        @if (sinCoordenadas().length) {
          <p class="ck-text-sm ck-text-muted">Sin coordenadas, no se dibujan: {{ sinCoordenadas().join(' · ') }}.</p>
        }
      </section>

      <aside class="ck-geo__lista" aria-label="Colaboradores">
        <div class="ck-geo__cabecera">
          <strong>{{ visibles().length }} colaborador{{ visibles().length === 1 ? '' : 'es' }}</strong>
          <span class="ck-text-sm ck-text-muted">
            @if (actualizado()) { Actualizado {{ actualizado() }} · }
            <button type="button" class="ck-link" (click)="actualizar.emit()">Actualizar</button>
          </span>
        </div>
        <input class="ck-geo__buscar" type="search" placeholder="Buscar colaborador" aria-label="Buscar colaborador" [value]="busqueda()" (input)="busqueda.set($any($event.target).value)" />
        <ul class="ck-geo__personas">
          @for (u of visibles(); track u.empleadoId) {
            <li>
              <button type="button" class="ck-geo__persona" [class.is-sel]="u.empleadoId === seleccionId()" (click)="seleccionar(u)">
                <span class="ck-geo__punto" [class]="'ck-geo__punto ck-geo__punto--' + u.estado"></span>
                <span class="ck-grow">
                  <strong>{{ u.nombre }}</strong>
                  <small>{{ u.departamento }} · {{ etqEstado[u.estado] }}</small>
                  <small>{{ detalle(u) }}</small>
                </span>
              </button>
            </li>
          } @empty {
            <li class="ck-text-muted ck-text-sm">No hay colaboradores con ese estado.</li>
          }
        </ul>
        <p class="ck-text-sm ck-text-muted">Se muestra la ubicación de la última checada de hoy, no un seguimiento continuo.</p>
      </aside>
    </div>
  `,
})
export class MapaLugaresComponent implements AfterViewInit, OnDestroy {
  readonly lugares = input.required<LugarPermitido[]>();
  readonly ubicaciones = input.required<UbicacionColaborador[]>();
  readonly actualizado = input('');
  readonly actualizar = output<void>();

  protected readonly filtros = FILTROS;
  protected readonly etqEstado = ETQ_ESTADO;
  protected readonly filtro = signal<Filtro>('Todos');
  protected readonly busqueda = signal('');
  private readonly contenedor = viewChild.required<ElementRef<HTMLElement>>('mapa');

  protected readonly conteo = computed(() => {
    const c: Record<Filtro, number> = { Todos: this.ubicaciones().length, EnSuLugar: 0, FueraDeLugar: 0, SinUbicacion: 0, Salio: 0, SinChecada: 0 };
    for (const u of this.ubicaciones()) c[u.estado]++;
    return c;
  });

  protected readonly visibles = computed(() => {
    const q = this.busqueda().trim().toLowerCase();
    const orden: Record<EstadoUbicacion, number> = { FueraDeLugar: 0, SinUbicacion: 1, EnSuLugar: 2, Salio: 3, SinChecada: 4 };
    return this.ubicaciones()
      .filter((u) => (this.filtro() === 'Todos' || u.estado === this.filtro()) && (!q || `${u.nombre} ${u.numero} ${u.departamento}`.toLowerCase().includes(q)))
      .sort((a, b) => orden[a.estado] - orden[b.estado] || a.nombre.localeCompare(b.nombre, 'es'));
  });

  protected readonly sinCoordenadas = computed(() => this.lugares().filter((l) => l.latitud == null || l.longitud == null).map((l) => l.nombre));

  protected readonly seleccionId = signal<string | null>(null);
  protected readonly seleccionado = computed(() => this.ubicaciones().find((u) => u.empleadoId === this.seleccionId()) ?? null);

  private mapa?: L.Map;
  private readonly zonas = L.featureGroup();
  private readonly pinesLugar = L.featureGroup();
  private readonly personas = L.featureGroup();
  private readonly seleccion = L.layerGroup();
  private readonly marcadores = new Map<string, L.Marker>();
  private readonly marcadoresLugar = new Map<string, L.Marker>();
  private colores?: Record<EstadoUbicacion, string>;
  private ajustado = false;

  constructor() {
    effect(() => {
      const lugares = this.lugares();
      const visibles = this.visibles();
      if (this.mapa) this.dibujar(lugares, visibles);
    });
    effect(() => {
      const u = this.seleccionado();
      this.ubicaciones();
      if (this.mapa) this.marcarSeleccion(u);
    });
  }

  ngAfterViewInit() {
    this.mapa = L.map(this.contenedor().nativeElement, { center: CENTRO_MEXICO, zoom: 5, zoomControl: true, attributionControl: true });
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
    }).addTo(this.mapa);
    this.zonas.addTo(this.mapa);
    this.seleccion.addTo(this.mapa);
    this.pinesLugar.addTo(this.mapa);
    this.personas.addTo(this.mapa);
    this.dibujar(this.lugares(), this.visibles());
    setTimeout(() => this.mapa?.invalidateSize());
  }

  ngOnDestroy() { this.mapa?.remove(); }

  private color(variable: string, respaldo: string) {
    return getComputedStyle(document.documentElement).getPropertyValue(variable).trim() || respaldo;
  }

  private dibujar(lugares: LugarPermitido[], visibles: UbicacionColaborador[]) {
    const verde = this.color('--ck-color-success', '#1a7f5a');
    const rojo = this.color('--ck-color-danger', '#c0392b');
    const ambar = this.color('--ck-color-warning', '#b7791f');
    const primario = this.color('--ck-color-primary', '#5b3fd0');
    const gris = this.color('--ck-color-text-muted', '#6b6b80');
    const colores: Record<EstadoUbicacion, string> = { EnSuLugar: verde, FueraDeLugar: rojo, SinUbicacion: ambar, Salio: gris, SinChecada: gris };

    this.colores = colores;
    const clavePrimaria = primario;

    this.zonas.clearLayers();
    this.pinesLugar.clearLayers();
    this.marcadoresLugar.clear();
    for (const l of lugares) {
      if (l.latitud == null || l.longitud == null) continue;
      L.circle([l.latitud, l.longitud], { radius: l.radioMetros ?? 100, color: primario, weight: 2, fillColor: primario, fillOpacity: 0.12, interactive: false }).addTo(this.zonas);
      const pinLugar = L.marker([l.latitud, l.longitud], { icon: this.pin(clavePrimaria, 'lugar'), zIndexOffset: 200, title: l.nombre })
        .bindPopup(`<strong>${escapar(l.nombre)}</strong><br>${escapar(ETQ_LUGAR[l.tipo])} · radio ${l.radioMetros ?? 100} m<br>${escapar(l.direccion)}<br>${l.empleadosAsignados} colaborador(es) asignados`)
        .bindTooltip(escapar(l.nombre), { direction: 'top', offset: [0, -38] })
        .addTo(this.pinesLugar);
      this.marcadoresLugar.set(l.nombre, pinLugar);
    }

    this.personas.clearLayers();
    this.marcadores.clear();
    for (const u of visibles) {
      if (u.latitud == null || u.longitud == null) continue;
      const m = L.marker([u.latitud, u.longitud], { icon: this.pin(colores[u.estado], 'persona'), title: u.nombre })
        .bindPopup(this.popup(u))
        .bindTooltip(escapar(u.nombre), { direction: 'top', offset: [0, -32] })
        .on('click', () => this.seleccionar(u))
        .addTo(this.personas);
      this.marcadores.set(u.empleadoId, m);
    }
    this.marcarSeleccion(this.seleccionado());

    if (!this.ajustado) {
      const todo = L.featureGroup([this.zonas, this.personas]);
      if (todo.getLayers().length) { this.mapa!.fitBounds(todo.getBounds().pad(0.15), { maxZoom: 16 }); this.ajustado = true; }
    }
  }

  private popup(u: UbicacionColaborador) {
    const filas = [
      `<strong>${escapar(u.nombre)}</strong>`,
      `${escapar(u.departamento)} · No. ${escapar(u.numero)}`,
      `<strong>${ETQ_ESTADO[u.estado]}</strong>`,
    ];
    if (u.tipo && u.hora) filas.push(`${escapar(ETQ_CHECADA[u.tipo])} a las ${hora(u.hora)}`);
    if (u.lugarDetectado) filas.push(`Lugar detectado: ${escapar(u.lugarDetectado)}`);
    if (u.lugaresAsignados.length) filas.push(`Asignado a: ${escapar(u.lugaresAsignados.join(', '))}`);
    if (u.distanciaMetros != null) filas.push(`A ${distancia(u.distanciaMetros)} de su lugar más cercano`);
    if (u.precisionMetros != null) filas.push(`Precisión del GPS: ${u.precisionMetros} m`);
    return filas.join('<br>');
  }

  protected detalle(u: UbicacionColaborador) {
    const debeEstar = u.lugaresAsignados.length ? `Debería estar en ${u.lugaresAsignados.join(', ')}` : 'Sin lugar de trabajo asignado';
    if (u.estado === 'SinChecada') return debeEstar;
    if (u.latitud == null) return `${u.tipo && u.hora ? `${ETQ_CHECADA[u.tipo]} ${hora(u.hora)} · ` : ''}${debeEstar}`;
    const base = u.tipo && u.hora ? `${ETQ_CHECADA[u.tipo]} ${hora(u.hora)}` : '';
    if (u.estado === 'FueraDeLugar') return `${base}${u.distanciaMetros != null ? ` · a ${distancia(u.distanciaMetros)} de su lugar` : ''}`;
    return `${base}${u.lugarDetectado ? ` · ${u.lugarDetectado}` : ''}`;
  }

  /** Pin en forma de gota: se ve igual a cualquier zoom, a diferencia del círculo del radio, que cambia con la escala. */
  private pin(color: string, clase: 'lugar' | 'persona', grande = false) {
    const [w, h] = clase === 'lugar' ? [36, 48] : grande ? [38, 50] : [28, 38];
    const centro = clase === 'lugar' ? '<rect x="11" y="11" width="8" height="8" rx="1.5" fill="#fff"/>' : '<circle cx="15" cy="15" r="5.5" fill="#fff"/>';
    const html = `<svg viewBox="0 0 30 40" width="${w}" height="${h}" aria-hidden="true"><path d="M15 1C7 1 1 7.2 1 15c0 10.5 14 24 14 24s14-13.5 14-24C29 7.2 23 1 15 1z" fill="${color}" stroke="#fff" stroke-width="2"/>${centro}</svg>`;
    return L.divIcon({ className: `ck-pin ck-pin--${clase}${grande ? ' ck-pin--sel' : ''}`, html, iconSize: [w, h], iconAnchor: [w / 2, h], popupAnchor: [0, -h + 4], tooltipAnchor: [0, -h + 6] });
  }

  protected seleccionar(u: UbicacionColaborador | null) {
    // Volver a tocar al seleccionado lo suelta; la lista no se mueve ni se reordena al elegir.
    const quitar = !u || u.empleadoId === this.seleccionId();
    this.seleccionId.set(quitar ? null : u!.empleadoId);
    if (!quitar) this.acercar(u!);
  }

  private anterior?: string;

  private marcarSeleccion(u: UbicacionColaborador | null) {
    this.seleccion.clearLayers();
    if (this.anterior && this.anterior !== u?.empleadoId) {
      const previo = this.ubicaciones().find((x) => x.empleadoId === this.anterior);
      const m = this.marcadores.get(this.anterior);
      if (previo && m && this.colores) { m.setIcon(this.pin(this.colores[previo.estado], 'persona')); m.setZIndexOffset(0); }
    }
    this.anterior = u?.empleadoId;
    if (!u || !this.colores) return;

    if (u.latitud == null || u.longitud == null) {
      // Sin ubicación de hoy: se señala dónde debería estar, es decir, sus lugares asignados.
      for (const l of this.lugaresDe(u)) {
        L.marker([l.latitud!, l.longitud!], {
          interactive: false, keyboard: false, zIndexOffset: -10,
          icon: L.divIcon({ className: 'ck-pulso', html: `<span style="--c:${this.colores['EnSuLugar']}"></span>`, iconSize: [64, 64], iconAnchor: [32, 32] }),
        }).addTo(this.seleccion);
      }
      return;
    }

    const color = this.colores[u.estado];
    const pos: L.LatLngExpression = [u.latitud, u.longitud];
    const m = this.marcadores.get(u.empleadoId);
    if (m) { m.setIcon(this.pin(color, 'persona', true)); m.setZIndexOffset(1000); }
    L.marker(pos, {
      interactive: false, keyboard: false, zIndexOffset: -10,
      icon: L.divIcon({ className: 'ck-pulso', html: `<span style="--c:${color}"></span>`, iconSize: [56, 56], iconAnchor: [28, 28] }),
    }).addTo(this.seleccion);

    const lugar = this.lugarCercano(u);
    if (lugar && u.estado === 'FueraDeLugar') {
      L.polyline([pos, [lugar.latitud!, lugar.longitud!]], { color, weight: 3, dashArray: '2 8', lineCap: 'round', interactive: false }).addTo(this.seleccion);
    }
  }

  private lugaresDe(u: UbicacionColaborador) {
    return this.lugares().filter((l) => l.latitud != null && l.longitud != null && u.lugaresAsignados.includes(l.nombre));
  }

  private lugarCercano(u: UbicacionColaborador) {
    if (u.latitud == null || u.longitud == null) return null;
    const mios = this.lugaresDe(u);
    if (!mios.length) return null;
    const d = (l: LugarPermitido) => Math.hypot(l.latitud! - u.latitud!, l.longitud! - u.longitud!);
    return mios.reduce((a, b) => (d(b) < d(a) ? b : a));
  }

  private acercar(u: UbicacionColaborador) {
    if (!this.mapa) return;
    const m = this.marcadores.get(u.empleadoId);
    if (!m) {
      // Aún no checa o salió sin ubicación: se lleva al lugar donde está registrado que debería estar.
      const lugares = this.lugaresDe(u);
      if (!lugares.length) return;
      if (lugares.length === 1) {
        const l = lugares[0]!;
        this.mapa.flyTo([l.latitud!, l.longitud!], 16, { duration: 0.6 });
        setTimeout(() => this.marcadoresLugar.get(l.nombre)?.openPopup(), 650);
      } else {
        this.mapa.flyToBounds(L.latLngBounds(lugares.map((l) => [l.latitud!, l.longitud!] as L.LatLngTuple)).pad(0.4), { maxZoom: 16, duration: 0.6 });
      }
      return;
    }
    const lugar = u.estado === 'FueraDeLugar' ? this.lugarCercano(u) : null;
    if (lugar) {
      // Fuera de su lugar: se encuadra a la persona y al lugar que le corresponde, para ver qué tan lejos está.
      this.mapa.flyToBounds(L.latLngBounds([m.getLatLng(), [lugar.latitud!, lugar.longitud!]]).pad(0.4), { maxZoom: 16, duration: 0.6 });
    } else {
      this.mapa.flyTo(m.getLatLng(), Math.max(this.mapa.getZoom(), 17), { duration: 0.6 });
    }
    setTimeout(() => m.openPopup(), 650);
  }
}
