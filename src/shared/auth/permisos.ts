import { Injectable, computed, inject } from '@angular/core';
import { Rol, TipoAlcance } from '../models/models';
import { SessionService } from './session.service';

export type Seccion =
  | 'panel' | 'incidencias' | 'revision' | 'correcciones' | 'solicitudes' | 'empleados' | 'turnos' | 'lugares'
  | 'contingencias' | 'reportes' | 'cumplimiento' | 'privacidad' | 'auditoria' | 'usuarios';
/**
 * resolver: aprobar o rechazar trámites y checadas.
 * configurar: turnos, lugares, contingencias, catálogos.
 * usuarios: alta y mantenimiento de cuentas operativas (supervisores y líderes de proyecto).
 * administrar: además, roles privilegiados (RH, administradores y auditores).
 */
export type Accion = 'resolver' | 'configurar' | 'usuarios' | 'administrar';

export interface Perfil {
  nombre: string;
  secciones: Seccion[];
  acciones: Accion[];
  descripcion: string;
  quienAsigna: string;
  alcances: TipoAlcance[];
  vigenciaObligatoria: boolean;
  permiteExterno: boolean;
}

const TODAS: Seccion[] = [
  'panel', 'incidencias', 'revision', 'correcciones', 'solicitudes', 'empleados', 'turnos', 'lugares',
  'contingencias', 'reportes', 'cumplimiento', 'privacidad', 'auditoria', 'usuarios',
];

export const PERMISOS: Record<Rol, Perfil> = {
  Empleado: {
    nombre: 'Colaborador', secciones: [], acciones: [], quienAsigna: 'Se crea al dar de alta al colaborador.',
    descripcion: 'Solo usa la app del colaborador para registrar su jornada.', alcances: ['Empresa'], vigenciaObligatoria: false, permiteExterno: false,
  },
  LiderProyecto: {
    nombre: 'Líder de proyecto',
    secciones: ['panel', 'empleados', 'solicitudes', 'reportes'],
    acciones: [],
    descripcion: 'Da seguimiento a la asistencia y horas de las personas asignadas a sus proyectos mientras dure la asignación. Consulta, no aprueba ni configura.',
    quienAsigna: 'RH o Administrador', alcances: ['Proyecto'], vigenciaObligatoria: false, permiteExterno: false,
  },
  Supervisor: {
    nombre: 'Supervisor',
    secciones: ['panel', 'incidencias', 'revision', 'correcciones', 'solicitudes', 'empleados', 'turnos', 'reportes'],
    acciones: ['resolver'],
    descripcion: 'Atiende a su equipo: revisa checadas, aprueba permisos y correcciones. No modifica configuración ni ve datos de privacidad.',
    quienAsigna: 'RH o Administrador', alcances: ['Area', 'Sede'], vigenciaObligatoria: false, permiteExterno: false,
  },
  RH: {
    nombre: 'Recursos Humanos',
    secciones: TODAS,
    acciones: ['resolver', 'configurar', 'usuarios'],
    descripcion: 'Operación completa de asistencia: aprueba, configura turnos, lugares y contingencias, y da de alta supervisores y líderes de proyecto.',
    quienAsigna: 'Solo Administrador', alcances: ['Empresa'], vigenciaObligatoria: false, permiteExterno: false,
  },
  Admin: {
    nombre: 'Administrador (Dirección)',
    secciones: TODAS,
    acciones: ['resolver', 'configurar', 'usuarios', 'administrar'],
    descripcion: 'Dirección de la empresa: supervisión general y control de roles privilegiados (RH, administradores y auditores).',
    quienAsigna: 'Solo Administrador', alcances: ['Empresa'], vigenciaObligatoria: false, permiteExterno: false,
  },
  Auditor: {
    nombre: 'Auditor',
    secciones: TODAS,
    acciones: [],
    descripcion: 'Revisión independiente (auditoría interna, despacho externo o asesor legal). Solo lectura de todo, incluida la revisión de accesos. Su acceso vence en una fecha fija.',
    quienAsigna: 'Solo Administrador', alcances: ['Empresa'], vigenciaObligatoria: true, permiteExterno: true,
  },
};

