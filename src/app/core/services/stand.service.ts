import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, forkJoin, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Page } from '../models/page.model';
import { Stand, StandFiltro, StandRequest } from '../models/stand.model';


export interface PaginacionStand {
  page?: number;
  size?: number;
  sort?: string;
}


export interface OcupacionStands {
  ocupados: number;
  total: number;
}

@Injectable({ providedIn: 'root' })
export class StandService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/stands`;

  
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

  // Ocupación de una feria: { ocupados, total }.
  // Pide dos páginas de 1 elemento y usa solo totalElements, así no baja todos los stands.
  ocupacion(idEvento: number): Observable<OcupacionStands> {
    const solo1 = { page: 0, size: 1 };
    return forkJoin({
      total: this.listar({ idEvento }, solo1),
      ocupados: this.listar({ idEvento, estadoStand: false }, solo1),
    }).pipe(
      map(({ total, ocupados }) => ({
        ocupados: ocupados.totalElements,
        total: total.totalElements,
      })),
    );
  }
}