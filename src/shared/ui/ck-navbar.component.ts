import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { MenuController } from '@ionic/angular';
import { filter, map } from 'rxjs';
import { ETQ_SECCION, GRUPO_SECCION, Seccion } from '../auth/permisos';
import { CkIconComponent } from './ck-icon.component';
import { CkLogoComponent } from './ck-logo.component';
import { CkUsuarioMenuComponent } from './ck-usuario-menu.component';

/**
 * Barra superior del portal. Vive en el shell, junto al menú lateral: se queda fija mientras cambian las pantallas
 * y solo actualiza las migas de pan según la sección abierta.
 */
@Component({
  selector: 'ck-navbar',
  imports: [RouterLink, CkIconComponent, CkLogoComponent, CkUsuarioMenuComponent],
  template: `
    <header class="ck-topbar">
      <button type="button" class="ck-icon-btn ck-icon-btn--soft ck-menu-btn" aria-label="Abrir menú" (click)="alternarMenu()"><ck-icon name="menu-outline" /></button>
      <ck-logo class="ck-topbar__logo" />
      <nav class="ck-crumbs" aria-label="Ubicación">
        <a routerLink="/panel">Inicio</a>
        @if (grupo()) { <ck-icon name="chevron-forward" /><span>{{ grupo() }}</span> }
        @if (titulo()) { <ck-icon name="chevron-forward" /><strong aria-current="page">{{ titulo() }}</strong> }
      </nav>
      <div class="ck-topbar__actions">
        <span class="ck-env-chip" title="Datos ficticios para presentación">Demo</span>
        <a class="ck-topbar__help" href="mailto:soporte@grupodemo.mx"><ck-icon name="circle-question" /><span>Ayuda</span></a>
        <ck-usuario-menu />
      </div>
    </header>
  `,
})
export class CkNavbarComponent {
  private readonly router = inject(Router);
  private readonly menus = inject(MenuController);

  private readonly url = toSignal(
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd), map(() => this.router.url)),
    { initialValue: this.router.url });
  private readonly seccion = computed(() => this.url().split(/[?#]/)[0]!.split('/')[1] as Seccion);
  protected readonly titulo = computed(() => ETQ_SECCION[this.seccion()] ?? '');
  protected readonly grupo = computed(() => {
    const g = GRUPO_SECCION[this.seccion()] ?? '';
    return g === this.titulo() ? '' : g;
  });

  protected async alternarMenu() {
    if (await this.menus.isOpen()) await this.menus.close(); else await this.menus.open();
  }
}
