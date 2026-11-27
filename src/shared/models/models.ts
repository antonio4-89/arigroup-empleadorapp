export type Rol = 'Empleado' | 'LiderProyecto' | 'Supervisor' | 'RH' | 'Admin' | 'Auditor';
export type TipoChecada = 'Entrada' | 'SalidaComida' | 'RegresoComida' | 'Salida';
export type Validacion = 'Valida' | 'PorRevisar' | 'FueraDeLugar';
export type Origen = 'Movil' | 'Web' | 'Kiosco' | 'Correccion';

export interface Coordenada { latitud: number; longitud: number }
export type Modalidad = 'Presencial' | 'HomeOffice' | 'Hibrido' | 'Itinerante';
export type TipoJornada = 'Diurna' | 'Nocturna' | 'Mixta';
export type EstadoHoy = 'Presente' | 'EnComida' | 'Salio' | 'Retardo' | 'Ausente' | 'Vacaciones' | 'Incapacidad';

export type EscenarioUbicacion =
  | 'Sede' | 'HomeOffice' | 'LugarPendiente' | 'Fuera' | 'VPN' | 'UbicacionFalsa' | 'AppTercero' | 'SinRed'
  | 'SinRedReinicio' | 'HoraManipulada' | 'DispositivoNuevo' | 'DispositivoModificado';

export interface Usuario {
  id: string;
  nombre: string;
  rol: Rol;
  empleadoId?: string;
}

export interface Empleado {
  id: string;
  numero: string;
  nombre: string;
  puesto: string;
  departamento: string;
  sede: string;
  modalidad: Modalidad;
  tipoJornada: TipoJornada;
  horario: string;
  turnoId: string;
  /** Comida pactada individualmente; si no existe, aplica la del turno. */
  comidaPactada?: { minutos: number; fundamento: string };
  correo: string;
  cuenta: 'Activa' | 'Invitada';
  fechaIngreso: string;
  estadoHoy: EstadoHoy;
}

export interface Checada {
  id: string;
  empleadoId: string;
  empleado: string;
  tipo: TipoChecada;
  horaServidor: string;
  lugar: string;
  validacion: Validacion;
  motivos: string[];
  diferida: boolean;
  origen: Origen;
  contingenciaId?: string;
  folio: string;
  senales?: Senal[];
  /** Solo en entradas o regresos de comida fuera de tolerancia. La hora nunca cambia; el motivo es contexto para RH. */
  retardo?: RetardoChecada;
  /** En regresos de comida: minutos que duró el descanso. */
  descansoMin?: number;
  sello: string;
  selloAnterior: string;
  posicion?: Coordenada;
  /** Solo en checadas diferidas: cuándo llegó al servidor. `horaServidor` conserva el momento real de la checada. */
  recibidaEl?: string;
  /** Solo si el reloj del teléfono no coincidía con el oficial: la hora que mostraba el teléfono. */
  horaDispositivo?: string;
}

/** Motivos de retardo. Los de casa no incluyen transporte: en home office no hay traslado. */
export type MotivoRetardo =
  | 'Transporte' | 'CitaMedica' | 'AsuntoPersonal' | 'InstruccionJefe' | 'FallaInternetLuz' | 'FallaEquipoEmpresa' | 'Otro';

/** Entrada: llegó después de la tolerancia. Comida: regresó después de la comida pactada más su tolerancia. */
export type ClaseRetardo = 'Entrada' | 'Comida';

export interface RetardoChecada {
  clase: ClaseRetardo;
  /** Minutos después de lo esperado: la hora de entrada o el fin de la comida pactada (sin descontar tolerancia). */
  minutos: number;
  toleranciaMin: number;
  horaEntrada?: string;
  comidaPactadaMin?: number;
  comidaRealMin?: number;
  /** Vacío cuando el empleado eligió explicarlo después. */
  motivo?: MotivoRetardo;
  nota?: string;
  desdeCasa: boolean;
}

/** ComidaCorta: el descanso duró menos de 30 min, el mínimo de ley en jornada continua (art. 63 LFT). */
export type EstadoPuntualidad = 'ATiempo' | 'EnTolerancia' | 'Retardo' | 'ComidaCorta';

/** Mínimo legal de descanso durante la jornada continua (art. 63 LFT). */
export const DESCANSO_MINIMO_MIN = 30;

export interface Puntualidad {
  clase: ClaseRetardo;
  toleranciaMin: number;
  /** Hora oficial (servidor) con la que se registraría la checada. */
  horaRegistro: string;
  minutosTarde: number;
  estado: EstadoPuntualidad;
  horaEntrada?: string;
  comidaPactadaMin?: number;
  comidaRealMin?: number;
  inicioComida?: string;
}

