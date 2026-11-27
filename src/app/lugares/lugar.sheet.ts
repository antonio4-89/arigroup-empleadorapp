import { AfterViewInit, Component, ElementRef, Input, OnDestroy, OnInit, computed, effect, inject, signal, viewChild } from '@angular/core';
import { IonButton, ModalController } from '@ionic/angular';
import * as L from 'leaflet';
import { ChecadorApi, CkInputComponent, CkOpcionComponent, CkSelectComponent, ETQ_LUGAR, LugarPermitido, TipoLugar } from '@checador/shared';

@Component({
  selector: 'app-lugar-sheet',
  imports: [CkInputComponent, CkSelectComponent, CkOpcionComponent, IonButton],
  template: `
    <form class="ck-form-sheet" (submit)="$event.preventDefault(); guardar()">
      <header class="ck-form-sheet__head">
        <h2 class="ck-sheet__title">{{ lugar ? 'Editar lugar' : 'Nuevo lugar' }}</h2>
        @if (lugar && lugar.empleadosAsignados) { <span class="ck-text-sm ck-text-muted">Los cambios aplican a los {{ lugar.empleadosAsignados }} colaboradores asignados, de aquí en adelante.</span> }
      </header>
      <ck-input label="Nombre" placeholder="Ej. Bodega Tultitlán" [maxlength]="150" [value]="nombre()" (cambio)="nombre.set($event)" />
      <div class="ck-grid">
        <ck-select label="Tipo" [value]="tipo()" (cambio)="tipo.set($any($event))">
          @for (t of tipos; track t) { <ck-opcion [valor]="t" [etiqueta]="etq[t]" /> }
        </ck-select>
        @if (conMapa()) {
          <ck-select label="Radio permitido" [value]="radio()" (cambio)="radio.set(+$event)">
            @for (r of radios; track r) { <ck-opcion [valor]="r" etiqueta="{{ r }} m" /> }
          </ck-select>
        }
      </div>
      <ck-input label="Dirección" placeholder="Calle, número, colonia y municipio" [maxlength]="500" [value]="direccion()" (cambio)="direccion.set($event)" />

      @if (conMapa()) {
        <div class="ck-lugar-mapa">
          <div #mapa class="ck-lugar-mapa__mapa" role="application" aria-label="Mapa para marcar el lugar"></div>
          <span class="ck-text-sm ck-text-muted">Toca el mapa para colocar el pin, o arrástralo. Se usa para validar las checadas dentro del radio.</span>
        </div>
        <div class="ck-grid">
          <ck-input label="Latitud" type="number" [value]="latitud()" (cambio)="escribir('lat', $event)" />
          <ck-input label="Longitud" type="number" [value]="longitud()" (cambio)="escribir('lon', $event)" />
        </div>
      } @else {
        <p class="ck-text-sm ck-text-muted">Una ruta itinerante no tiene punto fijo: no se valida contra un radio.</p>
      }

      @if (error()) { <p class="ck-notice ck-notice--error" role="alert">{{ error() }}</p> }
      <footer class="ck-form-sheet__actions">
        <ion-button fill="clear" color="medium" (click)="cancelar()">Cancelar</ion-button>
        <ion-button type="submit" [disabled]="guardando()">{{ lugar ? 'Guardar cambios' : 'Crear lugar' }}</ion-button>
      </footer>
    </form>
  ` })
export class LugarSheet implements OnInit, AfterViewInit, OnDestroy {
  @Input() lugar: LugarPermitido | null = null;
  private readonly api = inject(ChecadorApi);
  private readonly ctrl = inject(ModalController);
  protected readonly etq = ETQ_LUGAR;
  protected readonly tipos: TipoLugar[] = ['Sede', 'HomeOffice', 'Cliente', 'Itinerante'];
  protected readonly radios = [50, 100, 150, 200, 300, 500, 1000, 2000];
  protected readonly nombre = signal('');
  protected readonly tipo = signal<TipoLugar>('Sede');
  protected readonly direccion = signal('');
  protected readonly radio = signal(150);
  protected readonly latitud = signal('');
  protected readonly longitud = signal('');
  protected readonly error = signal('');
  protected readonly guardando = signal(false);
  protected readonly conMapa = computed(() => this.tipo() !== 'Itinerante');
  private readonly contenedor = viewChild<ElementRef<HTMLElement>>('mapa');

  private mapa?: L.Map;
  private pin?: L.Marker;
  private zona?: L.Circle;

