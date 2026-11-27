import { formatearDireccion } from './direccion';
import { siguientesTipos } from './secuencia';
import { CODIGOS_POSTALES } from './mock-codigos-postales';
import { Inject, Injectable, inject } from '@angular/core';
import {
  AcuseEmpleado, AsistenciaHoy, PuntoTendencia, Checada, Consentimiento, Constancia, Contingencia, ControlCumplimiento, Correccion, DerechoArco, Dispositivo, DispositivoActual,
  Empleado, Coordenada, EntornoDetectado, DispositivoDetalle, DatosLugar, ResultadoEliminarLugar, UbicacionColaborador, EscenarioUbicacion, EventoAuditoria, Festivo, FilaReporte, Incidencia, JornadaAbierta, JornadaDia,
  LugarPermitido, Metodo2fa, MiEstado, MiHorario, MiLugar, MiSeguridad, MisSaldos, NuevoEmpleado, Notificacion, Origen, Pendiente,
  PreferenciasNotif, InfoCodigoPostal, PosicionGps, RelojDispositivo, ResultadoIntegridad, ResumenHoy, Rol, Senal, SesionActiva, Solicitud, SolicitudArco, SolicitudLugar,
  AccionAuditoria, CambiosTurno, NuevoTurno, ResultadoEliminarTurno, DESCANSO_MINIMO_MIN, EstadoJornadaAbierta, EstadoPuntualidad, JornadaFuera, MARGEN_AVISO_SALIDA_MIN, Puntualidad,
  TipoChecada, Turno, Usuario, UsuarioAdmin,
} from '../models/models';
import {
  APP_ROL, CatalogosUsuarios, ChecadorApi, DatosUsuario, NuevaContingencia, NuevaCorreccion, NuevaIncidencia, NuevaSolicitud, NuevoLugar, OpcionesChecada, RolApp,
} from './checador-api';
import {
  fechaCorta,
  CHECADAS_INICIALES, CONTINGENCIAS_INICIALES, EMPLEADOS, INCIDENCIAS_INICIALES, LUGARES, LUGARES_EMPLEADOS,
  SOLICITUDES_INICIALES, YO, hace, isoDia,
} from './mock-data';
import {
  ARCO_INICIALES, CONSENTIMIENTO_INICIAL, CORRECCIONES_INICIALES, FESTIVOS, JORNADAS_ABIERTAS, KIOSCOS, NOTIFICACIONES_BASE,
  PREFERENCIAS_INICIALES, PROYECTOS, TURNOS, USUARIOS_ADMIN, VERSION_AVISO, bitacoraInicial, sesionesIniciales,
} from './mock-data-extra';
import {
  arcoMasivas, bitacoraMasiva, checadasMasivas, correccionesMasivas, dispositivosMasivos, generarEmpleados, incidenciasMasivas, solicitudesMasivas,
} from './mock-masivo';
import { VENTANA_KIOSCO_MS, codigoKiosco, hashCorto } from './sello';
import { COMIDA_CORTA_MIN, DESFASE_COMIDA, DESFASE_LLEGADA, DemoService, MIN_DESPUES_DE_SALIDA } from '../ui/demo.service';
import { ETQ_EFECTO, ETQ_SOLICITUD, textoAlcance } from '../ui/etiquetas';
import { PERMISOS, ROLES_GESTIONABLES, Accion } from '../auth/permisos';
import { SessionService } from '../auth/session.service';
import { clave } from '../ui/almacen';

export const CODIGO_2FA_DUMMY = '123456';
const LATENCIA_MS = 250;
const espera = <T>(v: T): Promise<T> => new Promise((r) => setTimeout(() => r(structuredClone(v)), LATENCIA_MS));
const falla = (msg: string): Promise<never> => new Promise((_, rej) => setTimeout(() => rej(new Error(msg)), LATENCIA_MS));
let secuencia = 100;
const nuevoId = (p: string) => `${p}${Date.now().toString(36)}${(++secuencia).toString(36)}${Math.random().toString(36).slice(2, 5)}`;

export const etiquetaTipoCont: Record<Contingencia['tipo'], string> = {
  Apagon: 'Apagón', Sismo: 'Sismo', Huracan: 'Huracán', Sanitaria: 'Contingencia sanitaria',
  FallaSistema: 'Falla del sistema', Bloqueo: 'Bloqueo / paro de transporte', Otro: 'Otro',
};

@Injectable()
export class MockChecadorApi extends ChecadorApi {
  private readonly demo = inject(DemoService);
  private readonly sesion = inject(SessionService);
  private readonly empleadosDb: Empleado[] = [...structuredClone(EMPLEADOS), ...generarEmpleados()];
  private checadas: Checada[] = sellarTodas([...structuredClone(CHECADAS_INICIALES), ...checadasMasivas(this.empleadosDb)]);
  private alterada?: { indice: number; lugar: string };
  private solicitudesDb: Solicitud[] = [...SOLICITUDES_INICIALES, ...solicitudesMasivas(this.empleadosDb)];
  private correccionesDb: Correccion[] = [...structuredClone(CORRECCIONES_INICIALES), ...correccionesMasivas(this.empleadosDb)];
  private abiertas: JornadaAbierta[] = structuredClone(JORNADAS_ABIERTAS);
  private arcoDb: SolicitudArco[] = [...structuredClone(ARCO_INICIALES), ...arcoMasivas(this.empleadosDb)];
  private usuariosDb: UsuarioAdmin[] = structuredClone(USUARIOS_ADMIN);
  private bitacora: EventoAuditoria[] = [...bitacoraInicial(), ...bitacoraMasiva()];
  private turnosDb: Turno[] = structuredClone(TURNOS);
  private sesiones: SesionActiva[] = sesionesIniciales();
  private seguridad: MiSeguridad = {
    metodo2fa: 'App', ultimoCambioPassword: '2026-08-14',
    metodos: [
      { id: 'App', etiqueta: 'App autenticadora', nota: 'Recomendado', disponible: true },
      { id: 'SMS', etiqueta: 'Mensaje de texto (SMS)', nota: 'Menos seguro', disponible: true },
      { id: 'Passkey', etiqueta: 'Llave de acceso con huella o rostro', nota: 'Próximamente', disponible: false },
    ],
  };
  private consentimiento: Consentimiento = leerConsentimiento();
  private preferencias: PreferenciasNotif = { ...PREFERENCIAS_INICIALES };
  private leidas = new Set(NOTIFICACIONES_BASE.filter((n) => n.leida).map((n) => n.id));
  private acusesDb = new Map<string, { conforme: boolean; fecha: string; observacion?: string }>();
  private intentos2fa = 0;
  private bloqueadoHasta = 0;
  private contingenciasDb: Contingencia[] = [...CONTINGENCIAS_INICIALES];
  private lugaresEmpleados: SolicitudLugar[] = [...LUGARES_EMPLEADOS];
  private readonly checadasPorIdLocal = new Map<string, Checada>();
  private incidenciasDb: Incidencia[] = [...INCIDENCIAS_INICIALES, ...incidenciasMasivas(this.empleadosDb)];
  private dispositivosDb: Dispositivo[] = [...dispositivosIniciales(), ...dispositivosMasivos(this.empleadosDb)];
  private historial = generarHistorial();
  private usuarioPendiente?: Usuario;
  /** Jornada sin salida de hoy del empleado de esta app (si ya se detectó). */
  private jornadaHoy?: JornadaAbierta;

  constructor(@Inject(APP_ROL) private readonly rolApp: RolApp) {
    super();
  }

  async login(usuario: string, password: string) {
    if (!usuario.trim() || !password) return falla('Captura usuario y contraseña.');
    this.usuarioPendiente =
      this.rolApp === 'empleado'
        ? { id: 'u-luis', nombre: 'Luis Ángel', rol: 'Empleado', empleadoId: YO }
        : { id: 'u-laura', nombre: 'Laura Mendoza', rol: 'RH' };
    return espera({ requiere2fa: true });
  }

  async verificar2fa(codigo: string): Promise<Usuario> {
    if (Date.now() < this.bloqueadoHasta) return falla('Demasiados intentos. Por seguridad, tu cuenta está bloqueada 15 minutos.');
    if (codigo !== CODIGO_2FA_DUMMY || !this.usuarioPendiente) {
      this.intentos2fa++;
      if (this.intentos2fa >= 5) {
        this.bloqueadoHasta = Date.now() + 15 * 60_000;
        this.intentos2fa = 0;
        return falla('Demasiados intentos. Por seguridad, tu cuenta quedó bloqueada 15 minutos.');
      }
      return falla(`Código incorrecto. Te quedan ${5 - this.intentos2fa} intento(s).`);
    }
    this.intentos2fa = 0;
    return espera(this.usuarioPendiente);
  }

  async salir(): Promise<void> { }

  async recuperarCuenta(usuario: string): Promise<void> {
    if (!usuario.trim()) return falla('Escribe tu usuario o correo.');
    return espera(undefined);
  }

  async miEstado(): Promise<MiEstado> {
    const yo = this.empleadosDb.find((e) => e.id === YO)!;
    const hoy = this.checadasDe(YO);
    const lunes = hace((new Date().getDay() + 6) % 7);
    const semana = this.historial.filter((d) => d.fecha >= isoDia(lunes));
    // Sin salida registrada, las horas de hoy solo cuentan hasta la hora de salida del turno:
    // lo posterior no es tiempo ordinario ni extra hasta que el empleado o RH lo resuelvan.
    const jornadaFuera = this.jornadaFuera(hoy);
    const horasHoy = horasTrabajadasHoy(hoy, jornadaFuera ? this.finDeTurno(yo).getTime() : this.ahoraDemo().getTime());
    const pendientes: Pendiente[] = [];
    const mesCierre = mesAnterior();
    if (!this.acusesDb.has(mesCierre)) {
      pendientes.push({ id: 'pd1', tipo: 'AcuseConformidad', titulo: `Constancia de ${nombreMes(mesCierre)}`, detalle: 'Revisa y confirma tus horas.', ruta: '/constancia' });
    }
    const corrPend = this.correccionesDb.filter((c) => c.empleadoId === YO && c.estado === 'Pendiente');
    for (const d of this.historial.filter((x) => x.entrada && !x.salida && !corrPend.some((c) => c.fecha === x.fecha))) {
      pendientes.push({ id: `cp-${d.fecha}`, tipo: 'CierrePendiente', titulo: 'Jornada sin salida', detalle: `Sin salida el ${fechaCorta(d.fecha)}.`, ruta: '/solicitudes' });
    }
    for (const c of corrPend) {
      pendientes.push({ id: c.id, tipo: 'CorreccionPendiente', titulo: 'Corrección de checada en revisión', detalle: c.motivo, ruta: '/solicitudes' });
    }
    for (const s of this.solicitudesDb.filter((x) => x.empleadoId === YO && x.estado === 'Pendiente')) {
      pendientes.push({ id: s.id, tipo: 'SolicitudEnTramite', titulo: 'Solicitud en trámite', detalle: s.motivo, ruta: '/solicitudes' });
    }
    for (const l of this.lugaresEmpleados.filter((x) => x.empleadoId === YO && x.estado === 'Pendiente')) {
      pendientes.push({ id: l.id, tipo: 'LugarEnRevision', titulo: 'Lugar esperando aprobación de RH', detalle: l.nombre, ruta: '/lugares' });
    }
    return espera({
      empleado: { ...yo, estadoHoy: this.estadoDe(hoy) },
      checadasHoy: hoy,
      siguientes: siguientesTipos(hoy),
      saldoVacacionesDias: this.calcularSaldos().vacacionesDisponibles,
      dispositivo: { nombre: 'iPhone de Luis (vinculado)', vinculadoEl: '2026-01-12' },
      contingenciaActiva: this.contingenciasDb.find((c) => c.activa),
      resumen: {
        horasHoy,
        horasSemana: semana.reduce((a, d) => a + d.horasOrdinarias + d.extraDobles + d.extraTriples, 0) + horasHoy,
        metaSemana: 40,
        extraSemana: semana.reduce((a, d) => a + d.extraDobles + d.extraTriples, 0),
        retardosMes: this.historial.filter((d) => d.fecha.slice(0, 7) === isoDia(new Date()).slice(0, 7) && d.minutosRetardo > 0).length,
        faltasMes: this.historial.filter((d) => d.fecha.slice(0, 7) === isoDia(new Date()).slice(0, 7) && d.estado === 'Falta').length,
      },
      pendientes,
      enColaOffline: hoy.filter((c) => c.diferida).length,
      notificacionesSinLeer: this.notificacionesDe().filter((n) => !n.leida).length,
      jornadaFuera,
    });
  }

  async verificarEntorno(tipo: TipoChecada, posicion?: PosicionGps, reloj?: RelojDispositivo): Promise<EntornoDetectado> {
    return espera(this.entorno(tipo, posicion, reloj));
  }

  async horaServidor(): Promise<string> {
    return espera(new Date().toISOString());
  }

  /**
   * Lugar y señales, más la puntualidad:
   * - Entrada en día laboral: contra la hora de entrada del turno y su tolerancia.
   * - Regreso de comida: contra la comida pactada (individual o del turno) y su tolerancia de regreso.
   */
  private entorno(tipo: TipoChecada, posicion?: PosicionGps, reloj?: RelojDispositivo, hora?: Date): EntornoDetectado {
    const base = posicion && this.demo.origenUbicacion() === 'real' ? analizarPosicion(posicion) : analizarEntorno(this.demo.escenario());
    const ent = reloj ? aplicarReloj(base, reloj) : base;
    if (tipo === 'Entrada') return { ...ent, puntualidad: this.puntualidadEntrada(hora) };
    if (tipo === 'RegresoComida') return { ...ent, puntualidad: this.puntualidadComida(hora) };
    return ent;
  }

  private turnoDe(e: Empleado): Turno { return this.turnosDb.find((t) => t.id === e.turnoId) ?? this.turnosDb[0]!; }

