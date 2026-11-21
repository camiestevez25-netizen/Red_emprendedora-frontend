import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { UsuarioService } from '../../../core/services/usuario.service';
import { LocalidadService } from '../../../core/services/localidad.service';
import { Rol } from '../../../core/models/auth.model';
import { Localidad } from '../../../core/models/localidad.model';
import { UsuarioRequest } from '../../../core/models/usuario.model';
import { leerError } from '../../../core/utils/api-error.util';
import { ErrorCampo } from '../../../shared/components/error-campo/error-campo';
import { TIPOS_EMPRENDIMIENTOS } from '../../../shared/utils/tipos-emprendimientos';

@Component({
  selector: 'app-registro',
  imports: [FormsModule, RouterLink, ErrorCampo],
  templateUrl: './registro.html',
  styleUrl: './registro.css',
})
export class Registro implements OnInit {
  private readonly usuarioService = inject(UsuarioService);
  private readonly localidadService = inject(LocalidadService);
  private readonly auth = inject(AuthService);
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
    contrasena: '',
  };

  // Un usuario puede ser emprendedor, organizador o las dos cosas
  esEmprendedor = signal(true);
  esOrganizador = signal(false);

  localidades = signal<Localidad[]>([]);
  verContrasena = signal(false);
  cargando = signal(false);
  mensajeError = signal('');
  errores = signal<Record<string, string>>({});

  ngOnInit(): void {
    this.localidadService.listar().subscribe({
      next: (lista) => this.localidades.set(lista),
      error: (err: HttpErrorResponse) => this.mensajeError.set(leerError(err).mensaje),
    });
  }

  rolesElegidos(): Rol[] {
    const roles: Rol[] = [];
    if (this.esEmprendedor()) roles.push('EMPRENDEDOR');
    if (this.esOrganizador()) roles.push('ORGANIZADOR');
    return roles;
  }

  registrarse(): void {
    if (this.rolesElegidos().length === 0) return;

    this.mensajeError.set('');
    this.errores.set({});
    this.cargando.set(true);

    const usuario: UsuarioRequest = {
      nombre: this.datos.nombre.trim(),
      email: this.datos.email.trim(),
      telefono: this.datos.telefono.trim(),
      direccion: this.datos.direccion.trim(),
      contrasena: this.datos.contrasena,
      roles: this.rolesElegidos(),
      idLocalidad: Number(this.datos.idLocalidad),
      // Los datos del emprendimiento solo se mandan si es emprendedora
      nombreEmprendimiento: this.esEmprendedor()
        ? this.textoOpcional(this.datos.nombreEmprendimiento)
        : undefined,
      tipoEmprendimiento: this.esEmprendedor()
        ? this.textoOpcional(this.datos.tipoEmprendimiento)
        : undefined,
      instagram: this.esEmprendedor() ? this.textoOpcional(this.datos.instagram) : undefined,
    };

    this.usuarioService.crear(usuario).subscribe({
      next: () => this.entrarDespuesDeRegistrarse(usuario),
      error: (err: HttpErrorResponse) => {
        this.cargando.set(false);
        const { mensaje, errores } = leerError(err);
        this.mensajeError.set(mensaje);
        this.errores.set(errores);
      },
    });
  }

  // Después de crear la cuenta se inicia sesión sola, así no tiene que volver a escribir todo
  private entrarDespuesDeRegistrarse(usuario: UsuarioRequest): void {
    this.auth
      .login({ email: usuario.email, contrasena: usuario.contrasena ?? '' }, false)
      .subscribe({
        next: () => {
          this.cargando.set(false);
          this.router.navigateByUrl(this.esOrganizador() ? '/organizador' : '/ferias');
        },
        error: () => {
          // La cuenta se creó igual: la mandamos al login
          this.cargando.set(false);
          this.router.navigateByUrl('/login');
        },
      });
  }

  private textoOpcional(texto: string): string | undefined {
    const limpio = texto.trim();
    return limpio ? limpio : undefined;
  }
}