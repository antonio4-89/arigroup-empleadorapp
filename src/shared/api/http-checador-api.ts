import { Injectable, InjectionToken, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  AcuseEmpleado, DispositivoDetalle, DatosLugar, ResultadoEliminarLugar, UbicacionColaborador, AsistenciaHoy, ControlCumplimiento, Contingencia, Empleado, EventoAuditoria, Festivo, FilaReporte, JornadaAbierta, LugarPermitido, PuntoTendencia,
  ResultadoIntegridad, ResumenHoy, SolicitudLugar, Turno, UsuarioAdmin, DerechoArco, NuevoEmpleado,
  Checada, Consentimiento, Constancia, Correccion, Dispositivo, DispositivoActual, EntornoDetectado, Incidencia, InfoCodigoPostal, JornadaDia,
  Metodo2fa, MiEstado, MiHorario, MiLugar, MiSeguridad, MisSaldos, Notificacion, PosicionGps, PreferenciasNotif, RelojDispositivo, SesionActiva,
  Solicitud, SolicitudArco, TipoChecada, Usuario, CambiosTurno, NuevoTurno, ResultadoEliminarTurno,
} from '../models/models';
import { SessionService } from '../auth/session.service';
import { clave } from '../ui/almacen';
import { huellaDispositivo } from '../ui/huella';
import { CatalogosUsuarios, ChecadorApi, DatosUsuario, UbicacionLugar, NuevaContingencia, NuevaCorreccion, NuevaIncidencia, NuevaSolicitud, NuevoLugar, OpcionesChecada } from './checador-api';

export const API_URL = new InjectionToken<string>('API_URL');

interface Tokens { acceso: string; refresco: string }
interface RespuestaSesion { usuario: Usuario; accessToken: string; refreshToken: string }
interface ProblemaHttp { title?: string; detail?: string; errors?: Record<string, string[]> }

const TIEMPO_MAXIMO_MS = 20_000;
const KEY_TOKENS = clave('tokens');
const CAMPOS_DE_FECHA = new Set(['desde', 'hasta', 'fecha', 'hora']);

@Injectable()
export class HttpChecadorApi extends ChecadorApi {
  private readonly base = inject(API_URL).replace(/\/$/, '');
  private readonly sesion = inject(SessionService);
  private readonly router = inject(Router);
  private desafio = '';
  private renovando: Promise<boolean> | null = null;

  async login(usuario: string, password: string) {
    const r = await this.llamar<{ requiere2fa: boolean; desafio: string }>('POST', '/api/auth/login', { usuario: usuario.trim(), password }, false);
    this.desafio = r.desafio;
    return { requiere2fa: r.requiere2fa };
  }

  async verificar2fa(codigo: string): Promise<Usuario> {
    const dispositivo = await huellaDispositivo();
    const r = await this.llamar<RespuestaSesion>('POST', '/api/auth/verificar-2fa', { desafio: this.desafio, codigo: codigo.trim(), dispositivo }, false);
    this.guardarTokens({ acceso: r.accessToken, refresco: r.refreshToken });
    this.desafio = '';
    return r.usuario;
  }

  recuperarCuenta(usuario: string) { return this.llamar<void>('POST', '/api/auth/recuperar-cuenta', { usuario: usuario.trim() }, false); }

  async salir() {
    try { await this.llamar<void>('POST', '/api/auth/salir'); } catch { }
    this.guardarTokens(null);
  }

  miEstado() { return this.llamar<MiEstado>('GET', '/api/yo/estado'); }

  async verificarEntorno(tipo: TipoChecada, posicion?: PosicionGps, reloj?: RelojDispositivo) {
    const { huella } = await huellaDispositivo();
    return this.llamar<EntornoDetectado>('POST', '/api/checadas/entorno', { tipo, posicion, reloj, huellaDispositivo: huella });
  }

  async horaServidor() { return this.llamar<string>('GET', '/api/hora-servidor', undefined, false); }

  async registrarChecada(tipo: TipoChecada, o: OpcionesChecada = {}) {
    const { huella } = await huellaDispositivo();
    return this.llamar<Checada>('POST', '/api/checadas', {
      tipo, retardo: o.retardo, codigoKiosco: o.codigoKiosco, posicion: o.posicion, reloj: o.reloj, idLocal: o.idLocal,
      sinRed: o.sinRed ?? false, horaConfiable: o.horaConfiable, huellaDispositivo: huella,
    });
  }

