import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Rol } from '../models/auth.model';

// Uso en la ruta: canActivate: [rolGuard], data: { roles: ['ORGANIZADOR'] }
// Sin sesión -> /login?volver=<url>. Logueada sin ninguno de los roles -> /sin-permisos
export const rolGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.estaLogueado()) {
    return router.createUrlTree(['/login'], { queryParams: { volver: state.url } });
  }

  const roles = (route.data['roles'] as Rol[] | undefined) ?? [];
  const tieneAlguno = roles.length === 0 || roles.some((rol) => auth.tieneRol(rol));
  return tieneAlguno ? true : router.createUrlTree(['/sin-permisos']);
};