  private comidaDe(e: Empleado) {
    const t = this.turnoDe(e);
    return { minutos: e.comidaPactada?.minutos ?? t.comidaMin, toleranciaMin: t.toleranciaComidaMin, individual: !!e.comidaPactada, fundamento: e.comidaPactada?.fundamento };
  }

  private puntualidadEntrada(hora?: Date): Puntualidad | undefined {
    const yo = this.empleadosDb.find((e) => e.id === YO)!;
    const turno = this.turnoDe(yo);
    const llegada = hora ? 'real' : this.demo.llegada();
    const ahora = hora ?? new Date();
    const [h, m] = turno.entrada.split(':').map(Number);
    const programada = new Date(ahora);
    programada.setHours(h!, m!, 0, 0);
    const laborable = turno.diasLaborales.startsWith('Lun a sáb') ? ahora.getDay() !== 0 : ahora.getDay() >= 1 && ahora.getDay() <= 5;
    if (llegada === 'real' && !laborable) return undefined;
    const registro = llegada === 'real' ? ahora : new Date(programada.getTime() + DESFASE_LLEGADA[llegada] * 60_000);
    const minutosTarde = Math.floor((registro.getTime() - programada.getTime()) / 60_000);
    const estado: EstadoPuntualidad = minutosTarde <= 0 ? 'ATiempo' : minutosTarde <= turno.toleranciaMin ? 'EnTolerancia' : 'Retardo';
    return {
      clase: 'Entrada', horaEntrada: turno.entrada, toleranciaMin: turno.toleranciaMin, horaRegistro: registro.toISOString(),
      minutosTarde: Math.max(0, minutosTarde), estado,
    };
  }

  private puntualidadComida(hora?: Date): Puntualidad | undefined {
    const yo = this.empleadosDb.find((e) => e.id === YO)!;
    const salida = [...this.checadasDe(YO)].reverse().find((c) => c.tipo === 'SalidaComida');
    if (!salida) return undefined;
    const comida = this.comidaDe(yo);
    const inicio = new Date(salida.horaServidor);
    const sim = hora ? 'real' : this.demo.comida();
    const duracionSimulada = sim === 'real' ? null : sim === 'Corta' ? COMIDA_CORTA_MIN : comida.minutos + DESFASE_COMIDA[sim];
    const registro = duracionSimulada === null ? (hora ?? new Date()) : new Date(inicio.getTime() + duracionSimulada * 60_000);
    const real = Math.max(0, Math.floor((registro.getTime() - inicio.getTime()) / 60_000));
    const estado: EstadoPuntualidad = real < DESCANSO_MINIMO_MIN ? 'ComidaCorta'
      : real <= comida.minutos ? 'ATiempo'
      : real <= comida.minutos + comida.toleranciaMin ? 'EnTolerancia' : 'Retardo';
    return {
      clase: 'Comida', toleranciaMin: comida.toleranciaMin, horaRegistro: registro.toISOString(), minutosTarde: Math.max(0, real - comida.minutos), estado,
      comidaPactadaMin: comida.minutos, comidaRealMin: real, inicioComida: salida.horaServidor,
    };
  }

  async registrarChecada(tipo: TipoChecada, opciones?: OpcionesChecada): Promise<Checada> {
    if (opciones?.idLocal && this.checadasPorIdLocal.has(opciones.idLocal)) return espera(this.checadasPorIdLocal.get(opciones.idLocal)!);
    const yo = this.empleadosDb.find((e) => e.id === YO)!;
    const cont = this.contingenciasDb.find((c) => c.activa);
    const hora = opciones?.sinRed && opciones.horaConfiable ? new Date(opciones.horaConfiable) : undefined;
    const ent = this.entorno(tipo, opciones?.posicion, opciones?.reloj, hora);
    const p = ent.puntualidad;
    let origen: Origen = 'Movil';
    if (opciones?.codigoKiosco) {
      const ahora = hora?.getTime() ?? Date.now();
      const valido = KIOSCOS.some((k) => k.estado === 'EnLinea'
        && [ahora, ahora - VENTANA_KIOSCO_MS].some((t) => codigoKiosco(k.id, t) === opciones.codigoKiosco));
      if (!valido) return falla('El código del kiosco es incorrecto o ya venció. Pide el vigente en la pantalla.');
      origen = 'Kiosco';
    }
    // Con "ya pasó mi hora de salida" (demo), la salida se registra a esa hora simulada.
    const horaSalidaDemo = tipo === 'Salida' && this.demo.jornada() === 'Terminada' ? this.ahoraDemo().toISOString() : undefined;
    const c: Checada = {
      id: nuevoId('ch'), empleadoId: yo.id, empleado: yo.nombre, tipo, horaServidor: p?.horaRegistro ?? hora?.toISOString() ?? horaSalidaDemo ?? new Date().toISOString(),
      lugar: ent.lugar?.nombre ?? 'Sin lugar aprobado', validacion: ent.validacionPrevista, motivos: [...ent.motivos],
      diferida: ent.sinRed || !!opciones?.sinRed, origen, folio: `CH-${Date.now().toString(36).toUpperCase()}`,
      contingenciaId: cont?.id, senales: ent.senales, posicion: { ...ent.gps },
      sello: '', selloAnterior: '',
    };
    if (opciones?.sinRed) {
      const aviso = 'Checada diferida: se envió al recuperar la red';
      if (!c.motivos.includes(aviso)) c.motivos.unshift(aviso);
      if (c.validacion === 'Valida') c.validacion = 'PorRevisar';
      c.recibidaEl = new Date().toISOString();
      if (!c.senales?.some((x) => x.id === 'red')) c.senales = [...(c.senales ?? []), { id: 'red', etiqueta: 'Conexión', estado: 'alerta', detalle: 'Sin internet: la checada se guardó en el teléfono y se envió al reconectar' }];
    }
    if (opciones?.reloj && opciones.reloj.estado !== 'ok') c.horaDispositivo = opciones.reloj.horaDispositivo;
    if (cont) {
      c.motivos.push(`Registrada durante contingencia: ${etiquetaTipoCont[cont.tipo]}`);
      cont.checadasAfectadas++;
    }
    if (p?.clase === 'Comida') c.descansoMin = p.comidaRealMin;
    if (p?.estado === 'Retardo') {
      const nota = opciones?.retardo?.nota?.trim();
      c.retardo = {
        clase: p.clase, minutos: p.minutosTarde, toleranciaMin: p.toleranciaMin, horaEntrada: p.horaEntrada,
        comidaPactadaMin: p.comidaPactadaMin, comidaRealMin: p.comidaRealMin,
        motivo: opciones?.retardo?.motivo, nota: nota || undefined, desdeCasa: ent.lugar?.tipo === 'HomeOffice',
      };
    }
    this.agregarSellada(c);
    if (opciones?.idLocal) this.checadasPorIdLocal.set(opciones.idLocal, c);
    if (tipo === 'Salida') this.cambiarJornadaHoy('Cerrada');
    return espera(c);
  }

  // ── Jornadas sin salida ─────────────────────────────────────────

  /** Hora de salida del turno de hoy (si el turno cruza la medianoche, es mañana). */
  private finDeTurno(e: Empleado): Date {
    const t = this.turnoDe(e);
    const [he, me] = t.entrada.split(':').map(Number);
    const [hs, ms] = t.salida.split(':').map(Number);
    const fin = new Date();
    fin.setHours(hs!, ms!, 0, 0);
    if (hs! * 60 + ms! < he! * 60 + me!) fin.setDate(fin.getDate() + 1);
    return fin;
  }

  /** Hora actual de la demo: real, o 20 min después de la salida si se simula que ya terminó la jornada. */
  private ahoraDemo(): Date {
    if (this.demo.jornada() !== 'Terminada') return new Date();
    const yo = this.empleadosDb.find((e) => e.id === YO)!;
    return new Date(this.finDeTurno(yo).getTime() + MIN_DESPUES_DE_SALIDA * 60_000);
  }

  /**
   * Si ya pasó la hora de salida y no hay checada de salida, avisa al empleado (una sola vez) y a RH.
   * Nunca se inventa una salida: la jornada queda abierta hasta que el empleado o RH la resuelvan.
   */
  private jornadaFuera(hoy: Checada[]): JornadaFuera | undefined {
    const entrada = hoy.find((c) => c.tipo === 'Entrada');
    if (!entrada || hoy[hoy.length - 1]?.tipo === 'Salida') return undefined;
    const yo = this.empleadosDb.find((e) => e.id === YO)!;
    const fin = this.finDeTurno(yo);
    const minutos = Math.floor((this.ahoraDemo().getTime() - fin.getTime()) / 60_000);
    if (minutos < MARGEN_AVISO_SALIDA_MIN) return undefined;
    if (!this.jornadaHoy) {
      this.jornadaHoy = {
        id: `jo-${isoDia(new Date())}`, empleadoId: yo.id, empleado: yo.nombre, fecha: isoDia(new Date()),
        entrada: new Date(entrada.horaServidor).toTimeString().slice(0, 5), horasAbierta: Math.round((minutos / 60) * 100) / 100,
        avisada: false, finProgramado: this.turnoDe(yo).salida, estado: 'SinSalida',
      };
    }
    if (this.jornadaHoy.estado === 'Cerrada') return undefined;
    return { finProgramado: this.turnoDe(yo).salida, minutos, estado: this.jornadaHoy.estado ?? 'SinSalida', avisadaPorRh: this.jornadaHoy.avisada };
  }

  private cambiarJornadaHoy(estado: EstadoJornadaAbierta) {
    const j = this.jornadaHoy;
    if (!j || j.estado === 'Cerrada' || j.estado === estado) return;
    j.estado = estado;
  }

  async continuarJornada(horas: number, motivo: string): Promise<Solicitud> {
    if (horas < 0.5 || horas > 4) return falla('Indica entre 0.5 y 4 horas: es el máximo de tiempo extra por día (art. 66 LFT).');
    if (motivo.trim().length < 5) return falla('Cuéntale a tu supervisor en qué estás trabajando.');
    const hoy = isoDia(new Date());
    const s = await this.crearSolicitud({ tipo: 'HorasExtra', desde: hoy, hasta: hoy, horas, motivo: `Sigo trabajando después de mi horario: ${motivo.trim()}` });
    this.cambiarJornadaHoy('SigueTrabajando');
    return s;
  }

  async misDispositivos(actual: DispositivoActual): Promise<Dispositivo[]> {
    if (!this.dispositivosDb.some((d) => d.empleadoId === YO && d.estado !== 'Revocado' && d.plataforma === actual.plataforma)
        && !this.dispositivosDb.some((d) => d.huella === actual.huella)) {
      this.dispositivosDb.push({
        id: nuevoId('d'), empleadoId: YO, empleado: 'Luis Ángel', nombre: actual.nombre, plataforma: actual.plataforma,
        huella: actual.huella, estado: 'Aprobado', vinculadoEl: isoDia(new Date()), ultimoUso: new Date().toISOString(),
      });
    }
    return espera(this.dispositivosDb.filter((d) => d.empleadoId === YO));
  }

  async solicitarDispositivo(actual: DispositivoActual): Promise<Dispositivo> {
    const existente = this.dispositivosDb.find((d) => d.huella === actual.huella);
    if (existente) return espera(existente);
    const nuevo: Dispositivo = {
      id: nuevoId('d'), empleadoId: YO, empleado: 'Luis Ángel', nombre: actual.nombre, plataforma: actual.plataforma,
      huella: actual.huella, estado: 'Pendiente', vinculadoEl: isoDia(new Date()),
    };
    this.dispositivosDb.push(nuevo);
    return espera(nuevo);
  }

  async misLugares(): Promise<MiLugar[]> {
    return espera(this.lugaresEmpleados.filter((l) => l.empleadoId === YO));
  }

  async solicitarLugar(l: NuevoLugar): Promise<MiLugar> {
    const nuevo: SolicitudLugar = {
      id: nuevoId('ml'), empleadoId: YO, empleado: 'Luis Ángel', nombre: l.nombre, tipo: l.tipo, direccion: l.direccion || formatearDireccion(l.domicilio),
      domicilio: l.domicilio,
      radioMetros: 200, dias: l.dias, vigencia: l.hasta ? `Del ${l.desde} al ${l.hasta}` : 'Permanente',
      estado: 'Pendiente', motivo: l.motivo, creada: new Date().toISOString(),
    };
    this.lugaresEmpleados.push(nuevo);
    return espera(nuevo);
  }

  async buscarCodigoPostal(codigoPostal: string): Promise<InfoCodigoPostal | null> {
    return espera(CODIGOS_POSTALES.find((c) => c.codigoPostal === codigoPostal.trim()) ?? null);
  }

  async reportarIncidencia(i: NuevaIncidencia): Promise<Incidencia> {
    const ent = analizarEntorno(this.demo.escenario());
    const nueva: Incidencia = {
      id: nuevoId('i'), empleadoId: YO, empleado: 'Luis Ángel', ...i, lugar: ent.lugar?.nombre ?? 'Ubicación no aprobada',
      creada: new Date().toISOString(), estado: 'Reportada',
    };
    this.incidenciasDb.push(nueva);
    return espera(nueva);
  }

  async misIncidencias(): Promise<Incidencia[]> {
    return espera(this.incidenciasDb.filter((i) => i.empleadoId === YO).sort((a, b) => b.creada.localeCompare(a.creada)));
  }

  async miHistorial(): Promise<JornadaDia[]> {
    return espera(this.historial);
  }

  async misSolicitudes(): Promise<Solicitud[]> {
    return espera(this.solicitudesDb.filter((s) => s.empleadoId === YO).sort(porCreadaDesc));
  }

  async crearSolicitud(s: NuevaSolicitud): Promise<Solicitud> {
    const yo = this.empleadosDb.find((e) => e.id === YO)!;
    const nueva: Solicitud = {
      id: nuevoId('s'), empleadoId: yo.id, empleado: yo.nombre, ...s, estado: 'Pendiente', creada: new Date().toISOString(),
    };
    this.solicitudesDb.push(nueva);
    return espera(nueva);
  }

