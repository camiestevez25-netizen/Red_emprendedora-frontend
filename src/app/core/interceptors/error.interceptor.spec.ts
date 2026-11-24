import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from '../services/auth.service';
import { errorInterceptor } from './error.interceptor';
import { environment } from '../../../environments/environment';

describe('errorInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  let navegar: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
    navegar = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  });

  afterEach(() => {
    backend.verify();
    sessionStorage.clear();
  });

  function responder401(url: string): void {
    http.get(url).subscribe({ error: () => undefined });
    backend
      .expectOne(url)
      .flush({ mensaje: 'No autorizado' }, { status: 401, statusText: 'Unauthorized' });
  }

  it('sin sesión, un 401 no manda al login (pantallas públicas como Registro)', () => {
    responder401('/api/localidades');
    expect(navegar).not.toHaveBeenCalled();
  });

  it('con sesión, un 401 cierra la sesión y manda al login', () => {
    const auth = TestBed.inject(AuthService);
    auth.login({ email: 'ana@mail.com', contrasena: '123456' }, false).subscribe();
    backend.expectOne(`${environment.apiUrl}/auth/login`).flush({
      token: 't',
      tipo: 'Bearer',
      expiraEnMs: 60000,
      idUsuario: 1,
      nombre: 'Ana',
      email: 'ana@mail.com',
      roles: ['EMPRENDEDOR'],
    });

    responder401('/api/stands/1/reservar');

    expect(auth.estaLogueado()).toBe(false);
    expect(navegar).toHaveBeenCalled();
  });

  it('el 401 del login no redirige (la pantalla muestra el mensaje)', () => {
    responder401(`${environment.apiUrl}/auth/login`);
    expect(navegar).not.toHaveBeenCalled();
  });
});