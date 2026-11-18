import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, forkJoin, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Page } from '../models/page.model';
import { Stand, StandFiltro, StandRequest } from '../models/stand.model';

// Paginación de GET /api/stands (page empieza en 0). sort: "numeroStand,asc"
export interface PaginacionStand {
  page?: number;
  size?: number;
  sort?: string;
}

// Cuántos stands de una feria están ocupados y cuántos hay en total
export interface OcupacionStands {
  ocupados: number;
  total: number;
}

@Injectable({ providedIn: 'root' })
export class StandService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/stands`;

  // GET /api/stands?idEvento=&estadoStand=&numeroStand=&nombreEvento=&idUsuario=&page=&size=&sort=
  // Devuelve un Page<Stand> de Spring (usar content, totalElements, totalPages…)
  listar(filtro: StandFiltro = {}, paginacion: PaginacionStand = {}): Observable<Page<Stand>> {
    let params = new HttpParams();
    if (filtro.idEvento != null) params = params.set('idEvento', filtro.idEvento);
    if (filtro.estadoStand != null) params = params.set('estadoStand', filtro.estadoStand);
    if (filtro.numeroStand != null) params = params.set('numeroStand', filtro.numeroStand);
    if (filtro.nombreEvento) params = params.set('nombreEvento', filtro.nombreEvento);
    if (filtro.idUsuario != null) params = params.set('idUsuario', filtro.idUsuario);
    if (paginacion.page != null) params = params.set('page', paginacion.page);
    if (paginacion.size != null) params = params.set('size', paginacion.size);
    if (paginacion.sort) params = params.set('sort', paginacion.sort);
    return this.http.get<Page<Stand>>(this.url, { params });
  }

  // GET /api/stands/{id}
  obtener(id: number): Observable<Stand> {
    return this.http.get<Stand>(`${this.url}/${id}`);
  }

  // POST /api/stands (ORGANIZADOR)
  crear(stand: StandRequest): Observable<Stand> {
    return this.http.post<Stand>(this.url, stand);
  }

  // PUT /api/stands/{id}
  actualizar(id: number, stand: StandRequest): Observable<Stand> {
    return this.http.put<Stand>(`${this.url}/${id}`, stand);
  }

  // DELETE /api/stands/{id}. Responde 204 sin cuerpo
  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }

  // PUT /api/stands/{id}/reservar?idUsuario=. El backend pide el idUsuario como parámetro
  // (sale de AuthService.usuarioActual().idUsuario). Devuelve el stand ya reservado
  reservar(id: number, idUsuario: number): Observable<Stand> {
    const params = new HttpParams().set('idUsuario', idUsuario);
    return this.http.put<Stand>(`${this.url}/${id}/reservar`, null, { params });
  }

  // PUT /api/stands/{id}/cancelar-reserva. Devuelve el stand ya liberado
  cancelarReserva(id: number): Observable<Stand> {
    return this.http.put<Stand>(`${this.url}/${id}/cancelar-reserva`, null);
  }

  // GET /api/stands/evento/{idEvento}/contar-ocupados. Responde un número suelto
  contarOcupados(idEvento: number): Observable<number> {
    return this.http.get<number>(`${this.url}/evento/${idEvento}/contar-ocupados`);
  }

  // Ocupación de una feria: { ocupados, total }.
  // ocupados sale de contar-ocupados; total es el totalElements de GET /stands?idEvento=&size=1
  ocupacion(idEvento: number): Observable<OcupacionStands> {
    return forkJoin({
      ocupados: this.contarOcupados(idEvento),
      total: this.listar({ idEvento }, { page: 0, size: 1 }).pipe(map((p) => p.totalElements)),
    });
  }
}