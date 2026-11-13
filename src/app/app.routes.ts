import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { rolGuard } from './core/guards/rol.guard';

// Lou
import { Inicio } from './features/inicio/inicio';
import { MisFerias } from './features/organizador/mis-ferias/mis-ferias';
import { Localidades } from './features/organizador/localidades/localidades';
import { NoEncontrada } from './features/errores/no-encontrada/no-encontrada';
import { SinPermisos } from './features/errores/sin-permisos/sin-permisos';
// Canu
import { Login } from './features/auth/login/login';
import { Registro } from './features/auth/registro/registro';
import { Perfil } from './features/perfil/perfil';
// Agus
import { Explorar } from './features/ferias/explorar/explorar';
import { Panel } from './features/organizador/panel/panel';
import { FeriaForm } from './features/organizador/feria-form/feria-form';
// Cami
import { Detalle } from './features/ferias/detalle/detalle';
import { MisReservas } from './features/reservas/mis-reservas/mis-reservas';
import { GestionStands } from './features/organizador/gestion-stands/gestion-stands';

const soloOrganizador = { canActivate: [rolGuard], data: { roles: ['ORGANIZADOR'] } };

export const routes: Routes = [
  // Públicas
  { path: '', component: Inicio, title: 'Red Emprendedora' },
  { path: 'login', component: Login, title: 'Iniciar sesión · Red Emprendedora' },
  { path: 'registro', component: Registro, title: 'Crear cuenta · Red Emprendedora' },
  { path: 'ferias', component: Explorar, title: 'Explorá ferias · Red Emprendedora' },
  // Detalle y reserva: reservar sin sesión lleva a /login?volver=...
  { path: 'ferias/:id', component: Detalle, title: 'Feria · Red Emprendedora' },

  // Con sesión (cualquier rol)
  { path: 'mis-reservas', component: MisReservas, canActivate: [authGuard], title: 'Mis reservas · Red Emprendedora' },
  { path: 'perfil', component: Perfil, canActivate: [authGuard], title: 'Mi perfil · Red Emprendedora' },

  // Solo ORGANIZADOR
  { path: 'organizador', component: Panel, ...soloOrganizador, title: 'Panel · Red Emprendedora' },
  { path: 'organizador/ferias', component: MisFerias, ...soloOrganizador, title: 'Mis ferias · Red Emprendedora' },
  { path: 'organizador/ferias/nueva', component: FeriaForm, ...soloOrganizador, title: 'Crear feria · Red Emprendedora' },
  { path: 'organizador/ferias/:id/editar', component: FeriaForm, ...soloOrganizador, title: 'Editar feria · Red Emprendedora' },
  { path: 'organizador/ferias/:id/stands', component: GestionStands, ...soloOrganizador, title: 'Gestión de stands · Red Emprendedora' },
  { path: 'organizador/localidades', component: Localidades, ...soloOrganizador, title: 'Localidades · Red Emprendedora' },

  // Errores
  { path: 'sin-permisos', component: SinPermisos, title: 'Sin permisos · Red Emprendedora' },
  { path: '**', component: NoEncontrada, title: 'Página no encontrada · Red Emprendedora' },
];