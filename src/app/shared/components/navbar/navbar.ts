import { Component, ElementRef, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter, map } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';

// Barra de navegación. Usa las signals de AuthService.
// A la vista: logo, botón "Menú", y Iniciar sesión + Registrate (o el avatar si hay sesión).
// El resto de los enlaces está en el menú desplegable, según el rol:
//   Visitante:   Explorá ferias, ¿Cómo funciona?, Contacto
//   Emprendedor: Explorá ferias, Mis reservas, Mi perfil, Salir
//   Organizador: Panel, Mis ferias, Localidades, Mi perfil, Salir (+ Mis reservas si también es emprendedor)
@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
  host: {
    '(document:keydown.escape)': 'cerrarMenu()',
    '(document:click)': 'clickAfuera($event)',
  },
})
export class Navbar {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly elemento = inject(ElementRef);

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

  // Menú desplegable con el resto de los enlaces
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

  // Un clic fuera del navbar cierra el menú
  clickAfuera(evento: MouseEvent): void {
    if (!this.elemento.nativeElement.contains(evento.target)) this.cerrarMenu();
  }

  salir(): void {
    this.auth.logout();
    this.cerrarMenu();
    this.router.navigate(['/']);
  }
}