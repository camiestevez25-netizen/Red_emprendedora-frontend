import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

// Pie de página (pantalla 1 del diseño): logo, redes y contacto.
// Tiene el ancla #contacto que usa el navbar.
@Component({
  selector: 'app-footer',
  imports: [RouterLink],
  templateUrl: './footer.html',
  styleUrl: './footer.css',
})
export class Footer {}