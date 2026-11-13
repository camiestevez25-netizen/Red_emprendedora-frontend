import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginRequest, LoginResponse, Rol, Sesion } from '../models/auth.model';

const CLAVE_SESION = 'sesion';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/auth`;

  // Al iniciar la app se lee la sesión guardada (si está vencida, se borra)
  private readonly sesion = signal<Sesion | null>(this.leerSesionGuardada());

  readonly estaLogueado = computed(() => this.sesion() !== null);
  readonly usuarioActual = computed(() => {
    const s = this.sesion();
    return s ? { idUsuario: s.idUsuario, nombre: s.nombre, email: s.email } : null;
  });
  readonly roles = computed<Rol[]>(() => this.sesion()?.roles ?? []);
  readonly esEmprendedor = computed(() => this.roles().includes('EMPRENDEDOR'));
  readonly esOrganizador = computed(() => this.roles().includes('ORGANIZADOR'));

  // recordarme = true: localStorage (sigue logueada al cerrar el navegador, hasta que vence el token)
  // recordarme = false: sessionStorage (se borra al cerrar el navegador)
  login(credenciales: LoginRequest, recordarme: boolean): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.url}/login`, credenciales)
      .pipe(tap((respuesta) => this.guardarSesion(respuesta, recordarme)));
  }

  logout(): void {
    localStorage.removeItem(CLAVE_SESION);
    sessionStorage.removeItem(CLAVE_SESION);
    this.sesion.set(null);
  }

  // Lo usa jwt.interceptor. Si el token venció, cierra la sesión y devuelve null
  obtenerToken(): string | null {
    const s = this.sesion();
    if (!s) return null;
    if (Date.now() >= s.venceEn) {
      this.logout();
      return null;
    }
    return s.token;
  }

  tieneRol(rol: Rol): boolean {
    return this.roles().includes(rol);
  }

  private guardarSesion(r: LoginResponse, recordarme: boolean): void {
    const sesion: Sesion = {
      token: r.token,
      idUsuario: r.idUsuario,
      nombre: r.nombre,
      email: r.email,
      roles: r.roles ?? [],
      venceEn: Date.now() + r.expiraEnMs,
    };
    // Se limpia antes por si había una sesión vieja en el otro storage
    localStorage.removeItem(CLAVE_SESION);
    sessionStorage.removeItem(CLAVE_SESION);
    (recordarme ? localStorage : sessionStorage).setItem(CLAVE_SESION, JSON.stringify(sesion));
    this.sesion.set(sesion);
  }

  private leerSesionGuardada(): Sesion | null {
    const texto = localStorage.getItem(CLAVE_SESION) ?? sessionStorage.getItem(CLAVE_SESION);
    if (!texto) return null;
    try {
      const s = JSON.parse(texto) as Sesion;
      if (!s.token || Date.now() >= s.venceEn) {
        localStorage.removeItem(CLAVE_SESION);
        sessionStorage.removeItem(CLAVE_SESION);
        return null;
      }
      return s;
    } catch {
      localStorage.removeItem(CLAVE_SESION);
      sessionStorage.removeItem(CLAVE_SESION);
      return null;
    }
  }
}