export type EstadoDia = 'Normal' | 'Retardo' | 'Falta' | 'Descanso' | 'Festivo' | 'Vacaciones' | 'Incapacidad';

export interface JornadaDia {
  fecha: string;
  estado: EstadoDia;
  entrada?: string;
  salida?: string;
  horasOrdinarias: number;
  extraDobles: number;
  extraTriples: number;
  minutosRetardo: number;
  alertas: string[];
  extraAutorizada?: boolean;
}

export type TipoSolicitud = 'Permiso' | 'Vacaciones' | 'HorasExtra' | 'Incapacidad' | 'Comision';
export type EstadoSolicitud = 'Pendiente' | 'Aprobada' | 'Rechazada';

export interface Solicitud {
  id: string;
  empleadoId: string;
  empleado: string;
  tipo: TipoSolicitud;
  desde: string;
  hasta: string;
  motivo: string;
  estado: EstadoSolicitud;
  creada: string;
  comentarioResolucion?: string;
  horas?: number;
  folio?: string;
  adjunto?: string;
}

export type TipoLugar = 'Sede' | 'HomeOffice' | 'Cliente' | 'Itinerante' | 'Contingencia';

export interface DatosLugar {
  nombre: string;
  tipo: TipoLugar;
  direccion: string;
  radioMetros?: number;
  latitud?: number;
  longitud?: number;
}

export interface ResultadoEliminarLugar { movidos: number }

/** Dónde se registró por última vez cada colaborador hoy y si estaba en su lugar de trabajo. */
export type EstadoUbicacion = 'EnSuLugar' | 'FueraDeLugar' | 'SinUbicacion' | 'Salio' | 'SinChecada';

export interface UbicacionColaborador {
  empleadoId: string;
  nombre: string;
  numero: string;
  departamento: string;
  estado: EstadoUbicacion;
  /** Última checada de hoy; no hay seguimiento continuo. */
  tipo?: TipoChecada;
  hora?: string;
  latitud?: number;
  longitud?: number;
  precisionMetros?: number;
  lugarDetectado?: string;
  lugaresAsignados: string[];
  /** Metros al lugar asignado más cercano; solo cuando está fuera de su lugar. */
  distanciaMetros?: number;
}

export interface LugarPermitido {
  id: string;
  nombre: string;
  tipo: TipoLugar;
  direccion: string;
  radioMetros?: number;
  latitud?: number;
  longitud?: number;
  vigencia: string;
  empleadosAsignados: number;
  redes: string[];
}

export type TipoContingencia = 'Apagon' | 'Sismo' | 'Huracan' | 'Sanitaria' | 'FallaSistema' | 'Bloqueo' | 'Otro';
export type EfectoContingencia = 'ToleranciaAmpliada' | 'SinRetardoNiFalta' | 'TrabajoRemoto' | 'JornadaSuspendida';

export interface Contingencia {
  id: string;
  tipo: TipoContingencia;
  alcance: string;
  inicio: string;
  fin?: string;
  efecto: EfectoContingencia;
  nota: string;
  declaradaPor: string;
  activa: boolean;
  checadasAfectadas: number;
}

export interface ResumenHoy {
  fecha: string;
  plantilla: number;
  presentes: number;
  enComida: number;
  retardos: number;
  ausentes: number;
  porRevisar: number;
  solicitudesPendientes: number;
  lugaresPendientes: number;
  dispositivosPendientes: number;
  incidenciasAbiertas: number;
  ayudaUrgente: number;
  correccionesPendientes: number;
  jornadasSinCierre: number;
  arcoPendientes: number;
  contingenciaActiva?: Contingencia;
}

export interface FilaReporte {
  empleadoId: string;
  empleado: string;
  diasTrabajados: number;
  horasOrdinarias: number;
  extraDobles: number;
  extraTriples: number;
  retardos: number;
  faltas: number;
  alertas: number;
  diasConExtra: number;
  extraSinAutorizar: number;
}

export interface MiEstado {
  empleado: Empleado;
  checadasHoy: Checada[];
  siguientes: TipoChecada[];
  saldoVacacionesDias: number;
  dispositivo: { nombre: string; vinculadoEl: string };
  contingenciaActiva?: Contingencia;
  resumen: MiResumen;
  pendientes: Pendiente[];
  enColaOffline: number;
  notificacionesSinLeer: number;
  /** Presente cuando ya pasó la hora de salida del turno y no hay checada de salida. */
  jornadaFuera?: JornadaFuera;
}

