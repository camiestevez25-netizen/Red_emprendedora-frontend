import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { StandService } from './stand.service';
import { Page } from '../models/page.model';
import { Stand } from '../models/stand.model';
import { environment } from '../../../environments/environment';

function pagina(totalElements: number): Page<Stand> {
  return {
    content: [],
    totalElements,
    totalPages: totalElements,
    number: 0,
    size: 1,
    first: true,
    empty: totalElements === 0,
  };
}

describe('StandService', () => {
  let service: StandService;
  let http: HttpTestingController;
  const url = `${environment.apiUrl}/stands`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(StandService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('listar manda solo los filtros y la paginación que se pasaron', () => {
    service
      .listar({ idEvento: 3, estadoStand: false }, { page: 1, size: 10, sort: 'numeroStand,asc' })
      .subscribe();

    const req = http.expectOne((r) => r.url === url);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('idEvento')).toBe('3');
    expect(req.request.params.get('estadoStand')).toBe('false');
    expect(req.request.params.get('page')).toBe('1');
    expect(req.request.params.get('size')).toBe('10');
    expect(req.request.params.get('sort')).toBe('numeroStand,asc');
    expect(req.request.params.has('idUsuario')).toBe(false);
    expect(req.request.params.has('nombreEvento')).toBe(false);
    req.flush(pagina(0));
  });

  it('listar sin filtros no agrega parámetros', () => {
    service.listar().subscribe();

    const req = http.expectOne((r) => r.url === url);
    expect(req.request.params.keys()).toEqual([]);
    req.flush(pagina(0));
  });

  it('obtener hace GET /stands/{id}', () => {
    service.obtener(5).subscribe();
    const req = http.expectOne(`${url}/5`);
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('crear hace POST con el cuerpo', () => {
    const cuerpo = { costoStand: 1500, numeroStand: 4, idEvento: 3 };
    service.crear(cuerpo).subscribe();
    const req = http.expectOne(url);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(cuerpo);
    req.flush({});
  });

  it('actualizar hace PUT /stands/{id} con el cuerpo', () => {
    const cuerpo = { costoStand: 2000, numeroStand: 4, idEvento: 3 };
    service.actualizar(9, cuerpo).subscribe();
    const req = http.expectOne(`${url}/9`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(cuerpo);
    req.flush({});
  });

  it('eliminar hace DELETE /stands/{id}', () => {
    service.eliminar(9).subscribe();
    const req = http.expectOne(`${url}/9`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('reservar hace PUT /stands/{id}/reservar con el idUsuario como parámetro', () => {
    service.reservar(7, 5).subscribe();
    const req = http.expectOne((r) => r.url === `${url}/7/reservar`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.params.get('idUsuario')).toBe('5');
    expect(req.request.body).toBeNull();
    req.flush({});
  });

  it('cancelarReserva hace PUT /stands/{id}/cancelar-reserva', () => {
    service.cancelarReserva(7).subscribe();
    const req = http.expectOne(`${url}/7/cancelar-reserva`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toBeNull();
    req.flush({});
  });

  it('contarOcupados hace GET /stands/evento/{id}/contar-ocupados y devuelve el número', () => {
    let resultado: number | undefined;
    service.contarOcupados(3).subscribe((n) => (resultado = n));
    const req = http.expectOne(`${url}/evento/3/contar-ocupados`);
    expect(req.request.method).toBe('GET');
    req.flush(12);
    expect(resultado).toBe(12);
  });

  it('ocupacion junta contar-ocupados con el totalElements de la feria', () => {
    let resultado: unknown;
    service.ocupacion(3).subscribe((o) => (resultado = o));

    const ocupados = http.expectOne(`${url}/evento/3/contar-ocupados`);
    const total = http.expectOne((r) => r.url === url);
    expect(total.request.params.get('idEvento')).toBe('3');
    expect(total.request.params.get('size')).toBe('1');

    ocupados.flush(12);
    total.flush(pagina(20));
    expect(resultado).toEqual({ ocupados: 12, total: 20 });
  });
});