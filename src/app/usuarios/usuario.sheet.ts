import { Component, Input, OnInit, computed, inject, signal } from '@angular/core';
import {
  IonBadge, IonButton, IonContent, IonLabel, IonSearchbar, IonSegment, IonSegmentButton, ModalController } from '@ionic/angular';
import { CLR_ESTADO_CUENTA, CLR_ROL, CatalogosUsuarios, ChecadorApi, CkFechaComponent, CkIconComponent, DatosUsuario, ETQ_ACCION, ETQ_ESTADO_CUENTA, ETQ_METODO_2FA, ETQ_ROL, ETQ_SECCION, Empleado, EventoAuditoria, FechaPipe, HoraPipe, PERMISOS, PermisosService, Rol, TipoAlcance, UsuarioAdmin, textoAlcance, CkInputComponent, CkSelectComponent, CkOpcionComponent, ConfirmarService } from '@checador/shared';
import { MotivoService } from '../comun/motivo.service';

type Modo = 'ver' | 'editar';

const isoLocal = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const hoyIso = () => isoLocal(new Date());
const enDias = (n: number) => { const d = new Date(); d.setDate(d.getDate() + n); return isoLocal(d); };
export const diasParaVencer = (u: Pick<UsuarioAdmin, 'vigenciaHasta'>) =>
  u.vigenciaHasta ? Math.ceil((new Date(`${u.vigenciaHasta}T23:59:59`).getTime() - Date.now()) / 86_400_000) : null;

