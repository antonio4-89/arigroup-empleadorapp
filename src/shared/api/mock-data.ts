import {
  Checada, Contingencia, Coordenada, Empleado, Incidencia, LugarPermitido, Solicitud, SolicitudLugar,
} from '../models/models';

const hoy = () => new Date();
export const isoDia = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const fechaCorta = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
export const hace = (dias: number) => { const d = hoy(); d.setDate(d.getDate() - dias); return d; };
const hora = (h: number, m: number, dias = 0) => { const d = hace(dias); d.setHours(h, m, 0, 0); return d.toISOString(); };

export const YO = 'e01';

export const EMPLEADOS: Empleado[] = [
  { id: 'e01', numero: '1001', nombre: 'Luis Ángel', puesto: 'Analista de Nómina', departamento: 'Recursos Humanos', sede: 'Sede Centro', modalidad: 'Hibrido', tipoJornada: 'Diurna', horario: '09:00 – 18:00', turnoId: 't1', correo: 'luis.angel@grupodemo.mx', cuenta: 'Activa', fechaIngreso: '2021-07-15', estadoHoy: 'Ausente' },
  { id: 'e02', numero: '1002', nombre: 'Luis Hernández', puesto: 'Desarrollador', departamento: 'Sistemas', sede: 'Sede Centro', modalidad: 'HomeOffice', tipoJornada: 'Diurna', horario: '09:00 – 18:00', turnoId: 't1', correo: 'luis.hernandez@grupodemo.mx', cuenta: 'Activa', fechaIngreso: '2022-08-01', estadoHoy: 'Presente' },
  { id: 'e03', numero: '1003', nombre: 'María López', puesto: 'Contadora', departamento: 'Finanzas', sede: 'Sede Centro', modalidad: 'Presencial', tipoJornada: 'Diurna', horario: '08:00 – 17:00', turnoId: 't2', comidaPactada: { minutos: 45, fundamento: 'Convenio por escrito: comida de 45 min para salir a las 16:45' }, correo: 'maria.lopez@grupodemo.mx', cuenta: 'Activa', fechaIngreso: '2019-01-10', estadoHoy: 'Presente' },
  { id: 'e04', numero: '1004', nombre: 'Carlos Ramírez', puesto: 'Vigilante', departamento: 'Seguridad', sede: 'Planta Norte', modalidad: 'Presencial', tipoJornada: 'Nocturna', horario: '21:00 – 04:00', turnoId: 't5', correo: 'carlos.ramirez@grupodemo.mx', cuenta: 'Activa', fechaIngreso: '2020-06-22', estadoHoy: 'Ausente' },
  { id: 'e05', numero: '1005', nombre: 'Sofía Martínez', puesto: 'Ejecutiva de Ventas', departamento: 'Ventas', sede: 'Sede Centro', modalidad: 'Itinerante', tipoJornada: 'Diurna', horario: '09:00 – 18:00', turnoId: 't1', comidaPactada: { minutos: 90, fundamento: 'Contrato individual, cláusula 6: comida extendida por visitas a clientes' }, correo: 'sofia.martinez@grupodemo.mx', cuenta: 'Activa', fechaIngreso: '2023-02-13', estadoHoy: 'Retardo' },
  { id: 'e06', numero: '1006', nombre: 'Jorge Díaz', puesto: 'Operador', departamento: 'Producción', sede: 'Planta Norte', modalidad: 'Presencial', tipoJornada: 'Mixta', horario: '14:00 – 21:30', turnoId: 't4', correo: 'jorge.diaz@grupodemo.mx', cuenta: 'Activa', fechaIngreso: '2018-11-05', estadoHoy: 'Presente' },
  { id: 'e07', numero: '1007', nombre: 'Patricia Ruiz', puesto: 'Supervisora', departamento: 'Producción', sede: 'Planta Norte', modalidad: 'Presencial', tipoJornada: 'Diurna', horario: '07:00 – 16:00', turnoId: 't3', correo: 'patricia.ruiz@grupodemo.mx', cuenta: 'Activa', fechaIngreso: '2017-04-03', estadoHoy: 'EnComida' },
  { id: 'e08', numero: '1008', nombre: 'Miguel Ángel Soto', puesto: 'Almacenista', departamento: 'Logística', sede: 'Planta Norte', modalidad: 'Presencial', tipoJornada: 'Diurna', horario: '07:00 – 16:00', turnoId: 't3', correo: 'miguel.soto@grupodemo.mx', cuenta: 'Activa', fechaIngreso: '2024-01-15', estadoHoy: 'Presente' },
  { id: 'e09', numero: '1009', nombre: 'Daniela Flores', puesto: 'Diseñadora', departamento: 'Marketing', sede: 'Sede Centro', modalidad: 'HomeOffice', tipoJornada: 'Diurna', horario: '10:00 – 19:00', turnoId: 't7', correo: 'daniela.flores@grupodemo.mx', cuenta: 'Activa', fechaIngreso: '2023-09-01', estadoHoy: 'Vacaciones' },
  { id: 'e10', numero: '1010', nombre: 'Roberto Castillo', puesto: 'Chofer', departamento: 'Logística', sede: 'Planta Norte', modalidad: 'Itinerante', tipoJornada: 'Diurna', horario: '06:00 – 15:00', turnoId: 't6', correo: 'roberto.castillo@grupodemo.mx', cuenta: 'Activa', fechaIngreso: '2020-02-17', estadoHoy: 'Presente' },
  { id: 'e11', numero: '1011', nombre: 'Elena Vargas', puesto: 'Auxiliar Contable', departamento: 'Finanzas', sede: 'Sede Centro', modalidad: 'Presencial', tipoJornada: 'Diurna', horario: '08:00 – 17:00', turnoId: 't2', correo: 'elena.vargas@grupodemo.mx', cuenta: 'Activa', fechaIngreso: '2022-05-09', estadoHoy: 'Incapacidad' },
  { id: 'e12', numero: '1012', nombre: 'Héctor Navarro', puesto: 'Soporte TI', departamento: 'Sistemas', sede: 'Sede Centro', modalidad: 'Hibrido', tipoJornada: 'Diurna', horario: '09:00 – 18:00', turnoId: 't1', correo: 'hector.navarro@grupodemo.mx', cuenta: 'Invitada', fechaIngreso: '2021-10-04', estadoHoy: 'Presente' },
];

