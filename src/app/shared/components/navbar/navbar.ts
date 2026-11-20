import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter, map } from 'rxjs';
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

  // URL actual (se actualiza en cada navegación)
  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  // En Inicio el navbar se dibuja como toldo de comercio.
  // Para usarlo en todas las pantallas, cambiar esta línea por: readonly esToldo = signal(true);
  readonly esToldo = computed(() => this.url().split(/[?#]/)[0] === '/');

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