  misDispositivos(_: DispositivoActual) { return this.llamar<Dispositivo[]>('GET', '/api/dispositivos/mios'); }
  solicitarDispositivo(actual: DispositivoActual) { return this.llamar<Dispositivo>('POST', '/api/dispositivos', actual); }

  misLugares() { return this.llamar<MiLugar[]>('GET', '/api/lugares/mios'); }
  solicitarLugar(l: NuevoLugar) { return this.llamar<MiLugar>('POST', '/api/lugares/solicitudes', l); }

  async buscarCodigoPostal(codigoPostal: string): Promise<InfoCodigoPostal | null> {
    try {
      const r = await this.llamar<{ codigoPostal: string; estado: string; municipio: string; colonias: string[] }>('GET', `/api/catalogos/codigos-postales/${encodeURIComponent(codigoPostal.trim())}`);
      return r as InfoCodigoPostal;
    } catch (e) {
      if (e instanceof ErrorApi && (e.estado === 404 || e.estado === 422)) return null;
      throw e;
    }
  }

  reportarIncidencia(i: NuevaIncidencia) { return this.llamar<Incidencia>('POST', '/api/incidencias', i); }
  misIncidencias() { return this.llamar<Incidencia[]>('GET', '/api/incidencias'); }

  miHistorial() { return this.llamar<JornadaDia[]>('GET', '/api/yo/historial'); }

  misSolicitudes() { return this.llamar<Solicitud[]>('GET', '/api/solicitudes'); }
  crearSolicitud(s: NuevaSolicitud) { return this.llamar<Solicitud>('POST', '/api/solicitudes', s); }
  continuarJornada(horas: number, motivo: string) { return this.llamar<Solicitud>('POST', '/api/jornada/continuar', { horas, motivo }); }

  miConsentimiento() { return this.llamar<Consentimiento>('GET', '/api/consentimiento'); }
  aceptarConsentimiento() { return this.llamar<Consentimiento>('POST', '/api/consentimiento'); }
  reiniciarConsentimiento() { return this.llamar<void>('DELETE', '/api/consentimiento'); }

  misSesiones() { return this.llamar<SesionActiva[]>('GET', '/api/sesiones'); }
  cerrarSesionRemota(id: string) { return this.llamar<void>('DELETE', `/api/sesiones/${encodeURIComponent(id)}`); }
  cerrarOtrasSesiones() { return this.llamar<void>('DELETE', '/api/sesiones/otras'); }
  miSeguridad() { return this.llamar<MiSeguridad>('GET', '/api/seguridad'); }
  cambiarMetodo2fa(metodo: Metodo2fa) { return this.llamar<MiSeguridad>('PUT', '/api/seguridad/metodo-2fa', { metodo }); }

  misArco() { return this.llamar<SolicitudArco[]>('GET', '/api/arco'); }
  solicitarArco(derecho: DerechoArco, detalle: string) { return this.llamar<SolicitudArco>('POST', '/api/arco', { derecho, detalle }); }

  miHorario() { return this.llamar<MiHorario>('GET', '/api/yo/horario'); }
  misSaldos() { return this.llamar<MisSaldos>('GET', '/api/yo/saldos'); }

  misCorrecciones() { return this.llamar<Correccion[]>('GET', '/api/correcciones'); }
  solicitarCorreccion(c: NuevaCorreccion) { return this.llamar<Correccion>('POST', '/api/correcciones', c); }

  misNotificaciones() { return this.llamar<Notificacion[]>('GET', '/api/notificaciones'); }
  marcarNotificacionesLeidas() { return this.llamar<void>('POST', '/api/notificaciones/marcar-leidas'); }
  misPreferenciasNotif() { return this.llamar<PreferenciasNotif>('GET', '/api/notificaciones/preferencias'); }
  guardarPreferenciasNotif(p: PreferenciasNotif) { return this.llamar<PreferenciasNotif>('PUT', '/api/notificaciones/preferencias', p); }