/** Qué roles puede otorgar cada rol. Nadie otorga un rol con más facultades que el suyo, ni RH crea otros RH. */
export const ROLES_GESTIONABLES: Record<Rol, Rol[]> = {
  Empleado: [], LiderProyecto: [], Supervisor: [], Auditor: [],
  RH: ['LiderProyecto', 'Supervisor'],
  Admin: ['LiderProyecto', 'Supervisor', 'RH', 'Admin', 'Auditor'],
};

export const ETQ_SECCION: Record<Seccion, string> = {
  panel: 'Panel de control', incidencias: 'Incidencias', revision: 'Checadas por revisar', correcciones: 'Correcciones', solicitudes: 'Solicitudes',
  empleados: 'Colaboradores', turnos: 'Turnos y festivos', lugares: 'Lugares permitidos',
  contingencias: 'Contingencias', reportes: 'Reportes', cumplimiento: 'Cumplimiento',
  privacidad: 'Privacidad', auditoria: 'Bitácora e integridad', usuarios: 'Usuarios y roles',
};

export const SECCIONES = TODAS;

/** Navegación del portal del empleador: grupos en orden, ícono y propósito de cada sección. */
export const NAV_EMPLEADOR: { titulo: string; secciones: Seccion[] }[] = [
  { titulo: 'Operación', secciones: ['panel', 'incidencias', 'revision', 'correcciones', 'solicitudes'] },
  { titulo: 'Personas', secciones: ['empleados', 'turnos'] },
  { titulo: 'Lugares y equipos', secciones: ['lugares', 'contingencias'] },
  { titulo: 'Cumplimiento', secciones: ['reportes', 'cumplimiento', 'privacidad', 'auditoria'] },
  { titulo: 'Administración', secciones: ['usuarios'] },
];

export const ICONO_SECCION: Record<Seccion, string> = {
  panel: 'gauge-high', incidencias: 'triangle-exclamation', revision: 'clipboard-check', correcciones: 'pen-to-square', solicitudes: 'inbox',
  empleados: 'users', turnos: 'calendar-days', lugares: 'location-dot', contingencias: 'bolt',
  reportes: 'chart-column', cumplimiento: 'shield-halved', privacidad: 'lock', auditoria: 'list-check', usuarios: 'user-gear',
};

export const DESC_SECCION: Record<Seccion, string> = {
  panel: 'Asistencia del día y asuntos que requieren tu atención.',
  incidencias: 'Siniestros, emergencias y fallas reportadas por los colaboradores.',
  revision: 'Checadas que no pasaron la validación de lugar y entradas con retardo, con el motivo que dio el empleado.',
  correcciones: 'Ajustes solicitados a checadas. El registro original nunca se modifica.',
  solicitudes: 'Permisos, vacaciones, horas extra, incapacidades y comisiones.',
  empleados: 'Plantilla, modalidad de trabajo, turno asignado y estado del día.',
  turnos: 'Horarios, tolerancias, días de descanso y festivos obligatorios.',
  lugares: 'Sedes y lugares aprobados desde donde se puede registrar la jornada.',
  contingencias: 'Eventos que afectan a varios colaboradores y cómo se trata su jornada.',
  reportes: 'Jornada, horas extra y constancias mensuales firmadas por los colaboradores.',
  cumplimiento: 'Controles legales del registro electrónico de jornada y evidencia para la autoridad.',
  privacidad: 'Aviso de privacidad, consentimientos y solicitudes ARCO.',
  auditoria: 'Integridad de los sellos del registro y bitácora de todas las acciones.',
  usuarios: 'Alta, consulta, edición y baja de las personas con acceso al portal, con su rol, alcance y vigencia.',
};

export const GRUPO_SECCION = Object.fromEntries(
  NAV_EMPLEADOR.flatMap((g) => g.secciones.map((s) => [s, g.titulo])),
) as Record<Seccion, string>;

@Injectable({ providedIn: 'root' })
export class PermisosService {
  private readonly sesion = inject(SessionService);
  readonly rol = computed<Rol>(() => this.sesion.usuario()?.rol ?? 'Empleado');
  readonly perfil = computed(() => PERMISOS[this.rol()]);

  readonly gestionables = computed(() => ROLES_GESTIONABLES[this.rol()]);

  veSeccion(s: Seccion) { return this.perfil().secciones.includes(s); }
  puede(a: Accion) { return this.perfil().acciones.includes(a); }
  puedeGestionar(rol: Rol) { return this.gestionables().includes(rol); }
}