export interface MiResumen {
  horasHoy: number;
  horasSemana: number;
  metaSemana: number;
  extraSemana: number;
  retardosMes: number;
  faltasMes: number;
}

export interface Pendiente {
  id: string;
  tipo: 'AcuseConformidad' | 'SolicitudEnTramite' | 'LugarEnRevision' | 'CorreccionPendiente' | 'CierrePendiente';
  titulo: string;
  detalle: string;
  ruta?: string;
}

export type EstadoSenal = 'ok' | 'alerta' | 'falla';

export interface Senal {
  id: 'gps' | 'ip' | 'vpn' | 'simulada' | 'apps' | 'hora' | 'dispositivo' | 'red';
  etiqueta: string;
  estado: EstadoSenal;
  detalle: string;
}

export type EstadoReloj = 'ok' | 'alterado' | 'noVerificable';

export interface RelojDispositivo {
  estado: EstadoReloj;
  desfaseSegundos: number;
  horaDispositivo: string;
}

export interface PosicionGps {
  latitud: number;
  longitud: number;
  precisionMetros: number;
  momento: string;
}

export interface EntornoDetectado {
  lugar?: { id: string; nombre: string; tipo: TipoLugar };
  /** Solo al registrar la entrada en un día laboral del turno. */
  puntualidad?: Puntualidad;
  gps: { latitud: number; longitud: number; precisionMetros: number };
  ip: { direccion: string; ciudad: string; proveedor: string; distanciaGpsKm: number };
  senales: Senal[];
  validacionPrevista: Validacion;
  motivos: string[];
  sinRed: boolean;
  desfaseRelojSegundos: number;
}

export type EstadoAprobacion = 'Aprobado' | 'Pendiente' | 'Rechazado';

/** Domicilio capturado por partes; `direccion` (texto) se arma a partir de él. */
export interface DireccionLugar {
  codigoPostal: string;
  calle: string;
  numeroExterior: string;
  numeroInterior?: string;
  colonia: string;
  municipio: string;
  estado: string;
  referencias?: string;
}

/** Respuesta de la consulta de un código postal: sirve para autocompletar estado, municipio y colonias. */
export interface InfoCodigoPostal {
  codigoPostal: string;
  estado: string;
  municipio: string;
  colonias: string[];
}

export interface MiLugar {
  id: string;
  nombre: string;
  tipo: TipoLugar;
  direccion: string;
  domicilio?: DireccionLugar;
  radioMetros?: number;
  dias: string;
  vigencia: string;
  estado: EstadoAprobacion;
  comentarioResolucion?: string;
}

export interface SolicitudLugar extends MiLugar {
  empleadoId: string;
  empleado: string;
  motivo: string;
  creada: string;
}

export type TipoIncidencia =
  | 'Siniestro' | 'EmergenciaMedica' | 'CambioDeLugar' | 'FallaTransporte' | 'FallaDispositivo' | 'Otro';
export type EstadoIncidencia = 'Reportada' | 'EnAtencion' | 'Atendida';

export interface Incidencia {
  id: string;
  empleadoId: string;
  empleado: string;
  tipo: TipoIncidencia;
  descripcion: string;
  requiereAyuda: boolean;
  lugar: string;
  creada: string;
  estado: EstadoIncidencia;
  respuesta?: string;
}

export type EstadoDispositivo = 'Aprobado' | 'Pendiente' | 'Revocado';
export type PlataformaDispositivo = 'iOS' | 'Android' | 'Web';

export interface DispositivoActual {
  huella: string;
  plataforma: PlataformaDispositivo;
  nombre: string;
}

export interface Dispositivo {
  id: string;
  empleadoId: string;
  empleado: string;
  nombre: string;
  plataforma: PlataformaDispositivo;
  huella: string;
  estado: EstadoDispositivo;
  vinculadoEl: string;
  ultimoUso?: string;
  comentario?: string;
}

export interface ChecadaDeDispositivo {
  hora: string;
  tipo: TipoChecada;
  lugar: string;
  validacion: Validacion;
  origen: Origen;
}

/** Un equipo del colaborador con cuánto se ha usado para checar. */
export interface DispositivoDetalle {
  id: string;
  empleadoId: string;
  empleado: string;
  nombre: string;
  plataforma: PlataformaDispositivo;
  estado: EstadoDispositivo;
  vinculadoEl: string;
  ultimoUso?: string;
  comentario?: string;
  checadasTotal: number;
  checadasUltimos30Dias: number;
  recientes: ChecadaDeDispositivo[];
}