export const LUGARES: LugarPermitido[] = [
  { id: 'l1', nombre: 'Sede Centro', tipo: 'Sede', direccion: 'Av. Reforma 250, CDMX', radioMetros: 150, latitud: 19.4326, longitud: -99.1332, vigencia: 'Permanente', empleadosAsignados: 6, redes: ['IP 189.203.10.5', 'Wi-Fi Oficina-Centro'] },
  { id: 'l2', nombre: 'Planta Norte', tipo: 'Sede', direccion: 'Parque Industrial Vallejo, CDMX', radioMetros: 300, latitud: 19.4906, longitud: -99.148, vigencia: 'Permanente', empleadosAsignados: 6, redes: ['IP 189.203.44.8'] },
  { id: 'l3', nombre: 'Home office – Luis Ángel', tipo: 'HomeOffice', direccion: 'Col. Del Valle, CDMX (domicilio declarado)', radioMetros: 200, latitud: 19.3902, longitud: -99.1672, vigencia: 'Mar y jue', empleadosAsignados: 1, redes: ['Ciudad: CDMX', 'Proveedor habitual'] },
  { id: 'l4', nombre: 'Home office – Luis Hernández', tipo: 'HomeOffice', direccion: 'Querétaro, Qro. (domicilio declarado)', radioMetros: 250, latitud: 20.5888, longitud: -100.3899, vigencia: 'Permanente', empleadosAsignados: 1, redes: ['Ciudad: Querétaro'] },
  { id: 'l5', nombre: 'Cliente Grupo Alfa – Monterrey', tipo: 'Cliente', direccion: 'San Pedro Garza García, N.L.', radioMetros: 500, latitud: 25.6514, longitud: -100.2895, vigencia: 'Hasta 12/12/2026', empleadosAsignados: 2, redes: [] },
  { id: 'l6', nombre: 'Ruta de ventas Zona Centro', tipo: 'Itinerante', direccion: 'Zona CDMX y Edomex', vigencia: 'Permanente', empleadosAsignados: 2, redes: [] },
];