  miConstancia(mes?: string) { return this.llamar<Constancia>('GET', `/api/yo/constancias${mes ? `/${encodeURIComponent(mes)}` : ''}`); }
  acusarConstancia(mes: string, conforme: boolean, observacion?: string) {
    return this.llamar<Constancia>('POST', `/api/yo/constancias/${encodeURIComponent(mes)}/acuse`, { conforme, observacion });
  }

  // ── Portal de RH ───────────────────────────────────────────────

  resumenHoy() { return this.llamar<ResumenHoy>('GET', '/api/rh/resumen-hoy'); }
  checadasRecientes(soloPorRevisar = false) { return this.llamar<Checada[]>('GET', `/api/rh/checadas?soloPorRevisar=${soloPorRevisar}`); }
  empleados() { return this.llamar<Empleado[]>('GET', '/api/rh/empleados'); }

  solicitudes() { return this.llamar<Solicitud[]>('GET', '/api/rh/solicitudes'); }
  resolverSolicitud(id: string, aprobar: boolean, comentario?: string) { return this.resolver<Solicitud>('solicitudes', id, aprobar, comentario); }

  correcciones() { return this.llamar<Correccion[]>('GET', '/api/rh/correcciones'); }
  resolverCorreccion(id: string, aprobar: boolean, comentario?: string) { return this.resolver<Correccion>('correcciones', id, aprobar, comentario); }

  lugares() { return this.llamar<LugarPermitido[]>('GET', '/api/rh/lugares'); }
  dispositivosDe(empleadoId: string) { return this.llamar<DispositivoDetalle[]>('GET', `/api/rh/empleados/${encodeURIComponent(empleadoId)}/dispositivos`); }
  historialDe(empleadoId: string, desde?: string, hasta?: string) {
    const q = [desde ? `desde=${desde}` : '', hasta ? `hasta=${hasta}` : ''].filter(Boolean).join('&');
    return this.llamar<JornadaDia[]>('GET', `/api/rh/empleados/${encodeURIComponent(empleadoId)}/historial${q ? `?${q}` : ''}`);
  }
  crearLugar(datos: DatosLugar) { return this.llamar<LugarPermitido>('POST', '/api/rh/lugares', datos); }
  modificarLugar(id: string, datos: DatosLugar) { return this.llamar<LugarPermitido>('PUT', `/api/rh/lugares/${encodeURIComponent(id)}`, datos); }
  eliminarLugar(id: string, destinoId?: string) {
    const q = destinoId ? `?destinoId=${encodeURIComponent(destinoId)}` : '';
    return this.llamar<ResultadoEliminarLugar>('DELETE', `/api/rh/lugares/${encodeURIComponent(id)}${q}`);
  }
  ubicacionesColaboradores() { return this.llamar<UbicacionColaborador[]>('GET', '/api/rh/lugares/ubicaciones'); }
  solicitudesLugar() { return this.llamar<SolicitudLugar[]>('GET', '/api/rh/lugares/solicitudes'); }
  resolverSolicitudLugar(id: string, aprobar: boolean, comentario?: string, ubicacion?: UbicacionLugar) {
    return this.llamar<SolicitudLugar>('POST', `/api/rh/lugares/solicitudes/${encodeURIComponent(id)}/resolver`, { aprobar, comentario, ...ubicacion });
  }

  dispositivos() { return this.llamar<Dispositivo[]>('GET', '/api/rh/dispositivos'); }
  resolverDispositivo(id: string, aprobar: boolean, comentario?: string) { return this.resolver<Dispositivo>('dispositivos', id, aprobar, comentario); }

  incidencias() { return this.llamar<Incidencia[]>('GET', '/api/rh/incidencias'); }
  atenderIncidencia(id: string, respuesta: string, cerrar = false) { return this.llamar<Incidencia>('POST', `/api/rh/incidencias/${encodeURIComponent(id)}/atender`, { respuesta, cerrar }); }

  contingencias() { return this.llamar<Contingencia[]>('GET', '/api/rh/contingencias'); }
  declararContingencia(c: NuevaContingencia) { return this.llamar<Contingencia>('POST', '/api/rh/contingencias', c); }
  cerrarContingencia(id: string) { return this.llamar<Contingencia>('POST', `/api/rh/contingencias/${encodeURIComponent(id)}/cerrar`); }

