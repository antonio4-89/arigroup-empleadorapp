import {
  Consentimiento, Correccion, EventoAuditoria, Festivo, JornadaAbierta, Kiosco, Notificacion, PreferenciasNotif, Proyecto, SesionActiva, SolicitudArco,
  Turno, UsuarioAdmin,
} from '../models/models';
import { fechaCorta, hace, isoDia } from './mock-data';

const hora = (h: number, m: number, dias = 0) => { const d = hace(dias); d.setHours(h, m, 0, 0); return d.toISOString(); };

export const VERSION_AVISO = '2026.2';

export const TURNOS: Turno[] = [
  { id: 't1', nombre: 'Administrativo', tipo: 'Diurna', entrada: '09:00', salida: '18:00', comidaMin: 60, toleranciaMin: 10, toleranciaComidaMin: 5, diasLaborales: 'Lun a vie', descanso: 'Sábado y domingo', empleados: 0 },
  { id: 't2', nombre: 'Administrativo temprano', tipo: 'Diurna', entrada: '08:00', salida: '17:00', comidaMin: 60, toleranciaMin: 10, toleranciaComidaMin: 5, diasLaborales: 'Lun a vie', descanso: 'Sábado y domingo', empleados: 0 },
  { id: 't3', nombre: 'Planta matutino', tipo: 'Diurna', entrada: '07:00', salida: '16:00', comidaMin: 60, toleranciaMin: 5, toleranciaComidaMin: 5, diasLaborales: 'Lun a vie', descanso: 'Sábado y domingo', empleados: 0 },
  { id: 't4', nombre: 'Planta mixto', tipo: 'Mixta', entrada: '14:00', salida: '21:30', comidaMin: 30, toleranciaMin: 5, toleranciaComidaMin: 5, diasLaborales: 'Lun a vie', descanso: 'Sábado y domingo', empleados: 0 },
  { id: 't5', nombre: 'Vigilancia nocturna', tipo: 'Nocturna', entrada: '21:00', salida: '04:00', comidaMin: 30, toleranciaMin: 5, toleranciaComidaMin: 5, diasLaborales: 'Lun a vie', descanso: 'Sábado y domingo', empleados: 0 },
  { id: 't6', nombre: 'Reparto', tipo: 'Diurna', entrada: '06:00', salida: '15:00', comidaMin: 60, toleranciaMin: 15, toleranciaComidaMin: 5, diasLaborales: 'Lun a sáb', descanso: 'Domingo', empleados: 0 },
  { id: 't7', nombre: 'Creativo', tipo: 'Diurna', entrada: '10:00', salida: '19:00', comidaMin: 60, toleranciaMin: 15, toleranciaComidaMin: 5, diasLaborales: 'Lun a vie', descanso: 'Sábado y domingo', empleados: 0 },
];

export const FESTIVOS: Festivo[] = [
  { fecha: '2026-01-01', nombre: 'Año Nuevo', nota: 'Descanso obligatorio' },
  { fecha: '2026-02-02', nombre: 'Día de la Constitución', nota: 'Primer lunes de febrero' },
  { fecha: '2026-03-16', nombre: 'Natalicio de Benito Juárez', nota: 'Tercer lunes de marzo' },
  { fecha: '2026-05-01', nombre: 'Día del Trabajo', nota: 'Descanso obligatorio' },
  { fecha: '2026-09-16', nombre: 'Día de la Independencia', nota: 'Descanso obligatorio' },
  { fecha: '2026-11-16', nombre: 'Día de la Revolución', nota: 'Tercer lunes de noviembre' },
  { fecha: '2026-12-25', nombre: 'Navidad', nota: 'Descanso obligatorio' },
  { fecha: '2027-01-01', nombre: 'Año Nuevo', nota: 'Descanso obligatorio' },
  { fecha: '2027-02-01', nombre: 'Día de la Constitución', nota: 'Primer lunes de febrero' },
  { fecha: '2027-03-15', nombre: 'Natalicio de Benito Juárez', nota: 'Tercer lunes de marzo' },
  { fecha: '2027-05-01', nombre: 'Día del Trabajo', nota: 'Descanso obligatorio' },
];

