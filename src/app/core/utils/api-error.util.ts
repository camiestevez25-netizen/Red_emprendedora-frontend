import { HttpErrorResponse } from '@angular/common/http';
import { ApiError } from '../models/api-error.model';

export interface ErrorLeido {
  mensaje: string;
  errores: Record<string, string>;
}

// Lee el error del backend para mostrarlo en pantalla.
// - mensaje: va arriba de la acción (alert alert-error)
// - errores: en los 400 de validación, { campo: mensaje } para <app-error-campo>
export function leerError(err: HttpErrorResponse): ErrorLeido {
  if (err.status === 0) {
    return { mensaje: 'No se pudo conectar con el servidor', errores: {} };
  }

  const cuerpo = typeof err.error === 'object' && err.error !== null ? (err.error as Partial<ApiError>) : null;

  return {
    mensaje: cuerpo?.mensaje ?? 'Ocurrió un error inesperado. Probá de nuevo.',
    errores: cuerpo?.errores ?? {},
  };
}