  async resumenHoy(): Promise<ResumenHoy> {
    const emp = this.empleadosActuales();
    const c = (e: Empleado['estadoHoy']) => emp.filter((x) => x.estadoHoy === e).length;
    const abiertas = this.incidenciasDb.filter((i) => i.estado !== 'Atendida');
    return espera({
      fecha: isoDia(new Date()),
      plantilla: emp.length,
      presentes: c('Presente') + c('Retardo') + c('EnComida'),
      enComida: c('EnComida'),
      retardos: c('Retardo'),
      ausentes: c('Ausente'),
      porRevisar: this.checadas.filter((x) => x.validacion !== 'Valida').length,
      solicitudesPendientes: this.solicitudesDb.filter((s) => s.estado === 'Pendiente').length,
      correccionesPendientes: this.correccionesDb.filter((c) => c.estado === 'Pendiente').length,
      jornadasSinCierre: this.abiertas.filter((j) => j.estado !== 'Cerrada').length,
      arcoPendientes: this.arcoDb.filter((a) => a.estado !== 'Atendida').length,
      lugaresPendientes: this.lugaresEmpleados.filter((l) => l.estado === 'Pendiente').length,
      dispositivosPendientes: this.dispositivosDb.filter((d) => d.estado === 'Pendiente').length,
      incidenciasAbiertas: abiertas.length,
      ayudaUrgente: abiertas.filter((i) => i.requiereAyuda).length,
      contingenciaActiva: this.contingenciasDb.find((x) => x.activa),
    });
  }

  async checadasRecientes(soloPorRevisar = false): Promise<Checada[]> {
    const l = soloPorRevisar ? this.checadas.filter((c) => c.validacion !== 'Valida') : this.checadas;
    return espera([...l].sort((a, b) => b.horaServidor.localeCompare(a.horaServidor)));
  }

  async empleados(): Promise<Empleado[]> {
    return espera(this.empleadosActuales());
  }

  async solicitudes(): Promise<Solicitud[]> {
    return espera([...this.solicitudesDb].sort(porCreadaDesc));
  }

  async resolverSolicitud(id: string, aprobar: boolean, comentario?: string): Promise<Solicitud> {
    if (this.sinPermiso('resolver')) return falla(MSG_PERMISO);
    const s = this.solicitudesDb.find((x) => x.id === id);
    if (!s) return falla('Solicitud no encontrada.');
    s.estado = aprobar ? 'Aprobada' : 'Rechazada';
    s.comentarioResolucion = comentario;
    this.registrar(aprobar ? 'Aprobacion' : 'Rechazo', `Solicitud de ${s.empleado}`, `${ETQ_SOLICITUD[s.tipo]}: ${comentario ?? ''}`.trim());
    return espera(s);
  }

  async lugares(): Promise<LugarPermitido[]> { return espera(LUGARES); }

  private validarLugar(d: DatosLugar, propio?: string): string | null {
    const nombre = d.nombre.trim();
    if (nombre.length < 3) return 'Escribe el nombre del lugar (mínimo 3 letras).';
    if (LUGARES.some((l) => l.nombre === nombre && l.id !== propio)) return 'Ya existe un lugar con ese nombre.';
    if (d.direccion.trim().length < 3) return 'Escribe la dirección del lugar.';
    if (d.tipo === 'Itinerante') return null;
    if (d.latitud == null || d.longitud == null) return 'Marca el lugar en el mapa o escribe sus coordenadas: sin ellas no se pueden validar las checadas.';
    if (Math.abs(d.latitud) > 90 || Math.abs(d.longitud) > 180) return 'Las coordenadas no son válidas.';
    const radio = d.radioMetros ?? 150;
    if (radio < 20 || radio > 2000) return 'El radio debe estar entre 20 y 2000 metros.';
    return null;
  }

  async crearLugar(d: DatosLugar): Promise<LugarPermitido> {
    if (this.sinPermiso('configurar')) return falla(MSG_PERMISO);
    const error = this.validarLugar(d);
    if (error) return falla(error);
    const itinerante = d.tipo === 'Itinerante';
    const lugar: LugarPermitido = {
      id: nuevoId('l'), nombre: d.nombre.trim(), tipo: d.tipo, direccion: d.direccion.trim(), radioMetros: itinerante ? undefined : d.radioMetros ?? 150,
      latitud: itinerante ? undefined : d.latitud, longitud: itinerante ? undefined : d.longitud, vigencia: 'Permanente', empleadosAsignados: 0, redes: [],
    };
    LUGARES.push(lugar);
    this.registrar('Configuracion', `Lugar ${lugar.nombre}`, `Creó el lugar (${lugar.tipo})`);
    return espera(lugar);
  }

  async modificarLugar(id: string, d: DatosLugar): Promise<LugarPermitido> {
    if (this.sinPermiso('configurar')) return falla(MSG_PERMISO);
    const l = LUGARES.find((x) => x.id === id);
    if (!l) return falla('No encontramos ese lugar.');
    const error = this.validarLugar(d, id);
    if (error) return falla(error);
    const itinerante = d.tipo === 'Itinerante';
    Object.assign(l, { nombre: d.nombre.trim(), tipo: d.tipo, direccion: d.direccion.trim(), radioMetros: itinerante ? undefined : d.radioMetros ?? 150, latitud: itinerante ? undefined : d.latitud, longitud: itinerante ? undefined : d.longitud });
    this.registrar('Configuracion', `Lugar ${l.nombre}`, 'Modificó el lugar');
    return espera(l);
  }

  async eliminarLugar(id: string, destinoId?: string): Promise<ResultadoEliminarLugar> {
    if (this.sinPermiso('configurar')) return falla(MSG_PERMISO);
    const i = LUGARES.findIndex((x) => x.id === id);
    if (i < 0) return falla('No encontramos ese lugar.');
    const l = LUGARES[i]!;
    let movidos = 0;
    if (l.empleadosAsignados > 0) {
      if (!destinoId) return falla(`${l.empleadosAsignados} colaborador(es) tienen este lugar. Elige a qué lugar pasarlos para poder eliminarlo.`);
      const destino = LUGARES.find((x) => x.id === destinoId && x.id !== id);
      if (!destino) return falla('No encontramos el lugar al que quieres pasarlos.');
      movidos = l.empleadosAsignados;
      destino.empleadosAsignados += movidos;
      for (const s of this.lugaresEmpleados.filter((x) => x.nombre === l.nombre && x.estado === 'Aprobado')) s.nombre = destino.nombre;
    }
    LUGARES.splice(i, 1);
    this.registrar('Configuracion', `Lugar ${l.nombre}`, movidos ? `Dio de baja el lugar y pasó a ${movidos} colaborador(es)` : 'Dio de baja el lugar');
    return espera({ movidos });
  }

  async ubicacionesColaboradores(): Promise<UbicacionColaborador[]> {
    const inicio = new Date();
    inicio.setHours(0, 0, 0, 0);
    const metros = (a: Coordenada, b: Coordenada) => {
      const rad = (g: number) => (g * Math.PI) / 180;
      const h = Math.sin(rad(b.latitud - a.latitud) / 2) ** 2 + Math.cos(rad(a.latitud)) * Math.cos(rad(b.latitud)) * Math.sin(rad(b.longitud - a.longitud) / 2) ** 2;
      return 2 * 6_371_000 * Math.asin(Math.sqrt(h));
    };
    return espera(this.empleadosDb.map((e): UbicacionColaborador => {
      const asignados = this.lugaresEmpleados.filter((l) => l.empleadoId === e.id && l.estado === 'Aprobado').map((l) => l.nombre);
      const base = { empleadoId: e.id, nombre: e.nombre, numero: e.numero, departamento: e.departamento, lugaresAsignados: asignados };
      const ultima = this.checadas.filter((c) => c.empleadoId === e.id && new Date(c.horaServidor) >= inicio)
        .sort((a, b) => b.horaServidor.localeCompare(a.horaServidor))[0];
      if (!ultima) return { ...base, estado: 'SinChecada' };
      const comun = { ...base, tipo: ultima.tipo, hora: ultima.horaServidor, lugarDetectado: ultima.lugar, latitud: ultima.posicion?.latitud, longitud: ultima.posicion?.longitud };
      if (ultima.tipo === 'Salida') return { ...comun, estado: 'Salio' };
      if (!ultima.posicion) return { ...comun, estado: ultima.validacion === 'Valida' ? 'EnSuLugar' : 'SinUbicacion' };
      if (ultima.validacion === 'Valida') return { ...comun, estado: 'EnSuLugar' };
      const cercanos = LUGARES.filter((l) => l.latitud != null && l.longitud != null && asignados.includes(l.nombre))
        .map((l) => metros(ultima.posicion!, { latitud: l.latitud!, longitud: l.longitud! }));
      return { ...comun, estado: 'FueraDeLugar', distanciaMetros: cercanos.length ? Math.round(Math.min(...cercanos)) : undefined };
    }));
  }

  async solicitudesLugar(): Promise<SolicitudLugar[]> {
    return espera([...this.lugaresEmpleados].sort((a, b) => b.creada.localeCompare(a.creada)));
  }

  async resolverSolicitudLugar(id: string, aprobar: boolean, comentario?: string): Promise<SolicitudLugar> {
    if (this.sinPermiso('configurar')) return falla(MSG_PERMISO);
    const l = this.lugaresEmpleados.find((x) => x.id === id);
    if (!l) return falla('Solicitud de lugar no encontrada.');
    l.estado = aprobar ? 'Aprobado' : 'Rechazado';
    l.comentarioResolucion = comentario;
    this.registrar(aprobar ? 'Aprobacion' : 'Rechazo', `Lugar de ${l.empleado}`, `${aprobar ? 'Aprobó' : 'Rechazó'} “${l.nombre}”${comentario ? `: ${comentario}` : ''}`);
    return espera(l);
  }

  async dispositivos(): Promise<Dispositivo[]> {
    const orden = { Pendiente: 0, Aprobado: 1, Revocado: 2 } as const;
    return espera([...this.dispositivosDb].sort((a, b) => orden[a.estado] - orden[b.estado]));
  }

  async dispositivosDe(empleadoId: string): Promise<DispositivoDetalle[]> {
    const propias = this.checadas.filter((c) => c.empleadoId === empleadoId).sort((a, b) => b.horaServidor.localeCompare(a.horaServidor));
    const hace30 = Date.now() - 30 * 86_400_000;
    const orden = { Pendiente: 0, Aprobado: 1, Revocado: 2 } as const;
    const equipos = this.dispositivosDb.filter((d) => d.empleadoId === empleadoId).sort((a, b) => orden[a.estado] - orden[b.estado]);
    const principal = equipos.find((d) => d.estado === 'Aprobado');
    return espera(equipos.map((d): DispositivoDetalle => {
      const suyas = d === principal ? propias : [];
      return {
        id: d.id, empleadoId: d.empleadoId, empleado: d.empleado, nombre: d.nombre, plataforma: d.plataforma, estado: d.estado, vinculadoEl: d.vinculadoEl,
        ultimoUso: d.ultimoUso ?? suyas[0]?.horaServidor, comentario: d.comentario, checadasTotal: suyas.length,
        checadasUltimos30Dias: suyas.filter((c) => new Date(c.horaServidor).getTime() >= hace30).length,
        recientes: suyas.slice(0, 8).map((c) => ({ hora: c.horaServidor, tipo: c.tipo, lugar: c.lugar, validacion: c.validacion, origen: c.origen })),
      };
    }));
  }

  async historialDe(empleadoId: string, desde?: string, hasta?: string): Promise<JornadaDia[]> {
    const fin = hasta ?? isoDia(new Date());
    const inicio = desde ?? isoDia(new Date(Date.parse(`${fin}T12:00:00`) - 29 * 86_400_000));
    const semilla = [...empleadoId].reduce((a, c) => a + c.charCodeAt(0), 0);
    return espera(this.historial
      .filter((j) => j.fecha >= inicio && j.fecha <= fin)
      .map((j, i): JornadaDia => {
        if (j.estado !== 'Normal') return j;
        const v = (semilla + i * 7) % 13;
        if (v === 0) { const r = 9 + (semilla % 6) * 4; return { ...j, estado: 'Retardo', minutosRetardo: r, horasOrdinarias: Math.round((8 - r / 60) * 100) / 100, entrada: `09:${String(r).padStart(2, '0')}` }; }
        if (v === 1) return { ...j, horasOrdinarias: 7.5, salida: '17:30' };
        return j;
      })
      .sort((a, b) => a.fecha.localeCompare(b.fecha)));
  }

  async resolverDispositivo(id: string, aprobar: boolean, comentario?: string): Promise<Dispositivo> {
    if (this.sinPermiso('configurar')) return falla(MSG_PERMISO);
    const d = this.dispositivosDb.find((x) => x.id === id);
    if (!d) return falla('Dispositivo no encontrado.');
    d.estado = aprobar ? 'Aprobado' : 'Revocado';
    d.comentario = comentario;
    this.registrar(aprobar ? 'Aprobacion' : 'Rechazo', `Dispositivo de ${d.empleado}`, `${aprobar ? 'Vinculó' : 'Revocó'} “${d.nombre}”${comentario ? `: ${comentario}` : ''}`);
    return espera(d);
  }

  async incidencias(): Promise<Incidencia[]> {
    return espera([...this.incidenciasDb].sort((a, b) => b.creada.localeCompare(a.creada)));
  }

  async atenderIncidencia(id: string, respuesta: string, cerrar = true): Promise<Incidencia> {
    if (this.sinPermiso('resolver')) return falla(MSG_PERMISO);
    const i = this.incidenciasDb.find((x) => x.id === id);
    if (!i) return falla('Incidencia no encontrada.');
    i.estado = cerrar ? 'Atendida' : 'EnAtencion';
    i.respuesta = respuesta;
    this.registrar('Cierre', `Incidencia de ${i.empleado}`, `${cerrar ? 'Atendió' : 'Tomó'} la incidencia: ${respuesta}`);
    return espera(i);
  }

  async contingencias(): Promise<Contingencia[]> {
    return espera([...this.contingenciasDb].sort((a, b) => b.inicio.localeCompare(a.inicio)));
  }

