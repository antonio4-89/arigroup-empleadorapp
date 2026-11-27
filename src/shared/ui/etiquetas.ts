import {
  EstadoDia, EstadoHoy, EstadoSolicitud, Modalidad, TipoChecada, TipoLugar, TipoSolicitud, Validacion,
} from '../models/models';

export const ETQ_CHECADA: Record<TipoChecada, string> = {
  Entrada: 'Entrada', SalidaComida: 'Salida a comer', RegresoComida: 'Regreso de comer', Salida: 'Salida',
};
export const ETQ_VALIDACION: Record<Validacion, string> = {
  Valida: 'Válida', PorRevisar: 'Por revisar', FueraDeLugar: 'Fuera de lugar',
};
export const CLR_VALIDACION: Record<Validacion, string> = { Valida: 'success', PorRevisar: 'warning', FueraDeLugar: 'danger' };
export const CLS_VALIDACION: Record<Validacion, string> = { Valida: 'valida', PorRevisar: 'revisar', FueraDeLugar: 'fuera' };
export const ETQ_SOLICITUD: Record<TipoSolicitud, string> = {
  Permiso: 'Permiso', Vacaciones: 'Vacaciones', HorasExtra: 'Horas extra', Incapacidad: 'Incapacidad', Comision: 'Comisión',
};
export const ETQ_ESTADO_SOLICITUD: Record<EstadoSolicitud, string> = { Pendiente: 'Pendiente', Aprobada: 'Aprobada', Rechazada: 'Rechazada' };
export const CLR_ESTADO_SOLICITUD: Record<EstadoSolicitud, string> = { Pendiente: 'warning', Aprobada: 'success', Rechazada: 'danger' };
export const ETQ_MODALIDAD: Record<Modalidad, string> = {
  Presencial: 'Presencial', HomeOffice: 'Home office', Hibrido: 'Híbrido', Itinerante: 'Itinerante',
};
export const ETQ_ESTADO_HOY: Record<EstadoHoy, string> = {
  Presente: 'Presente', EnComida: 'En comida', Salio: 'Salió', Retardo: 'Retardo', Ausente: 'Sin registro',
  Vacaciones: 'Vacaciones', Incapacidad: 'Incapacidad',
};
export const CLR_ESTADO_HOY: Record<EstadoHoy, string> = {
  Presente: 'success', EnComida: 'secondary', Salio: 'medium', Retardo: 'warning', Ausente: 'danger',
  Vacaciones: 'primary', Incapacidad: 'primary',
};
export const ETQ_ESTADO_DIA: Record<EstadoDia, string> = {
  Normal: 'Normal', Retardo: 'Retardo', Falta: 'Falta', Descanso: 'Descanso', Festivo: 'Festivo',
  Vacaciones: 'Vacaciones', Incapacidad: 'Incapacidad',
};
export const CLR_ESTADO_DIA: Record<EstadoDia, string> = {
  Normal: 'success', Retardo: 'warning', Falta: 'danger', Descanso: 'medium', Festivo: 'medium',
  Vacaciones: 'primary', Incapacidad: 'primary',
};
export const ETQ_LUGAR: Record<TipoLugar, string> = {
  Sede: 'Sede', HomeOffice: 'Home office', Cliente: 'Cliente / obra', Itinerante: 'Itinerante', Contingencia: 'Contingencia',
};
export const CLR_CHECADA: Record<TipoChecada, string> = {
  Entrada: 'success', SalidaComida: 'warning', RegresoComida: 'warning', Salida: 'danger',
};
export const ETQ_EFECTO: Record<string, string> = {
  ToleranciaAmpliada: 'Tolerancia de entrada ampliada',
  SinRetardoNiFalta: 'Sin retardo ni falta',
  TrabajoRemoto: 'Trabajo remoto temporal',
  JornadaSuspendida: 'Jornada suspendida',
};

import { EstadoAprobacion, EstadoIncidencia, EstadoSenal, TipoIncidencia } from '../models/models';

