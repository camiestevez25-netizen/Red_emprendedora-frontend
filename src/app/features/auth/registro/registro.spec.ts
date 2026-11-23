import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../../environments/environment';
import { Registro } from './registro';

describe('Registro', () => {
  let component: Registro;
  let fixture: ComponentFixture<Registro>;
  let http: HttpTestingController;
  const api = environment.apiUrl;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Registro],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(Registro);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    http
      .expectOne(`${api}/localidades`)
      .flush([{ idLocalidad: 1, nombreLocalidad: 'Rojas', provinciaLocalidad: 'Buenos Aires' }]);
  });

  afterEach(() => http.verify());

  function completarDatos(): void {
    component.datos = {
      nombre: ' Ana Pérez ',
      email: 'ana@mail.com',
      telefono: '2475123456',
      direccion: 'Calle 123',
      idLocalidad: 1,
      nombreEmprendimiento: 'Velas Ana',
      tipoEmprendimiento: 'Decoración',
      instagram: '',
      contrasena: '123456',
    };
  }

  it('carga las localidades', () => {
    expect(component.localidades().length).toBe(1);
  });

  it('arma los roles elegidos', () => {
    component.esOrganizador.set(true);
    expect(component.rolesElegidos()).toEqual(['EMPRENDEDOR', 'ORGANIZADOR']);
    component.esEmprendedor.set(false);
    component.esOrganizador.set(false);
    expect(component.rolesElegidos()).toEqual([]);
  });

  it('crea la cuenta, inicia sesión y va a explorar ferias', () => {
    const router = TestBed.inject(Router);
    const navegar = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    completarDatos();

    component.registrarse();

    const alta = http.expectOne(`${api}/usuarios`);
    expect(alta.request.body.nombre).toBe('Ana Pérez');
    expect(alta.request.body.roles).toEqual(['EMPRENDEDOR']);
    expect(alta.request.body.instagram).toBeUndefined();
    alta.flush({});

    http.expectOne(`${api}/auth/login`).flush({
      token: 't',
      tipo: 'Bearer',
      expiraEnMs: 60000,
      idUsuario: 1,
      nombre: 'Ana Pérez',
      email: 'ana@mail.com',
      roles: ['EMPRENDEDOR'],
    });
    expect(navegar).toHaveBeenCalledWith('/ferias');
  });

  it('no manda los datos del emprendimiento si solo es organizadora', () => {
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    completarDatos();
    component.esEmprendedor.set(false);
    component.esOrganizador.set(true);

    component.registrarse();

    const alta = http.expectOne(`${api}/usuarios`);
    expect(alta.request.body.nombreEmprendimiento).toBeUndefined();
    expect(alta.request.body.roles).toEqual(['ORGANIZADOR']);
    alta.flush({});
    // Si el login automático falla, la cuenta ya existe: va al login
    http.expectOne(`${api}/auth/login`).flush({}, { status: 500, statusText: 'Error' });
    expect(navegar).toHaveBeenCalledWith('/login');
  });

  it('muestra los errores del backend', () => {
    completarDatos();
    component.registrarse();

    http
      .expectOne(`${api}/usuarios`)
      .flush(
        { mensaje: 'Datos inválidos', errores: { email: 'El email ya está registrado' } },
        { status: 400, statusText: 'Bad Request' },
      );

    expect(component.mensajeError()).toBe('Datos inválidos');
    expect(component.errores()['email']).toBe('El email ya está registrado');
    expect(component.cargando()).toBe(false);
  });
});