  async declararContingencia(c: NuevaContingencia): Promise<Contingencia> {
    if (this.sinPermiso('configurar')) return falla(MSG_PERMISO);
    if (this.contingenciasDb.some((x) => x.activa)) {
      return falla('Ya hay una contingencia activa. Ciérrala antes de declarar otra.');
    }
    const nueva: Contingencia = {
      id: nuevoId('c'), ...c, inicio: new Date().toISOString(), declaradaPor: 'Laura Mendoza (RH)', activa: true, checadasAfectadas: 0,
    };
    this.contingenciasDb.push(nueva);
    this.registrar('Declaracion', `Contingencia ${etiquetaTipoCont[nueva.tipo]}`, `${nueva.alcance}: ${ETQ_EFECTO[nueva.efecto]}`);
    return espera(nueva);
  }

  async cerrarContingencia(id: string): Promise<Contingencia> {
    if (this.sinPermiso('configurar')) return falla(MSG_PERMISO);
    const c = this.contingenciasDb.find((x) => x.id === id);
    if (!c) return falla('Contingencia no encontrada.');
    c.activa = false;
    c.fin = new Date().toISOString();
    this.registrar('Cierre', `Contingencia ${etiquetaTipoCont[c.tipo]}`, `Cerró la contingencia; ${c.checadasAfectadas} checadas afectadas`);
    return espera(c);
  }


  async reporteSemana(): Promise<FilaReporte[]> {
    const filas: FilaReporte[] = this.empleadosDb.filter((e) => e.estadoHoy !== 'Vacaciones').map((e, i) => {
      const extraDobles = i % 4 === 0 ? 3 : i % 5 === 0 ? 6 : 0;
      const extraTriples = i % 9 === 0 ? 2 : 0;
      const total = extraDobles + extraTriples;
      return {
        empleadoId: e.id, empleado: e.nombre,
        diasTrabajados: 5 - (i % 6 === 4 ? 1 : 0),
        horasOrdinarias: 40 - (i % 6 === 4 ? 8 : 0),
        extraDobles, extraTriples,
        retardos: i % 3 === 0 ? 1 : 0,
        faltas: i % 6 === 4 ? 1 : 0,
        alertas: i % 9 === 0 ? 1 : 0,
        diasConExtra: total > 0 ? Math.min(3, Math.ceil(total / 3)) : 0,
        extraSinAutorizar: Math.min(total, i % 5 === 0 ? 3 : i % 9 === 0 ? 2 : 0),
      };
    });
    return espera(filas);
  }

  async miConsentimiento(): Promise<Consentimiento> { return espera(this.consentimiento); }

  async aceptarConsentimiento(): Promise<Consentimiento> {
    this.consentimiento = { versionAviso: VERSION_AVISO, aceptado: true, fecha: new Date().toISOString() };
    guardarConsentimiento(this.consentimiento);
    return espera(this.consentimiento);
  }

  async reiniciarConsentimiento(): Promise<void> {
    this.consentimiento = { ...CONSENTIMIENTO_INICIAL };
    guardarConsentimiento(null);
    return espera(undefined);
  }

  async misSesiones(): Promise<SesionActiva[]> { return espera(this.sesiones); }

  async cerrarSesionRemota(id: string): Promise<void> {
    this.sesiones = this.sesiones.filter((s) => s.id !== id || s.actual);
    return espera(undefined);
  }

  async cerrarOtrasSesiones(): Promise<void> {
    this.sesiones = this.sesiones.filter((s) => s.actual);
    return espera(undefined);
  }

  async miSeguridad(): Promise<MiSeguridad> { return espera(this.seguridad); }

  async cambiarMetodo2fa(m: Metodo2fa): Promise<MiSeguridad> {
    if (!this.seguridad.metodos.find((x) => x.id === m)?.disponible) return falla('Este método aún no está disponible.');
    this.seguridad = { ...this.seguridad, metodo2fa: m };
    return espera(this.seguridad);
  }

  async misArco(): Promise<SolicitudArco[]> {
    return espera(this.arcoDb.filter((a) => a.empleadoId === YO).sort((a, b) => b.creada.localeCompare(a.creada)));
  }

  async solicitarArco(derecho: DerechoArco, detalle: string): Promise<SolicitudArco> {
    const limite = new Date();
    limite.setDate(limite.getDate() + 28);
    const nueva: SolicitudArco = {
      id: nuevoId('ar'), empleadoId: YO, empleado: 'Luis Ángel', derecho, detalle, creada: new Date().toISOString(),
      limite: isoDia(limite), estado: 'Recibida',
    };
    this.arcoDb.push(nueva);
    return espera(nueva);
  }

  async miHorario(): Promise<MiHorario> {
    const yo = this.empleadosDb.find((e) => e.id === YO)!;
    const turno = this.turnosActuales().find((t) => t.id === yo.turnoId)!;
    const laborables = turno.diasLaborales === 'Lun a sáb' ? 6 : 5;
    const casa = yo.modalidad === 'HomeOffice' ? [0, 1, 2, 3, 4] : yo.modalidad === 'Hibrido' ? [1, 3] : [];
    const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    return espera({
      turno,
      semana: dias.map((dia, i) => ({
        dia, horario: i < laborables ? `${turno.entrada} – ${turno.salida}` : 'Descanso', descanso: i >= laborables, casa: i < laborables && casa.includes(i),
      })),
      proximosFestivos: FESTIVOS.filter((f) => f.fecha >= isoDia(new Date())).slice(0, 4),
      comida: this.comidaDe(yo),
    });
  }

  async misSaldos(): Promise<MisSaldos> { return espera(this.calcularSaldos()); }

  async misCorrecciones(): Promise<Correccion[]> {
    return espera(this.correccionesDb.filter((c) => c.empleadoId === YO).sort((a, b) => b.creada.localeCompare(a.creada)));
  }

  async solicitarCorreccion(c: NuevaCorreccion): Promise<Correccion> {
    if (this.correccionesDb.some((x) => x.empleadoId === YO && x.fecha === c.fecha && x.tipo === c.tipo && x.estado === 'Pendiente')) {
      return falla('Ya tienes una corrección pendiente para ese día y tipo de checada.');
    }
    const nueva: Correccion = {
      id: nuevoId('c'), empleadoId: YO, empleado: 'Luis Ángel', fecha: c.fecha, tipo: c.tipo, horaSolicitada: c.hora, motivo: c.motivo,
      estado: 'Pendiente', creada: new Date().toISOString(),
    };
    const dia = this.historial.find((d) => d.fecha === c.fecha);
    if (dia?.entrada && c.tipo === 'Entrada') nueva.horaOriginal = dia.entrada;
    if (dia?.salida && c.tipo === 'Salida') nueva.horaOriginal = dia.salida;
    this.correccionesDb.push(nueva);
    if (c.tipo === 'Salida' && c.fecha === isoDia(new Date())) this.cambiarJornadaHoy('CorreccionSolicitada');
    return espera(nueva);
  }

  async misNotificaciones(): Promise<Notificacion[]> { return espera(this.notificacionesDe()); }

  async marcarNotificacionesLeidas(): Promise<void> {
    for (const n of this.notificacionesDe()) this.leidas.add(n.id);
    return espera(undefined);
  }

  async misPreferenciasNotif(): Promise<PreferenciasNotif> { return espera(this.preferencias); }

  async guardarPreferenciasNotif(p: PreferenciasNotif): Promise<PreferenciasNotif> {
    this.preferencias = { ...p };
    return espera(this.preferencias);
  }

  async miConstancia(mes?: string): Promise<Constancia> { return espera(this.armarConstancia(mes ?? mesAnterior(), YO)); }

  async acusarConstancia(mes: string, conforme: boolean, observacion?: string): Promise<Constancia> {
    this.acusesDb.set(mes, { conforme, fecha: new Date().toISOString(), observacion });
    return espera(this.armarConstancia(mes, YO));
  }

  async verificarIntegridad(): Promise<ResultadoIntegridad> {
    let previo = 'GENESIS';
    let fallo: Checada | undefined;
    for (const c of this.checadas) {
      if (c.selloAnterior !== previo || c.sello !== hashCorto(contenidoSello(c))) { fallo = c; break; }
      previo = c.sello;
    }
    return espera({
      registros: this.checadas.length,
      integra: !fallo,
      primerFallo: fallo ? { folio: fallo.folio, empleado: fallo.empleado } : undefined,
      ultimoSello: this.checadas[this.checadas.length - 1].sello,
      verificadoEl: new Date().toISOString(),
      constancia: { folio: 'NOM151-2026-000481', emitidaEl: hace(0).toISOString(), proveedor: 'Prestador de servicios de certificación (demostración)' },
    });
  }

  async simularAlteracion(restaurar: boolean): Promise<void> {
    if (restaurar && this.alterada) {
      this.checadas[this.alterada.indice].lugar = this.alterada.lugar;
      this.alterada = undefined;
    } else if (!restaurar && !this.alterada) {
      const indice = 3;
      this.alterada = { indice, lugar: this.checadas[indice].lugar };
      this.checadas[indice].lugar = `${this.checadas[indice].lugar} (editado)`;
    }
    return espera(undefined);
  }

  async auditoria(): Promise<EventoAuditoria[]> {
    return espera([...this.bitacora].sort((a, b) => b.fecha.localeCompare(a.fecha)));
  }

  async registrarExportacion(detalle: string): Promise<void> {
    this.registrar('Exportacion', 'Expediente de inspección', detalle);
    return espera(undefined);
  }

  async usuariosAdmin(): Promise<UsuarioAdmin[]> { return espera(this.usuariosDb); }

  async catalogosUsuarios(): Promise<CatalogosUsuarios> {
    const unicos = (xs: string[]) => [...new Set(xs)].sort((a, b) => a.localeCompare(b, 'es'));
    return espera({ sedes: unicos(this.empleadosDb.map((e) => e.sede)), areas: unicos(this.empleadosDb.map((e) => e.departamento)), proyectos: PROYECTOS });
  }

  async crearUsuario(d: DatosUsuario): Promise<UsuarioAdmin> {
    const error = this.validarUsuario(d) ?? this.validarGestion(d.rol);
    if (error) return falla(error);
    if (this.usuariosDb.some((u) => u.correo.toLowerCase() === d.correo.trim().toLowerCase())) {
      return falla('Ya existe una cuenta con ese correo. Búscala y reactívala en lugar de crear otra.');
    }
    if (d.empleadoId && this.usuariosDb.some((u) => u.empleadoId === d.empleadoId)) {
      return falla('Ese colaborador ya tiene una cuenta en el portal. Cambia su rol desde su ficha.');
    }
    const u: UsuarioAdmin = {
      id: nuevoId('ua'), ...this.normalizar(d), estado: 'Invitado', creado: new Date().toISOString(), creadoPor: this.sesion.usuario()?.nombre ?? 'Sistema',
    };
    this.usuariosDb.unshift(u);
    this.registrar('Usuario', `Usuario ${u.nombre}`,
      `Alta como ${PERMISOS[u.rol].nombre} (${textoAlcance(u.alcance)})${u.vigenciaHasta ? `, acceso hasta ${u.vigenciaHasta}` : ''}. Invitación enviada a ${u.correo}`);
    return espera(u);
  }

  async actualizarUsuario(id: string, d: DatosUsuario): Promise<UsuarioAdmin> {
    const u = this.usuariosDb.find((x) => x.id === id);
    if (!u) return falla('Usuario no encontrado.');
    const error = this.validarUsuario(d) ?? this.validarGestion(u.rol) ?? this.validarGestion(d.rol);
    if (error) return falla(error);
    if (this.esYo(u) && d.rol !== u.rol) return falla('No puedes cambiar tu propio rol. Pídeselo a otro administrador.');
    if (u.rol === 'Admin' && d.rol !== 'Admin' && this.adminsActivos() <= 1) return falla('Debe quedar al menos un administrador activo.');
    const n = this.normalizar(d);
    const cambios: string[] = [];
    if (u.rol !== n.rol) cambios.push(`rol de ${PERMISOS[u.rol].nombre} a ${PERMISOS[n.rol].nombre}`);
    if (textoAlcance(u.alcance) !== textoAlcance(n.alcance)) cambios.push(`alcance a ${textoAlcance(n.alcance)}`);
    if ((u.vigenciaHasta ?? '') !== (n.vigenciaHasta ?? '')) cambios.push(n.vigenciaHasta ? `vigencia hasta ${n.vigenciaHasta}` : 'vigencia sin fecha');
    if (u.nombre !== n.nombre || u.correo !== n.correo || u.puesto !== n.puesto || u.organizacion !== n.organizacion) cambios.push('datos de contacto');
    if (!cambios.length) return espera(u);
    Object.assign(u, n);
    this.registrar(cambios.some((c) => c.startsWith('rol')) ? 'Rol' : 'Usuario', `Usuario ${u.nombre}`, `Cambió ${cambios.join(', ')}`);
    return espera(u);
  }

  async cambiarEstadoUsuario(id: string, activo: boolean, motivo: string): Promise<UsuarioAdmin> {
    const u = this.usuariosDb.find((x) => x.id === id);
    if (!u) return falla('Usuario no encontrado.');
    const error = this.validarGestion(u.rol);
    if (error) return falla(error);
    if (!activo) {
      if (this.esYo(u)) return falla('No puedes desactivar tu propia cuenta.');
      if (u.rol === 'Admin' && this.adminsActivos() <= 1) return falla('Debe quedar al menos un administrador activo.');
      if (motivo.trim().length < 5) return falla('Indica el motivo de la baja; queda en la bitácora.');
      u.estado = 'Inactivo';
      u.motivoBaja = motivo.trim();
      this.registrar('Usuario', `Usuario ${u.nombre}`, `Desactivó la cuenta y cerró sus sesiones. Motivo: ${u.motivoBaja}. Su historial se conserva.`);
    } else {
      if (u.vigenciaHasta && u.vigenciaHasta < isoDia(new Date())) return falla('El acceso ya venció. Edita la cuenta y define una nueva fecha de vigencia antes de reactivarla.');
      u.estado = u.ultimoAcceso ? 'Activo' : 'Invitado';
      u.motivoBaja = undefined;
      this.registrar('Usuario', `Usuario ${u.nombre}`, `Reactivó la cuenta${motivo.trim() ? `. Motivo: ${motivo.trim()}` : ''}`);
    }
    return espera(u);
  }