export const CORRECCIONES_INICIALES: Correccion[] = [
  { id: 'c1', empleadoId: 'e01', empleado: 'Luis Ángel', fecha: isoDia(hace(3)), tipo: 'Salida', horaSolicitada: '18:05', motivo: 'Olvidé registrar la salida; salí a las 18:05', estado: 'Pendiente', creada: hora(9, 30, 2) },
  { id: 'c2', empleadoId: 'e05', empleado: 'Sofía Martínez', fecha: isoDia(hace(2)), tipo: 'Entrada', horaOriginal: '09:34', horaSolicitada: '08:55', motivo: 'Marqué tarde por falla de la app; ya estaba con el cliente', estado: 'Pendiente', creada: hora(10, 5, 1) },
  { id: 'c3', empleadoId: 'e08', empleado: 'Miguel Ángel Soto', fecha: isoDia(hace(9)), tipo: 'RegresoComida', horaSolicitada: '14:00', motivo: 'No registré el regreso de comer', estado: 'Aprobada', creada: hora(8, 0, 8), comentarioResolucion: 'Confirmado con el supervisor de turno', resueltaPor: 'Patricia Ruiz (Supervisor)' },
  { id: 'c4', empleadoId: 'e03', empleado: 'María López', fecha: isoDia(hace(14)), tipo: 'Salida', horaSolicitada: '16:00', motivo: 'Salí temprano y no marqué', estado: 'Rechazada', creada: hora(9, 0, 13), comentarioResolucion: 'No hay evidencia de que la salida fuera a esa hora', resueltaPor: 'Laura Mendoza (RH)' },
];

export const JORNADAS_ABIERTAS: JornadaAbierta[] = [
  { id: 'ja1', empleadoId: 'e08', empleado: 'Miguel Ángel Soto', fecha: isoDia(hace(1)), entrada: '07:03', horasAbierta: 31, avisada: false },
  { id: 'ja2', empleadoId: 'e10', empleado: 'Roberto Castillo', fecha: isoDia(hace(1)), entrada: '05:52', horasAbierta: 32, avisada: true },
  { id: 'ja3', empleadoId: 'e04', empleado: 'Carlos Ramírez', fecha: isoDia(hace(2)), entrada: '21:00', horasAbierta: 52, avisada: false },
];

export const ARCO_INICIALES: SolicitudArco[] = [
  { id: 'ar1', empleadoId: 'e01', empleado: 'Luis Ángel', derecho: 'Acceso', detalle: 'Quiero una copia de los datos de ubicación que se han guardado de mis checadas.', creada: hora(11, 0, 3), limite: isoDia(hace(-25)), estado: 'EnTramite' },
  { id: 'ar2', empleadoId: 'e05', empleado: 'Sofía Martínez', derecho: 'Rectificacion', detalle: 'Mi domicilio de home office cambió; actualizar el declarado.', creada: hora(9, 0, 10), limite: isoDia(hace(-18)), estado: 'Recibida' },
  { id: 'ar3', empleadoId: 'e03', empleado: 'María López', derecho: 'Oposicion', detalle: 'Prefiero no compartir la IP con terceros fuera de la empresa.', creada: hora(9, 0, 30), limite: isoDia(hace(-2)), estado: 'Atendida', respuesta: 'La IP solo se usa para validar la checada y no se comparte con terceros. Se documentó tu oposición a otros usos.' },
];

