import { Component, computed, input } from '@angular/core';

export type Estado = 'Activo' | 'Agotado' | 'Cancelado' | 'Disponible' | 'Ocupado';

// Uso: <app-badge-estado [estado]="evento.estado" />
//      <app-badge-estado [estado]="stand.estadoStandTexto" />
@Component({
  selector: 'app-badge-estado',
  imports: [],
  templateUrl: './badge-estado.html',
  styleUrl: './badge-estado.css',
})
export class BadgeEstado {
  readonly estado = input.required<Estado>();

  // "Agotado" -> "badge badge-agotado" (las clases están en styles.css)
  readonly clase = computed(() => `badge badge-${this.estado().toLowerCase()}`);
}