  async reenviarInvitacion(id: string): Promise<UsuarioAdmin> {
    const u = this.usuariosDb.find((x) => x.id === id);
    if (!u) return falla('Usuario no encontrado.');
    const error = this.validarGestion(u.rol);
    if (error) return falla(error);
    if (u.estado !== 'Invitado') return falla('Solo se reenvía la invitación a cuentas que aún no se activan.');
    this.registrar('Usuario', `Usuario ${u.nombre}`, `Reenvió la invitación a ${u.correo}`);
    return espera(u);
  }

  async restablecerDobleFactor(id: string): Promise<UsuarioAdmin> {
    const u = this.usuariosDb.find((x) => x.id === id);
    if (!u) return falla('Usuario no encontrado.');
    const error = this.validarGestion(u.rol);
    if (error) return falla(error);
    if (this.esYo(u)) return falla('Restablece tu propio segundo factor desde tu perfil.');
    u.dobleFactor = undefined;
    this.registrar('Usuario', `Usuario ${u.nombre}`, 'Restableció la doble autenticación; deberá configurarla en su próximo inicio de sesión');
    return espera(u);
  }

  private validarUsuario(d: DatosUsuario): string | null {
    const p = PERMISOS[d.rol];
    if (!p || d.rol === 'Empleado') return 'Elige un rol del portal.';
    if (d.nombres !== undefined) {
      if (d.nombres.trim().length < 2) return 'Escribe el nombre o los nombres de la persona.';
      if ((d.apellidoPaterno ?? '').trim().length < 2) return 'Escribe el apellido paterno.';
    } else if (d.nombre.trim().length < 3) return 'Escribe el nombre completo.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.correo.trim())) return 'Escribe un correo válido; ahí llegará la invitación.';
    if (d.externo && !p.permiteExterno) return `${p.nombre} solo puede asignarse a personal de la empresa.`;
    if (d.externo && !d.organizacion?.trim()) return 'Indica la organización a la que pertenece la persona externa.';
    if (!p.alcances.includes(d.alcance.tipo)) return `Elige el alcance de ${p.nombre}.`;
    if (d.alcance.tipo !== 'Empresa' && !d.alcance.valores.length) return 'Selecciona al menos una opción del alcance.';
    if (p.vigenciaObligatoria && !d.vigenciaHasta) return `${p.nombre}: indica hasta qué fecha tendrá acceso.`;
    if (d.vigenciaHasta && d.vigenciaHasta < isoDia(new Date())) return 'La fecha de vigencia ya pasó.';
    return null;
  }

  private validarGestion(rol: Rol): string | null {
    const yo = this.sesion.usuario();
    if (!yo || !ROLES_GESTIONABLES[yo.rol].includes(rol)) {
      return yo && ROLES_GESTIONABLES[yo.rol].length
        ? `Tu rol solo administra cuentas de ${ROLES_GESTIONABLES[yo.rol].map((r) => PERMISOS[r].nombre).join(' y ')}.`
        : MSG_PERMISO;
    }
    return null;
  }

  private normalizar(d: DatosUsuario) {
    return {
      nombre: d.nombres !== undefined ? [d.nombres, d.apellidoPaterno, d.apellidoMaterno].map((x) => (x ?? '').trim()).filter(Boolean).join(' ') : d.nombre.trim(),
      nombres: d.nombres?.trim(), apellidoPaterno: d.apellidoPaterno?.trim(), apellidoMaterno: d.apellidoMaterno?.trim() || undefined,
      correo: d.correo.trim().toLowerCase(), puesto: d.puesto.trim(), rol: d.rol,
      alcance: d.alcance.tipo === 'Empresa' ? { tipo: 'Empresa' as const, valores: [] } : { tipo: d.alcance.tipo, valores: [...d.alcance.valores] },
      empleadoId: d.externo ? undefined : d.empleadoId, externo: d.externo, organizacion: d.externo ? d.organizacion?.trim() : undefined,
      vigenciaHasta: d.vigenciaHasta || undefined,
    };
  }

  private esYo(u: UsuarioAdmin) { return u.nombre === this.sesion.usuario()?.nombre; }
  private adminsActivos() { return this.usuariosDb.filter((u) => u.rol === 'Admin' && u.estado !== 'Inactivo').length; }

  async arco(): Promise<SolicitudArco[]> {
    return espera([...this.arcoDb].sort((a, b) => a.limite.localeCompare(b.limite)));
  }

  async atenderArco(id: string, respuesta: string): Promise<SolicitudArco> {
    if (this.sinPermiso('configurar')) return falla(MSG_PERMISO);
    const a = this.arcoDb.find((x) => x.id === id);
    if (!a) return falla('Solicitud no encontrada.');
    a.estado = 'Atendida';
    a.respuesta = respuesta;
    this.registrar('Privacidad', `Solicitud ARCO de ${a.empleado}`, `Atendió derecho de ${a.derecho.toLowerCase()}`);
    return espera(a);
  }

  async turnos(): Promise<Turno[]> { return espera(this.turnosActuales()); }

  async crearFestivo(f: Festivo): Promise<Festivo> {
    if (this.sinPermiso('configurar')) return falla(MSG_PERMISO);
    const nombre = f.nombre.trim().slice(0, 80);
    if (nombre.length < 3) return falla('Escribe el nombre del festivo (mínimo 3 letras).');
    if (FESTIVOS.some((x) => x.fecha === f.fecha)) return falla('Ese día ya está marcado como festivo.');
    const nuevo: Festivo = { fecha: f.fecha, nombre, nota: f.nota.trim().slice(0, 120) };
    FESTIVOS.push(nuevo);
    FESTIVOS.sort((a, b) => a.fecha.localeCompare(b.fecha));
    this.registrar('Configuracion', `Festivo ${nombre}`, `Agregó el festivo del ${nuevo.fecha}`);
    return espera(nuevo);
  }

  async modificarFestivo(fechaActual: string, c: Festivo): Promise<Festivo> {
    if (this.sinPermiso('configurar')) return falla(MSG_PERMISO);
    const i = FESTIVOS.findIndex((x) => x.fecha === fechaActual);
    if (i < 0) return falla('Festivo no encontrado.');
    const nombre = c.nombre.trim().slice(0, 80);
    if (nombre.length < 3) return falla('Escribe el nombre del festivo (mínimo 3 letras).');
    if (c.fecha !== fechaActual && FESTIVOS.some((x) => x.fecha === c.fecha)) return falla('Ese día ya está marcado como festivo.');
    const nuevo: Festivo = { fecha: c.fecha, nombre, nota: c.nota.trim().slice(0, 120) };
    FESTIVOS[i] = nuevo;
    FESTIVOS.sort((a, b) => a.fecha.localeCompare(b.fecha));
    this.registrar('Configuracion', `Festivo ${nombre}`, `Modificó el festivo del ${fechaActual}`);
    return espera(nuevo);
  }

  async eliminarFestivo(fecha: string): Promise<void> {
    if (this.sinPermiso('configurar')) return falla(MSG_PERMISO);
    const i = FESTIVOS.findIndex((x) => x.fecha === fecha);
    if (i < 0) return falla('Festivo no encontrado.');
    const [quitado] = FESTIVOS.splice(i, 1);
    this.registrar('Configuracion', `Festivo ${quitado!.nombre}`, `Quitó el festivo del ${fecha}`);
    return espera(undefined);
  }

  async crearTurno(n: NuevoTurno): Promise<Turno> {
    if (this.sinPermiso('configurar')) return falla(MSG_PERMISO);
    const nombre = n.nombre.trim().slice(0, 60);
    if (nombre.length < 3) return falla('Escribe el nombre del turno (mínimo 3 letras).');
    if (this.turnosDb.some((t) => t.nombre === nombre)) return falla('Ya existe un turno con ese nombre.');
    const min = (h: string) => { const [a, b] = h.split(':').map(Number); return (a ?? 0) * 60 + (b ?? 0); };
    if (!/^\d{2}:\d{2}$/.test(n.entrada) || !/^\d{2}:\d{2}$/.test(n.salida)) return falla('Indica la hora de entrada y de salida.');
    if (n.entrada === n.salida) return falla('La entrada y la salida no pueden ser la misma hora.');
    const duracion = (min(n.salida) - min(n.entrada) + 1440) % 1440;
    if (duracion > 720) return falla('El turno no puede durar más de 12 horas.');
    if (n.comidaMin < DESCANSO_MINIMO_MIN) return falla(`La comida no puede ser menor a ${DESCANSO_MINIMO_MIN} minutos en jornada continua (art. 63 LFT).`);
    if (n.comidaMin > 120) return falla('La comida no puede pasar de 120 minutos.');
    if (duracion <= n.comidaMin) return falla('La comida no cabe dentro del horario del turno.');
    if (n.toleranciaMin < 0 || n.toleranciaMin > 30) return falla('La tolerancia de entrada debe estar entre 0 y 30 minutos.');
    if (n.toleranciaComidaMin < 0 || n.toleranciaComidaMin > 15) return falla('La tolerancia de regreso de comida debe estar entre 0 y 15 minutos.');
    const sabado = n.patron === 'LunesASabado';
    const turno: Turno = {
      id: nuevoId('t'), nombre, tipo: n.tipo, entrada: n.entrada, salida: n.salida, comidaMin: n.comidaMin, toleranciaMin: n.toleranciaMin,
      toleranciaComidaMin: n.toleranciaComidaMin, diasLaborales: sabado ? 'Lun a sáb' : 'Lun a vie', descanso: sabado ? 'Domingo' : 'Sábado y domingo', empleados: 0,
    };
    this.turnosDb.push(turno);
    this.registrar('Configuracion', `Turno ${nombre}`, `Creó el turno ${n.entrada} – ${n.salida}, ${turno.diasLaborales}, comida de ${n.comidaMin} min`);
    return espera(turno);
  }

  async eliminarTurno(id: string, destinoId?: string): Promise<ResultadoEliminarTurno> {
    if (this.sinPermiso('configurar')) return falla(MSG_PERMISO);
    const t = this.turnosDb.find((x) => x.id === id);
    if (!t) return falla('Turno no encontrado.');
    if (this.turnosDb.length <= 1) return falla('Debe quedar al menos un turno.');
    const gente = this.empleadosDb.filter((e) => e.turnoId === id);
    let detalle = 'Eliminó el turno';
    if (gente.length) {
      if (!destinoId) return falla(`${gente.length} colaborador(es) tienen este turno. Elige a qué turno pasarlos para poder eliminarlo.`);
      if (destinoId === id) return falla('El turno nuevo debe ser distinto al que vas a eliminar.');
      const destino = this.turnosDb.find((x) => x.id === destinoId);
      if (!destino) return falla('No encontramos el turno al que quieres pasarlos.');
      for (const e of gente) { e.turnoId = destino.id; e.horario = `${destino.entrada} – ${destino.salida}`; e.tipoJornada = destino.tipo; }
      detalle = `Eliminó el turno y pasó a ${gente.length} colaborador(es) a ${destino.nombre}`;
    }
    this.turnosDb = this.turnosDb.filter((x) => x.id !== id);
    this.registrar('Configuracion', `Turno ${t.nombre}`, detalle);
    return espera({ movidos: gente.length });
  }

  async configurarTurno(id: string, cambios: CambiosTurno): Promise<Turno> {
    if (this.sinPermiso('configurar')) return falla(MSG_PERMISO);
    const t = this.turnosDb.find((x) => x.id === id);
    if (!t) return falla('Turno no encontrado.');
    if (cambios.comidaMin !== undefined && cambios.comidaMin < DESCANSO_MINIMO_MIN) {
      return falla(`La comida no puede ser menor a ${DESCANSO_MINIMO_MIN} minutos en jornada continua (art. 63 LFT).`);
    }
    if (cambios.comidaMin !== undefined && cambios.comidaMin > 120) return falla('La comida no puede pasar de 120 minutos.');
    const notas: string[] = [];
    if (cambios.nombre !== undefined) {
      const nombre = cambios.nombre.trim().slice(0, 60);
      if (nombre.length < 3) return falla('Escribe el nombre del turno (mínimo 3 letras).');
      if (this.turnosDb.some((x) => x.nombre === nombre && x.id !== id)) return falla('Ya existe un turno con ese nombre.');
      if (nombre !== t.nombre) notas.push(`nombre de “${t.nombre}” a “${nombre}”`);
      t.nombre = nombre;
    }
    if (cambios.entrada !== undefined || cambios.salida !== undefined) {
      const entrada = cambios.entrada ?? t.entrada;
      const salida = cambios.salida ?? t.salida;
      const min = (h: string) => { const [a, b] = h.split(':').map(Number); return (a ?? 0) * 60 + (b ?? 0); };
      if (entrada === salida) return falla('La entrada y la salida no pueden ser la misma hora.');
      const duracion = (min(salida) - min(entrada) + 1440) % 1440;
      if (duracion > 720) return falla('El turno no puede durar más de 12 horas.');
      if (duracion <= (cambios.comidaMin ?? t.comidaMin)) return falla('La comida no cabe dentro del horario del turno.');
      if (entrada !== t.entrada || salida !== t.salida) notas.push(`horario de ${t.entrada}–${t.salida} a ${entrada}–${salida}`);
      t.entrada = entrada;
      t.salida = salida;
      for (const e of this.empleadosDb.filter((x) => x.turnoId === id)) e.horario = `${entrada} – ${salida}`;
    }
    if (cambios.tipo !== undefined && cambios.tipo !== t.tipo) {
      notas.push(`tipo de jornada de ${t.tipo} a ${cambios.tipo}`);
      t.tipo = cambios.tipo;
      for (const e of this.empleadosDb.filter((x) => x.turnoId === id)) e.tipoJornada = cambios.tipo;
    }
    if (cambios.patron !== undefined) {
      const sabado = cambios.patron === 'LunesASabado';
      const dias = sabado ? 'Lun a sáb' : 'Lun a vie';
      if (dias !== t.diasLaborales) notas.push(`días laborales de ${t.diasLaborales} a ${dias}`);
      t.diasLaborales = dias;
      t.descanso = sabado ? 'Domingo' : 'Sábado y domingo';
    }
    if (cambios.toleranciaMin !== undefined) {
      const v = Math.max(0, Math.min(30, cambios.toleranciaMin));
      notas.push(`tolerancia de entrada de ${t.toleranciaMin} a ${v} min`);
      t.toleranciaMin = v;
    }
    if (cambios.comidaMin !== undefined) {
      notas.push(`comida de ${t.comidaMin} a ${cambios.comidaMin} min`);
      t.comidaMin = cambios.comidaMin;
    }
    if (cambios.toleranciaComidaMin !== undefined) {
      const v = Math.max(0, Math.min(15, cambios.toleranciaComidaMin));
      notas.push(`tolerancia de regreso de comida de ${t.toleranciaComidaMin} a ${v} min`);
      t.toleranciaComidaMin = v;
    }
    if (notas.length) this.registrar('Configuracion', `Turno ${t.nombre}`, `Cambió ${notas.join(', ')}`);
    return espera(this.turnosActuales().find((x) => x.id === id)!);
  }