@Component({
  selector: 'app-usuario-sheet',
  imports: [CkInputComponent, CkSelectComponent, CkOpcionComponent, 
    IonContent, IonButton, IonSearchbar, IonSegment, IonSegmentButton, IonLabel, IonBadge, CkFechaComponent, CkIconComponent, FechaPipe, HoraPipe,
  ],
  template: `
    <ion-content>
      <div class="ck-form-sheet ck-user-sheet">
        @if (modo() === 'ver' && u(); as x) {
          <header class="ck-user-sheet__head">
            <span class="ck-avatar ck-avatar--lg" aria-hidden="true">{{ iniciales(x.nombre) }}</span>
            <div class="ck-grow">
              <h2 class="ck-sheet__title">{{ x.nombre }}</h2>
              <span class="ck-text-sm ck-text-muted">{{ x.puesto }}{{ x.organizacion ? ' · ' + x.organizacion : '' }}</span>
              <div class="ck-chips">
                <ion-badge [color]="clrRol[x.rol]">{{ etqRol[x.rol] }}</ion-badge>
                <ion-badge [color]="clrEstado[x.estado]">{{ etqEstado[x.estado] }}</ion-badge>
                @if (x.externo) { <span class="ck-tag">Externo</span> }
              </div>
            </div>
            <button type="button" class="ck-icon-btn ck-icon-btn--soft" aria-label="Cerrar" (click)="cerrar()"><ck-icon name="close-outline" /></button>
          </header>

          @if (x.estado === 'Inactivo' && x.motivoBaja) {
            <p class="ck-notice ck-notice--warn">Cuenta desactivada. Motivo: {{ x.motivoBaja }}. Su historial y sus registros se conservan.</p>
          }
          @if (x.estado === 'Invitado') {
            <p class="ck-notice">Aún no acepta la invitación: no ha creado su contraseña ni activado la doble autenticación.</p>
          }
          @if (vence(x) !== null && vence(x)! <= 30 && x.estado !== 'Inactivo') {
            <p class="ck-notice ck-notice--warn">{{ vence(x)! < 0 ? 'El acceso ya venció.' : 'El acceso vence en ' + vence(x) + ' día(s).' }}</p>
          }

          <dl class="ck-dl">
            <dt>Correo</dt><dd>{{ x.correo }}</dd>
            <dt>Alcance</dt><dd>{{ alcance(x.alcance) }}</dd>
            <dt>Acceso hasta</dt><dd>{{ x.vigenciaHasta ? (x.vigenciaHasta | ckFecha) : 'Sin fecha de término' }}</dd>
            <dt>Colaborador</dt><dd>{{ empleadoVinculado(x) }}</dd>
            <dt>Doble factor</dt><dd>{{ x.dobleFactor ? etqMetodo[x.dobleFactor] : 'Sin configurar' }}@if (x.dobleFactor === 'SMS') { <span class="ck-text-warning"> · menos seguro</span> }</dd>
            <dt>Último acceso</dt><dd>{{ x.ultimoAcceso ? (x.ultimoAcceso | ckFecha) + ' ' + (x.ultimoAcceso | ckHora) : 'Nunca' }}</dd>
            <dt>Alta</dt><dd>{{ x.creado | ckFecha }} · {{ x.creadoPor }}</dd>
          </dl>

          <section class="ck-stack">
            <h3 class="ck-section-title">Qué puede hacer</h3>
            <p class="ck-text-sm">{{ perfiles[x.rol].descripcion }}</p>
            <div class="ck-chips">
              @for (s of perfiles[x.rol].secciones; track s) { <span class="ck-tag">{{ etqSeccion[s] }}</span> }
            </div>
          </section>

          <section class="ck-stack">
            <h3 class="ck-section-title">Historial de la cuenta</h3>
            @for (h of historial(); track h.id) {
              <div class="ck-user-sheet__log">
                <span class="ck-text-sm"><strong>{{ etqAccion[h.accion] }}</strong> · {{ h.detalle }}</span>
                <span class="ck-text-sm ck-text-muted">{{ h.fecha | ckFecha }} {{ h.fecha | ckHora }} · {{ h.usuario }}</span>
              </div>
            } @empty {
              <span class="ck-text-sm ck-text-muted">Sin movimientos registrados en la bitácora.</span>
            }
          </section>

          @if (permisos.puedeGestionar(x.rol)) {
            <footer class="ck-user-sheet__actions">
              @if (error()) { <p class="ck-notice ck-notice--error" role="alert">{{ error() }}</p> }
              @if (aviso()) { <p class="ck-notice ck-notice--ok" role="status">{{ aviso() }}</p> }
              <div class="ck-form-sheet__actions">
              @if (x.estado === 'Inactivo') {
                <ion-button fill="outline" color="success" (click)="reactivar(x)">Reactivar</ion-button>
              } @else {
                <ion-button fill="clear" color="danger" (click)="desactivar(x)">Desactivar</ion-button>
              }
              @if (x.estado === 'Invitado') { <ion-button fill="outline" (click)="reenviar(x)">Reenviar invitación</ion-button> }
              @if (x.estado === 'Activo' && x.dobleFactor) { <ion-button fill="outline" (click)="restablecer2fa(x)">Restablecer doble factor</ion-button> }
              <ion-button (click)="editar(x)"><ck-icon slot="start" name="pen-to-square" />Editar</ion-button>
              </div>
            </footer>
          } @else {
            <p class="ck-notice">Solo lectura. {{ permisos.gestionables().length ? 'Tu rol no administra cuentas de ' + etqRol[x.rol] + '.' : 'Tu rol no administra cuentas.' }}</p>
          }
        } @else {
          <form class="ck-user-form" (submit)="$event.preventDefault(); guardar()">
            <header class="ck-row ck-row--between">
              <div>
                <h2 class="ck-sheet__title">{{ u() ? 'Editar usuario' : 'Nuevo usuario del portal' }}</h2>
                <span class="ck-text-sm ck-text-muted">{{ u() ? u()!.correo : 'Recibirá una invitación por correo para crear su contraseña.' }}</span>
              </div>
              <button type="button" class="ck-icon-btn ck-icon-btn--soft" aria-label="Cerrar" (click)="u() ? modo.set('ver') : cerrar()"><ck-icon name="close-outline" /></button>
            </header>

            <section class="ck-user-form__seccion" aria-labelledby="us-rol">
              <h3 id="us-rol" class="ck-user-form__titulo">Rol</h3>
              <ck-select label="Rol en el portal" [value]="rol()" (cambio)="elegirRol($event)">
                @for (r of rolesDisponibles(); track r) { <ck-opcion [valor]="r" [etiqueta]="perfiles[r].nombre" /> }
              </ck-select>
              <p class="ck-user-form__ayuda">{{ perfiles[rol()].descripcion }}</p>
            </section>

            <section class="ck-user-form__seccion" aria-labelledby="us-persona">
              <h3 id="us-persona" class="ck-user-form__titulo">Persona</h3>
              @if (perfiles[rol()].permiteExterno) {
                <ion-segment [value]="externo() ? 'ext' : 'int'" (ionChange)="externo.set($event.detail.value === 'ext')">
                  <ion-segment-button value="int"><ion-label>Personal de la empresa</ion-label></ion-segment-button>
                  <ion-segment-button value="ext"><ion-label>Externo</ion-label></ion-segment-button>
                </ion-segment>
              }
              @if (!externo()) {
                @if (empleado(); as e) {
                  <div class="ck-user-form__vinculo">
                    <ck-icon name="user" />
                    <div class="ck-grow"><strong>{{ e.nombre }}</strong><small>No. {{ e.numero }} · {{ e.puesto }} · {{ e.departamento }}</small></div>
                    <button type="button" class="ck-link" (click)="empleado.set(null)">Quitar</button>
                  </div>
                } @else {
                  <ion-searchbar placeholder="Buscar colaborador para vincularlo (opcional)" aria-label="Buscar colaborador" [value]="busqueda()" [debounce]="150"
                    (ionInput)="busqueda.set($any($event.detail.value ?? ''))" />
                  @if (coincidencias().length) {
                    <ul class="ck-menu-list">
                      @for (e of coincidencias(); track e.id) {
                        <li><button type="button" class="ck-menu-list__item" (click)="vincular(e)">
                          <ck-icon name="user" /><span class="ck-grow"><strong>{{ e.nombre }}</strong><small>No. {{ e.numero }} · {{ e.puesto }} · {{ e.departamento }}</small></span>
                        </button></li>
                      }
                    </ul>
                  } @else {
                    <p class="ck-user-form__ayuda">Si ya es colaborador, vincúlalo: checa en la app y entra al portal con la misma cuenta.</p>
                  }
                }
              }
              <div class="ck-user-form__fila ck-user-form__fila--3">
                <ck-input label="Nombre(s)" autocomplete="given-name" autocapitalize="words" [value]="nombres()" (cambio)="nombres.set($event)" />
                <ck-input label="Apellido paterno" autocomplete="family-name" autocapitalize="words" [value]="apellidoPaterno()" (cambio)="apellidoPaterno.set($event)" />
                <ck-input label="Apellido materno (opcional)" autocapitalize="words" [value]="apellidoMaterno()" (cambio)="apellidoMaterno.set($event)" />
              </div>
              <div class="ck-user-form__fila">
                <ck-input label="Correo" type="email" [helper]="u() ? 'No se puede cambiar.' : ''" [readonly]="!!u()" [value]="correo()" (cambio)="correo.set($event)" />
                <ck-input label="Puesto o cargo" [value]="puesto()" (cambio)="puesto.set($event)" />
                @if (externo()) {
                  <ck-input label="Organización" placeholder="Despacho o institución" [value]="organizacion()" (cambio)="organizacion.set($event)" />
                }
              </div>
            </section>

            <section class="ck-user-form__seccion" aria-labelledby="us-acceso">
              <h3 id="us-acceso" class="ck-user-form__titulo">Acceso</h3>
              @if (perfiles[rol()].alcances.length === 1 && perfiles[rol()].alcances[0] === 'Empresa') {
                <p class="ck-user-form__ayuda">{{ perfiles[rol()].nombre }} ve toda la empresa.</p>
              } @else {
                @if (perfiles[rol()].alcances.length > 1) {
                  <ck-select label="Qué puede ver" [value]="tipoAlcance()" (cambio)="cambiarTipoAlcance($any($event))">
                    @for (t of perfiles[rol()].alcances; track t) { <ck-opcion [valor]="t" [etiqueta]="t === 'Area' ? 'Solo algunas áreas' : 'Solo algunas sedes'" /> }
                  </ck-select>
                }
                <p class="ck-user-form__ayuda">{{ ayudaAlcance() }}</p>
                <div class="ck-chips" role="group" aria-label="Opciones de alcance">
                  @for (o of opcionesAlcance(); track o.valor) {
                    <button type="button" class="ck-chip" [attr.aria-pressed]="valores().includes(o.valor)" (click)="alternarValor(o.valor)" [attr.title]="o.detalle">{{ o.valor }}</button>
                  }
                </div>
              }

              @if (perfiles[rol()].vigenciaObligatoria) {
                <ck-fecha label="Acceso hasta (obligatorio)" [valor]="vigencia()" [min]="hoy" (cambia)="vigencia.set($event)" />
                <p class="ck-user-form__ayuda">Al llegar la fecha, la cuenta deja de entrar sola. Para extenderla hay que editarla.</p>
              } @else {
                <ck-select label="Vigencia del acceso" [value]="vigencia() ? 'fecha' : 'sin'" (cambio)="cambiarVigencia($event)">
                  <ck-opcion valor="sin" etiqueta="Sin fecha de término" />
                  <ck-opcion valor="fecha" etiqueta="Hasta una fecha" />
                </ck-select>
                @if (vigencia()) { <ck-fecha label="Acceso hasta" [valor]="vigencia()" [min]="hoy" (cambia)="vigencia.set($event)" /> }
              }
            </section>

            @if (!u()) {
              <p class="ck-notice">
                <strong>Nadie conoce la contraseña.</strong> La persona recibe un enlace para crearla y activar la doble autenticación. Hasta entonces aparece como "Invitación enviada".
              </p>
            }
            @if (error()) { <p class="ck-notice ck-notice--error" role="alert">{{ error() }}</p> }

            <footer class="ck-form-sheet__actions">
              <ion-button fill="clear" color="medium" (click)="u() ? modo.set('ver') : cerrar()">Cancelar</ion-button>
              <ion-button type="submit" [disabled]="ocupado()">{{ u() ? 'Guardar cambios' : 'Crear y enviar invitación' }}</ion-button>
            </footer>
          </form>
        }
      </div>
    </ion-content>
  ` })
