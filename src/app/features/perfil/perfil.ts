import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { UsuarioService } from '../../core/services/usuario.service';
import { LocalidadService } from '../../core/services/localidad.service';
import { Rol } from '../../core/models/auth.model';
import { Localidad } from '../../core/models/localidad.model';
import { UsuarioRequest, UsuarioResponse } from '../../core/models/usuario.model';
import { leerError } from '../../core/utils/api-error.util';
import { ErrorCampo } from '../../shared/components/error-campo/error-campo';
import { TIPOS_EMPRENDIMIENTOS } from '../../shared/utils/tipos-emprendimientos';

@Component({
  selector: 'app-perfil',
  imports: [FormsModule, RouterLink, ErrorCampo],
  templateUrl: './perfil.html',
  styleUrl: './perfil.css',
})
export class Perfil implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly usuarioService = inject(UsuarioService);
  private readonly localidadService = inject(LocalidadService);
  private readonly router = inject(Router);

  readonly tiposEmprendimiento = TIPOS_EMPRENDIMIENTOS;

  datos = {
    nombre: '',
    email: '',
    telefono: '',
    direccion: '',
    idLocalidad: null as number | null,
    nombreEmprendimiento: '',
    tipoEmprendimiento: '',
    instagram: '',
    contrasena: '', // vacía = no se cambia
  };

  esEmprendedor = signal(false);
  esOrganizador = signal(false);

  localidades = signal<Localidad[]>([]);
  cargando = signal(true);
  guardando = signal(false);
  mensajeError = signal('');
  mensajeExito = signal('');
  errores = signal<Record<string, string>>({});
  // Si cambió los roles, el menú se actualiza recién al volver a iniciar sesión
  cambiaronRoles = signal(false);

  readonly iniciales = computed(() => {
    const nombre = this.auth.usuarioActual()?.nombre ?? '';
    return nombre
      .split(' ')
      .filter((parte) => parte)
      .slice(0, 2)
      .map((parte) => parte[0].toUpperCase())
      .join('');
  });

  ngOnInit(): void {
    const usuario = this.auth.usuarioActual();
    if (!usuario) return;

    this.localidadService.listar().subscribe({
      next: (lista) => this.localidades.set(lista),
    });

    this.usuarioService.obtener(usuario.idUsuario).subscribe({
      next: (u) => {
        this.cargarDatos(u);
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.cargando.set(false);
        this.mensajeError.set(leerError(err).mensaje);
      },
    });
  }

  rolesElegidos(): Rol[] {
    const roles: Rol[] = [];
    if (this.esEmprendedor()) roles.push('EMPRENDEDOR');
    if (this.esOrganizador()) roles.push('ORGANIZADOR');
    return roles;
  }

  guardar(): void {
    const usuario = this.auth.usuarioActual();
    if (!usuario || this.rolesElegidos().length === 0) return;

    this.mensajeError.set('');
    this.mensajeExito.set('');
    this.errores.set({});
    this.guardando.set(true);

    const cambios: UsuarioRequest = {
      nombre: this.datos.nombre.trim(),
      email: this.datos.email.trim(),
      telefono: this.datos.telefono.trim(),
      direccion: this.datos.direccion.trim(),
      roles: this.rolesElegidos(),
      idLocalidad: Number(this.datos.idLocalidad),
      nombreEmprendimiento: this.textoOpcional(this.datos.nombreEmprendimiento),
      tipoEmprendimiento: this.textoOpcional(this.datos.tipoEmprendimiento),
      instagram: this.textoOpcional(this.datos.instagram),
      // El backend rechaza una contraseña vacía: si no la cambia, no se manda
      contrasena: this.datos.contrasena ? this.datos.contrasena : undefined,
    };

    this.usuarioService.actualizar(usuario.idUsuario, cambios).subscribe({
      next: (u) => {
        this.guardando.set(false);
        // Se compara con los roles de la sesión (los del token)
        this.cambiaronRoles.set(
          [...u.roles].sort().join() !== [...this.auth.roles()].sort().join(),
        );
        this.cargarDatos(u);
        this.mensajeExito.set('Guardamos tus cambios.');
      },
      error: (err: HttpErrorResponse) => {
        this.guardando.set(false);
        const { mensaje, errores } = leerError(err);
        this.mensajeError.set(mensaje);
        this.errores.set(errores);
      },
    });
  }

  volverAEntrar(): void {
    this.auth.logout();
    this.router.navigate(['/login'], { queryParams: { volver: '/perfil' } });
  }

  private cargarDatos(u: UsuarioResponse): void {
    this.datos = {
      nombre: u.nombre,
      email: u.email,
      telefono: u.telefono,
      direccion: u.direccion,
      idLocalidad: u.idLocalidad,
      nombreEmprendimiento: u.nombreEmprendimiento ?? '',
      tipoEmprendimiento: u.tipoEmprendimiento ?? '',
      instagram: u.instagram ?? '',
      contrasena: '',
    };
    this.esEmprendedor.set(u.roles.includes('EMPRENDEDOR'));
    this.esOrganizador.set(u.roles.includes('ORGANIZADOR'));
  }

  private textoOpcional(texto: string): string | undefined {
    const limpio = texto.trim();
    return limpio ? limpio : undefined;
  }
}