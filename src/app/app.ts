import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { Navbar } from './shared/components/navbar/navbar';
import { Footer } from './shared/components/footer/footer';

// Pantallas de acceso: no muestran el navbar (como en el diseño)
const RUTAS_SIN_NAVBAR = ['/login', '/registro'];

@Component({
  imports: [RouterOutlet, Navbar, Footer],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  private readonly router = inject(Router);

  readonly ocultarNavbar = toSignal(
    this.router.events.pipe(
      filter((evento) => evento instanceof NavigationEnd),
      map((evento) => esRutaSinNavbar(evento.urlAfterRedirects)),
    ),
    { initialValue: esRutaSinNavbar(this.router.url) },
  );
}

// Compara solo el camino, sin "?volver=..." ni "#..."
function esRutaSinNavbar(url: string): boolean {
  const camino = url.split(/[?#]/)[0];
  return RUTAS_SIN_NAVBAR.includes(camino);
}