export class UsuarioSheet implements OnInit {
  @Input() usuario: UsuarioAdmin | null = null;
  @Input({ required: true }) catalogos!: CatalogosUsuarios;
  @Input({ required: true }) empleados!: Empleado[];

  private readonly api = inject(ChecadorApi);
  private readonly ctrl = inject(ModalController);
  private readonly confirmar = inject(ConfirmarService);
  private readonly motivos = inject(MotivoService);
  protected readonly permisos = inject(PermisosService);

  protected readonly perfiles = PERMISOS;
  protected readonly etqRol = ETQ_ROL;
  protected readonly clrRol = CLR_ROL;
  protected readonly etqEstado = ETQ_ESTADO_CUENTA;
  protected readonly clrEstado = CLR_ESTADO_CUENTA;
  protected readonly etqMetodo = ETQ_METODO_2FA;
  protected readonly etqSeccion = ETQ_SECCION;
  protected readonly etqAccion = ETQ_ACCION;
  protected readonly hoy = hoyIso();
  protected readonly enDias = enDias;
  protected readonly alcance = textoAlcance;
  protected readonly vence = diasParaVencer;

  protected readonly u = signal<UsuarioAdmin | null>(null);
  protected readonly modo = signal<Modo>('editar');
  protected readonly historial = signal<EventoAuditoria[]>([]);
  protected readonly error = signal('');
  protected readonly aviso = signal('');
  protected readonly ocupado = signal(false);
  private huboCambios = false;

