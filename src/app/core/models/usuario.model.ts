import { Rol } from './auth.model';

// POST /api/usuarios y PUT /api/usuarios/{id}
export interface UsuarioRequest {
  nombre: string; // máx. 50
  email: string; // máx. 50
  telefono: string; // máx. 15
  direccion: string; // máx. 50
  contrasena?: string; // 6 a 50. En el PUT es opcional
  nombreEmprendimiento?: string; // máx. 100
  tipoEmprendimiento?: string; // máx. 100
  instagram?: string; // máx. 100
  roles: Rol[]; // al menos uno
  idLocalidad: number;
}

export interface UsuarioResponse {
  idUsuario: number;
  nombre: string;
  email: string;
  telefono: string;
  direccion: string;
  nombreEmprendimiento: string | null;
  tipoEmprendimiento: string | null;
  instagram: string | null;
  roles: Rol[];
  idLocalidad: number;
  nombreLocalidad: string;
}