export const PROYECTOS: Proyecto[] = [
  { id: 'p1', nombre: 'Implementación ERP', cliente: 'Grupo Comercial del Norte', lugar: 'Oficinas del cliente, Monterrey', integrantes: 8, vigencia: 'ago 2026 – mar 2027' },
  { id: 'p2', nombre: 'Ampliación Planta Sur', cliente: 'Proyecto interno', lugar: 'Obra Planta Sur', integrantes: 24, vigencia: 'oct 2026 – jun 2027' },
  { id: 'p3', nombre: 'Inventario anual', cliente: 'Proyecto interno', lugar: 'Almacén Planta Norte', integrantes: 6, vigencia: 'nov – dic 2026' },
];

const empresa = { tipo: 'Empresa', valores: [] } as const;

/** Cuentas del portal. Siempre nominales: una persona, una cuenta (nunca cuentas compartidas). */
export const USUARIOS_ADMIN: UsuarioAdmin[] = [
  { id: 'ua2', nombre: 'Ricardo Fuentes', correo: 'ricardo.fuentes@grupodemo.mx', puesto: 'Director General', rol: 'Admin', estado: 'Activo', alcance: { ...empresa, valores: [] }, externo: false, ultimoAcceso: hora(17, 40, 1), dobleFactor: 'Passkey', creado: hora(9, 0, 420), creadoPor: 'Configuración inicial' },
  { id: 'ua1', nombre: 'Laura Mendoza', correo: 'laura.mendoza@grupodemo.mx', puesto: 'Gerente de Recursos Humanos', rol: 'RH', estado: 'Activo', alcance: { ...empresa, valores: [] }, externo: false, ultimoAcceso: hora(8, 12, 0), dobleFactor: 'App', creado: hora(9, 30, 418), creadoPor: 'Ricardo Fuentes' },
  { id: 'ua3', nombre: 'Patricia Ruiz', correo: 'patricia.ruiz@grupodemo.mx', puesto: 'Supervisora de Producción', rol: 'Supervisor', estado: 'Activo', alcance: { tipo: 'Area', valores: ['Producción'] }, empleadoId: 'e07', externo: false, ultimoAcceso: hora(7, 5, 0), dobleFactor: 'App', creado: hora(10, 0, 300), creadoPor: 'Laura Mendoza' },
  { id: 'ua6', nombre: 'Luis Hernández', correo: 'luis.hernandez@grupodemo.mx', puesto: 'Desarrollador · Líder del proyecto ERP', rol: 'LiderProyecto', estado: 'Activo', alcance: { tipo: 'Proyecto', valores: ['Implementación ERP'] }, empleadoId: 'e02', externo: false, ultimoAcceso: hora(9, 48, 0), dobleFactor: 'App', creado: hora(11, 15, 110), creadoPor: 'Laura Mendoza' },
  { id: 'ua7', nombre: 'Gerardo Ibarra', correo: 'gerardo.ibarra@grupodemo.mx', puesto: 'Residente de obra', rol: 'LiderProyecto', estado: 'Activo', alcance: { tipo: 'Proyecto', valores: ['Ampliación Planta Sur', 'Inventario anual'] }, externo: false, ultimoAcceso: hora(6, 40, 2), dobleFactor: 'App', creado: hora(12, 0, 52), creadoPor: 'Laura Mendoza' },
  { id: 'ua9', nombre: 'Héctor Navarro', correo: 'hector.navarro@grupodemo.mx', puesto: 'Soporte TI · Supervisor de Sistemas', rol: 'Supervisor', estado: 'Invitado', alcance: { tipo: 'Area', valores: ['Sistemas'] }, empleadoId: 'e12', externo: false, creado: hora(16, 20, 1), creadoPor: 'Laura Mendoza' },
  { id: 'ua4', nombre: 'Ana Torres', correo: 'ana.torres@lopezasociados.mx', puesto: 'Auditora externa', rol: 'Auditor', estado: 'Activo', alcance: { ...empresa, valores: [] }, externo: true, organizacion: 'Despacho López y Asociados', vigenciaHasta: isoDia(hace(-70)), ultimoAcceso: hora(12, 30, 9), dobleFactor: 'App', creado: hora(10, 0, 40), creadoPor: 'Ricardo Fuentes' },
  { id: 'ua8', nombre: 'Fernando Gil', correo: 'fernando.gil@grupodemo.mx', puesto: 'Contralor interno', rol: 'Auditor', estado: 'Activo', alcance: { ...empresa, valores: [] }, externo: false, vigenciaHasta: isoDia(hace(-12)), ultimoAcceso: hora(13, 10, 4), dobleFactor: 'App', creado: hora(9, 0, 80), creadoPor: 'Ricardo Fuentes' },
  { id: 'ua5', nombre: 'Mónica Salas', correo: 'monica.salas@grupodemo.mx', puesto: 'Analista de RH', rol: 'RH', estado: 'Inactivo', alcance: { ...empresa, valores: [] }, externo: false, ultimoAcceso: hora(10, 0, 75), dobleFactor: 'SMS', creado: hora(9, 0, 380), creadoPor: 'Ricardo Fuentes', motivoBaja: 'Baja de la empresa (renuncia voluntaria)' },
];

