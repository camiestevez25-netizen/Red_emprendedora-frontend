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

  it('ocupacion devuelve ocupados y total de la feria usando totalElements', () => {
    let resultado: unknown;
    service.ocupacion(3).subscribe((o) => (resultado = o));

    const pedidos = http.match((r) => r.url === url);
    expect(pedidos.length).toBe(2);

    const total = pedidos.find((p) => !p.request.params.has('estadoStand'))!;
    const ocupados = pedidos.find((p) => p.request.params.get('estadoStand') === 'false')!;
    expect(total.request.params.get('idEvento')).toBe('3');
    expect(ocupados.request.params.get('idEvento')).toBe('3');
    expect(total.request.params.get('size')).toBe('1');

    total.flush(pagina(20));
    ocupados.flush(pagina(12));
    expect(resultado).toEqual({ ocupados: 12, total: 20 });
  });
});