export const SOLICITUDES_INICIALES: Solicitud[] = [
  { id: 's1', empleadoId: 'e01', empleado: 'Luis Ángel', tipo: 'Permiso', desde: isoDia(hace(12)), hasta: isoDia(hace(12)), motivo: 'Trámite personal', estado: 'Aprobada', creada: hora(10, 0, 14), comentarioResolucion: 'Autorizado' },
  { id: 's3', empleadoId: 'e05', empleado: 'Sofía Martínez', tipo: 'Comision', desde: isoDia(hace(0)), hasta: isoDia(hace(-2)), motivo: 'Visita a cliente en Monterrey', estado: 'Pendiente', creada: hora(8, 15, 1) },
  { id: 's4', empleadoId: 'e08', empleado: 'Miguel Ángel Soto', tipo: 'Vacaciones', desde: isoDia(hace(-20)), hasta: isoDia(hace(-14)), motivo: 'Vacaciones de fin de año', estado: 'Pendiente', creada: hora(12, 0, 3) },
  { id: 's5', empleadoId: 'e03', empleado: 'María López', tipo: 'Permiso', desde: isoDia(hace(-1)), hasta: isoDia(hace(-1)), motivo: 'Cita médica', estado: 'Pendiente', creada: hora(16, 40, 1) },
];

export const CONTINGENCIAS_INICIALES: Contingencia[] = [
  { id: 'c1', tipo: 'Apagon', alcance: 'Planta Norte', inicio: hora(9, 10, 20), fin: hora(13, 30, 20), efecto: 'SinRetardoNiFalta', nota: 'Apagón general de zona por CFE', declaradaPor: 'Laura Mendoza (RH)', activa: false, checadasAfectadas: 14 },
];

export const CENTROS: Record<string, Coordenada> = {
  'Sede Centro': { latitud: 19.4326, longitud: -99.1332 },
  'Planta Norte': { latitud: 19.4906, longitud: -99.148 },
  'Home office – Luis Hernández': { latitud: 20.5888, longitud: -100.3899 },
  'Ruta de ventas Zona Centro': { latitud: 19.4412, longitud: -99.1215 },
  'Ruta de reparto': { latitud: 19.5201, longitud: -99.2004 },
};

export function cerca(c: Coordenada, semilla: string): Coordenada {
  let h = 0;
  for (const ch of semilla) h = (h * 31 + ch.charCodeAt(0)) % 997;
  const dx = ((h % 101) - 50) * 1.1;
  const dy = (((h * 7) % 101) - 50) * 1.1;
  return { latitud: c.latitud + dy / 111_320, longitud: c.longitud + dx / (111_320 * Math.cos((c.latitud * Math.PI) / 180)) };
}

function ch(id: string, e: Empleado, tipo: Checada['tipo'], h: number, m: number, extra: Partial<Checada> = {}): Checada {
  const lugar = extra.lugar ?? e.sede;
  return {
    id, empleadoId: e.id, empleado: e.nombre, tipo, horaServidor: hora(h, m), lugar, validacion: 'Valida',
    motivos: [], diferida: false, origen: 'Movil', folio: `CH-${id.toUpperCase()}`, sello: '', selloAnterior: '',
    posicion: CENTROS[lugar] ? cerca(CENTROS[lugar], id) : undefined, ...extra,
  };
}

const E = (id: string) => EMPLEADOS.find((x) => x.id === id)!;
export const CHECADAS_INICIALES: Checada[] = [
  ch('a01', E('e03'), 'Entrada', 7, 58, { origen: 'Kiosco' }),
  ch('a02', E('e07'), 'Entrada', 6, 55, { origen: 'Kiosco' }),
  ch('a03', E('e07'), 'SalidaComida', 11, 5, { origen: 'Kiosco' }),
  ch('a04', E('e08'), 'Entrada', 7, 3, { origen: 'Kiosco' }),
  ch('a05', E('e02'), 'Entrada', 8, 57, { origen: 'Web', lugar: 'Home office – Luis Hernández' }),
  ch('a06', E('e12'), 'Entrada', 9, 1),
  ch('a07', E('e05'), 'Entrada', 9, 34, { validacion: 'PorRevisar', motivos: ['Retardo de 34 min', 'IP con VPN/proxy'], lugar: 'Ruta de ventas Zona Centro' }),
  ch('a08', E('e10'), 'Entrada', 5, 52, { lugar: 'Ruta de reparto' }),
  ch('a09', E('e06'), 'Entrada', 14, 2, { validacion: 'FueraDeLugar', motivos: ['GPS a 4.2 km de Planta Norte', 'IP en otra ciudad'], posicion: { latitud: 19.5276, longitud: -99.148 } }),
  ch('a10', E('e03'), 'SalidaComida', 12, 30, { origen: 'Kiosco' }),
  ch('a11', E('e03'), 'RegresoComida', 13, 2, { origen: 'Kiosco' }),
  ch('a12', E('e10'), 'SalidaComida', 10, 59, { diferida: true, validacion: 'PorRevisar', motivos: ['Checada diferida (sin red)'] }),
];


