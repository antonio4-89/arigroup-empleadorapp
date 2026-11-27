import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonButton, IonLabel, IonPopover, IonSegment, IonSegmentButton } from '@ionic/angular';
import { PermisosService } from '../auth/permisos';
import { SessionService } from '../auth/session.service';
import { ETQ_ROL, ROLES_ADMIN } from './etiquetas';
import { ConfirmarService } from './confirmar.service';
import { CkIconComponent } from './ck-icon.component';
import { Tema, ThemeService } from './theme.service';
import { Rol } from '../models/models';
import { CkOpcionComponent, CkSelectComponent } from './ck-select.component';

@Component({
  selector: 'ck-usuario-menu',
  imports: [CkSelectComponent, CkOpcionComponent, IonButton, IonLabel, IonPopover, IonSegment, IonSegmentButton, CkIconComponent],
  template: `
    <button type="button" id="ck-usuario-trigger" class="ck-user" aria-label="Menú de usuario">
      <span class="ck-avatar ck-avatar--sm" aria-hidden="true">{{ iniciales() }}</span>
      <span class="ck-user__name">{{ sesion.usuario()?.nombre }}</span>
      <ck-icon name="chevron-down-outline" />
    </button>
    <ion-popover trigger="ck-usuario-trigger" triggerAction="click" [dismissOnSelect]="false" class="ck-popover-user">
      <ng-template>
        <div class="ck-user-menu">
          <div class="ck-user-menu__head">
            <span class="ck-avatar ck-avatar--lg" aria-hidden="true">{{ iniciales() }}</span>
            <div><strong>{{ sesion.usuario()?.nombre }}</strong><span class="ck-text-sm ck-text-muted">{{ etqRol[permisos.rol()] }}</span></div>
          </div>
          <ck-select label="Ver como (demostración)" [value]="permisos.rol()" (cambio)="cambiarRol($event)">
            @for (r of roles; track r) { <ck-opcion [valor]="r" etiqueta="{{ etqRol[r] }}" /> }
          </ck-select>
          <ion-segment [value]="tema.tema()" (ionChange)="cambiarTema($event.detail.value)">
            <ion-segment-button value="auto"><ion-label>Auto</ion-label></ion-segment-button>
            <ion-segment-button value="light"><ion-label>Claro</ion-label></ion-segment-button>
            <ion-segment-button value="dark"><ion-label>Oscuro</ion-label></ion-segment-button>
          </ion-segment>
          <ion-button expand="block" fill="outline" color="danger" (click)="salir()"><ck-icon slot="start" name="log-out-outline" />Cerrar sesión</ion-button>
        </div>
      </ng-template>
    </ion-popover>
  ` })
export class CkUsuarioMenuComponent {
  protected readonly sesion = inject(SessionService);
  protected readonly permisos = inject(PermisosService);
  protected readonly tema = inject(ThemeService);
  private readonly router = inject(Router);
  private readonly confirmar = inject(ConfirmarService);
  protected readonly roles = ROLES_ADMIN;
  protected readonly etqRol = ETQ_ROL;
  protected readonly iniciales = computed(() =>
    (this.sesion.usuario()?.nombre ?? '').split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join(''));

  protected cambiarTema(v: unknown) { this.tema.cambiar(v as Tema); }

  protected async cambiarRol(rol: string) {
    this.sesion.cambiarRol(rol as Rol);
    const actual = this.router.url.split('/')[1];
    if (actual && !this.permisos.veSeccion(actual as never)) await this.router.navigateByUrl('/panel');
  }

  protected async salir() {
    const r = await this.confirmar.pedir({
      peligro: true, icono: 'log-out-outline', titulo: '¿Deseas cerrar\nsesión?',
      descripcion: 'Tendrás que iniciar sesión de nuevo con tu usuario, contraseña y código de verificación.', textoAceptar: 'Cerrar sesión' });
    if (!r) return;
    this.sesion.cerrar();
    await this.router.navigateByUrl('/login');
    location.reload();
  }
}