  protected readonly rol = signal<Rol>('Supervisor');
  protected readonly externo = signal(false);
  protected readonly empleado = signal<Empleado | null>(null);
  protected readonly busqueda = signal('');
  protected readonly nombres = signal('');
  protected readonly apellidoPaterno = signal('');
  protected readonly apellidoMaterno = signal('');
  protected readonly correo = signal('');
  protected readonly puesto = signal('');
  protected readonly organizacion = signal('');
  protected readonly tipoAlcance = signal<TipoAlcance>('Area');
  protected readonly valores = signal<string[]>([]);
  protected readonly vigencia = signal('');

  protected readonly rolesDisponibles = computed(() => {
    const propios = this.permisos.gestionables();
    const actual = this.u()?.rol;
    return actual && !propios.includes(actual) ? [actual, ...propios] : propios;
  });

  protected readonly coincidencias = computed(() => {
    const q = this.busqueda().trim().toLowerCase();
    if (q.length < 2) return [];
    return this.empleados.filter((e) => e.nombre.toLowerCase().includes(q) || e.numero.includes(q)).slice(0, 5);
  });

  protected readonly opcionesAlcance = computed(() => {
    const t = this.tipoAlcance();
    if (t === 'Proyecto') return this.catalogos.proyectos.map((p) => ({ valor: p.nombre, detalle: `${p.cliente} · ${p.lugar} · ${p.integrantes} personas · ${p.vigencia}` }));
    return (t === 'Sede' ? this.catalogos.sedes : this.catalogos.areas).map((v) => ({ valor: v, detalle: v }));
  });