  jornadasPorCerrar() { return this.llamar<JornadaAbierta[]>('GET', '/api/rh/jornadas-por-cerrar'); }
  pedirCierre(id: string) { return this.llamar<JornadaAbierta>('POST', `/api/rh/jornadas/${encodeURIComponent(id)}/pedir-cierre`); }

  asistenciaHoy(sede?: string) { return this.llamar<AsistenciaHoy>('GET', `/api/rh/asistencia-hoy${sede ? `?sede=${encodeURIComponent(sede)}` : ''}`); }
  tendenciaAsistencia() { return this.llamar<PuntoTendencia[]>('GET', '/api/rh/tendencia'); }
  turnos() { return this.llamar<Turno[]>('GET', '/api/rh/turnos'); }
  festivos() { return this.llamar<Festivo[]>('GET', '/api/rh/festivos'); }
  auditoria() { return this.llamar<EventoAuditoria[]>('GET', '/api/rh/auditoria'); }

  reporteSemana() { return this.llamar<FilaReporte[]>('GET', '/api/rh/reporte-semana'); }
  acuses() { return this.llamar<AcuseEmpleado[]>('GET', '/api/rh/acuses'); }
  cumplimiento() { return this.llamar<ControlCumplimiento[]>('GET', '/api/rh/cumplimiento'); }
  verificarIntegridad() { return this.llamar<ResultadoIntegridad>('POST', '/api/rh/integridad'); }
  registrarExportacion(detalle: string) { return this.llamar<void>('POST', '/api/rh/exportaciones', { detalle }); }
  async simularAlteracion(): Promise<void> { }

  arco() { return this.llamar<SolicitudArco[]>('GET', '/api/rh/arco'); }
  atenderArco(id: string, respuesta: string) { return this.llamar<SolicitudArco>('POST', `/api/rh/arco/${encodeURIComponent(id)}/atender`, { respuesta }); }

  usuariosAdmin() { return this.llamar<UsuarioAdmin[]>('GET', '/api/rh/usuarios'); }
  catalogosUsuarios() { return this.llamar<CatalogosUsuarios>('GET', '/api/rh/usuarios/catalogos'); }
  crearUsuario(d: DatosUsuario) { return this.llamar<UsuarioAdmin>('POST', '/api/rh/usuarios', d); }
  actualizarUsuario(id: string, d: DatosUsuario) { return this.llamar<UsuarioAdmin>('PUT', `/api/rh/usuarios/${encodeURIComponent(id)}`, d); }
  cambiarEstadoUsuario(id: string, activo: boolean, motivo: string) { return this.llamar<UsuarioAdmin>('POST', `/api/rh/usuarios/${encodeURIComponent(id)}/estado`, { activo, motivo }); }
  reenviarInvitacion(id: string) { return this.llamar<UsuarioAdmin>('POST', `/api/rh/usuarios/${encodeURIComponent(id)}/invitacion`); }
  restablecerDobleFactor(id: string) { return this.llamar<UsuarioAdmin>('POST', `/api/rh/usuarios/${encodeURIComponent(id)}/restablecer-2fa`); }

  crearFestivo(f: Festivo) { return this.llamar<Festivo>('POST', '/api/rh/festivos', f); }
  modificarFestivo(fechaActual: string, cambios: Festivo) { return this.llamar<Festivo>('PUT', `/api/rh/festivos/${encodeURIComponent(fechaActual)}`, cambios); }
  eliminarFestivo(fecha: string) { return this.llamar<void>('DELETE', `/api/rh/festivos/${encodeURIComponent(fecha)}`); }
  crearTurno(turno: NuevoTurno) { return this.llamar<Turno>('POST', '/api/rh/turnos', turno); }
  eliminarTurno(id: string, destinoId?: string) {
    const q = destinoId ? `?destinoId=${encodeURIComponent(destinoId)}` : '';
    return this.llamar<ResultadoEliminarTurno>('DELETE', `/api/rh/turnos/${encodeURIComponent(id)}${q}`);
  }
  configurarTurno(id: string, cambios: CambiosTurno) { return this.llamar<Turno>('PUT', `/api/rh/turnos/${encodeURIComponent(id)}`, cambios); }
  pactarComida(empleadoId: string, minutos: number | null, fundamento: string) {
    return this.llamar<Empleado>('PUT', `/api/rh/empleados/${encodeURIComponent(empleadoId)}/comida`, { minutos, fundamento });
  }
  asignarTurno(empleadoId: string, turnoId: string) { return this.llamar<Empleado>('PUT', `/api/rh/empleados/${encodeURIComponent(empleadoId)}/turno`, { turnoId }); }
  importarEmpleados(filas: NuevoEmpleado[]) { return this.llamar<number>('POST', '/api/rh/empleados/importar', filas); }