export function bitacoraInicial(): EventoAuditoria[] {
  const e = (id: string, dias: number, h: number, m: number, usuario: string, rol: EventoAuditoria['rol'], accion: EventoAuditoria['accion'], objeto: string, detalle: string, ip: string): EventoAuditoria =>
    ({ id, fecha: hora(h, m, dias), usuario, rol, accion, objeto, detalle, ip });
  return [
    e('au1', 0, 8, 12, 'Laura Mendoza', 'RH', 'Acceso', 'Panel de RH', 'Inicio de sesión con doble factor (app autenticadora)', '189.203.10.***'),
    e('au2', 1, 17, 40, 'Ricardo Fuentes', 'Admin', 'Rol', 'Usuario Mónica Salas', 'Cuenta desactivada por baja de la empresa', '189.203.10.***'),
    e('au3', 1, 12, 5, 'Laura Mendoza', 'RH', 'Aprobacion', 'Lugar de Luis Ángel', 'Aprobó “Home office – Col. Del Valle”', '189.203.10.***'),
    e('au4', 3, 9, 20, 'Patricia Ruiz', 'Supervisor', 'Correccion', 'Checada de Miguel Ángel Soto', 'Aprobó corrección de regreso de comida (14:00); el original se conserva', '189.203.44.***'),
    e('au5', 5, 15, 30, 'Laura Mendoza', 'RH', 'Rechazo', 'Lugar de Luis Ángel', 'Rechazó “Coworking Roma”: no se autorizan espacios de terceros', '189.203.10.***'),
    e('au6', 9, 10, 0, 'Laura Mendoza', 'RH', 'Configuracion', 'Turno Reparto', 'Cambió la tolerancia de 10 a 15 minutos', '189.203.10.***'),
    e('au7', 12, 11, 45, 'Ana Torres', 'Auditor', 'Exportacion', 'Expediente de inspección', 'Descargó registros de octubre en CSV (Despacho López y Asociados)', '201.141.77.***'),
    e('au12', 1, 16, 20, 'Laura Mendoza', 'RH', 'Usuario', 'Usuario Héctor Navarro', 'Alta como Supervisor (Área: Sistemas). Invitación enviada a hector.navarro@grupodemo.mx', '189.203.10.***'),
    e('au13', 40, 10, 0, 'Ricardo Fuentes', 'Admin', 'Usuario', 'Usuario Ana Torres', 'Alta como Auditor externo (Despacho López y Asociados), acceso hasta el ' + fechaCorta(isoDia(hace(-70))), '189.203.10.***'),
    e('au8', 14, 9, 30, 'Laura Mendoza', 'RH', 'Rechazo', 'Corrección de María López', 'Rechazó corrección de salida: sin evidencia', '189.203.10.***'),
    e('au9', 20, 9, 10, 'Laura Mendoza', 'RH', 'Declaracion', 'Contingencia Apagón', 'Declaró apagón en Planta Norte (sin retardo ni falta)', '189.203.10.***'),
    e('au10', 20, 13, 30, 'Laura Mendoza', 'RH', 'Cierre', 'Contingencia Apagón', 'Cerró la contingencia; 14 checadas afectadas', '189.203.10.***'),
    e('au11', 30, 10, 15, 'Ricardo Fuentes', 'Admin', 'Privacidad', 'Aviso de privacidad', `Publicó la versión ${VERSION_AVISO} y pidió nueva aceptación`, '189.203.10.***'),
  ];
}

