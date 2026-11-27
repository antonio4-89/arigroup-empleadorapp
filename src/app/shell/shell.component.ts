import { Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { IonContent, IonMenu, IonMenuToggle, IonRouterOutlet, IonSplitPane } from '@ionic/angular';
import { filter } from 'rxjs';
import { ChecadorApi, CkIconComponent, CkLogoComponent, CkNavbarComponent, ETQ_SECCION, ICONO_SECCION, NAV_EMPLEADOR, PermisosService, Seccion } from '@checador/shared';

@Component({
  selector: 'app-shell',
  imports: [IonSplitPane, IonMenu, IonContent, IonRouterOutlet, IonMenuToggle, RouterLink, RouterLinkActive, CkIconComponent, CkLogoComponent, CkNavbarComponent],
  templateUrl: './shell.component.html',
})
export class ShellComponent {
  protected readonly permisos = inject(PermisosService);
  private readonly router = inject(Router);
  private readonly api = inject(ChecadorApi);
  protected readonly badges = signal<Partial<Record<Seccion, number>>>({});
  protected readonly etq = ETQ_SECCION;
  protected readonly iconos = ICONO_SECCION;

  protected readonly grupos = computed(() =>
    NAV_EMPLEADOR
      .map((g) => ({ titulo: g.titulo, secciones: g.secciones.filter((s) => this.permisos.veSeccion(s)) }))
      .filter((g) => g.secciones.length > 0));

  constructor() {
    this.actualizarBadges();
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => this.actualizarBadges());
  }

  private async actualizarBadges() {
    const r = await this.api.resumenHoy();
    this.badges.set({
      incidencias: r.incidenciasAbiertas, revision: r.porRevisar, correcciones: r.correccionesPendientes + r.jornadasSinCierre,
      solicitudes: r.solicitudesPendientes, lugares: r.lugaresPendientes, empleados: r.dispositivosPendientes, privacidad: r.arcoPendientes,
    });
  }
}