export interface ResultadoIntegridad {
  registros: number;
  integra: boolean;
  primerFallo?: { folio: string; empleado: string };
  ultimoSello: string;
  verificadoEl: string;
  constancia: { folio: string; emitidaEl: string; proveedor: string };
}

export type AccionAuditoria =
  | 'Aprobacion' | 'Rechazo' | 'Declaracion' | 'Cierre' | 'Correccion' | 'Configuracion' | 'Exportacion' | 'Rol' | 'Usuario' | 'Privacidad' | 'Acceso';

export interface EventoAuditoria {
  id: string;
  fecha: string;
  usuario: string;
  rol: Rol;
  accion: AccionAuditoria;
  objeto: string;
  detalle: string;
  ip: string;
}

export type Metodo2fa = 'App' | 'Passkey' | 'SMS';

/** A quién alcanza la vista y las decisiones de un usuario del portal. */
export type TipoAlcance = 'Empresa' | 'Sede' | 'Area' | 'Proyecto';
export interface Alcance { tipo: TipoAlcance; valores: string[] }

/** Invitado: se dio de alta pero aún no crea su contraseña ni activa la doble autenticación. */
export type EstadoCuenta = 'Invitado' | 'Activo' | 'Inactivo';

export interface Proyecto { id: string; nombre: string; cliente: string; lugar: string; integrantes: number; vigencia: string }

export interface UsuarioAdmin {
  id: string;
  nombre: string;
  correo: string;
  puesto: string;
  rol: Rol;
  estado: EstadoCuenta;
  alcance: Alcance;
  /** Empleado de la empresa al que pertenece la cuenta (también checa en la app). Vacío en externos. */
  empleadoId?: string;
  externo: boolean;
  organizacion?: string;
  /** Fecha en que el acceso vence solo. Obligatoria para auditores. */
  vigenciaHasta?: string;
  ultimoAcceso?: string;
  dobleFactor?: Metodo2fa;
  creado: string;
  creadoPor: string;
  motivoBaja?: string;
  nombres?: string;
  apellidoPaterno?: string;
  apellidoMaterno?: string;
}

export interface SesionActiva {
  id: string;
  dispositivo: string;
  plataforma: PlataformaDispositivo;
  ubicacion: string;
  ip: string;
  inicio: string;
  ultimaActividad: string;
  actual: boolean;
  advertencia?: string;
}

export interface MiSeguridad {
  metodo2fa: Metodo2fa;
  metodos: { id: Metodo2fa; etiqueta: string; nota: string; disponible: boolean }[];
  ultimoCambioPassword: string;
}

export interface Consentimiento {
  versionAviso: string;
  aceptado: boolean;
  fecha?: string;
}

export type DerechoArco = 'Acceso' | 'Rectificacion' | 'Cancelacion' | 'Oposicion';
export type EstadoArco = 'Recibida' | 'EnTramite' | 'Atendida';

export interface SolicitudArco {
  id: string;
  empleadoId: string;
  empleado: string;
  derecho: DerechoArco;
  detalle: string;
  creada: string;
  limite: string;
  estado: EstadoArco;
  respuesta?: string;
}

export interface Turno {
  id: string;
  nombre: string;
  tipo: TipoJornada;
  entrada: string;
  salida: string;
  /** Duración de la comida del turno. Mínimo 30 min en jornada continua (art. 63 LFT). */
  comidaMin: number;
  /** Tolerancia de entrada. */
  toleranciaMin: number;
  /** Minutos extra permitidos al regresar de comer antes de contar como retardo. */
  toleranciaComidaMin: number;
  diasLaborales: string;
  descanso: string;
  empleados: number;
}

export type PatronSemanal = 'LunesAViernes' | 'LunesASabado';
export interface NuevoTurno {
  nombre: string; tipo: TipoJornada; entrada: string; salida: string;
  comidaMin: number; toleranciaMin: number; toleranciaComidaMin: number; patron: PatronSemanal;
}
export interface CambiosTurno {
  toleranciaMin?: number; comidaMin?: number; toleranciaComidaMin?: number;
  nombre?: string; tipo?: TipoJornada; entrada?: string; salida?: string; patron?: PatronSemanal;
}
export interface ResultadoEliminarTurno { movidos: number }

export interface Festivo {
  fecha: string;
  nombre: string;
  nota: string;
}

export interface MiHorario {
  turno: Turno;
  semana: { dia: string; horario: string; descanso: boolean; casa: boolean }[];
  proximosFestivos: Festivo[];
  /** Comida que le aplica: la del turno o la pactada individualmente. */
  comida: { minutos: number; toleranciaMin: number; individual: boolean; fundamento?: string };
}

