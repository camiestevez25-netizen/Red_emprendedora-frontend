import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginRequest } from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  login(cred: LoginRequest): Observable<unknown> {
    const basic = btoa(`${cred.email}:${cred.password}`);
    const headers = new HttpHeaders({ Authorization: `Basic ${basic}` });

    return this.http.get(`${environment.apiUrl}/usuarios`, { headers }).pipe(
      tap(() => localStorage.setItem('token', basic))
    );
  }

  logout(): void {
    localStorage.removeItem('token');
  }

  estaLogueado(): boolean {
    return !!localStorage.getItem('token');
  }
}