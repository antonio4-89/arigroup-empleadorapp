import {
  Checada, Correccion, Dispositivo, Empleado, EventoAuditoria, Incidencia, MotivoRetardo, Solicitud, SolicitudArco, TipoSolicitud,
} from '../models/models';
import { MOTIVOS_RETARDO_CASA, MOTIVOS_RETARDO_SEDE } from '../ui/etiquetas';
import { CENTROS, EMPLEADOS, cerca, hace, isoDia } from './mock-data';
import { TURNOS } from './mock-data-extra';
import { hashCorto } from './sello';

export const TOTAL_EMPLEADOS = 420;

function azar(semilla: number) {
  let s = semilla;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const NOMBRES = ['Alejandro', 'Brenda', 'Camila', 'Diego', 'Eduardo', 'Fernanda', 'Gabriel', 'Héctor', 'Irene', 'Javier', 'Karla', 'Leonardo', 'Mariana', 'Néstor', 'Olivia', 'Pablo', 'Rafael', 'Sandra', 'Tomás', 'Valeria', 'Ximena', 'Yolanda', 'Adrián', 'Beatriz', 'César', 'Daniela', 'Emilio', 'Fabiola', 'Gerardo', 'Lorena'];
const APELLIDOS = ['García', 'Hernández', 'Martínez', 'López', 'González', 'Pérez', 'Rodríguez', 'Sánchez', 'Ramírez', 'Cruz', 'Flores', 'Gómez', 'Morales', 'Vázquez', 'Jiménez', 'Reyes', 'Torres', 'Díaz', 'Mendoza', 'Ruiz', 'Aguilar', 'Ortega', 'Castro', 'Rivera', 'Silva', 'Romero', 'Herrera', 'Medina', 'Guerrero', 'Ibarra'];
const AREAS: { nombre: string; sede: string; puestos: string[]; turnos: string[]; peso: number }[] = [
  { nombre: 'Producción', sede: 'Planta Norte', puestos: ['Operador', 'Soldador', 'Ensamblador', 'Supervisor de línea'], turnos: ['t3', 't4', 't5'], peso: 8 },
  { nombre: 'Logística', sede: 'Planta Norte', puestos: ['Almacenista', 'Chofer', 'Montacarguista'], turnos: ['t3', 't6'], peso: 4 },
  { nombre: 'Calidad', sede: 'Planta Norte', puestos: ['Inspector', 'Analista de calidad'], turnos: ['t3', 't1'], peso: 2 },
  { nombre: 'Mantenimiento', sede: 'Planta Norte', puestos: ['Técnico', 'Electricista'], turnos: ['t3', 't4'], peso: 2 },
  { nombre: 'Seguridad', sede: 'Planta Norte', puestos: ['Vigilante', 'Jefe de turno'], turnos: ['t5', 't3'], peso: 1 },
  { nombre: 'Ventas', sede: 'Sede Centro', puestos: ['Ejecutivo de ventas', 'Gerente comercial'], turnos: ['t1', 't7'], peso: 2 },
  { nombre: 'Finanzas', sede: 'Sede Centro', puestos: ['Contador', 'Auxiliar contable'], turnos: ['t2', 't1'], peso: 1 },
  { nombre: 'Sistemas', sede: 'Sede Centro', puestos: ['Desarrollador', 'Soporte TI'], turnos: ['t1', 't7'], peso: 1 },
  { nombre: 'Recursos Humanos', sede: 'Sede Centro', puestos: ['Analista de RH', 'Reclutador'], turnos: ['t1', 't2'], peso: 1 },
  { nombre: 'Marketing', sede: 'Sede Centro', puestos: ['Diseñador', 'Community manager'], turnos: ['t7', 't1'], peso: 1 },
];

export function generarEmpleados(): Empleado[] {
  const r = azar(2026);
  const bolsa = AREAS.flatMap((a) => Array(a.peso).fill(a));
  const out: Empleado[] = [];
  for (let n = EMPLEADOS.length + 1; n <= TOTAL_EMPLEADOS; n++) {
    const area = bolsa[Math.floor(r() * bolsa.length)];
    const idTurno = area.turnos[Math.floor(r() * area.turnos.length)];
    const turno = TURNOS.find((t) => t.id === idTurno)!;
    const nombre = NOMBRES[Math.floor(r() * NOMBRES.length)];
    const apellido = APELLIDOS[Math.floor(r() * APELLIDOS.length)];
    const modalidad = area.sede === 'Sede Centro' ? (r() < 0.35 ? 'Hibrido' : r() < 0.15 ? 'HomeOffice' : 'Presencial') : 'Presencial';
    const x = r();
    const estadoHoy: Empleado['estadoHoy'] =
      x < 0.62 ? 'Presente' : x < 0.72 ? 'EnComida' : x < 0.79 ? 'Retardo' : x < 0.86 ? 'Salio' : x < 0.93 ? 'Ausente' : x < 0.97 ? 'Vacaciones' : 'Incapacidad';
    const sinAcento = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    out.push({
      id: `e${String(n).padStart(3, '0')}`, numero: String(1000 + n), nombre: `${nombre} ${apellido}`,
      puesto: area.puestos[Math.floor(r() * area.puestos.length)], departamento: area.nombre, sede: area.sede,
      modalidad: modalidad as Empleado['modalidad'], tipoJornada: turno.tipo, horario: `${turno.entrada} – ${turno.salida}`, turnoId: turno.id,
      correo: `${sinAcento(nombre)}.${sinAcento(apellido)}${n}@grupodemo.mx`, cuenta: r() < 0.05 ? 'Invitada' : 'Activa',
      fechaIngreso: `${2015 + Math.floor(r() * 11)}-${String(1 + Math.floor(r() * 12)).padStart(2, '0')}-${String(1 + Math.floor(r() * 28)).padStart(2, '0')}`, estadoHoy,
    });
  }
  return out;
}

export function checadasMasivas(empleados: Empleado[]): Checada[] {
  const r = azar(77);
  const out: Checada[] = [];
  const hora = (hh: number, mm: number) => { const d = hace(0); d.setHours(hh, mm, 0, 0); return d.toISOString(); };
  for (const e of empleados.slice(EMPLEADOS.length)) {
    if (e.estadoHoy === 'Ausente' || e.estadoHoy === 'Vacaciones' || e.estadoHoy === 'Incapacidad') continue;
    const [h, m] = e.horario.slice(0, 5).split(':').map(Number);
    const turno = TURNOS.find((t) => t.id === e.turnoId);
    const tolerancia = turno?.toleranciaMin ?? 10;
    const retraso = e.estadoHoy === 'Retardo' ? tolerancia + 2 + Math.floor(r() * 30) : Math.floor(r() * 6) - 3;
    const enCasa = e.modalidad === 'HomeOffice' || (e.modalidad === 'Hibrido' && r() < 0.4);
    const y = r();
    const validacion: Checada['validacion'] = y < 0.07 ? 'PorRevisar' : y < 0.09 ? 'FueraDeLugar' : 'Valida';
    const motivos = validacion === 'PorRevisar' ? [['VPN detectada', 'Reloj del teléfono modificado', 'Equipo no vinculado', 'Checada diferida (sin red)'][Math.floor(r() * 4)]]
      : validacion === 'FueraDeLugar' ? ['GPS fuera de los lugares aprobados'] : [];
    const base: Checada = {
      id: `m${e.id}`, empleadoId: e.id, empleado: e.nombre, tipo: 'Entrada', horaServidor: hora(h, Math.max(0, m + retraso)),
      lugar: enCasa ? 'Home office (domicilio aprobado)' : e.sede,
      validacion, motivos, diferida: motivos[0] === 'Checada diferida (sin red)', origen: enCasa ? 'Movil' : r() < 0.3 ? 'Kiosco' : 'Movil', folio: `CH-M${e.numero}`,
      sello: '', selloAnterior: '', posicion: cerca(CENTROS[e.sede] ?? CENTROS['Sede Centro'], e.id),
    };
    if (e.estadoHoy === 'Retardo') {
      const opciones: MotivoRetardo[] = enCasa ? MOTIVOS_RETARDO_CASA : MOTIVOS_RETARDO_SEDE;
      const sinJustificar = r() < 0.2;
      const motivo = sinJustificar ? undefined : opciones[Math.floor(r() * (opciones.length - 1))];
      const notas: Partial<Record<MotivoRetardo, string>> = {
        Transporte: 'Hubo un choque en la vía rápida', FallaInternetLuz: 'Se fue la luz en la colonia', FallaEquipoEmpresa: 'La laptop no encendía',
        CitaMedica: 'Análisis de laboratorio en ayunas', InstruccionJefe: 'Pasé a recoger material al almacén',
      };
      base.retardo = {
        clase: 'Entrada', minutos: retraso, horaEntrada: e.horario.slice(0, 5), toleranciaMin: tolerancia, motivo,
        nota: motivo && r() < 0.6 ? notas[motivo] : undefined, desdeCasa: enCasa,
      };
    }
    out.push(base);
    const otra = (sufijo: string, tipo: Checada['tipo'], horaServidor: string): Checada =>
      ({ ...base, id: `m${e.id}${sufijo}`, tipo, horaServidor, folio: `CH-M${e.numero}${sufijo.toUpperCase()}`, validacion: 'Valida', motivos: [], retardo: undefined });
    if (e.estadoHoy === 'EnComida') out.push(otra('c', 'SalidaComida', hora(13, Math.floor(r() * 30))));
    if (e.estadoHoy === 'Salio') out.push(otra('s', 'Salida', hora(Math.min(h + 9, 23), 0)));
    if (e.estadoHoy === 'Presente' && r() < 0.3) out.push(...comidaSimulada(e, enCasa, h * 60 + m, r, hora, otra));
  }
  return out;
}

/** Salida y regreso de comida: la mayoría dentro de lo pactado, ~20 % excedidos y ~10 % con descanso menor al mínimo legal. */
function comidaSimulada(
  e: Empleado, enCasa: boolean, entradaMin: number, r: () => number,
  hora: (hh: number, mm: number) => string, otra: (sufijo: string, tipo: Checada['tipo'], horaServidor: string) => Checada,
): Checada[] {
  const turno = TURNOS.find((t) => t.id === e.turnoId);
  const pactada = e.comidaPactada?.minutos ?? turno?.comidaMin ?? 60;
  const tolerancia = turno?.toleranciaComidaMin ?? 5;
  const inicio = entradaMin + 240 + Math.floor(r() * 40);
  const z = r();
  const holgura = Math.max(0, Math.min(10, pactada - 30));
  const duracion = z < 0.1 ? 18 + Math.floor(r() * 10)
    : z < 0.3 ? pactada + tolerancia + 2 + Math.floor(r() * 25)
    : pactada - holgura + Math.floor(r() * (holgura + tolerancia + 1));
  const regreso = otra('r', 'RegresoComida', hora(0, inicio + duracion));
  regreso.descansoMin = duracion;
  if (duracion > pactada + tolerancia) {
    const opciones: MotivoRetardo[] = enCasa ? MOTIVOS_RETARDO_CASA : MOTIVOS_RETARDO_SEDE;
    const motivo = r() < 0.2 ? undefined : opciones[Math.floor(r() * (opciones.length - 1))];
    const notas: Partial<Record<MotivoRetardo, string>> = {
      Transporte: 'Mucho tráfico de regreso del restaurante', FallaInternetLuz: 'Se cayó el internet al reconectar', CitaMedica: 'Consulta en la clínica del IMSS',
      AsuntoPersonal: 'Fui por mi hijo a la escuela', InstruccionJefe: 'Me pidieron pasar al banco',
    };
    regreso.retardo = {
      clase: 'Comida', minutos: duracion - pactada, toleranciaMin: tolerancia, comidaPactadaMin: pactada, comidaRealMin: duracion,
      motivo, nota: motivo && r() < 0.6 ? notas[motivo] : undefined, desdeCasa: enCasa,
    };
  }
  return [otra('c', 'SalidaComida', hora(0, inicio)), regreso];
}

export function solicitudesMasivas(empleados: Empleado[]): Solicitud[] {
  const r = azar(5);
  const tipos: TipoSolicitud[] = ['Permiso', 'Vacaciones', 'HorasExtra', 'Incapacidad', 'Comision'];
  const motivos: Record<TipoSolicitud, string[]> = {
    Permiso: ['Cita médica', 'Trámite personal', 'Asunto familiar'], Vacaciones: ['Vacaciones de fin de año', 'Descanso', 'Viaje familiar'],
    HorasExtra: ['Cierre de producción', 'Entrega urgente', 'Inventario'], Incapacidad: ['Incapacidad IMSS', 'Reposo médico'], Comision: ['Visita a cliente', 'Capacitación externa'],
  };
  const out: Solicitud[] = [];
  const pool = empleados.slice(EMPLEADOS.length);
  for (let i = 0; i < 80; i++) {
    const e = pool[Math.floor(r() * pool.length)];
    const tipo = tipos[Math.floor(r() * tipos.length)];
    const dias = tipo === 'Vacaciones' ? 3 + Math.floor(r() * 8) : tipo === 'Incapacidad' ? 2 + Math.floor(r() * 5) : 1;
    const desde = Math.floor(r() * 25) - 5;
    const pendiente = i < 46;
    const creada = hace(Math.floor(r() * 6));
    creada.setHours(8 + Math.floor(r() * 9), Math.floor(r() * 60), 0, 0);
    out.push({
      id: `sm${i}`, empleadoId: e.id, empleado: e.nombre, tipo, desde: isoDia(hace(-desde)), hasta: isoDia(hace(-desde - dias + 1)),
      motivo: motivos[tipo][Math.floor(r() * motivos[tipo].length)], estado: pendiente ? 'Pendiente' : r() < 0.8 ? 'Aprobada' : 'Rechazada',
      creada: creada.toISOString(), horas: tipo === 'HorasExtra' ? 1 + Math.floor(r() * 3) : undefined, folio: tipo === 'Incapacidad' ? `IMSS-${100000 + Math.floor(r() * 899999)}` : undefined,
      comentarioResolucion: pendiente ? undefined : 'Revisado',
    });
  }
  return out;
}

export function correccionesMasivas(empleados: Empleado[]): Correccion[] {
  const r = azar(9);
  const pool = empleados.slice(EMPLEADOS.length);
  return Array.from({ length: 24 }, (_, i) => {
    const e = pool[Math.floor(r() * pool.length)];
    const tipo = (['Entrada', 'Salida', 'RegresoComida'] as const)[Math.floor(r() * 3)];
    const creada = hace(Math.floor(r() * 5));
    return {
      id: `cm${i}`, empleadoId: e.id, empleado: e.nombre, fecha: isoDia(hace(1 + Math.floor(r() * 6))), tipo,
      horaSolicitada: tipo === 'Entrada' ? '08:55' : tipo === 'Salida' ? '17:05' : '14:00', motivo: ['Olvidé checar', 'Falla de la app', 'Sin señal'][Math.floor(r() * 3)],
      estado: i < 16 ? 'Pendiente' : 'Aprobada', creada: creada.toISOString(), comentarioResolucion: i < 16 ? undefined : 'Confirmado', resueltaPor: i < 16 ? undefined : 'Laura Mendoza (RH)',
    } as Correccion;
  });
}

export function dispositivosMasivos(empleados: Empleado[]): Dispositivo[] {
  const r = azar(21);
  return empleados.slice(EMPLEADOS.length).map((e, i) => {
    const plataforma = (['iOS', 'Android', 'Android', 'Web'] as const)[Math.floor(r() * 4)];
    const estado: Dispositivo['estado'] = i % 29 === 0 ? 'Pendiente' : i % 71 === 0 ? 'Revocado' : 'Aprobado';
    return {
      id: `dm${i}`, empleadoId: e.id, empleado: e.nombre,
      nombre: plataforma === 'iOS' ? 'iPhone' : plataforma === 'Android' ? 'Android' : 'Navegador web', plataforma, huella: hashCorto(e.id + plataforma),
      estado, vinculadoEl: isoDia(hace(30 + Math.floor(r() * 600))), ultimoUso: estado === 'Aprobado' ? hace(0).toISOString() : undefined,
    };
  });
}

export function incidenciasMasivas(empleados: Empleado[]): Incidencia[] {
  const r = azar(33);
  const pool = empleados.slice(EMPLEADOS.length);
  const tipos: Incidencia['tipo'][] = ['FallaTransporte', 'FallaDispositivo', 'CambioDeLugar', 'EmergenciaMedica', 'Otro'];
  const textos: Record<string, string> = {
    FallaTransporte: 'Hay mucho tráfico y llegaré tarde.', FallaDispositivo: 'Mi teléfono no abre la app.', CambioDeLugar: 'Trabajaré hoy en otra sede.',
    EmergenciaMedica: 'Me sentí mal en el trabajo y necesito apoyo.', Otro: 'Imprevisto personal, aviso por aquí.',
  };
  return Array.from({ length: 12 }, (_, i) => {
    const e = pool[Math.floor(r() * pool.length)];
    const tipo = tipos[Math.floor(r() * tipos.length)];
    const creada = hace(Math.floor(r() * 3));
    creada.setHours(6 + Math.floor(r() * 12), Math.floor(r() * 60), 0, 0);
    return {
      id: `im${i}`, empleadoId: e.id, empleado: e.nombre, tipo, descripcion: textos[tipo], requiereAyuda: tipo === 'EmergenciaMedica', lugar: e.sede,
      creada: creada.toISOString(), estado: i < 7 ? 'Reportada' : i < 9 ? 'EnAtencion' : 'Atendida', respuesta: i >= 9 ? 'Atendido por RH.' : undefined,
    } as Incidencia;
  });
}

export function arcoMasivas(empleados: Empleado[]): SolicitudArco[] {
  const r = azar(41);
  const pool = empleados.slice(EMPLEADOS.length);
  return Array.from({ length: 6 }, (_, i) => {
    const e = pool[Math.floor(r() * pool.length)];
    return {
      id: `arm${i}`, empleadoId: e.id, empleado: e.nombre, derecho: (['Acceso', 'Rectificacion', 'Oposicion'] as const)[i % 3],
      detalle: 'Solicitud sobre mis datos de asistencia.', creada: hace(2 + i).toISOString(), limite: isoDia(hace(-20 + i * 3)), estado: i < 4 ? 'Recibida' : 'EnTramite',
    } as SolicitudArco;
  });
}

export function bitacoraMasiva(): EventoAuditoria[] {
  const r = azar(55);
  const gente: [string, EventoAuditoria['rol']][] = [['Laura Mendoza', 'RH'], ['Patricia Ruiz', 'Supervisor'], ['Ricardo Fuentes', 'Admin']];
  const acciones: [EventoAuditoria['accion'], string, string][] = [
    ['Aprobacion', 'Solicitud', 'Aprobó solicitud de permiso'], ['Rechazo', 'Solicitud', 'Rechazó solicitud de vacaciones'],
    ['Correccion', 'Checada', 'Aprobó corrección de salida'], ['Aprobacion', 'Dispositivo', 'Vinculó equipo nuevo'], ['Acceso', 'Panel de RH', 'Inicio de sesión con doble factor'],
  ];
  return Array.from({ length: 60 }, (_, i) => {
    const [usuario, rol] = gente[Math.floor(r() * gente.length)];
    const [accion, objeto, detalle] = acciones[Math.floor(r() * acciones.length)];
    const f = hace(1 + Math.floor(i / 4));
    f.setHours(8 + Math.floor(r() * 10), Math.floor(r() * 60), 0, 0);
    return { id: `aum${i}`, fecha: f.toISOString(), usuario, rol, accion, objeto, detalle, ip: '189.203.10.***' };
  });
}
