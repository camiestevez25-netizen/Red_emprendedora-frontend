import { Component, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { StandService } from '../../../core/services/stand.service';
import { EstadoEvento } from '../../../core/models/evento.model';
import { Stand } from '../../../core/models/stand.model';
import { leerError } from '../../../core/utils/api-error.util';
import { BadgeEstado } from '../../../shared/components/badge-estado/badge-estado';
import { ModalConfirmacion } from '../../../shared/components/modal-confirmacion/modal-confirmacion';
import { Paginador } from '../../../shared/components/paginador/paginador';
import { formatoPrecio } from '../../../shared/utils/precio';

const POR_PAGINA = 10;

@Component({
  selector: 'app-mis-reservas',
  imports: [RouterLink, BadgeEstado, ModalConfirmacion, Paginador],
  templateUrl: './mis-reservas.html',
  styleUrl: './mis-reservas.css',
})
export class MisReservas {
  private readonly auth = inject(AuthService);
  private readonly standService = inject(StandService);

  readonly precio = formatoPrecio;

  readonly reservas = signal<Stand[]>([]);
  readonly total = signal(0);
  readonly pagina = signal(0); 
  readonly totalPaginas = signal(0);
  readonly cargando = signal(true);
  readonly mensajeError = signal('');
  readonly mensajeOk = signal('');

  // Reserva que se está por cancelar: abre el modal de confirmación
  readonly standElegido = signal<Stand | null>(null);
  readonly procesando = signal(false);
  readonly errorModal = signal<string | null>(null);

  readonly mensajeModal = computed(() => {
    const stand = this.standElegido();
    if (!stand) return '';
    return `Vas a liberar el stand ${stand.numeroStand} de "${stand.nombreEvento}". Otra persona podría reservarlo.`;
  });

  constructor() {
    this.cargar(0);
  }

  // GET /api/stands?idUsuario={yo}&page=&size=10
  cargar(pagina: number): void {
    const usuario = this.auth.usuarioActual();
    if (!usuario) {
      this.cargando.set(false);
      this.mensajeError.set('Iniciá sesión para ver tus reservas.');
      return;
    }

    this.cargando.set(true);
    this.mensajeError.set('');
    this.standService
      .listar({ idUsuario: usuario.idUsuario }, { page: pagina, size: POR_PAGINA })
      .subscribe({
        next: (resultado) => {
          // Si se canceló la última reserva de la página, se vuelve a la anterior
          if (resultado.content.length === 0 && pagina > 0) {
            this.cargar(pagina - 1);
            return;
          }
          this.reservas.set(resultado.content);
          this.total.set(resultado.totalElements);
          this.pagina.set(resultado.number);
          this.totalPaginas.set(resultado.totalPages);
          this.cargando.set(false);
        },
        error: (err: HttpErrorResponse) => {
          this.cargando.set(false);
          this.mensajeError.set(leerError(err).mensaje);
        },
      });
  }

  // El texto del stand viene como string del backend: acá se acota al tipo del badge
  estadoFeria(stand: Stand): EstadoEvento {
    return stand.estadoEvento as EstadoEvento;
  }

  // En una feria cancelada no se muestran acciones
  puedeCancelar(stand: Stand): boolean {
    return stand.estadoEvento !== 'Cancelado';
  }

  pedirCancelar(stand: Stand): void {
    if (!this.puedeCancelar(stand)) return;
    this.mensajeOk.set('');
    this.errorModal.set(null);
    this.standElegido.set(stand);
  }

  cerrarModal(): void {
    if (this.procesando()) return;
    this.standElegido.set(null);
    this.errorModal.set(null);
  }

  // PUT /api/stands/{id}/cancelar-reserva
  confirmarCancelacion(): void {
    const stand = this.standElegido();
    if (!stand) return;

    this.procesando.set(true);
    this.errorModal.set(null);
    this.standService.cancelarReserva(stand.idStand).subscribe({
      next: () => {
        this.procesando.set(false);
        this.standElegido.set(null);
        this.mensajeOk.set(`Se canceló tu reserva del stand ${stand.numeroStand}.`);
        this.cargar(this.pagina());
      },
      error: (err: HttpErrorResponse) => {
        this.procesando.set(false);
        this.errorModal.set(leerError(err).mensaje);
      },
    });
  }
}