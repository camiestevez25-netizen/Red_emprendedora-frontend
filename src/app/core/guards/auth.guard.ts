import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

// Rutas que necesitan sesión. Sin sesión va a /login?volver=<url> para volver después
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.estaLogueado()
    ? true
    : router.createUrlTree(['/login'], { queryParams: { volver: state.url } });
};