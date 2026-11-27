import { EnvironmentProviders, Provider, provideAppInitializer } from '@angular/core';
import { APP_ROL, ChecadorApi, RolApp } from './api/checador-api';
import { avisarErroresDelServidor } from './api/errores-sin-atender';
import { API_URL, HttpChecadorApi } from './api/http-checador-api';
import { MockChecadorApi } from './api/mock-checador-api';

/** Con `apiUrl` la app usa el backend real (cadena vacía = mismo dominio); sin él, los datos de demostración. */
export function provideChecador(rol: RolApp, apiUrl?: string): (Provider | EnvironmentProviders)[] {
  return [
    { provide: APP_ROL, useValue: rol },
    ...(apiUrl === undefined
      ? [{ provide: ChecadorApi, useClass: MockChecadorApi }]
      : [{ provide: API_URL, useValue: apiUrl }, { provide: ChecadorApi, useClass: HttpChecadorApi }, provideAppInitializer(avisarErroresDelServidor)]),
  ];
}
