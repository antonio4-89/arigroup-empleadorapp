import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { IonButton, ModalController } from '@ionic/angular';
import { CkIconComponent } from './ck-icon.component';
import { CkOpcionComponent, CkSelectComponent } from './ck-select.component';

export interface OpcionesConfirmar {
  titulo: string;
  descripcion: string;
  icono?: string;
  peligro?: boolean;
  textoAceptar?: string;
  eleccion?: { etiqueta: string; opciones: { valor: string; etiqueta: string }[] };
}

export interface ResultadoConfirmar { valor?: string }

@Component({
  selector: 'app-confirmar-sheet',
  imports: [IonButton, CkIconComponent, CkSelectComponent, CkOpcionComponent],
  template: `
    <div class="ck-confirm" role="alertdialog" [attr.aria-label]="o.titulo">
      <span class="ck-confirm__icono" [class.ck-confirm__icono--peligro]="o.peligro" aria-hidden="true"><ck-icon [name]="o.icono ?? (o.peligro ? 'trash' : 'alert-circle-outline')" /></span>
      <h2 class="ck-confirm__titulo">{{ o.titulo }}</h2>
      <p class="ck-confirm__texto">{{ o.descripcion }}</p>
      @if (o.eleccion; as e) {
        <div class="ck-confirm__campo">
          <ck-select [label]="e.etiqueta" [value]="valor()" (cambio)="valor.set($event)">
            @for (op of e.opciones; track op.valor) { <ck-opcion [valor]="op.valor" [etiqueta]="op.etiqueta" /> }
          </ck-select>
        </div>
      }
      <ion-button class="ck-confirm__aceptar" expand="block" [color]="o.peligro ? 'danger' : 'primary'" [disabled]="!!o.eleccion && !valor()" (click)="aceptar()">{{ o.textoAceptar ?? 'Aceptar' }}</ion-button>
      <ion-button class="ck-confirm__cancelar" fill="clear" (click)="cancelar()">Cancelar</ion-button>
    </div>
  ` })
export class ConfirmarSheet implements OnInit {
  @Input({ required: true }) opciones!: OpcionesConfirmar;
  private readonly ctrl = inject(ModalController);
  protected readonly valor = signal('');

  protected get o() { return this.opciones; }
  ngOnInit() { this.valor.set(this.o.eleccion?.opciones[0]?.valor ?? ''); }

  protected cancelar() { return this.ctrl.dismiss(null, 'cancelada'); }
  protected aceptar() { return this.ctrl.dismiss({ valor: this.valor() || undefined } satisfies ResultadoConfirmar, 'ok'); }
}