export interface MisSaldos {
  antiguedadAnios: number;
  vacacionesDerecho: number;
  vacacionesTomadas: number;
  vacacionesProgramadas: number;
  vacacionesDisponibles: number;
  primaVacacionalPct: number;
  vencimientoVacaciones: string;
  permisosConGoceUsados: number;
  permisosConGoceLimite: number;
  diasIncapacidadAnio: number;
  extraAutorizadasMes: number;
}

export interface Correccion {
  id: string;
  empleadoId: string;
  empleado: string;
  fecha: string;
  tipo: TipoChecada;
  horaOriginal?: string;
  horaSolicitada: string;
  motivo: string;
  estado: EstadoSolicitud;
  creada: string;
  comentarioResolucion?: string;
  resueltaPor?: string;
}

/**
 * Jornada que terminó según el turno sin checada de salida. Nunca se cierra sola: el sistema no inventa una salida.
 * - SinSalida: aún no explica qué pasó (solo cuenta hasta la hora programada).
 * - SigueTrabajando: el tiempo después de la hora programada queda como extra por validar.
 * - CorreccionSolicitada: dijo a qué hora salió; RH decide.
 * - Cerrada: registró su salida o RH aprobó la corrección.
 */
export type EstadoJornadaAbierta = 'SinSalida' | 'SigueTrabajando' | 'CorreccionSolicitada' | 'Cerrada';

export interface JornadaAbierta {
  id: string;
  empleadoId: string;
  empleado: string;
  fecha: string;
  entrada: string;
  horasAbierta: number;
  avisada: boolean;
  finProgramado?: string;
  estado?: EstadoJornadaAbierta;
}

/** Aviso al empleado cuando pasó su hora de salida y no ha checado. */
export interface JornadaFuera {
  finProgramado: string;
  minutos: number;
  estado: EstadoJornadaAbierta;
  avisadaPorRh: boolean;
}

/** Minutos después de la hora de salida para avisar al empleado (un solo aviso, por la desconexión del art. 330-E). */
export const MARGEN_AVISO_SALIDA_MIN = 15;

export type TipoNotificacion = 'Recordatorio' | 'Resultado' | 'Contingencia' | 'Seguridad' | 'Cierre' | 'Constancia';

export interface Notificacion {
  id: string;
  tipo: TipoNotificacion;
  titulo: string;
  detalle: string;
  fecha: string;
  leida: boolean;
  ruta?: string;
}

export interface PreferenciasNotif {
  recordatorios: boolean;
  resultados: boolean;
  contingencias: boolean;
  seguridad: boolean;
}

export interface Constancia {
  mes: string;
  folio: string;
  sello: string;
  emitida: string;
  limiteAcuse: string;
  diasTrabajados: number;
  descansos: number;
  faltas: number;
  retardos: number;
  horasOrdinarias: number;
  extraDobles: number;
  extraTriples: number;
  extraSinAutorizar: number;
  incidencias: JornadaDia[];
  acuse?: { conforme: boolean; fecha: string; observacion?: string };
}

export interface AcuseEmpleado {
  empleadoId: string;
  empleado: string;
  mes: string;
  estado: 'Firmada' | 'Pendiente' | 'Inconforme';
  fecha?: string;
  observacion?: string;
}

export type EstadoControl = 'Cumple' | 'Atencion' | 'Pendiente';

export interface ControlCumplimiento {
  id: string;
  area: 'Asistencia' | 'Jornada' | 'Descansos' | 'Privacidad' | 'Seguridad';
  titulo: string;
  detalle: string;
  estado: EstadoControl;
  referencia: string;
  ruta: string;
}

export interface Kiosco {
  id: string;
  nombre: string;
  sede: string;
  estado: 'EnLinea' | 'SinConexion';
  ultimaSync: string;
  checadasHoy: number;
  version: string;
}

export interface NuevoEmpleado {
  numero: string;
  nombre: string;
  correo: string;
  puesto: string;
  departamento: string;
  sede: string;
  modalidad: Modalidad;
  tipoJornada: TipoJornada;
  turnoId: string;
  fechaIngreso: string;
}

export interface FilaArea {
  area: string;
  total: number;
  aTiempo: number;
  enComida: number;
  retardos: number;
  ausentes: number;
  justificados: number;
  cambio: number;
}

export interface AsistenciaHoy {
  total: number;
  aTiempo: number;
  enComida: number;
  retardos: number;
  ausentes: number;
  justificados: number;
  areas: FilaArea[];
  sedes: string[];
}

export interface PuntoTendencia { fecha: string; pct: number }
