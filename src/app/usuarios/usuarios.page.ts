import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonBadge, IonButton, IonSearchbar, ModalController } from '@ionic/angular';
import { CLR_ESTADO_CUENTA, CLR_ROL, CatalogosUsuarios, ChecadorApi, CkIconComponent, CkPageComponent, ETQ_ALCANCE, ETQ_ESTADO_CUENTA, ETQ_METODO_2FA, ETQ_ROL, ETQ_SECCION, Empleado, EstadoCuenta, FechaPipe, HoraPipe, PERMISOS, PermisosService, ROLES_ADMIN, ROLES_GESTIONABLES, Rol, SECCIONES, TipoAlcance, UsuarioAdmin, textoAlcance, CkSelectComponent, CkOpcionComponent } from '@checador/shared';
import { UsuarioSheet, diasParaVencer } from './usuario.sheet';

@Component({
  selector: 'app-usuarios',
  imports: [CkSelectComponent, CkOpcionComponent, IonSearchbar, IonButton, IonBadge, RouterLink, CkPageComponent, CkIconComponent, FechaPipe, HoraPipe],
  templateUrl: './usuarios.page.html' })
export class UsuariosPage {
  private readonly api = inject(ChecadorApi);
  private readonly modales = inject(ModalController);
  protected readonly permisos = inject(PermisosService);

  protected readonly usuarios = signal<UsuarioAdmin[]>([]);
  protected readonly busqueda = signal('');
  protected readonly filtroRol = signal<Rol | ''>('');
  protected readonly filtroEstado = signal<EstadoCuenta | 'Vence' | ''>('');
  private catalogos?: CatalogosUsuarios;
  private empleados: Empleado[] = [];

  protected readonly roles = ROLES_ADMIN;
  protected readonly perfiles = PERMISOS;
  protected readonly gestionables = ROLES_GESTIONABLES;
  protected readonly secciones = SECCIONES;
  protected readonly etqSeccion = ETQ_SECCION;
  protected readonly etqRol = ETQ_ROL;
  protected readonly clrRol = CLR_ROL;
  protected readonly etqEstado = ETQ_ESTADO_CUENTA;
  protected readonly clrEstado = CLR_ESTADO_CUENTA;
  protected readonly etqMetodo = ETQ_METODO_2FA;
  protected readonly etqAlcance = ETQ_ALCANCE;
  protected readonly alcance = textoAlcance;
  protected readonly vence = diasParaVencer;
  protected readonly etqAlcanceFn = (t: TipoAlcance) => ETQ_ALCANCE[t];
  protected readonly etqRolFn = (r: Rol) => ETQ_ROL[r];

  protected readonly porVencer = (u: UsuarioAdmin) => {
    const d = diasParaVencer(u);
    return u.estado !== 'Inactivo' && d !== null && d <= 30;
  };

  protected readonly cuentas = computed(() => {
    const us = this.usuarios();
    return {
      activos: us.filter((u) => u.estado === 'Activo').length,
      invitados: us.filter((u) => u.estado === 'Invitado').length,
      porVencer: us.filter(this.porVencer).length,
      inactivos: us.filter((u) => u.estado === 'Inactivo').length,
      sinFactorFuerte: us.filter((u) => u.estado === 'Activo' && (!u.dobleFactor || u.dobleFactor === 'SMS')).length };
  });

  protected readonly visibles = computed(() => {
    const q = this.busqueda().trim().toLowerCase();
    const r = this.filtroRol();
    const e = this.filtroEstado();
    const orden: Record<EstadoCuenta, number> = { Invitado: 0, Activo: 1, Inactivo: 2 };
    return this.usuarios()
      .filter((u) => !q || `${u.nombre} ${u.correo} ${u.puesto} ${u.organizacion ?? ''}`.toLowerCase().includes(q))
      .filter((u) => !r || u.rol === r)
      .filter((u) => !e || (e === 'Vence' ? this.porVencer(u) : u.estado === e))
      .sort((a, b) => orden[a.estado] - orden[b.estado] || ROLES_ADMIN.indexOf(b.rol) - ROLES_ADMIN.indexOf(a.rol) || a.nombre.localeCompare(b.nombre, 'es'));
  });

  constructor() { this.cargar(); }
  ionViewWillEnter() { this.cargar(); }

  private async cargar() { this.usuarios.set(await this.api.usuariosAdmin()); }

  protected iniciales(n: string) { return n.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join(''); }

  protected nuevo() { return this.abrir(null); }

  protected async abrir(usuario: UsuarioAdmin | null) {
    if (!this.catalogos) {
      [this.catalogos, this.empleados] = await Promise.all([this.api.catalogosUsuarios(), this.api.empleados()]);
    }
    const m = await this.modales.create({
      component: UsuarioSheet, cssClass: 'ck-modal-full',
      componentProps: { usuario, catalogos: this.catalogos, empleados: this.empleados } });
    await m.present();
    await m.onDidDismiss();
    await this.cargar();
  }
}
