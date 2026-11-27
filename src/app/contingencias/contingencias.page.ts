import { Component, inject, signal } from '@angular/core';
import { IonBadge, IonButton } from '@ionic/angular';
import { ConfirmarService, ChecadorApi, CkPageComponent, Contingencia, ETQ_EFECTO, EfectoContingencia, FechaPipe, HoraPipe, TipoContingencia, etiquetaTipoCont, PuedeDirective, CkInputComponent, CkSelectComponent, CkOpcionComponent } from '@checador/shared';

@Component({
  selector: 'app-contingencias',
  imports: [CkInputComponent, CkSelectComponent, CkOpcionComponent, CkPageComponent, IonBadge, IonButton, FechaPipe, HoraPipe, PuedeDirective],
  templateUrl: './contingencias.page.html' })
export class ContingenciasPage {
  private readonly api = inject(ChecadorApi);
  private readonly confirmar = inject(ConfirmarService);
  protected readonly lista = signal<Contingencia[]>([]);
  protected readonly error = signal('');
  protected readonly ocupado = signal(false);

  protected readonly tipo = signal<TipoContingencia>('Apagon');
  protected readonly alcance = signal('');
  protected readonly efecto = signal<EfectoContingencia>('SinRetardoNiFalta');
  protected readonly nota = signal('');

  protected readonly tipos = Object.entries(etiquetaTipoCont) as [TipoContingencia, string][];
  protected readonly efectos = Object.entries(ETQ_EFECTO) as [EfectoContingencia, string][];
  protected readonly etqTipo = etiquetaTipoCont;
  protected readonly etqEfecto = ETQ_EFECTO;

  constructor() { this.cargar(); }
  ionViewWillEnter() { this.cargar(); }

  protected activa() { return this.lista().find((c) => c.activa); }
  private async cargar() { this.lista.set(await this.api.contingencias()); }

  protected async declarar() {
    this.error.set('');
    if (!this.alcance().trim()) { this.error.set('Indica el alcance (por ejemplo: "Toda la empresa" o "Planta Norte").'); return; }
    this.ocupado.set(true);
    try {
      await this.api.declararContingencia({ tipo: this.tipo(), alcance: this.alcance().trim(), efecto: this.efecto(), nota: this.nota().trim() });
      this.alcance.set(''); this.nota.set('');
      await this.cargar();
    } catch (e) { this.error.set((e as Error).message); } finally { this.ocupado.set(false); }
  }

  protected async cerrar(c: Contingencia) {
    const r = await this.confirmar.pedir({
      peligro: true, icono: 'alert-circle-outline', titulo: '¿Deseas cerrar\nla contingencia?',
      descripcion: `Se cerrará “${this.etqTipo[c.tipo]}” y dejará de aplicarse a las checadas. Quedará registrado.`, textoAceptar: 'Cerrar contingencia' });
    if (!r) return;
    await this.api.cerrarContingencia(c.id);
    await this.cargar();
  }
}