  constructor() {
    effect(() => {
      const hay = this.contenedor();
      this.latitud(); this.longitud(); this.radio();
      if (hay && !this.mapa) this.iniciarMapa(hay.nativeElement);
      else if (!hay && this.mapa) { this.mapa.remove(); this.mapa = undefined; this.pin = undefined; this.zona = undefined; }
      this.pintar();
    });
  }

  ngOnInit() {
    const l = this.lugar;
    if (!l) return;
    this.nombre.set(l.nombre);
    this.tipo.set(l.tipo);
    this.direccion.set(l.direccion);
    this.radio.set(l.radioMetros ?? 150);
    this.latitud.set(l.latitud != null ? String(l.latitud) : '');
    this.longitud.set(l.longitud != null ? String(l.longitud) : '');
  }

  ngAfterViewInit() { setTimeout(() => this.mapa?.invalidateSize(), 350); }
  ngOnDestroy() { this.mapa?.remove(); }

  private iniciarMapa(el: HTMLElement) {
    const lat = Number(this.latitud()), lon = Number(this.longitud());
    const tiene = this.latitud() !== '' && this.longitud() !== '' && Number.isFinite(lat) && Number.isFinite(lon);
    this.mapa = L.map(el, { center: tiene ? [lat, lon] : [23.6345, -102.5528], zoom: tiene ? 16 : 5 });
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
    }).addTo(this.mapa);
    this.mapa.on('click', (e: L.LeafletMouseEvent) => this.fijar(e.latlng.lat, e.latlng.lng));
    setTimeout(() => this.mapa?.invalidateSize(), 350);
  }

  private pintar() {
    if (!this.mapa) return;
    const lat = Number(this.latitud()), lon = Number(this.longitud());
    if (this.latitud() === '' || this.longitud() === '' || !Number.isFinite(lat) || !Number.isFinite(lon)) { this.pin?.remove(); this.zona?.remove(); this.pin = this.zona = undefined; return; }
    const primario = getComputedStyle(document.documentElement).getPropertyValue('--ck-color-primary').trim() || '#5b3fd0';
    if (!this.pin) {
      const icono = L.divIcon({
        className: 'ck-pin ck-pin--lugar', iconSize: [36, 48], iconAnchor: [18, 48],
        html: `<svg viewBox="0 0 30 40" width="36" height="48" aria-hidden="true"><path d="M15 1C7 1 1 7.2 1 15c0 10.5 14 24 14 24s14-13.5 14-24C29 7.2 23 1 15 1z" fill="${primario}" stroke="#fff" stroke-width="2"/><rect x="11" y="11" width="8" height="8" rx="1.5" fill="#fff"/></svg>`,
      });
      this.pin = L.marker([lat, lon], { icon: icono, draggable: true }).addTo(this.mapa);
      this.pin.on('dragend', () => { const p = this.pin!.getLatLng(); this.fijar(p.lat, p.lng); });
      this.zona = L.circle([lat, lon], { radius: this.radio(), color: primario, weight: 2, fillColor: primario, fillOpacity: 0.12, interactive: false }).addTo(this.mapa);
    } else {
      this.pin.setLatLng([lat, lon]);
      this.zona!.setLatLng([lat, lon]).setRadius(this.radio());
    }
  }

  private fijar(lat: number, lon: number) {
    this.latitud.set(lat.toFixed(6));
    this.longitud.set(lon.toFixed(6));
  }

  protected escribir(campo: 'lat' | 'lon', valor: string) {
    (campo === 'lat' ? this.latitud : this.longitud).set(valor);
    const lat = Number(this.latitud()), lon = Number(this.longitud());
    if (this.latitud() !== '' && this.longitud() !== '' && Number.isFinite(lat) && Number.isFinite(lon)) this.mapa?.setView([lat, lon], Math.max(this.mapa.getZoom(), 15));
  }

  protected cancelar() { return this.ctrl.dismiss(null, 'cancelada'); }

  protected async guardar() {
    this.error.set('');
    this.guardando.set(true);
    const conMapa = this.conMapa();
    const datos = {
      nombre: this.nombre(), tipo: this.tipo(), direccion: this.direccion(), radioMetros: conMapa ? this.radio() : undefined,
      latitud: conMapa && this.latitud() !== '' ? Number(this.latitud()) : undefined, longitud: conMapa && this.longitud() !== '' ? Number(this.longitud()) : undefined,
    };
    try {
      if (this.lugar) await this.api.modificarLugar(this.lugar.id, datos); else await this.api.crearLugar(datos);
      await this.ctrl.dismiss({ nombre: datos.nombre.trim(), nuevo: !this.lugar }, 'ok');
    } catch (e) {
      this.error.set((e as Error).message);
    } finally {
      this.guardando.set(false);
    }
  }
}
