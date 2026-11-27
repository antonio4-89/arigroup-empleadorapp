import { InjectionToken } from '@angular/core';
import {
  Alcance, CambiosTurno, NuevoTurno, ResultadoEliminarTurno, MotivoRetardo, Proyecto, AcuseEmpleado, AsistenciaHoy, PuntoTendencia, Checada, Consentimiento, Constancia, Contingencia, ControlCumplimiento, Correccion, DerechoArco, EfectoContingencia, Empleado,
  EntornoDetectado, DispositivoDetalle, DatosLugar, ResultadoEliminarLugar, UbicacionColaborador, EventoAuditoria, Festivo, FilaReporte, Incidencia, JornadaAbierta, JornadaDia, LugarPermitido, MiEstado, MiHorario,
  MiLugar, MiSeguridad, MisSaldos, Metodo2fa, Dispositivo, DispositivoActual, NuevoEmpleado, Notificacion, PreferenciasNotif,
  ResultadoIntegridad, ResumenHoy, Rol, SesionActiva, Solicitud, SolicitudArco, SolicitudLugar, TipoChecada,
  TipoContingencia, TipoIncidencia, TipoLugar, TipoSolicitud, Turno, Usuario, UsuarioAdmin, DireccionLugar, InfoCodigoPostal, PosicionGps, RelojDispositivo,
} from '../models/models';

export type RolApp = 'empleado' | 'empleador';
export const APP_ROL = new InjectionToken<RolApp>('APP_ROL');

export interface NuevaSolicitud { tipo: TipoSolicitud; desde: string; hasta: string; motivo: string; horas?: number; folio?: string; adjunto?: string }
export interface NuevaCorreccion { fecha: string; tipo: TipoChecada; hora: string; motivo: string }
export interface NuevaIncidencia { tipo: TipoIncidencia; descripcion: string; requiereAyuda: boolean }
export interface NuevoLugar {
  nombre: string; tipo: TipoLugar; direccion: string; domicilio: DireccionLugar;
  dias: string; desde: string; hasta: string; motivo: string;
}
export interface OpcionesChecada { retardo?: { motivo?: MotivoRetardo; nota?: string }; codigoKiosco?: string; posicion?: PosicionGps;
  /** Checada guardada en el teléfono sin internet: `horaConfiable` es el momento real, calculado con el reloj de confianza. */
  idLocal?: string; sinRed?: boolean; horaConfiable?: string; reloj?: RelojDispositivo }
export interface UbicacionLugar { latitud: number; longitud: number; radioMetros: number }
export interface NuevaContingencia { tipo: TipoContingencia; alcance: string; efecto: EfectoContingencia; nota: string }
export interface DatosUsuario {
  nombre: string; correo: string; puesto: string; rol: Rol; alcance: Alcance;
  empleadoId?: string; externo: boolean; organizacion?: string; vigenciaHasta?: string;
  /** El nombre se captura fragmentado; `nombre` es el completo, armado con estos tres. */
  nombres?: string; apellidoPaterno?: string; apellidoMaterno?: string;
}
export interface CatalogosUsuarios { sedes: string[]; areas: string[]; proyectos: Proyecto[] }

export abstract class ChecadorApi {
  abstract login(usuario: string, password: string): Promise<{ requiere2fa: boolean }>;
  abstract verificar2fa(codigo: string): Promise<Usuario>;
  abstract recuperarCuenta(usuario: string): Promise<void>;
  abstract salir(): Promise<void>;

