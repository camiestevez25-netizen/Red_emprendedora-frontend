import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

// Agrega "Authorization: Bearer <token>" a cada llamada si hay sesión
export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).obtenerToken();
  if (token && !req.headers.has('Authorization')) {
    return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
  }
  return next(req);
};