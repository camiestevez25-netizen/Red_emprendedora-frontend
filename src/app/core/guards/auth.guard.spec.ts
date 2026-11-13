import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('authGuard', () => {
  function ejecutar(logueada: boolean) {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: { estaLogueado: () => logueada } }],
    });
    const resultado = TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, { url: '/mis-reservas' } as RouterStateSnapshot),
    );
    return resultado instanceof UrlTree ? TestBed.inject(Router).serializeUrl(resultado) : resultado;
  }

  it('sin sesión va a /login con volver', () => {
    expect(ejecutar(false)).toBe('/login?volver=%2Fmis-reservas');
  });

  it('con sesión entra', () => {
    expect(ejecutar(true)).toBe(true);
  });
});