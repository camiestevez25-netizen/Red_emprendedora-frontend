import { Component, computed, input, output } from '@angular/core';

// Paginador reutilizable. Las páginas empiezan en 0, como en Spring.
// Si hay una sola página (o ninguna) no se muestra.
// Uso:
// <app-paginador [pagina]="pagina()" [totalPaginas]="totalPaginas()" (cambioPagina)="irAPagina($event)" />
@Component({
  selector: 'app-paginador',
  imports: [],
  templateUrl: './paginador.html',
  styleUrl: './paginador.css',
})
export class Paginador {
  readonly pagina = input.required<number>();
  readonly totalPaginas = input.required<number>();

  readonly cambioPagina = output<number>();

  // [0, 1, 2, ...] para dibujar un botón por página
  readonly paginas = computed(() => Array.from({ length: this.totalPaginas() }, (_, i) => i));

  ir(n: number): void {
    if (n >= 0 && n < this.totalPaginas() && n !== this.pagina()) {
      this.cambioPagina.emit(n);
    }
  }
}