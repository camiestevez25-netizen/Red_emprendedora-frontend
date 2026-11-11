import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { LoginRequest } from '../../../core/models/auth.model';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  private readonly auth = inject(AuthService);

  credenciales: LoginRequest = { email: '', password: '' };
  mensajeError = signal('');
  mensajeOk = signal('');

  iniciarSesion(): void {
    this.mensajeError.set('');
    this.mensajeOk.set('');
    this.auth.login(this.credenciales).subscribe({
      next: () => this.mensajeOk.set('¡Login correcto!'),
      error: () => this.mensajeError.set('Email o contraseña incorrectos, o el backend está apagado.')
    });
  }
}