import type { Routes } from '@angular/router';
import { LoginPage, authGuard } from '@checador/shared';


export const routes: Routes = [
  { path: 'login', component: LoginPage },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./shell/shell.component').then((m) => m.ShellComponent),
    children: [
      { path: 'panel', loadComponent: () => import('./panel/panel.page').then((m) => m.PanelPage) },
      { path: 'revision', loadComponent: () => import('./revision/revision.page').then((m) => m.RevisionPage) },
      { path: 'empleados', loadComponent: () => import('./empleados/empleados.page').then((m) => m.EmpleadosPage) },
      { path: 'empleados/:id', loadComponent: () => import('./empleados/empleado-detalle.page').then((m) => m.EmpleadoDetallePage) },
      { path: 'solicitudes', loadComponent: () => import('./solicitudes/solicitudes.page').then((m) => m.SolicitudesPage) },
      { path: 'incidencias', loadComponent: () => import('./incidencias/incidencias.page').then((m) => m.IncidenciasPage) },
      { path: 'lugares', loadComponent: () => import('./lugares/lugares.page').then((m) => m.LugaresPage) },
      { path: 'contingencias', loadComponent: () => import('./contingencias/contingencias.page').then((m) => m.ContingenciasPage) },
      { path: 'reportes', loadComponent: () => import('./reportes/reportes.page').then((m) => m.ReportesPage) },
      { path: 'correcciones', loadComponent: () => import('./correcciones/correcciones.page').then((m) => m.CorreccionesPage) },
      { path: 'turnos', loadComponent: () => import('./turnos/turnos.page').then((m) => m.TurnosPage) },
      { path: 'cumplimiento', loadComponent: () => import('./cumplimiento/cumplimiento.page').then((m) => m.CumplimientoPage) },
      { path: 'privacidad', loadComponent: () => import('./privacidad/privacidad.page').then((m) => m.PrivacidadPage) },
      { path: 'auditoria', loadComponent: () => import('./auditoria/auditoria.page').then((m) => m.AuditoriaPage) },
      { path: 'usuarios', loadComponent: () => import('./usuarios/usuarios.page').then((m) => m.UsuariosPage) },
      { path: '', redirectTo: 'panel', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: '' },
];