export function sesionesIniciales(): SesionActiva[] {
  return [
    { id: 'se1', dispositivo: 'iPhone de Luis', plataforma: 'iOS', ubicacion: 'Ciudad de México, MX', ip: '189.203.10.***', inicio: hora(8, 55, 0), ultimaActividad: new Date().toISOString(), actual: true },
    { id: 'se2', dispositivo: 'Chrome en Windows (oficina)', plataforma: 'Web', ubicacion: 'Ciudad de México, MX', ip: '189.203.10.***', inicio: hora(9, 10, 2), ultimaActividad: hora(18, 2, 2), actual: false },
    { id: 'se3', dispositivo: 'Samsung A54 (anterior)', plataforma: 'Android', ubicacion: 'Ciudad de México, MX', ip: '187.190.52.***', inicio: hora(7, 0, 40), ultimaActividad: hora(19, 0, 40), actual: false, advertencia: 'Equipo revocado' },
    { id: 'se4', dispositivo: 'Chrome en Linux', plataforma: 'Web', ubicacion: 'Bogotá, Colombia', ip: '190.27.14.***', inicio: hora(3, 14, 1), ultimaActividad: hora(3, 20, 1), actual: false, advertencia: 'Ubicación inusual' },
  ];
}

export const NOTIFICACIONES_BASE: Notificacion[] = [
  { id: 'n1', tipo: 'Recordatorio', titulo: 'Recuerda registrar tu salida', detalle: 'Tu jornada termina a las 18:00.', fecha: hora(17, 55, 1), leida: true, ruta: '/inicio' },
  { id: 'n2', tipo: 'Seguridad', titulo: 'Nuevo inicio de sesión', detalle: 'Chrome en Linux, Bogotá. ¿No fuiste tú? Ciérrala.', fecha: hora(3, 14, 1), leida: false, ruta: '/seguridad' },
  { id: 'n3', tipo: 'Cierre', titulo: 'Jornada sin salida', detalle: `Sin salida el ${fechaCorta(isoDia(hace(3)))}.`, fecha: hora(9, 0, 2), leida: false, ruta: '/solicitudes' },
  { id: 'n4', tipo: 'Constancia', titulo: 'Tu constancia de octubre está lista', detalle: 'Revísala y confirma.', fecha: hora(8, 0, 19), leida: false, ruta: '/constancia' },
  { id: 'n5', tipo: 'Contingencia', titulo: 'Contingencia cerrada', detalle: 'Terminó el apagón en Planta Norte.', fecha: hora(13, 30, 20), leida: true },
];

export const PREFERENCIAS_INICIALES: PreferenciasNotif = { recordatorios: true, resultados: true, contingencias: true, seguridad: true };

export const CONSENTIMIENTO_INICIAL: Consentimiento = { versionAviso: VERSION_AVISO, aceptado: false };

export const KIOSCOS: Kiosco[] = [
  { id: 'k1', nombre: 'Recepción', sede: 'Sede Centro', estado: 'EnLinea', ultimaSync: new Date().toISOString(), checadasHoy: 3, version: '1.4.2' },
  { id: 'k2', nombre: 'Acceso principal', sede: 'Planta Norte', estado: 'EnLinea', ultimaSync: new Date().toISOString(), checadasHoy: 2, version: '1.4.2' },
  { id: 'k3', nombre: 'Comedor', sede: 'Planta Norte', estado: 'SinConexion', ultimaSync: hora(7, 40, 0), checadasHoy: 0, version: '1.3.9' },
];
