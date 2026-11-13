// POST /api/auth/login
export type Rol = 'EMPRENDEDOR' | 'ORGANIZADOR';

export interface LoginRequest {
  email: string;
  contrasena: string;
}

export interface LoginResponse {
  token: string;
  tipo: string; // "Bearer"
  expiraEnMs: number;
  idUsuario: number;
  nombre: string;
  email: string;
  roles: Rol[];
}

// Lo que guarda AuthService en localStorage o sessionStorage (nunca la contraseña)
export interface Sesion {
  token: string;
  idUsuario: number;
  nombre: string;
  email: string;
  roles: Rol[];
  venceEn: number; // timestamp en ms (Date.now() + expiraEnMs)
}