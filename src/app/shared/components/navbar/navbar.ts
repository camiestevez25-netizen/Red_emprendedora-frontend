import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

// Barra de navegación según el rol (pantalla 16 del diseño). Usa las signals de AuthService.
// Visitante:   Explorá ferias, ¿Cómo funciona?, Contacto, Iniciar sesión, Registrate
// Emprendedor: Explorá ferias, Mis reservas, avatar (Perfil), Salir
// Organizador: Panel, Mis ferias, Localidades, avatar (Perfil), Salir
//              (+ Mis reservas si también es emprendedor)
@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  // Menú desplegable en celular
  readonly menuAbierto = signal(false);

  // "Lourdes Melo" -> "LM" (para el avatar)
  readonly iniciales = computed(() => {
    const nombre = this.auth.usuarioActual()?.nombre ?? '';
    return nombre
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((parte) => parte.charAt(0).toUpperCase())
      .join('');
  });

  alternarMenu(): void {
    this.menuAbierto.update((abierto) => !abierto);
  }

  cerrarMenu(): void {
    this.menuAbierto.set(false);
  }

  salir(): void {
    this.auth.logout();
    this.cerrarMenu();
    this.router.navigate(['/']);
  }
}