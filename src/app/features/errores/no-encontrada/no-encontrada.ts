import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

// Pantalla 14: cualquier ruta que no existe (path '**')
@Component({
  imports: [RouterLink],
  selector: 'app-no-encontrada',
  styleUrl: './no-encontrada.css',
  templateUrl: './no-encontrada.html',
})
export class NoEncontrada {}