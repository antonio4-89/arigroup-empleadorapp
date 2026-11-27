import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessionService } from './session.service';

export const authGuard: CanActivateFn = () => {
  const s = inject(SessionService);
  return s.autenticado() ? true : inject(Router).createUrlTree(['/login']);
};