  private resolver<T>(coleccion: string, id: string, aprobar: boolean, comentario?: string) {
    return this.llamar<T>('POST', `/api/rh/${coleccion}/${encodeURIComponent(id)}/resolver`, { aprobar, comentario });
  }

  private async llamar<T>(metodo: string, ruta: string, cuerpo?: unknown, conSesion = true): Promise<T> {
    let r = await this.enviar(metodo, ruta, cuerpo, conSesion);
    if (r.status === 401 && conSesion) {
      if (await this.renovar()) r = await this.enviar(metodo, ruta, cuerpo, conSesion);
      if (r.status === 401) { await this.expirar(); }
    }
    if (!r.ok) throw await this.errorDe(r);
    if (r.status === 204) return undefined as T;
    const texto = await r.text();
    return (texto ? JSON.parse(texto) : undefined) as T;
  }

  private enviar(metodo: string, ruta: string, cuerpo: unknown, conSesion: boolean) {
    const cabeceras: Record<string, string> = { Accept: 'application/json' };
    if (cuerpo !== undefined) cabeceras['Content-Type'] = 'application/json';
    const tokens = conSesion ? this.leerTokens() : null;
    if (tokens) cabeceras['Authorization'] = `Bearer ${tokens.acceso}`;
    return fetch(this.base + ruta, {
      method: metodo, headers: cabeceras, body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo, (k, v) => (v === '' && CAMPOS_DE_FECHA.has(k) ? null : v)), signal: AbortSignal.timeout(TIEMPO_MAXIMO_MS),
    });
  }

  /** Varias llamadas pueden recibir 401 a la vez; el token de refresco rota, así que solo una debe renovarlo. */
  private renovar(): Promise<boolean> {
    this.renovando ??= this.renovarUnaVez().finally(() => { this.renovando = null; });
    return this.renovando;
  }

  private async renovarUnaVez(): Promise<boolean> {
    const tokens = this.leerTokens();
    if (!tokens) return false;
    try {
      const r = await this.enviar('POST', '/api/auth/refrescar', { refreshToken: tokens.refresco }, false);
      if (!r.ok) return false;
      const s = (await r.json()) as RespuestaSesion;
      this.guardarTokens({ acceso: s.accessToken, refresco: s.refreshToken });
      return true;
    } catch {
      return false;
    }
  }

  private async expirar() {
    this.guardarTokens(null);
    if (!this.sesion.autenticado()) return;
    this.sesion.cerrar();
    await this.router.navigateByUrl('/login');
  }

  private async errorDe(r: Response): Promise<ErrorApi> {
    let p: ProblemaHttp = {};
    try { p = (await r.json()) as ProblemaHttp; } catch { }
    const validacion = p.errors ? Object.values(p.errors).flat()[0] : undefined;
    const mensaje = validacion ?? p.detail ?? p.title ?? (r.status >= 500 ? 'El servidor no pudo atender la solicitud. Intenta de nuevo en un momento.' : 'No se pudo completar la acción.');
    return new ErrorApi(mensaje, r.status);
  }

  private leerTokens(): Tokens | null {
    try { return JSON.parse(sessionStorage.getItem(KEY_TOKENS) ?? 'null'); } catch { return null; }
  }

  private guardarTokens(t: Tokens | null) {
    try { if (t) sessionStorage.setItem(KEY_TOKENS, JSON.stringify(t)); else sessionStorage.removeItem(KEY_TOKENS); } catch { }
  }
}

export class ErrorApi extends Error {
  constructor(mensaje: string, readonly estado: number) { super(mensaje); }
}