  async pactarComida(empleadoId: string, minutos: number | null, fundamento: string): Promise<Empleado> {
    if (this.sinPermiso('configurar')) return falla(MSG_PERMISO);
    const e = this.empleadosDb.find((x) => x.id === empleadoId);
    if (!e) return falla('Colaborador no encontrado.');
    if (minutos === null) {
      if (!e.comidaPactada) return espera(e);
      e.comidaPactada = undefined;
      this.registrar('Configuracion', `Empleado ${e.nombre}`, `Quitó la comida pactada; vuelve a la del turno (${this.turnoDe(e).comidaMin} min)`);
      return espera(e);
    }
    if (minutos < DESCANSO_MINIMO_MIN) return falla(`La comida no puede ser menor a ${DESCANSO_MINIMO_MIN} minutos en jornada continua (art. 63 LFT).`);
    if (minutos > 120) return falla('La comida no puede pasar de 120 minutos.');
    if (fundamento.trim().length < 5) return falla('Indica el fundamento: contrato individual, convenio o acuerdo por escrito.');
    const antes = e.comidaPactada?.minutos ?? this.turnoDe(e).comidaMin;
    e.comidaPactada = { minutos, fundamento: fundamento.trim() };
    this.registrar('Configuracion', `Empleado ${e.nombre}`, `Pactó comida de ${minutos} min (antes ${antes} min). Fundamento: ${e.comidaPactada.fundamento}`);
    return espera(e);
  }

  async asignarTurno(empleadoId: string, turnoId: string): Promise<Empleado> {
    if (this.sinPermiso('configurar')) return falla(MSG_PERMISO);
    const e = this.empleadosDb.find((x) => x.id === empleadoId);
    const t = this.turnosDb.find((x) => x.id === turnoId);
    if (!e || !t) return falla('No se encontró el colaborador o el turno.');
    e.turnoId = t.id;
    e.horario = `${t.entrada} – ${t.salida}`;
    e.tipoJornada = t.tipo;
    this.registrar('Configuracion', `Empleado ${e.nombre}`, `Asignó el turno ${t.nombre}`);
    return espera(e);
  }

  async festivos(): Promise<Festivo[]> {
    const hoy = isoDia(new Date());
    const finDeAnio = `${hoy.slice(0, 4)}-12-31`;
    return espera(FESTIVOS.filter((f) => f.fecha >= hoy && f.fecha <= finDeAnio));
  }

  async correcciones(): Promise<Correccion[]> {
    return espera([...this.correccionesDb].sort((a, b) => b.creada.localeCompare(a.creada)));
  }

  async resolverCorreccion(id: string, aprobar: boolean, comentario?: string): Promise<Correccion> {
    if (this.sinPermiso('resolver')) return falla(MSG_PERMISO);
    const c = this.correccionesDb.find((x) => x.id === id);
    if (!c) return falla('Corrección no encontrada.');
    c.estado = aprobar ? 'Aprobada' : 'Rechazada';
    c.comentarioResolucion = comentario;
    c.resueltaPor = `${this.sesion.usuario()?.nombre ?? 'Laura Mendoza'} (${this.sesion.usuario()?.rol ?? 'RH'})`;
    if (aprobar) {
      const nueva: Checada = {
        id: nuevoId('ch'), empleadoId: c.empleadoId, empleado: c.empleado, tipo: c.tipo,
        horaServidor: new Date(`${c.fecha}T${c.horaSolicitada}:00`).toISOString(), lugar: 'Corrección administrativa', validacion: 'Valida',
        motivos: ['Corrección aprobada; el registro original se conserva'], diferida: false, origen: 'Correccion',
        folio: `CH-COR-${c.id.toUpperCase()}`, sello: '', selloAnterior: '',
      };
      this.agregarSellada(nueva);
      const dia = c.empleadoId === YO ? this.historial.find((d) => d.fecha === c.fecha) : undefined;
      if (dia && c.tipo === 'Salida') {
        dia.salida = c.horaSolicitada;
        dia.alertas = dia.alertas.filter((a) => !a.startsWith('Salida sin registrar'));
      }
    }
    this.registrar('Correccion', `Checada de ${c.empleado}`, `${aprobar ? 'Aprobó' : 'Rechazó'} corrección de ${c.tipo} (${c.horaSolicitada})${comentario ? `: ${comentario}` : ''}`);
    return espera(c);
  }

  async jornadasPorCerrar(): Promise<JornadaAbierta[]> { return espera(this.abiertas.filter((j) => j.estado !== 'Cerrada')); }

  async pedirCierre(id: string): Promise<JornadaAbierta> {
    const j = this.abiertas.find((x) => x.id === id);
    if (!j) return falla('Jornada no encontrada.');
    j.avisada = true;
    this.registrar('Cierre', `Jornada de ${j.empleado}`, `Pidió justificar la jornada sin salida del ${j.fecha}`);
    return espera(j);
  }

  async tendenciaAsistencia(): Promise<PuntoTendencia[]> {
    const out: PuntoTendencia[] = [];
    for (let i = 0; out.length < 14; i++) {
      const d = hace(i);
      if (d.getDay() === 0 || d.getDay() === 6) continue;
      out.unshift({ fecha: isoDia(d), pct: 82 + (parseInt(hashCorto(isoDia(d)).slice(0, 3), 16) % 11) });
    }
    return espera(out);
  }

  async asistenciaHoy(sede?: string): Promise<AsistenciaHoy> {
    const lista = this.empleadosActuales().filter((e) => !sede || e.sede === sede);
    const cat = (e: Empleado) => {
      switch (e.estadoHoy) {
        case 'Presente': case 'Salio': return 'aTiempo';
        case 'EnComida': return 'enComida';
        case 'Retardo': return 'retardos';
        case 'Ausente': return 'ausentes';
        default: return 'justificados';
      }
    };
    const vacio = () => ({ total: 0, aTiempo: 0, enComida: 0, retardos: 0, ausentes: 0, justificados: 0 });
    const total = vacio();
    const porArea = new Map<string, ReturnType<typeof vacio>>();
    for (const e of lista) {
      const k = cat(e) as keyof ReturnType<typeof vacio>;
      const a = porArea.get(e.departamento) ?? vacio();
      a.total++; a[k]++; total.total++; total[k]++;
      porArea.set(e.departamento, a);
    }
    return espera({
      ...total,
      areas: [...porArea.entries()].map(([area, v]) => ({ area, ...v, cambio: (parseInt(hashCorto(area).slice(0, 4), 16) % 9) - 4 })).sort((a, b) => b.total - a.total),
      sedes: [...new Set(this.empleadosDb.map((e) => e.sede))].sort(),
    });
  }

  async acuses(): Promise<AcuseEmpleado[]> {
    const mes = mesAnterior();
    return espera(this.empleadosDb.map((e, i): AcuseEmpleado => {
      if (e.id === YO) {
        const a = this.acusesDb.get(mes);
        return { empleadoId: e.id, empleado: e.nombre, mes, estado: !a ? 'Pendiente' : a.conforme ? 'Firmada' : 'Inconforme', fecha: a?.fecha, observacion: a?.observacion };
      }
      if (i === 3) return { empleadoId: e.id, empleado: e.nombre, mes, estado: 'Inconforme', fecha: hace(10).toISOString(), observacion: 'No se refleja mi salida del día 14.' };
      if (i % 5 === 0) return { empleadoId: e.id, empleado: e.nombre, mes, estado: 'Pendiente' };
      return { empleadoId: e.id, empleado: e.nombre, mes, estado: 'Firmada', fecha: hace(8 + (i % 4)).toISOString() };
    }));
  }

  async cumplimiento(): Promise<ControlCumplimiento[]> {
    const acuses = await this.acuses();
    const firmadas = acuses.filter((a) => a.estado === 'Firmada').length;
    const inconformes = acuses.filter((a) => a.estado === 'Inconforme').length;
    const porRevisar = this.checadas.filter((c) => c.validacion !== 'Valida').length;
    const arcoVencidas = this.arcoDb.filter((a) => a.estado !== 'Atendida' && a.limite < isoDia(new Date())).length;
    const rep = await this.reporteSemana();
    const sinAutorizar = rep.reduce((a, f) => a + f.extraSinAutorizar, 0);
    const excedidos = rep.filter((f) => f.alertas > 0).length;
    const integra = (await this.verificarIntegridad()).integra;
    const dispPend = this.dispositivosDb.filter((d) => d.estado === 'Pendiente').length;
    const c = (id: string, area: ControlCumplimiento['area'], titulo: string, detalle: string, estado: ControlCumplimiento['estado'], referencia: string, ruta: string): ControlCumplimiento =>
      ({ id, area, titulo, detalle, estado, referencia, ruta });
    return espera([
      c('c1', 'Asistencia', 'Registro de entrada y salida', 'Cada checada se guarda con hora oficial, lugar y sello encadenado.', 'Cumple', 'Art. 804 LFT', '/auditoria'),
      c('c2', 'Asistencia', 'Integridad del registro', integra ? 'La cadena de sellos se verificó sin alteraciones.' : 'Se detectó un registro alterado. Revisa la bitácora.', integra ? 'Cumple' : 'Atencion', 'NOM-151', '/auditoria'),
      c('c3', 'Asistencia', 'Checadas por revisar', porRevisar ? `${porRevisar} checadas esperan revisión de RH.` : 'No hay checadas pendientes de revisión.', porRevisar ? 'Atencion' : 'Cumple', 'Política interna', '/revision'),
      c('c4', 'Asistencia', 'Constancias mensuales firmadas', `${firmadas} de ${acuses.length} firmadas${inconformes ? ` · ${inconformes} inconformidad(es)` : ''}.`, firmadas === acuses.length ? 'Cumple' : 'Atencion', 'Art. 804 LFT', '/reportes'),
      c('c5', 'Jornada', 'Límites de horas extra', excedidos ? `${excedidos} colaborador(es) rebasan los límites legales esta semana.` : 'Nadie rebasa los límites semanales.', excedidos ? 'Atencion' : 'Cumple', 'Arts. 66 y 67 LFT', '/reportes'),
      c('c6', 'Jornada', 'Horas extra con autorización previa', sinAutorizar ? `${sinAutorizar} h extra se trabajaron sin autorización previa.` : 'Todas las horas extra fueron autorizadas.', sinAutorizar ? 'Atencion' : 'Cumple', 'Política interna', '/reportes'),
      c('c7', 'Descansos', 'Festivos obligatorios cargados', `${FESTIVOS.length} días configurados para 2026 y 2027.`, 'Cumple', 'Arts. 74 y 75 LFT', '/turnos'),
      c('c8', 'Descansos', 'Vacaciones por antigüedad', 'El saldo se calcula con la tabla vigente desde 2023 (mínimo 12 días).', 'Cumple', 'Art. 76 LFT', '/empleados'),
      c('c10', 'Privacidad', 'Aviso de privacidad vigente', `Versión ${VERSION_AVISO} publicada y aceptada por los colaboradores activos.`, 'Cumple', 'LFPDPPP', '/privacidad'),
      c('c11', 'Privacidad', 'Solicitudes ARCO en plazo', arcoVencidas ? `${arcoVencidas} solicitud(es) vencida(s).` : 'Todas las solicitudes están dentro del plazo.', arcoVencidas ? 'Atencion' : 'Cumple', 'LFPDPPP', '/privacidad'),
      c('c12', 'Seguridad', 'Dispositivos por vincular', dispPend ? `${dispPend} equipo(s) esperan aprobación.` : 'No hay equipos pendientes.', dispPend ? 'Atencion' : 'Cumple', 'Política interna', '/empleados'),
      c('c13', 'Seguridad', 'Reglamento interior de trabajo', 'Aún no se ha cargado el documento vigente.', 'Pendiente', 'Art. 422 LFT', '/cumplimiento'),
    ]);
  }


  async importarEmpleados(filas: NuevoEmpleado[]): Promise<number> {
    if (this.sinPermiso('configurar')) return falla(MSG_PERMISO);
    for (const f of filas) {
      const t = this.turnosDb.find((x) => x.id === f.turnoId) ?? this.turnosDb[0];
      this.empleadosDb.push({
        id: nuevoId('e'), ...f, turnoId: t.id, horario: `${t.entrada} – ${t.salida}`, cuenta: 'Invitada', estadoHoy: 'Ausente',
      });
    }
    this.registrar('Configuracion', 'Empleados', `Importó ${filas.length} colaborador(es) desde CSV y envió invitaciones por correo`);
    return espera(filas.length);
  }

