import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { LoginRequest } from '../../../core/models/auth.model';
import { leerError } from '../../../core/utils/api-error.util';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  credenciales: LoginRequest = { email: '', contrasena: '' };
  recordarme = false;
  verContrasena = signal(false);

  cargando = signal(false);
  mensajeError = signal('');

  iniciarSesion(): void {
    this.mensajeError.set('');
    this.cargando.set(true);

    const datos: LoginRequest = {
      email: this.credenciales.email.trim(),
      contrasena: this.credenciales.contrasena,
    };

    this.auth.login(datos, this.recordarme).subscribe({
      next: () => {
        this.cargando.set(false);
        this.router.navigateByUrl(this.urlDeVuelta());
      },
      error: (err: HttpErrorResponse) => {
        this.cargando.set(false);
        // Muestra el mensaje del backend (ej. "Email o contraseña incorrectos")
        this.mensajeError.set(leerError(err).mensaje);
      },
    });
  }

  // Solo se acepta una ruta interna (empieza con "/" y no con "//")
  private urlDeVuelta(): string {
    const volver = this.route.snapshot.queryParamMap.get('volver');
    return volver && volver.startsWith('/') && !volver.startsWith('//') ? volver : '/';
  }
}