import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { LoginResponse } from '../models/auth.model';
import { environment } from '../../../environments/environment';

const respuesta: LoginResponse = {
  token: 'abc.def.ghi',
  tipo: 'Bearer',
  expiraEnMs: 60_000,
  idUsuario: 7,
  nombre: 'Canu',
  email: 'canu@mail.com',
  roles: ['EMPRENDEDOR', 'ORGANIZADOR'],
};

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  function crear() {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  }

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('login hace POST con email y contrasena y guarda la sesión', () => {
    crear();
    service.login({ email: 'canu@mail.com', contrasena: '123456' }, false).subscribe();

    const req = http.expectOne(`${environment.apiUrl}/auth/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'canu@mail.com', contrasena: '123456' });
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush(respuesta);

    expect(service.estaLogueado()).toBe(true);
    expect(service.obtenerToken()).toBe('abc.def.ghi');
    expect(service.esEmprendedor()).toBe(true);
    expect(service.esOrganizador()).toBe(true);
    expect(service.usuarioActual()?.idUsuario).toBe(7);
    http.verify();
  });

  it('sin Recordarme usa sessionStorage; con Recordarme usa localStorage', () => {
    crear();
    service.login({ email: 'a@a.com', contrasena: 'x' }, false).subscribe();
    http.expectOne(`${environment.apiUrl}/auth/login`).flush(respuesta);
    expect(sessionStorage.getItem('sesion')).not.toBeNull();
    expect(localStorage.getItem('sesion')).toBeNull();

    service.login({ email: 'a@a.com', contrasena: 'x' }, true).subscribe();
    http.expectOne(`${environment.apiUrl}/auth/login`).flush(respuesta);
    expect(localStorage.getItem('sesion')).not.toBeNull();
    expect(sessionStorage.getItem('sesion')).toBeNull();
  });

  it('nunca guarda la contraseña', () => {
    crear();
    service.login({ email: 'a@a.com', contrasena: 'secreta123' }, true).subscribe();
    http.expectOne(`${environment.apiUrl}/auth/login`).flush(respuesta);
    expect(localStorage.getItem('sesion')).not.toContain('secreta123');
  });

  it('logout limpia los dos storages', () => {
    crear();
    service.login({ email: 'a@a.com', contrasena: 'x' }, true).subscribe();
    http.expectOne(`${environment.apiUrl}/auth/login`).flush(respuesta);
    service.logout();
    expect(service.estaLogueado()).toBe(false);
    expect(localStorage.getItem('sesion')).toBeNull();
    expect(sessionStorage.getItem('sesion')).toBeNull();
  });

  it('al iniciar con un token vencido cierra la sesión', () => {
    localStorage.setItem(
      'sesion',
      JSON.stringify({ token: 'viejo', idUsuario: 1, nombre: 'x', email: 'x', roles: [], venceEn: Date.now() - 1 }),
    );
    crear();
    expect(service.estaLogueado()).toBe(false);
    expect(service.obtenerToken()).toBeNull();
    expect(localStorage.getItem('sesion')).toBeNull();
  });
});