  private registrar(accion: AccionAuditoria, objeto: string, detalle: string) {
    const u = this.sesion.usuario();
    if (!u || u.rol === 'Empleado') return;
    this.bitacora.unshift({
      id: nuevoId('au'), fecha: new Date().toISOString(), usuario: u.nombre, rol: u.rol, accion, objeto, detalle, ip: '189.203.10.***',
    });
  }

  private sinPermiso(a: Accion): boolean {
    const u = this.sesion.usuario();
    return !!u && !PERMISOS[u.rol].acciones.includes(a);
  }

  private agregarSellada(c: Checada) {
    c.selloAnterior = this.checadas[this.checadas.length - 1]?.sello ?? 'GENESIS';
    c.sello = hashCorto(contenidoSello(c));
    this.checadas.push(c);
  }

  private turnosActuales(): Turno[] {
    return this.turnosDb.map((t) => ({ ...t, empleados: this.empleadosDb.filter((e) => e.turnoId === t.id).length }));
  }

  private calcularSaldos(): MisSaldos {
    const yo = this.empleadosDb.find((e) => e.id === YO)!;
    const hoy = new Date();
    const ingreso = new Date(`${yo.fechaIngreso}T12:00:00`);
    let anios = hoy.getFullYear() - ingreso.getFullYear();
    if (hoy < new Date(hoy.getFullYear(), ingreso.getMonth(), ingreso.getDate(), 12)) anios--;
    const inicioCiclo = new Date(ingreso.getFullYear() + anios, ingreso.getMonth(), ingreso.getDate(), 12);
    const vence = new Date(ingreso.getFullYear() + anios, ingreso.getMonth() + 6, ingreso.getDate(), 12);
    const derecho = diasVacaciones(anios);
    const tomadas = this.historial.filter((d) => d.estado === 'Vacaciones' && d.fecha >= isoDia(inicioCiclo)).length;
    const mias = this.solicitudesDb.filter((s) => s.empleadoId === YO);
    const programadas = mias.filter((s) => s.tipo === 'Vacaciones' && s.estado === 'Aprobada' && s.hasta >= isoDia(hoy)).reduce((a, s) => a + diasEntre(s.desde, s.hasta), 0);
    const mes = isoDia(hoy).slice(0, 7);
    return {
      antiguedadAnios: anios,
      vacacionesDerecho: derecho,
      vacacionesTomadas: tomadas,
      vacacionesProgramadas: programadas,
      vacacionesDisponibles: derecho - tomadas - programadas,
      primaVacacionalPct: 25,
      vencimientoVacaciones: isoDia(vence),
      permisosConGoceUsados: mias.filter((s) => s.tipo === 'Permiso' && s.estado === 'Aprobada').reduce((a, s) => a + diasEntre(s.desde, s.hasta), 0),
      permisosConGoceLimite: 6,
      diasIncapacidadAnio: mias.filter((s) => s.tipo === 'Incapacidad' && s.estado === 'Aprobada').reduce((a, s) => a + diasEntre(s.desde, s.hasta), 0),
      extraAutorizadasMes: this.historial.filter((d) => d.fecha.slice(0, 7) === mes && d.extraAutorizada).reduce((a, d) => a + d.extraDobles + d.extraTriples, 0),
    };
  }

  private notificacionesDe(): Notificacion[] {
    const p = this.preferencias;
    const derivadas: Notificacion[] = [];
    for (const s of this.solicitudesDb.filter((x) => x.empleadoId === YO && x.estado !== 'Pendiente')) {
      derivadas.push({ id: `n-${s.id}`, tipo: 'Resultado', titulo: `Tu solicitud de ${ETQ_SOLICITUD[s.tipo].toLowerCase()} fue ${s.estado === 'Aprobada' ? 'aprobada' : 'rechazada'}`, detalle: s.comentarioResolucion ?? '', fecha: s.creada, leida: false, ruta: '/solicitudes' });
    }
    for (const c of this.correccionesDb.filter((x) => x.empleadoId === YO && x.estado !== 'Pendiente')) {
      derivadas.push({ id: `n-${c.id}`, tipo: 'Resultado', titulo: `Tu corrección del ${c.fecha} fue ${c.estado === 'Aprobada' ? 'aprobada' : 'rechazada'}`, detalle: c.comentarioResolucion ?? '', fecha: c.creada, leida: false, ruta: '/solicitudes' });
    }
    for (const l of this.lugaresEmpleados.filter((x) => x.empleadoId === YO && x.comentarioResolucion)) {
      derivadas.push({ id: `n-${l.id}`, tipo: 'Resultado', titulo: `Tu lugar “${l.nombre}” fue ${l.estado === 'Aprobado' ? 'aprobado' : 'rechazado'}`, detalle: l.comentarioResolucion ?? '', fecha: l.creada, leida: false, ruta: '/lugares' });
    }
    const permitido = (n: Notificacion) => {
      switch (n.tipo) {
        case 'Resultado': return p.resultados;
        case 'Contingencia': return p.contingencias;
        case 'Seguridad': return p.seguridad;
        default: return p.recordatorios;
      }
    };
    return [...NOTIFICACIONES_BASE, ...derivadas]
      .filter(permitido)
      .map((n) => ({ ...n, leida: this.leidas.has(n.id) }))
      .sort((a, b) => b.fecha.localeCompare(a.fecha));
  }

  private armarConstancia(mes: string, empleadoId: string): Constancia {
    const emp = this.empleadosDb.find((e) => e.id === empleadoId)!;
    const dias = this.historial.filter((d) => d.fecha.slice(0, 7) === mes);
    const trabajados = dias.filter((d) => d.entrada);
    const sig = new Date(Number(mes.slice(0, 4)), Number(mes.slice(5, 7)), 1);
    const folio = `CST-${mes.replace('-', '')}-${emp.numero}`;
    const totales = {
      diasTrabajados: trabajados.length,
      descansos: dias.filter((d) => d.estado === 'Descanso' || d.estado === 'Festivo').length,
      faltas: dias.filter((d) => d.estado === 'Falta').length,
      retardos: dias.filter((d) => d.minutosRetardo > 0).length,
      horasOrdinarias: Math.round(dias.reduce((a, d) => a + d.horasOrdinarias, 0) * 100) / 100,
      extraDobles: Math.round(dias.reduce((a, d) => a + d.extraDobles, 0) * 100) / 100,
      extraTriples: Math.round(dias.reduce((a, d) => a + d.extraTriples, 0) * 100) / 100,
      extraSinAutorizar: Math.round(dias.filter((d) => d.extraAutorizada === false).reduce((a, d) => a + d.extraDobles + d.extraTriples, 0) * 100) / 100,
    };
    return {
      mes, folio, sello: hashCorto(`${folio}|${JSON.stringify(totales)}`), emitida: new Date(sig.getFullYear(), sig.getMonth(), 1, 8).toISOString(),
      limiteAcuse: isoDia(new Date(sig.getFullYear(), sig.getMonth(), 25, 12)), ...totales,
      incidencias: dias.filter((d) => d.estado !== 'Normal' && d.estado !== 'Descanso' || d.alertas.length > 0 || d.extraDobles + d.extraTriples > 0),
      acuse: empleadoId === YO ? this.acusesDb.get(mes) : undefined,
    };
  }

  private checadasDe(empleadoId: string): Checada[] {
    const h = isoDia(new Date());
    return this.checadas
      .filter((c) => c.empleadoId === empleadoId && isoDia(new Date(c.horaServidor)) === h)
      .sort((a, b) => a.horaServidor.localeCompare(b.horaServidor));
  }

  private estadoDe(hoy: Checada[]): Empleado['estadoHoy'] {
    const u = hoy[hoy.length - 1]?.tipo;
    if (!u) return 'Ausente';
    return u === 'SalidaComida' ? 'EnComida' : u === 'Salida' ? 'Salio' : 'Presente';
  }

  private empleadosActuales(): Empleado[] {
    return this.empleadosDb.map((e) => (e.id === YO ? { ...e, estadoHoy: this.estadoDe(this.checadasDe(YO)) } : e));
  }
}

const MSG_PERMISO = 'Tu rol no permite realizar esta acción.';
const CLAVE_CONSENTIMIENTO = clave('consentimiento');

function leerConsentimiento(): Consentimiento {
  try {
    const v = JSON.parse(localStorage.getItem(CLAVE_CONSENTIMIENTO) ?? 'null') as Consentimiento | null;
    if (v && v.versionAviso === VERSION_AVISO) return v;
  } catch { }
  return { ...CONSENTIMIENTO_INICIAL };
}

function guardarConsentimiento(c: Consentimiento | null) {
  try {
    if (c) localStorage.setItem(CLAVE_CONSENTIMIENTO, JSON.stringify(c)); else localStorage.removeItem(CLAVE_CONSENTIMIENTO);
  } catch { }
}

function contenidoSello(c: Checada): string {
  const retardo = c.retardo ? `${c.retardo.minutos}|${c.retardo.motivo ?? ''}|${c.retardo.nota ?? ''}` : '';
  return [c.folio, c.empleadoId, c.tipo, c.horaServidor, c.lugar, c.validacion, retardo, c.selloAnterior].join('|');
}

function sellarTodas(lista: Checada[]): Checada[] {
  let previo = 'GENESIS';
  for (const c of lista) {
    c.selloAnterior = previo;
    c.sello = hashCorto(contenidoSello(c));
    previo = c.sello;
  }
  return lista;
}

