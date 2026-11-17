import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

// Pantalla 15: adonde manda rolGuard cuando la usuaria no tiene el rol necesario
@Component({
  imports: [RouterLink],
  selector: 'app-sin-permisos',
  styleUrl: './sin-permisos.css',
  templateUrl: './sin-permisos.html',
})
export class SinPermisos {}