  protected readonly ayudaAlcance = computed(() => ({
    Proyecto: 'Solo verá a las personas asignadas a estos proyectos, mientras dure su asignación.',
    Sede: 'Verá y atenderá a quienes trabajan en estas sedes.',
    Area: 'Verá y atenderá a quienes pertenecen a estas áreas.',
    Empresa: '' })[this.tipoAlcance()]);

  async ngOnInit() {
    if (this.usuario) {
      this.u.set(this.usuario);
      this.modo.set('ver');
      await this.cargarHistorial();
    } else {
      this.elegirRol(this.permisos.gestionables()[0] ?? 'Supervisor');
    }
  }

  protected iniciales(n: string) { return n.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join(''); }

  protected empleadoVinculado(x: UsuarioAdmin) {
    if (x.externo) return 'Externo, no es colaborador';
    const e = this.empleados.find((y) => y.id === x.empleadoId);
    return e ? `No. ${e.numero} · ${e.departamento} · ${e.sede}` : 'Sin vincular';
  }

  protected elegirRol(r: Rol) {
    this.rol.set(r);
    const p = PERMISOS[r];
    if (!p.permiteExterno) this.externo.set(false);
    if (!p.alcances.includes(this.tipoAlcance())) { this.tipoAlcance.set(p.alcances[0]!); this.valores.set([]); }
    if (p.alcances[0] === 'Empresa') this.valores.set([]);
    if (p.vigenciaObligatoria && !this.vigencia()) this.vigencia.set(enDias(60));
    this.sugerirAlcance();
  }

  protected cambiarTipoAlcance(t: TipoAlcance) {
    this.tipoAlcance.set(t);
    this.valores.set([]);
    this.sugerirAlcance();
  }

  protected alternarValor(v: string) {
    this.valores.update((xs) => (xs.includes(v) ? xs.filter((x) => x !== v) : [...xs, v]));
  }

  protected vincular(e: Empleado) {
    this.empleado.set(e);
    this.busqueda.set('');
    this.fragmentar(e.nombre);
    if (!this.u()) this.correo.set(e.correo);
    this.puesto.set(e.puesto);
    this.sugerirAlcance();
  }

  /** Parte un nombre completo en nombre(s) y apellidos: los dos últimos son los apellidos; lo anterior, el nombre. */
  private fragmentar(completo: string) {
    const t = completo.trim().split(/\s+/).filter(Boolean);
    const [n, p, m] = t.length >= 3 ? [t.slice(0, -2).join(' '), t.at(-2)!, t.at(-1)!] : [t[0] ?? '', t[1] ?? '', ''];
    this.nombres.set(n);
    this.apellidoPaterno.set(p);
    this.apellidoMaterno.set(m);
  }

  private sugerirAlcance() {
    const e = this.empleado();
    if (!e || this.valores().length) return;
    if (this.tipoAlcance() === 'Area') this.valores.set([e.departamento]);
    if (this.tipoAlcance() === 'Sede') this.valores.set([e.sede]);
  }

  protected editar(x: UsuarioAdmin) {
    this.error.set('');
    this.aviso.set('');
    this.rol.set(x.rol);
    this.externo.set(x.externo);
    this.empleado.set(this.empleados.find((e) => e.id === x.empleadoId) ?? null);
    if (x.nombres) {
      this.nombres.set(x.nombres);
      this.apellidoPaterno.set(x.apellidoPaterno ?? '');
      this.apellidoMaterno.set(x.apellidoMaterno ?? '');
    } else this.fragmentar(x.nombre);
    this.correo.set(x.correo);
    this.puesto.set(x.puesto);
    this.organizacion.set(x.organizacion ?? '');
    this.tipoAlcance.set(x.alcance.tipo);
    this.valores.set([...x.alcance.valores]);
    this.vigencia.set(x.vigenciaHasta ?? '');
    this.modo.set('editar');
  }

