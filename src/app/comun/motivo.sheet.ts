import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { IonButton, ModalController } from '@ionic/angular';
import { CkInputComponent } from '@checador/shared';

export interface OpcionesMotivo {
  titulo: string;
  subtitulo?: string;
  detalle?: string[];
  etiqueta?: string;
  sugerencias?: string[];
  obligatorio?: boolean;
  textoPrincipal: string;
  colorPrincipal?: 'primary' | 'danger' | 'success';
  textoSecundario?: string;
}

export interface ResultadoMotivo { texto: string; accion: 'principal' | 'secundaria' }

@Component({
  selector: 'app-motivo-sheet',
  imports: [CkInputComponent, IonButton],
  template: `
    <form class="ck-form-sheet" (submit)="$event.preventDefault(); enviar('principal')">
      <header class="ck-form-sheet__head">
        <h2 class="ck-sheet__title">{{ o.titulo }}</h2>
        @if (o.subtitulo) { <span class="ck-text-sm ck-text-muted">{{ o.subtitulo }}</span> }
      </header>

      @if (o.detalle?.length) {
        <div class="ck-form-sheet__ctx">
          @for (d of o.detalle; track d) { <span>{{ d }}</span> }
        </div>
      }

      @if (o.sugerencias?.length) {
        <div class="ck-chips" role="group" aria-label="Respuestas rápidas">
          @for (s of o.sugerencias; track s) {
            <button type="button" class="ck-chip" [attr.aria-pressed]="texto() === s" (click)="texto.set(s)">{{ s }}</button>
          }
        </div>
      }

      <ck-input label="{{ o.etiqueta ?? 'Mensaje' }}" rows="3" [value]="texto()" (cambio)="texto.set($event)" />
      @if (error()) { <p class="ck-notice ck-notice--error" role="alert">{{ error() }}</p> }

      <footer class="ck-form-sheet__actions">
        <ion-button fill="clear" color="medium" (click)="cancelar()">Cancelar</ion-button>
        @if (o.textoSecundario) { <ion-button fill="outline" (click)="enviar('secundaria')">{{ o.textoSecundario }}</ion-button> }
        <ion-button type="submit" [color]="o.colorPrincipal ?? 'primary'">{{ o.textoPrincipal }}</ion-button>
      </footer>
    </form>
  ` })
export class MotivoSheet implements OnInit {
  @Input({ required: true }) opciones!: OpcionesMotivo;
  private readonly ctrl = inject(ModalController);
  protected readonly texto = signal('');
  protected readonly error = signal('');

  protected get o() { return this.opciones; }
  ngOnInit() { this.error.set(''); }

  protected cancelar() { return this.ctrl.dismiss(null, 'cancelada'); }

  protected enviar(accion: ResultadoMotivo['accion']) {
    const texto = this.texto().trim();
    if (accion === 'principal' && this.o.obligatorio && texto.length < 3) { this.error.set('Escribe un mensaje breve.'); return; }
    return this.ctrl.dismiss({ texto, accion } satisfies ResultadoMotivo, 'ok');
  }
}
