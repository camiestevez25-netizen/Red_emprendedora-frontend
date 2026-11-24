import { HttpErrorResponse } from '@angular/common/http';
import { leerError } from './api-error.util';

describe('leerError', () => {
  it('sin respuesta (status 0) avisa que no hay conexión', () => {
    expect(leerError(new HttpErrorResponse({ status: 0 })).mensaje).toBe('No se pudo conectar con el servidor');
  });

  it('lee mensaje y errores del backend', () => {
    const err = new HttpErrorResponse({
      status: 400,
      error: { status: 400, mensaje: 'Hay campos con datos inválidos', errores: { email: 'El email es obligatorio' } },
    });
    expect(leerError(err)).toEqual({
      mensaje: 'Hay campos con datos inválidos',
      errores: { email: 'El email es obligatorio' },
    });
  });

  it('si no viene errores devuelve un objeto vacío', () => {
    const err = new HttpErrorResponse({ status: 401, error: { status: 401, mensaje: 'Email o contraseña incorrectos' } });
    expect(leerError(err).errores).toEqual({});
  });
});