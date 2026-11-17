import { Component, computed, input } from '@angular/core';

// Muestra el error de validación que el backend devuelve para un campo (400 con "errores"). Uso: <app-error-campo [errores]="errores()" campo="email" />"errores" es el { campo: mensaje } que entrega leerError(err). Si el campo no tiene error, no muestra nada.
@Component({
  selector: 'app-error-campo',
  imports: [],
  templateUrl: './error-campo.html',
  styleUrl: './error-campo.css',
})
export class ErrorCampo {
  readonly errores = input<Record<string, string>>({});
  readonly campo = input.required<string>();

  readonly mensaje = computed(() => this.errores()[this.campo()] ?? '');
}