  abstract miEstado(): Promise<MiEstado>;
  abstract verificarEntorno(tipo: TipoChecada, posicion?: PosicionGps, reloj?: RelojDispositivo): Promise<EntornoDetectado>;
  abstract horaServidor(): Promise<string>;
  abstract registrarChecada(tipo: TipoChecada, opciones?: OpcionesChecada): Promise<Checada>;
  abstract misDispositivos(actual: DispositivoActual): Promise<Dispositivo[]>;
  abstract solicitarDispositivo(actual: DispositivoActual): Promise<Dispositivo>;
  abstract misLugares(): Promise<MiLugar[]>;
  abstract solicitarLugar(l: NuevoLugar): Promise<MiLugar>;
  /** Devuelve estado, municipio y colonias de un código postal de 5 dígitos, o null si no existe. */
  abstract buscarCodigoPostal(codigoPostal: string): Promise<InfoCodigoPostal | null>;
  abstract reportarIncidencia(i: NuevaIncidencia): Promise<Incidencia>;
  abstract misIncidencias(): Promise<Incidencia[]>;
  abstract miHistorial(): Promise<JornadaDia[]>;
  abstract misSolicitudes(): Promise<Solicitud[]>;
  abstract crearSolicitud(s: NuevaSolicitud): Promise<Solicitud>;
  /** Pasó la hora de salida y el empleado sigue trabajando: pide validar el tiempo extra (no se cuenta solo). */
  abstract continuarJornada(horas: number, motivo: string): Promise<Solicitud>;
  abstract miConsentimiento(): Promise<Consentimiento>;
  abstract aceptarConsentimiento(): Promise<Consentimiento>;
  abstract reiniciarConsentimiento(): Promise<void>;
  abstract misSesiones(): Promise<SesionActiva[]>;
  abstract cerrarSesionRemota(id: string): Promise<void>;
  abstract cerrarOtrasSesiones(): Promise<void>;
  abstract miSeguridad(): Promise<MiSeguridad>;
  abstract cambiarMetodo2fa(m: Metodo2fa): Promise<MiSeguridad>;
  abstract misArco(): Promise<SolicitudArco[]>;
  abstract solicitarArco(derecho: DerechoArco, detalle: string): Promise<SolicitudArco>;
  abstract miHorario(): Promise<MiHorario>;
  abstract misSaldos(): Promise<MisSaldos>;
  abstract misCorrecciones(): Promise<Correccion[]>;
  abstract solicitarCorreccion(c: NuevaCorreccion): Promise<Correccion>;
  abstract misNotificaciones(): Promise<Notificacion[]>;
  abstract marcarNotificacionesLeidas(): Promise<void>;
  abstract misPreferenciasNotif(): Promise<PreferenciasNotif>;
  abstract guardarPreferenciasNotif(p: PreferenciasNotif): Promise<PreferenciasNotif>;
  abstract miConstancia(mes?: string): Promise<Constancia>;
  abstract acusarConstancia(mes: string, conforme: boolean, observacion?: string): Promise<Constancia>;

