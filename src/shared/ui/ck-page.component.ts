import { Location } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonButton, IonButtons, IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular';
import { DESC_SECCION, Seccion } from '../auth/permisos';
import { CkIconComponent } from './ck-icon.component';

@Component({
  selector: 'ck-page',
  host: { class: 'ion-page' },
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, CkIconComponent],
  template: `
    @if (!sinBarra() && !inline() && !menu()) {
      <ion-header>
        <ion-toolbar>
          @if (backHref()) {
            <ion-buttons slot="start"><ion-button aria-label="Regresar" (click)="atras()"><ck-icon name="arrow-back" /></ion-button></ion-buttons>
          }
          <ion-title>{{ titulo() }}</ion-title>
        </ion-toolbar>
      </ion-header>
    }
    <ion-content [fullscreen]="sinBarra()">
      <main [class]="flush() ? 'ck-flush' : 'ck-page ck-stack'" [class.ck-page--portal]="menu()">
        @if (inline() || menu()) {
          <header class="ck-head" [class.ck-head--back]="!!backHref()" [class.ck-head--portal]="menu()">
            @if (backHref()) {
              <button type="button" class="ck-icon-btn ck-icon-btn--soft" aria-label="Regresar" (click)="atras()"><ck-icon name="arrow-back" /></button>
            }
            <div class="ck-head__text">
              <h1 class="ck-head__title">{{ titulo() }}</h1>
              @if (descripcion()) { <p class="ck-head__sub">{{ descripcion() }}</p> }
            </div>
            <div class="ck-head__actions"><ng-content select="[slot=actions]" /></div>
          </header>
        }
        <ng-content />
      </main>
    </ion-content>
  `,
})
export class CkPageComponent {
  private readonly ubicacion = inject(Location);
  private readonly router = inject(Router);
  private readonly ruta = inject(ActivatedRoute, { optional: true });

  protected atras() {
    if (window.history.length > 1) this.ubicacion.back(); else this.router.navigateByUrl(this.backHref() ?? '/');
  }

  readonly titulo = input('');
  readonly subtitulo = input('');
  readonly inline = input(false);
  readonly menu = input(false);
  readonly backHref = input<string | null>(null);
  readonly sinBarra = input(false);
  readonly flush = input(false);

  private readonly seccion = (this.ruta?.snapshot.routeConfig?.path ?? '') as Seccion;
  protected readonly descripcion = computed(() => this.subtitulo() || (this.menu() ? DESC_SECCION[this.seccion] ?? '' : ''));
}
