import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { EventoService } from '../../../core/services/evento.service';
import { EstadoEvento, Evento, EventoFiltro } from '../../../core/models/evento.model';
import { leerError } from '../../../core/utils/api-error.util';
import { TarjetaFeria } from '../../../shared/components/tarjeta-feria/tarjeta-feria';
import { claveFecha } from '../../../shared/utils/fechas';
import { LocalidadService } from '../../../core/services/localidad.service';
import { Localidad } from '../../../core/models/localidad.model';
import { Paginador } from '../../../shared/components/paginador/paginador';

@Component({
  selector: 'app-explorar',
  imports: [FormsModule, TarjetaFeria, Paginador],
  templateUrl: './explorar.html',
  styleUrl: './explorar.css',
})
export class Explorar {
  private readonly eventoService = inject(EventoService);
  private readonly localidadService = inject(LocalidadService);

  readonly estados: EstadoEvento[] = ['Activo', 'Agotado', 'Cancelado'];

  readonly eventos = signal<Evento[]>([]);
  readonly estado = signal<EstadoEvento | ''>(''); // '' = todos los estados
  readonly localidades = signal<Localidad[]>([]);
  readonly idLocalidad = signal<number | null>(null);
  readonly busqueda = signal('');
  readonly cargando = signal(true);
  readonly mensajeError = signal('');

  // Búsqueda por nombre (en el front) y orden por fecha de inicio
  readonly filtradas = computed(() => {
    const texto = normalizar(this.busqueda());
    return this.eventos()
      .filter((e) => !texto || normalizar(e.nombre).includes(texto))
      .sort((a, b) => claveFecha(a.fechaInicio) - claveFecha(b.fechaInicio));  
    });

  // Paginacion en el front (devuelve la lista completa)
  readonly tamanio = 9;
  readonly pagina = signal(0);
  readonly totalPaginas = computed(() => Math.ceil(this.filtradas().length / this.tamanio));
  readonly visibles = computed(() => {
    const inicio = this.pagina() * this.tamanio;
    return this.filtradas().slice(inicio, inicio + this.tamanio);
  });

  // Hay algún filtro puesto (para mostrar "Limpiar filtros")
  readonly hayFiltros = computed(
    () => this.estado() !== '' || this.idLocalidad() !==null ||
  this.busqueda().trim() !== '',
  );

  constructor() {
    this.cargar();
    this.localidadService.listar().subscribe({
      next: (lista) => this.localidades.set(lista),
    });
  }

  cambiarEstado(estado: EstadoEvento | ''): void {
    this.estado.set(estado);
    this.cargar();
  }

  cambiarLocalidad(id: number | null): void {
    this.idLocalidad.set(id);
    this.cargar();
  }

    buscar(texto: string): void {
    this.busqueda.set(texto);
    this.pagina.set(0); // al cambiar la búsqueda se vuelve a la primera página
  }

  irAPagina(n: number): void {
    this.pagina.set(n);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  limpiarFiltros(): void {
    const recargar = this.estado() !== '' || this.idLocalidad() !== null;
    this.busqueda.set('');
    this.estado.set('');
    this.idLocalidad.set(null);
    if (recargar) this.cargar();
  }

  // GET /api/eventos con los filtros del backend (estado; después también localidad)
  cargar(): void {
    this.pagina.set(0); // cambió un filtro, vueve a la pagina 1
    this.cargando.set(true);
    this.mensajeError.set('');

    const filtro: EventoFiltro = {};
    const estado = this.estado();
    if (estado) filtro.estado = estado;
    const idLocalidad = this.idLocalidad();
    if (idLocalidad !== null) filtro.idLocalidad = idLocalidad;

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