export const LUGARES_EMPLEADOS: SolicitudLugar[] = [
  { id: 'ml1', empleadoId: 'e01', empleado: 'Luis Ángel', nombre: 'Sede Centro', tipo: 'Sede', direccion: 'Av. Reforma 250, CDMX', radioMetros: 150, dias: 'Lun a vie', vigencia: 'Permanente', estado: 'Aprobado', motivo: 'Lugar de adscripción', creada: hora(9, 0, 400) },
  { id: 'ml2', empleadoId: 'e01', empleado: 'Luis Ángel', nombre: 'Home office – Col. Del Valle', tipo: 'HomeOffice', direccion: 'Col. Del Valle, CDMX (domicilio declarado)', radioMetros: 200, dias: 'Martes y jueves', vigencia: 'Permanente', estado: 'Aprobado', motivo: 'Esquema híbrido', creada: hora(9, 0, 300) },
  { id: 'ml3', empleadoId: 'e01', empleado: 'Luis Ángel', nombre: 'Cliente Grupo Alfa – Monterrey', tipo: 'Cliente', direccion: 'San Pedro Garza García, N.L.', radioMetros: 500, dias: 'Del 24 al 28 de nov', vigencia: 'Hasta 28/11/2026', estado: 'Pendiente', motivo: 'Capacitación en las oficinas del cliente', creada: hora(11, 20, 1) },
  { id: 'ml4', empleadoId: 'e01', empleado: 'Luis Ángel', nombre: 'Coworking Roma', tipo: 'HomeOffice', direccion: 'Col. Roma Norte, CDMX', radioMetros: 100, dias: 'Viernes', vigencia: 'Permanente', estado: 'Rechazado', motivo: 'Prefiero trabajar fuera de casa los viernes', creada: hora(10, 0, 30), comentarioResolucion: 'No se autorizan espacios públicos o de terceros; usa tu home office o la sede.' },
  { id: 'ml5', empleadoId: 'e02', empleado: 'Luis Hernández', nombre: 'Coworking Querétaro Centro', tipo: 'Cliente', direccion: 'Centro Histórico, Querétaro', radioMetros: 150, dias: 'Del 25 al 27 de nov', vigencia: 'Hasta 27/11/2026', estado: 'Pendiente', motivo: 'Mi casa tendrá corte de luz programado', creada: hora(8, 40, 0) },
  { id: 'ml6', empleadoId: 'e10', empleado: 'Roberto Castillo', nombre: 'Bodega proveedor Tultitlán', tipo: 'Cliente', direccion: 'Tultitlán, Edomex', radioMetros: 400, dias: 'Lun a vie', vigencia: 'Hasta 31/12/2026', estado: 'Pendiente', motivo: 'Recolección diaria de mercancía', creada: hora(7, 5, 1) },
];

export const INCIDENCIAS_INICIALES: Incidencia[] = [
  { id: 'i1', empleadoId: 'e04', empleado: 'Carlos Ramírez', tipo: 'Siniestro', descripcion: 'Intento de robo en la caseta de acceso de Planta Norte. Estoy bien, pero hay daños en la puerta.', requiereAyuda: true, lugar: 'Planta Norte', creada: hora(6, 40, 0), estado: 'Reportada' },
  { id: 'i2', empleadoId: 'e10', empleado: 'Roberto Castillo', tipo: 'FallaTransporte', descripcion: 'La unidad 4 se descompuso en Periférico; llegaré con retraso.', requiereAyuda: false, lugar: 'Ruta de reparto', creada: hora(5, 50, 2), estado: 'Atendida', respuesta: 'Se envió grúa y se justificó el retardo.' },
  { id: 'i3', empleadoId: 'e01', empleado: 'Luis Ángel', tipo: 'FallaDispositivo', descripcion: 'Mi teléfono se quedó sin batería al salir y no pude registrar la salida.', requiereAyuda: false, lugar: 'Sede Centro', creada: hora(18, 20, 3), estado: 'EnAtencion' },
];
