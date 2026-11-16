import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Evento, EventoFiltro, EventoRequest, EventoUpdate } from '../models/evento.model';

@Injectable({ providedIn: 'root' })
export class EventoService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/eventos`;

  // GET /api/eventos?estado=&idLocalidad=&idUsuario= (público, lista sin paginar)
  listar(filtro: EventoFiltro = {}): Observable<Evento[]> {
    let params = new HttpParams();
    if (filtro.estado) params = params.set('estado', filtro.estado);
    if (filtro.idLocalidad != null) params = params.set('idLocalidad', filtro.idLocalidad);
    if (filtro.idUsuario != null) params = params.set('idUsuario', filtro.idUsuario);
    return this.http.get<Evento[]>(this.url, { params });
  }

  // GET /api/eventos/{id} (público)
  obtener(id: number): Observable<Evento> {
    return this.http.get<Evento>(`${this.url}/${id}`);
  }

  // POST /api/eventos (ORGANIZADOR). El organizador sale del token; el estado arranca en "Activo"
  crear(evento: EventoRequest): Observable<Evento> {
    return this.http.post<Evento>(this.url, evento);
  }

  // PUT /api/eventos/{id} (dueña). Solo cambia lo que se manda
  actualizar(id: number, cambios: EventoUpdate): Observable<Evento> {
    return this.http.put<Evento>(`${this.url}/${id}`, cambios);
  }

  // DELETE /api/eventos/{id} (dueña). Si tiene reservas pasa a "Cancelado"; si no, se borra.
  // Responde 200 con { mensaje } para mostrarle a la usuaria
  eliminar(id: number): Observable<{ mensaje: string }> {
    return this.http.delete<{ mensaje: string }>(`${this.url}/${id}`);
  }
}