import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Localidad } from '../models/localidad.model';

@Injectable({ providedIn: 'root' })
export class LocalidadService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/localidades`;

  // GET /api/localidades (público). Devuelve una lista, no una página
  listar(): Observable<Localidad[]> {
    return this.http.get<Localidad[]>(this.url);
  }

  // GET /api/localidades/{id} (público)
  obtener(id: number): Observable<Localidad> {
    return this.http.get<Localidad>(`${this.url}/${id}`);
  }

  // POST /api/localidades (ORGANIZADOR). Nombre y provincia: solo letras, máx. 50
  crear(localidad: Localidad): Observable<Localidad> {
    return this.http.post<Localidad>(this.url, localidad);
  }

  // PUT /api/localidades/{id} (ORGANIZADOR)
  actualizar(id: number, localidad: Localidad): Observable<Localidad> {
    return this.http.put<Localidad>(`${this.url}/${id}`, localidad);
  }

  // DELETE /api/localidades/{id} (ORGANIZADOR). Responde 204 sin contenido.
  // Si tiene usuarios o eventos asociados, el backend responde con error y su mensaje
  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}