  abstract resumenHoy(): Promise<ResumenHoy>;
  abstract checadasRecientes(soloPorRevisar?: boolean): Promise<Checada[]>;
  abstract empleados(): Promise<Empleado[]>;
  abstract solicitudes(): Promise<Solicitud[]>;
  abstract resolverSolicitud(id: string, aprobar: boolean, comentario?: string): Promise<Solicitud>;
  abstract lugares(): Promise<LugarPermitido[]>;
  abstract crearLugar(datos: DatosLugar): Promise<LugarPermitido>;
  abstract modificarLugar(id: string, datos: DatosLugar): Promise<LugarPermitido>;
  /** Da de baja el lugar. Si tiene colaboradores asignados hay que indicar a qué lugar pasarlos. */
  abstract eliminarLugar(id: string, destinoId?: string): Promise<ResultadoEliminarLugar>;
  /** Última ubicación de hoy de cada colaborador y si está en su lugar de trabajo. */
  abstract ubicacionesColaboradores(): Promise<UbicacionColaborador[]>;
  abstract solicitudesLugar(): Promise<SolicitudLugar[]>;
  abstract resolverSolicitudLugar(id: string, aprobar: boolean, comentario?: string, ubicacion?: UbicacionLugar): Promise<SolicitudLugar>;
  abstract dispositivos(): Promise<Dispositivo[]>;
  /** Equipos de un colaborador con su uso (checadas totales, de los últimos 30 días y las más recientes). */
  abstract dispositivosDe(empleadoId: string): Promise<DispositivoDetalle[]>;
  /** Jornadas de un colaborador día por día, de la más antigua a la más reciente. Sin fechas, los últimos 30 días. */
  abstract historialDe(empleadoId: string, desde?: string, hasta?: string): Promise<JornadaDia[]>;
  abstract resolverDispositivo(id: string, aprobar: boolean, comentario?: string): Promise<Dispositivo>;
  abstract incidencias(): Promise<Incidencia[]>;
  abstract atenderIncidencia(id: string, respuesta: string, cerrar?: boolean): Promise<Incidencia>;
  abstract contingencias(): Promise<Contingencia[]>;
  abstract declararContingencia(c: NuevaContingencia): Promise<Contingencia>;
  abstract cerrarContingencia(id: string): Promise<Contingencia>;
  abstract reporteSemana(): Promise<FilaReporte[]>;
  abstract verificarIntegridad(): Promise<ResultadoIntegridad>;
  abstract simularAlteracion(restaurar: boolean): Promise<void>;
  abstract auditoria(): Promise<EventoAuditoria[]>;
  abstract registrarExportacion(detalle: string): Promise<void>;
  abstract usuariosAdmin(): Promise<UsuarioAdmin[]>;
  abstract catalogosUsuarios(): Promise<CatalogosUsuarios>;
  abstract crearUsuario(d: DatosUsuario): Promise<UsuarioAdmin>;
  abstract actualizarUsuario(id: string, d: DatosUsuario): Promise<UsuarioAdmin>;
  abstract cambiarEstadoUsuario(id: string, activo: boolean, motivo: string): Promise<UsuarioAdmin>;
  abstract reenviarInvitacion(id: string): Promise<UsuarioAdmin>;
  abstract restablecerDobleFactor(id: string): Promise<UsuarioAdmin>;
  abstract arco(): Promise<SolicitudArco[]>;
  abstract atenderArco(id: string, respuesta: string): Promise<SolicitudArco>;
  abstract turnos(): Promise<Turno[]>;
  abstract crearFestivo(festivo: Festivo): Promise<Festivo>;
  abstract modificarFestivo(fechaActual: string, cambios: Festivo): Promise<Festivo>;
  abstract eliminarFestivo(fecha: string): Promise<void>;
  abstract crearTurno(turno: NuevoTurno): Promise<Turno>;
  /** Si el turno tiene colaboradores hay que indicar a qué turno pasarlos; queda registrado de dónde vienen. */
  abstract eliminarTurno(id: string, destinoId?: string): Promise<ResultadoEliminarTurno>;
  abstract configurarTurno(id: string, cambios: CambiosTurno): Promise<Turno>;
  /** Comida individual de un empleado; null la quita y vuelve a aplicar la del turno. */
  abstract pactarComida(empleadoId: string, minutos: number | null, fundamento: string): Promise<Empleado>;
  abstract asignarTurno(empleadoId: string, turnoId: string): Promise<Empleado>;
  abstract festivos(): Promise<Festivo[]>;
  abstract correcciones(): Promise<Correccion[]>;
  abstract resolverCorreccion(id: string, aprobar: boolean, comentario?: string): Promise<Correccion>;
  abstract jornadasPorCerrar(): Promise<JornadaAbierta[]>;
  abstract pedirCierre(id: string): Promise<JornadaAbierta>;
  abstract asistenciaHoy(sede?: string): Promise<AsistenciaHoy>;
  abstract tendenciaAsistencia(): Promise<PuntoTendencia[]>;
  abstract acuses(): Promise<AcuseEmpleado[]>;
  abstract cumplimiento(): Promise<ControlCumplimiento[]>;
  abstract importarEmpleados(filas: NuevoEmpleado[]): Promise<number>;
}
