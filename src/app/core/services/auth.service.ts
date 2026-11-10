import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginRequest, LoginResponse } from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly authUrl = `${environment.apiUrl}/auth/login`;

  login(credenciales: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(this.authUrl, credenciales).pipe(
      tap((resp) => localStorage.setItem('token', resp.token))
    );
  }

  logout(): void {
    localStorage.removeItem('token');
  }

  estaLogueado(): boolean {
    return !!localStorage.getItem('token');
  }
}