export const ETQ_INCIDENCIA: Record<TipoIncidencia, string> = {
  Siniestro: 'Siniestro o accidente', EmergenciaMedica: 'Emergencia médica', CambioDeLugar: 'Cambio de lugar de trabajo',
  FallaTransporte: 'Falla de transporte', FallaDispositivo: 'Falla del teléfono', Otro: 'Otro imprevisto',
};
export const ICO_INCIDENCIA: Record<TipoIncidencia, string> = {
  Siniestro: 'flame-outline', EmergenciaMedica: 'medkit-outline', CambioDeLugar: 'swap-horizontal-outline',
  FallaTransporte: 'car-outline', FallaDispositivo: 'phone-portrait-outline', Otro: 'help-circle-outline',
};
export const ETQ_ESTADO_INCIDENCIA: Record<EstadoIncidencia, string> = { Reportada: 'Reportada', EnAtencion: 'En atención', Atendida: 'Atendida' };
export const CLR_ESTADO_INCIDENCIA: Record<EstadoIncidencia, string> = { Reportada: 'warning', EnAtencion: 'primary', Atendida: 'success' };
export const ETQ_APROBACION: Record<EstadoAprobacion, string> = { Aprobado: 'Aprobado', Pendiente: 'En revisión', Rechazado: 'Rechazado' };
export const CLR_APROBACION: Record<EstadoAprobacion, string> = { Aprobado: 'success', Pendiente: 'warning', Rechazado: 'danger' };
export const ICO_SENAL: Record<EstadoSenal, string> = { ok: 'checkmark-circle', alerta: 'warning', falla: 'close-circle' };
export const TIPOS_INCIDENCIA = Object.keys(ETQ_INCIDENCIA) as TipoIncidencia[];

import { EstadoDispositivo, PlataformaDispositivo } from '../models/models';
export const ETQ_DISPOSITIVO: Record<EstadoDispositivo, string> = { Aprobado: 'Vinculado', Pendiente: 'En revisión', Revocado: 'Revocado' };
export const CLR_DISPOSITIVO: Record<EstadoDispositivo, string> = { Aprobado: 'success', Pendiente: 'warning', Revocado: 'danger' };
export const ICO_PLATAFORMA: Record<PlataformaDispositivo, string> = { iOS: 'phone-portrait-outline', Android: 'phone-portrait-outline', Web: 'desktop-outline' };

import {
  AccionAuditoria, Alcance, DerechoArco, EstadoArco, EstadoControl, EstadoCuenta, Metodo2fa, MotivoRetardo, Rol, TipoAlcance, TipoNotificacion,
} from '../models/models';