function mesAnterior(): string {
  const h = new Date();
  const d = new Date(h.getFullYear(), h.getMonth() - 1, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function nombreMes(clave: string): string {
  return new Date(`${clave}-15T12:00:00`).toLocaleDateString('es-MX', { month: 'long' });
}

function diasEntre(a: string, b: string): number {
  return Math.round((new Date(`${b}T12:00:00`).getTime() - new Date(`${a}T12:00:00`).getTime()) / 86_400_000) + 1;
}

function diasVacaciones(anios: number): number {
  if (anios < 1) return 0;
  if (anios <= 5) return [12, 14, 16, 18, 20][anios - 1];
  if (anios <= 10) return 22;
  return 22 + 2 * Math.ceil((anios - 10) / 5);
}


function porCreadaDesc(a: Solicitud, b: Solicitud) { return b.creada.localeCompare(a.creada); }

/** `hasta`: dónde termina el tramo abierto (ahora, o la hora de salida del turno si no checó salida). */
function horasTrabajadasHoy(hoy: Checada[], hasta = Date.now()): number {
  let total = 0;
  let inicio: number | null = null;
  for (const c of hoy) {
    const t = new Date(c.horaServidor).getTime();
    if (c.tipo === 'Entrada' || c.tipo === 'RegresoComida') inicio = t;
    else if (inicio !== null) { total += Math.max(0, t - inicio); inicio = null; }
  }
  // Con horas simuladas de la demo la entrada puede quedar "en el futuro": nunca se resta tiempo.
  if (inicio !== null) total += Math.max(0, hasta - inicio);
  return Math.round((total / 3_600_000) * 100) / 100;
}

function duracionLegible(segundos: number): string {
  const total = Math.abs(segundos);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  return h ? `${h} h ${m} min` : m ? `${m} min` : `${total} s`;
}

/** Refleja en el entorno lo que dice el reloj de confianza del teléfono: alterado o imposible de comprobar. */
function aplicarReloj(ent: EntornoDetectado, reloj: RelojDispositivo): EntornoDetectado {
  if (reloj.estado === 'ok') return ent;
  const poner = (estado: Senal['estado'], detalle: string) => ent.senales.map((s) => (s.id === 'hora' ? { ...s, estado, detalle } : s));
  if (reloj.estado === 'alterado') {
    const sentido = reloj.desfaseSegundos > 0 ? 'adelantado' : 'atrasado';
    const tiempo = duracionLegible(reloj.desfaseSegundos);
    return {
      ...ent, desfaseRelojSegundos: reloj.desfaseSegundos,
      senales: poner('falla', `El reloj del teléfono va ${tiempo} ${sentido} respecto al servidor. Se usa la hora del servidor`),
      validacionPrevista: ent.validacionPrevista === 'FueraDeLugar' ? 'FueraDeLugar' : 'PorRevisar',
      motivos: [...ent.motivos, `Reloj del teléfono modificado (${sentido} ${tiempo}); se registró con la hora oficial del servidor`],
    };
  }
  return {
    ...ent, desfaseRelojSegundos: 0,
    senales: poner('alerta', 'La hora de este teléfono no se puede comprobar: la app se reinició sin internet'),
    validacionPrevista: ent.validacionPrevista === 'FueraDeLugar' ? 'FueraDeLugar' : 'PorRevisar',
    motivos: [...ent.motivos, 'Hora no verificable: el teléfono se reinició sin conexión', 'RH la revisará con tu justificación'],
  };
}

const LUGARES_APROBADOS = ['l1', 'l2', 'l3'];
const LUGARES_PENDIENTES = ['l5'];
const PRECISION_MAXIMA_CONFIABLE_M = 100;

function distanciaMetros(a: { latitud: number; longitud: number }, b: { latitud: number; longitud: number }): number {
  const rad = (g: number) => (g * Math.PI) / 180;
  const h = Math.sin(rad(b.latitud - a.latitud) / 2) ** 2 + Math.cos(rad(a.latitud)) * Math.cos(rad(b.latitud)) * Math.sin(rad(b.longitud - a.longitud) / 2) ** 2;
  return 2 * 6_371_000 * Math.asin(Math.sqrt(h));
}

const textoDistancia = (m: number) => (m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`);

/** Valida la posición real del GPS contra los lugares con coordenadas: aprobados, pendientes o ninguno. */
function analizarPosicion(p: PosicionGps): EntornoDetectado {
  const base = analizarEntorno('Sede');
  const conCoordenadas = (ids: string[]) => LUGARES
    .filter((l) => ids.includes(l.id) && l.latitud !== undefined && l.longitud !== undefined)
    .map((l) => ({ lugar: l, distancia: distanciaMetros(p, { latitud: l.latitud!, longitud: l.longitud! }), radio: l.radioMetros ?? 150 }))
    .sort((a, b) => a.distancia - b.distancia);

  const aprobados = conCoordenadas(LUGARES_APROBADOS);
  const pendientes = conCoordenadas(LUGARES_PENDIENTES);
  const masCercano = aprobados[0];
  const dentro = aprobados.find((x) => x.distancia <= x.radio);
  const pendienteDentro = pendientes.find((x) => x.distancia <= x.radio);
  const imprecisa = p.precisionMetros > PRECISION_MAXIMA_CONFIABLE_M;
  const enElBorde = !dentro && masCercano && masCercano.distancia <= masCercano.radio + p.precisionMetros && !imprecisa;

  const poner = (estado: Senal['estado'], detalle: string) => base.senales.map((s) => (s.id === 'gps' ? { ...s, estado, detalle } : s));
  const gps = { latitud: p.latitud, longitud: p.longitud, precisionMetros: p.precisionMetros };
  const resultado = (extra: Partial<EntornoDetectado>): EntornoDetectado => ({ ...base, gps, lugar: undefined, ...extra });

  if (dentro && !imprecisa) {
    const l = dentro.lugar;
    return resultado({ lugar: { id: l.id, nombre: l.nombre, tipo: l.tipo }, senales: poner('ok', `Dentro de ${l.nombre} (precisión ${p.precisionMetros} m)`) });
  }
  if (dentro && imprecisa) {
    const l = dentro.lugar;
    return resultado({
      lugar: { id: l.id, nombre: l.nombre, tipo: l.tipo },
      senales: poner('alerta', `Precisión baja (${p.precisionMetros} m): sal a un lugar abierto o acércate a una ventana`),
      validacionPrevista: 'PorRevisar',
      motivos: [`Precisión de GPS baja (${p.precisionMetros} m); coincide con ${l.nombre}`],
    });
  }
  if (pendienteDentro) {
    return resultado({
      senales: poner('alerta', `Estás en un lugar que RH aún no aprueba (${pendienteDentro.lugar.nombre})`),
      validacionPrevista: 'PorRevisar',
      motivos: [`Lugar pendiente de aprobación: ${pendienteDentro.lugar.nombre}`],
    });
  }
  if (enElBorde && masCercano) {
    return resultado({
      senales: poner('alerta', `Cerca del límite de ${masCercano.lugar.nombre}: a ${textoDistancia(masCercano.distancia)} (precisión ${p.precisionMetros} m)`),
      validacionPrevista: 'PorRevisar',
      motivos: [`Posición en el límite de ${masCercano.lugar.nombre}`],
    });
  }
  const donde = masCercano ? `a ${textoDistancia(masCercano.distancia)} de ${masCercano.lugar.nombre}` : 'sin lugares aprobados con coordenadas';
  return resultado({
    senales: poner('falla', `No coincide con ningún lugar aprobado (${donde})`),
    validacionPrevista: 'FueraDeLugar',
    motivos: ['GPS fuera de los lugares aprobados', masCercano ? `El lugar aprobado más cercano es ${masCercano.lugar.nombre}, ${donde.split(' de ')[0]}` : 'Ningún lugar aprobado coincide con tu posición'],
  });
}

function analizarEntorno(e: EscenarioUbicacion): EntornoDetectado {
  const ok = (id: Senal['id'], etiqueta: string, detalle: string): Senal => ({ id, etiqueta, estado: 'ok', detalle });
  const base: Senal[] = [
    ok('gps', 'GPS', 'Dentro de un lugar aprobado (precisión 12 m)'),
    ok('ip', 'Dirección IP', 'Coincide con la ciudad del lugar'),
    ok('vpn', 'VPN / proxy', 'No detectada'),
    ok('simulada', 'Ubicación simulada', 'No detectada'),
    ok('apps', 'Apps que alteran ubicación', 'No detectadas'),
    ok('hora', 'Hora del teléfono', 'Coincide con la del servidor'),
    ok('dispositivo', 'Dispositivo', 'Vinculado y sin modificaciones'),
  ];
  const poner = (s: Senal[], id: Senal['id'], estado: Senal['estado'], detalle: string) =>
    s.map((x) => (x.id === id ? { ...x, estado, detalle } : x));

  let senales = base;
  let lugar: EntornoDetectado['lugar'] = { id: 'ml1', nombre: 'Sede Centro', tipo: 'Sede' };
  let ip = { direccion: '189.203.10.***', ciudad: 'Ciudad de México', proveedor: 'Telmex', distanciaGpsKm: 1.2 };
  let gps = { latitud: 19.4326, longitud: -99.1332, precisionMetros: 12 };
  let validacion: EntornoDetectado['validacionPrevista'] = 'Valida';
  const motivos: string[] = [];
  let sinRed = false;
  let desfase = 1;

  switch (e) {
    case 'HomeOffice':
      lugar = { id: 'ml2', nombre: 'Home office – Col. Del Valle', tipo: 'HomeOffice' };
      ip = { direccion: '201.141.77.***', ciudad: 'Ciudad de México', proveedor: 'Totalplay', distanciaGpsKm: 0.8 };
      gps = { latitud: 19.3902, longitud: -99.1672, precisionMetros: 9 };
      break;
    case 'LugarPendiente':
      lugar = undefined;
      gps = { latitud: 25.6514, longitud: -100.2895, precisionMetros: 15 };
      ip = { direccion: '187.190.52.***', ciudad: 'Monterrey', proveedor: 'Izzi', distanciaGpsKm: 2.1 };
      senales = poner(senales, 'gps', 'alerta', 'Estás en un lugar que RH aún no aprueba (Cliente Grupo Alfa)');
      validacion = 'PorRevisar';
      motivos.push('Lugar pendiente de aprobación: Cliente Grupo Alfa – Monterrey');
      break;
    case 'Fuera':
      lugar = undefined;
      gps = { latitud: 19.4978, longitud: -99.1269, precisionMetros: 20 };
      ip = { direccion: '189.203.99.***', ciudad: 'Ciudad de México', proveedor: 'Telmex', distanciaGpsKm: 4.6 };
      senales = poner(senales, 'gps', 'falla', 'No coincide con ningún lugar aprobado (a 4.2 km de Sede Centro)');
      senales = poner(senales, 'ip', 'alerta', 'La IP está a 4.6 km del GPS');
      validacion = 'FueraDeLugar';
      motivos.push('GPS fuera de los lugares aprobados', 'Ningún lugar aprobado coincide con tu posición');
      break;
    case 'VPN':
      ip = { direccion: '185.220.101.***', ciudad: 'Fráncfort, Alemania', proveedor: 'Proveedor de VPN', distanciaGpsKm: 9540 };
      senales = poner(senales, 'vpn', 'alerta', 'VPN o proxy activo en este teléfono');
      senales = poner(senales, 'ip', 'alerta', 'La IP indica Alemania, a 9,540 km del GPS: no es confiable');
      validacion = 'PorRevisar';
      motivos.push('VPN detectada: la IP no refleja tu ubicación real', 'El GPS sí coincide con Sede Centro');
      break;
    case 'UbicacionFalsa':
      lugar = undefined;
      senales = poner(senales, 'simulada', 'falla', 'El sistema reporta ubicación simulada (mock location)');
      senales = poner(senales, 'gps', 'falla', 'No se puede confiar en esta posición GPS');
      senales = poner(senales, 'dispositivo', 'alerta', 'Opciones de desarrollador activas');
      validacion = 'FueraDeLugar';
      motivos.push('Ubicación simulada detectada: el GPS no es confiable');
      break;
    case 'AppTercero':
      senales = poner(senales, 'apps', 'alerta', 'Instalada: “Fake GPS Pro” (puede modificar la ubicación)');
      validacion = 'PorRevisar';
      motivos.push('App de terceros capaz de alterar la ubicación: “Fake GPS Pro”');
      break;
    case 'SinRed':
      sinRed = true;
      senales = poner(senales, 'ip', 'alerta', 'Sin conexión: no se pudo leer la IP');
      senales.push({ id: 'red', etiqueta: 'Conexión', estado: 'alerta', detalle: 'Sin internet: la checada se guarda en tu teléfono y se envía sola' });
      validacion = 'PorRevisar';
      motivos.push('Checada diferida: se envió al recuperar la red');
      break;
    case 'SinRedReinicio':
      sinRed = true;
      senales = poner(senales, 'ip', 'alerta', 'Sin conexión: no se pudo leer la IP');
      senales = poner(senales, 'hora', 'alerta', 'El teléfono se reinició sin internet (p. ej. por un apagón): su reloj ya no se puede comprobar');
      senales.push({ id: 'red', etiqueta: 'Conexión', estado: 'alerta', detalle: 'Sin internet: la checada se guarda en tu teléfono y se envía sola' });
      validacion = 'PorRevisar';
      motivos.push('Hora no verificable: el teléfono se reinició sin conexión', 'RH la revisará con tu justificación');
      desfase = 0;
      break;
    case 'HoraManipulada':
      desfase = 11_520;
      senales = poner(senales, 'hora', 'falla', 'El reloj del teléfono va 3 h 12 min adelantado respecto al servidor. Se usa la hora del servidor');
      validacion = 'PorRevisar';
      motivos.push('Reloj del teléfono modificado (adelantado 3 h 12 min); se registró con la hora oficial del servidor');
      break;
    case 'DispositivoNuevo':
      senales = poner(senales, 'dispositivo', 'alerta', 'Este teléfono no está vinculado a tu cuenta (solicitud pendiente con RH)');
      validacion = 'PorRevisar';
      motivos.push('Checada desde un dispositivo no vinculado');
      break;
    case 'DispositivoModificado':
      senales = poner(senales, 'dispositivo', 'falla', 'La huella del equipo cambió y se detectan señales de emulador o root/jailbreak');
      validacion = 'PorRevisar';
      motivos.push('Huella del dispositivo no coincide con la registrada (posible emulador, clonado o modificado)');
      break;
    default:
      break;
  }
  return { lugar, gps, ip, senales, validacionPrevista: validacion, motivos, sinRed, desfaseRelojSegundos: desfase };
}

function generarHistorial(): JornadaDia[] {
  const out: JornadaDia[] = [];
  const festivos = new Set(FESTIVOS.map((f) => f.fecha));
  const sinMarcas = { entrada: undefined, salida: undefined, horasOrdinarias: 0 };
  const hhmm = (min: number) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
  for (let i = 1; i <= 100; i++) {
    const d = hace(i);
    const dow = d.getDay();
    const base: JornadaDia = {
      fecha: isoDia(d), estado: 'Normal', horasOrdinarias: 8, extraDobles: 0, extraTriples: 0,
      minutosRetardo: 0, alertas: [], entrada: '09:00', salida: '18:00',
    };
    const finDeSemana = dow === 0 || dow === 6;
    if (festivos.has(isoDia(d))) out.push({ ...base, ...sinMarcas, estado: 'Festivo' });
    else if (finDeSemana && i % 19 !== 0) out.push({ ...base, ...sinMarcas, estado: 'Descanso' });
    else if (finDeSemana) out.push({ ...base, entrada: '10:00', salida: '14:00', horasOrdinarias: 4, extraDobles: 0, alertas: [dow === 0 ? 'Domingo trabajado: prima dominical del 25% (Art. 71)' : 'Descanso trabajado: pago doble adicional (Art. 73)'] });
    else if (i === 8 || i % 23 === 0) out.push({ ...base, ...sinMarcas, estado: 'Falta' });
    else if (i === 9 || (i >= 40 && i <= 44)) out.push({ ...base, ...sinMarcas, estado: 'Vacaciones' });
    else if (i === 3) out.push({ ...base, estado: 'Retardo', entrada: '09:22', salida: undefined, minutosRetardo: 22, horasOrdinarias: 7.63, alertas: ['Salida sin registrar: corrección pendiente'] });
    else if (i % 17 === 0) { const r = 12 + (i % 5) * 6; out.push({ ...base, estado: 'Retardo', entrada: hhmm(540 + r), minutosRetardo: r, horasOrdinarias: 8 - r / 60 }); }
    else if (i === 6) out.push({ ...base, entrada: '08:58', salida: '20:10', extraDobles: 2.17, extraAutorizada: true });
    else if (i === 7) out.push({ ...base, entrada: '08:55', salida: '21:30', extraDobles: 3, extraTriples: 0.5, extraAutorizada: true, alertas: ['Excede 3 horas extra en el día (Art. 66)'] });
    else if (i % 11 === 0) out.push({ ...base, salida: '19:30', extraDobles: 1.5, extraAutorizada: false, alertas: ['Horas extra sin autorización previa'] });
    else out.push(base);
  }
  return out;
}

function dispositivosIniciales(): Dispositivo[] {
  const d = (id: string, empleadoId: string, empleado: string, nombre: string, plataforma: Dispositivo['plataforma'], huella: string,
    estado: Dispositivo['estado'], vinculadoEl: string, comentario?: string): Dispositivo =>
    ({ id, empleadoId, empleado, nombre, plataforma, huella, estado, vinculadoEl, comentario, ultimoUso: estado === 'Aprobado' ? hace(0).toISOString() : undefined });
  return [
    d('d1', 'e01', 'Luis Ángel', 'iPhone de Luis', 'iOS', 'a1f3c9e0b2d44718', 'Aprobado', '2026-01-12'),
    d('d2', 'e01', 'Luis Ángel', 'Samsung A54 (anterior)', 'Android', '7be20d91c3a85f66', 'Revocado', '2024-05-02', 'Reemplazado por teléfono nuevo'),
    d('d3', 'e02', 'Luis Hernández', 'Chrome en Windows', 'Web', '3c8d7a15e9f20b44', 'Aprobado', '2025-03-14'),
    d('d4', 'e05', 'Sofía Martínez', 'iPhone 15 (cambio de teléfono)', 'iOS', '9d41e6b7a0c25f83', 'Pendiente', isoDia(hace(0))),
    d('d5', 'e06', 'Jorge Díaz', 'Android genérico', 'Android', 'e4a09c2b71d36f58', 'Revocado', '2024-09-20', 'Detectado emulador'),
    d('d6', 'e03', 'María López', 'Safari en MacBook', 'Web', '5f12b8d0c7e94a31', 'Aprobado', '2025-07-01'),
  ];
}
