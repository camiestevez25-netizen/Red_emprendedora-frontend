import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

// 401 con sesión iniciada (token vencido o inválido): cierra la sesión y manda a
// /login?volver=<url actual>.
// Sin sesión no se redirige: un visitante en una pantalla pública (Registro, Explorar)
// no tiene que terminar en el login; la pantalla muestra el error.
// El 401 del login no se toca: la pantalla de Login muestra el mensaje del backend.
// El 403 no se redirige: cada pantalla muestra el mensaje cerca de la acción.
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && !req.url.includes('/auth/login') && auth.estaLogueado()) {
        auth.logout();
        const actual = router.url;
        const yaEnLogin = actual.startsWith('/login');
        router.navigate(['/login'], yaEnLogin ? {} : { queryParams: { volver: actual } });
      }
      return throwError(() => err);
    }),
  );
};