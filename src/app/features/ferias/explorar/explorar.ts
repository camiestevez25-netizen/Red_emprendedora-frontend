import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { EventoService } from '../../../core/services/evento.service';
import { EstadoEvento, Evento, EventoFiltro } from '../../../core/models/evento.model';
import { leerError } from '../../../core/utils/api-error.util';
import { TarjetaFeria } from '../../../shared/components/tarjeta-feria/tarjeta-feria';

@Component({
  selector: 'app-explorar',
  imports: [FormsModule, TarjetaFeria],
  templateUrl: './explorar.html',
  styleUrl: './explorar.css',
})
export class Explorar {
  private readonly eventoService = inject(EventoService);

  readonly estados: EstadoEvento[] = ['Activo', 'Agotado', 'Cancelado'];

  readonly eventos = signal<Evento[]>([]);
  readonly estado = signal<EstadoEvento | ''>(''); // '' = todos los estados
  readonly busqueda = signal('');
  readonly cargando = signal(true);
  readonly mensajeError = signal('');

  // Búsqueda por nombre (en el front) y orden por fecha de inicio
  readonly filtradas = computed(() => {
    const texto = normalizar(this.busqueda());
    return this.eventos()
      .filter((e) => !texto || normalizar(e.nombre).includes(texto))
      .sort((a, b) => a.fechaInicio.localeCompare(b.fechaInicio));
  });

  // Hay algún filtro puesto (para mostrar "Limpiar filtros")
  readonly hayFiltros = computed(() => this.estado() !== '' || this.busqueda().trim() !== '');

  constructor() {
    this.cargar();
  }

  cambiarEstado(estado: EstadoEvento | ''): void {
    this.estado.set(estado);
    this.cargar();
  }

  limpiarFiltros(): void {
    this.busqueda.set('');
    if (this.estado() !== '') this.cambiarEstado('');
  }

  // GET /api/eventos con los filtros del backend (estado; después también localidad)
  cargar(): void {
    this.cargando.set(true);
    this.mensajeError.set('');

    const filtro: EventoFiltro = {};
    const estado = this.estado();
    if (estado) filtro.estado = estado;

    this.eventoService.listar(filtro).subscribe({
      next: (lista) => {
        this.eventos.set(lista);
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.eventos.set([]);
        this.cargando.set(false);
        this.mensajeError.set(leerError(err).mensaje);
      },
    });
  }
}

// "Feria de Tandíl " -> "feria de tandil" (sin tildes ni mayúsculas)
function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}