export const ETQ_ACCION: Record<AccionAuditoria, string> = {
  Aprobacion: 'Aprobación', Rechazo: 'Rechazo', Declaracion: 'Declaración', Cierre: 'Cierre', Correccion: 'Corrección', Configuracion: 'Configuración',
  Exportacion: 'Exportación', Rol: 'Cambio de rol', Usuario: 'Cuentas de usuario', Privacidad: 'Privacidad', Acceso: 'Acceso',
};
export const CLR_ACCION: Record<AccionAuditoria, string> = {
  Aprobacion: 'success', Rechazo: 'danger', Declaracion: 'warning', Cierre: 'medium', Correccion: 'primary', Configuracion: 'primary',
  Exportacion: 'warning', Rol: 'danger', Usuario: 'secondary', Privacidad: 'secondary', Acceso: 'medium',
};
export const ETQ_ARCO: Record<DerechoArco, string> = { Acceso: 'Acceso', Rectificacion: 'Rectificación', Cancelacion: 'Cancelación', Oposicion: 'Oposición' };
export const AYUDA_ARCO: Record<DerechoArco, string> = {
  Acceso: 'Saber qué datos tuyos tiene la empresa y cómo los usa.',
  Rectificacion: 'Corregir datos que estén incompletos o incorrectos.',
  Cancelacion: 'Pedir que se eliminen datos que ya no se necesitan.',
  Oposicion: 'Pedir que no se usen tus datos para un fin específico.',
};
export const ETQ_ESTADO_ARCO: Record<EstadoArco, string> = { Recibida: 'Recibida', EnTramite: 'En trámite', Atendida: 'Atendida' };
export const CLR_ESTADO_ARCO: Record<EstadoArco, string> = { Recibida: 'warning', EnTramite: 'primary', Atendida: 'success' };
export const ETQ_METODO_2FA: Record<Metodo2fa, string> = { App: 'App autenticadora', Passkey: 'Llave de acceso', SMS: 'Mensaje de texto' };
export const ETQ_NOTIFICACION: Record<TipoNotificacion, string> = {
  Recordatorio: 'Recordatorio', Resultado: 'Resultado', Contingencia: 'Contingencia', Seguridad: 'Seguridad', Cierre: 'Jornada', Constancia: 'Constancia',
};
export const ICO_NOTIFICACION: Record<TipoNotificacion, string> = {
  Recordatorio: 'time-outline', Resultado: 'checkmark-circle', Contingencia: 'warning', Seguridad: 'shield-checkmark-outline',
  Cierre: 'alert-circle-outline', Constancia: 'document-text-outline',
};
export const ETQ_CONTROL: Record<EstadoControl, string> = { Cumple: 'Cumple', Atencion: 'Requiere atención', Pendiente: 'Pendiente' };
export const CLR_CONTROL: Record<EstadoControl, string> = { Cumple: 'success', Atencion: 'warning', Pendiente: 'danger' };
export const CLR_ROL: Record<Rol, string> = { Empleado: 'medium', LiderProyecto: 'success', Supervisor: 'secondary', RH: 'primary', Admin: 'dark', Auditor: 'warning' };
export const ETQ_ROL: Record<Rol, string> = {
  Empleado: 'Colaborador', LiderProyecto: 'Líder de proyecto', Supervisor: 'Supervisor', RH: 'Recursos Humanos', Admin: 'Administrador', Auditor: 'Auditor',
};
/** Roles del portal del empleador, de menor a mayor alcance. */
export const ROLES_ADMIN: Rol[] = ['LiderProyecto', 'Supervisor', 'RH', 'Admin', 'Auditor'];
export const ETQ_ESTADO_CUENTA: Record<EstadoCuenta, string> = { Invitado: 'Invitación enviada', Activo: 'Activo', Inactivo: 'Inactivo' };
export const CLR_ESTADO_CUENTA: Record<EstadoCuenta, string> = { Invitado: 'warning', Activo: 'success', Inactivo: 'medium' };
export const ETQ_ALCANCE: Record<TipoAlcance, string> = { Empresa: 'Toda la empresa', Sede: 'Por sede', Area: 'Por área', Proyecto: 'Por proyecto' };

export function textoAlcance(a: Alcance): string {
  if (a.tipo === 'Empresa' || !a.valores.length) return 'Toda la empresa';
  const pref = a.tipo === 'Sede' ? 'Sede' : a.tipo === 'Area' ? 'Área' : a.valores.length > 1 ? 'Proyectos' : 'Proyecto';
  return `${pref}: ${a.valores.join(', ')}`;
}
export const ETQ_CHECADA_ORIGEN: Record<string, string> = { Movil: 'Móvil', Web: 'Web', Kiosco: 'Kiosco', Correccion: 'Corrección' };

export const ETQ_MOTIVO_RETARDO: Record<MotivoRetardo, string> = {
  Transporte: 'Transporte o tráfico', CitaMedica: 'Cita médica', AsuntoPersonal: 'Asunto personal o familiar', InstruccionJefe: 'Encargo de mi jefe',
  FallaInternetLuz: 'Falla de internet o de luz', FallaEquipoEmpresa: 'Falla del equipo que da la empresa', Otro: 'Otro motivo',
};
/** En la sede, cliente u obra hay traslado; en home office no, pero sí fallas de conexión o del equipo (que en teletrabajo pone el patrón, art. 330-E LFT). */
export const MOTIVOS_RETARDO_SEDE: MotivoRetardo[] = ['Transporte', 'CitaMedica', 'AsuntoPersonal', 'InstruccionJefe', 'Otro'];
export const MOTIVOS_RETARDO_CASA: MotivoRetardo[] = ['FallaInternetLuz', 'FallaEquipoEmpresa', 'CitaMedica', 'AsuntoPersonal', 'Otro'];
