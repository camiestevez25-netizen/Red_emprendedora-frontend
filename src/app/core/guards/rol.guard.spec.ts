import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { rolGuard } from './rol.guard';
import { AuthService } from '../services/auth.service';

describe('rolGuard', () => {
  const ruta = { data: { roles: ['ORGANIZADOR'] } } as unknown as ActivatedRouteSnapshot;
  const estado = { url: '/organizador' } as RouterStateSnapshot;

  function ejecutar(logueada: boolean, organizadora: boolean) {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        {
          provide: AuthService,
          useValue: { estaLogueado: () => logueada, tieneRol: () => organizadora },
        },
      ],
    });
    const resultado = TestBed.runInInjectionContext(() => rolGuard(ruta, estado));
    const router = TestBed.inject(Router);
    return resultado instanceof UrlTree ? router.serializeUrl(resultado) : resultado;
  }

  it('sin sesión va a /login con volver', () => {
    expect(ejecutar(false, false)).toBe('/login?volver=%2Forganizador');
  });

  it('logueada sin el rol va a /sin-permisos', () => {
    expect(ejecutar(true, false)).toBe('/sin-permisos');
  });

  it('logueada con el rol entra', () => {
    expect(ejecutar(true, true)).toBe(true);
  });
});