  protected async guardar() {
    const datos: DatosUsuario = {
      nombre: [this.nombres(), this.apellidoPaterno(), this.apellidoMaterno()].map((x) => x.trim()).filter(Boolean).join(' '),
      nombres: this.nombres(), apellidoPaterno: this.apellidoPaterno(), apellidoMaterno: this.apellidoMaterno(), correo: this.correo(), puesto: this.puesto(), rol: this.rol(),
      alcance: { tipo: PERMISOS[this.rol()].alcances.includes(this.tipoAlcance()) ? this.tipoAlcance() : PERMISOS[this.rol()].alcances[0]!, valores: this.valores() },
      empleadoId: this.empleado()?.id, externo: this.externo(), organizacion: this.organizacion(), vigenciaHasta: this.vigencia() || undefined };
    const actual = this.u();
    await this.ejecutar(async () => {
      const r = actual ? await this.api.actualizarUsuario(actual.id, datos) : await this.api.crearUsuario(datos);
      this.u.set(r);
      this.modo.set('ver');
      this.aviso.set(actual ? 'Cambios guardados y anotados en la bitácora.' : `Invitación enviada a ${r.correo}.`);
      await this.cargarHistorial();
    });
  }

  protected async desactivar(x: UsuarioAdmin) {
    const r = await this.motivos.pedir({
      titulo: `Desactivar a ${x.nombre}`,
      subtitulo: 'Se cierran sus sesiones y deja de entrar al portal. Nada se borra: su historial y lo que aprobó se conservan.',
      etiqueta: 'Motivo de la baja', obligatorio: true,
      sugerencias: ['Baja de la empresa', 'Cambio de puesto', 'Terminó su proyecto', 'Concluyó la auditoría', 'Acceso no autorizado'],
      textoPrincipal: 'Desactivar', colorPrincipal: 'danger' });
    if (!r) return;
    await this.ejecutar(async () => {
      this.u.set(await this.api.cambiarEstadoUsuario(x.id, false, r.texto));
      this.aviso.set('Cuenta desactivada.');
      await this.cargarHistorial();
    });
  }

  protected async reactivar(x: UsuarioAdmin) {
    await this.ejecutar(async () => {
      this.u.set(await this.api.cambiarEstadoUsuario(x.id, true, ''));
      this.aviso.set('Cuenta reactivada.');
      await this.cargarHistorial();
    });
  }

  protected async reenviar(x: UsuarioAdmin) {
    await this.ejecutar(async () => {
      await this.api.reenviarInvitacion(x.id);
      this.aviso.set(`Invitación reenviada a ${x.correo}.`);
      await this.cargarHistorial();
    });
  }

  protected async restablecer2fa(x: UsuarioAdmin) {
    const r = await this.confirmar.pedir({
      peligro: true,
      icono: 'key-outline',
      titulo: '¿Deseas restablecer\nel doble factor?',
      descripcion: `${x.nombre} tendrá que configurar de nuevo su verificación en dos pasos en su próximo inicio de sesión.`,
      textoAceptar: 'Restablecer',
    });
    if (!r) return;
    await this.ejecutar(async () => {
      this.u.set(await this.api.restablecerDobleFactor(x.id));
      this.aviso.set('Deberá configurar su doble autenticación en el próximo inicio de sesión.');
      await this.cargarHistorial();
    });
  }

  protected cambiarVigencia(v: unknown) { this.vigencia.set(v === 'fecha' ? this.enDias(90) : ''); }

  protected cerrar() { return this.ctrl.dismiss(null, this.huboCambios ? 'cambio' : 'cerrado'); }

  private async cargarHistorial() {
    const x = this.u();
    if (!x) return;
    const todo = await this.api.auditoria();
    this.historial.set(todo.filter((h) => h.objeto === `Usuario ${x.nombre}`).slice(0, 6));
  }

  private async ejecutar(fn: () => Promise<void>) {
    this.error.set('');
    this.aviso.set('');
    this.ocupado.set(true);
    try { await fn(); this.huboCambios = true; } catch (e) { this.error.set((e as Error).message); } finally { this.ocupado.set(false); }
  }
}
