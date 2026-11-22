import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth.service';
import { UsuarioResponse } from '../../core/models/usuario.model';
import { Perfil } from './perfil';

describe('Perfil', () => {
  let component: Perfil;
  let fixture: ComponentFixture<Perfil>;
  let http: HttpTestingController;
  const api = environment.apiUrl;

  const ana: UsuarioResponse = {
    idUsuario: 1,
    nombre: 'Ana Pérez',
    email: 'ana@mail.com',
    telefono: '2475123456',
    direccion: 'Calle 123',
    nombreEmprendimiento: 'Velas Ana',
    tipoEmprendimiento: 'Decoración',
    instagram: null,
    roles: ['EMPRENDEDOR'],
    idLocalidad: 1,
    nombreLocalidad: 'Rojas',
  };

  beforeEach(async () => {
    sessionStorage.clear();
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Perfil],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);

    // Sesión iniciada como emprendedora
    TestBed.inject(AuthService)
      .login({ email: 'ana@mail.com', contrasena: '123456' }, false)
      .subscribe();
    http.expectOne(`${api}/auth/login`).flush({
      token: 't',
      tipo: 'Bearer',
      expiraEnMs: 60000,
      idUsuario: 1,
      nombre: 'Ana Pérez',
      email: 'ana@mail.com',
      roles: ['EMPRENDEDOR'],
    });

    fixture = TestBed.createComponent(Perfil);
    component = fixture.componentInstance;
    fixture.detectChanges();
    http.expectOne(`${api}/localidades`).flush([]);
    http.expectOne(`${api}/usuarios/1`).flush(ana);
  });

  afterEach(() => {
    http.verify();
    sessionStorage.clear();
  });

  it('carga los datos del usuario', () => {
    expect(component.cargando()).toBe(false);
    expect(component.datos.nombre).toBe('Ana Pérez');
    expect(component.esEmprendedor()).toBe(true);
    expect(component.esOrganizador()).toBe(false);
    expect(component.iniciales()).toBe('AP');
  });

  it('guarda sin mandar la contraseña si está vacía', () => {
    component.datos.telefono = '2475999999';
    component.guardar();

    const req = http.expectOne(`${api}/usuarios/1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body.contrasena).toBeUndefined();
    expect(req.request.body.telefono).toBe('2475999999');
    req.flush({ ...ana, telefono: '2475999999' });

    expect(component.mensajeExito()).toBe('Guardamos tus cambios.');
    expect(component.cambiaronRoles()).toBe(false);
  });

  it('avisa que hay que volver a entrar si suma un rol', () => {
    component.esOrganizador.set(true);
    component.guardar();

    const req = http.expectOne(`${api}/usuarios/1`);
    expect(req.request.body.roles).toEqual(['EMPRENDEDOR', 'ORGANIZADOR']);
    req.flush({ ...ana, roles: ['EMPRENDEDOR', 'ORGANIZADOR'] });

    expect(component.cambiaronRoles()).toBe(true);
  });

  it('muestra el error del backend', () => {
    component.guardar();
    http
      .expectOne(`${api}/usuarios/1`)
      .flush({ mensaje: 'No tenés permiso' }, { status: 403, statusText: 'Forbidden' });
    expect(component.mensajeError()).toBe('No tenés permiso');
  });
});