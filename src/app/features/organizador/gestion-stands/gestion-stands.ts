import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { EventoService } from '../../../core/services/evento.service';
import { OcupacionStands, StandService } from '../../../core/services/stand.service';
import { Evento } from '../../../core/models/evento.model';
import { Stand, StandRequest } from '../../../core/models/stand.model';
import { leerError } from '../../../core/utils/api-error.util';
import { BadgeEstado } from '../../../shared/components/badge-estado/badge-estado';
import { ErrorCampo } from '../../../shared/components/error-campo/error-campo';
import { ModalConfirmacion } from '../../../shared/components/modal-confirmacion/modal-confirmacion';
import { Paginador } from '../../../shared/components/paginador/paginador';
import { formatoPrecio } from '../../../shared/utils/precio';

const POR_PAGINA = 10;

// Acciones que piden confirmación en esta pantalla
interface Accion {
  tipo: 'eliminar' | 'cancelarReserva';
  stand: Stand;
}

@Component({
  selector: 'app-gestion-stands',
  imports: [FormsModule, RouterLink, BadgeEstado, ErrorCampo, ModalConfirmacion, Paginador],
  templateUrl: './gestion-stands.html',
  styleUrl: './gestion-stands.css',
})
export class GestionStands {
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);
  private readonly eventoService = inject(EventoService);
  private readonly standService = inject(StandService);

  // /organizador/ferias/7/stands -> 7
  private readonly id = Number(this.route.snapshot.paramMap.get('id'));

  readonly precio = formatoPrecio;

  readonly evento = signal<Evento | null>(null);
  readonly stands = signal<Stand[]>([]);
  readonly pagina = signal(0); // empieza en 0, como Spring
  readonly totalPaginas = signal(0);
  readonly ocupacion = signal<OcupacionStands | null>(null);
  readonly cargando = signal(true);
  readonly mensajeError = signal('');
  readonly mensajeOk = signal('');

  // Formulario de alta y edición
  datos: { numeroStand: number | null; costoStand: number | null } = {
    numeroStand: null,
    costoStand: null,
  };
  readonly editando = signal<Stand | null>(null);
  readonly guardando = signal(false);
  readonly errorForm = signal('');
  readonly errores = signal<Record<string, string>>({});

  // Confirmación de "Eliminar" y "Cancelar reserva"
  readonly accion = signal<Accion | null>(null);
  readonly procesando = signal(false);
  readonly errorModal = signal<string | null>(null);

  readonly cancelada = computed(() => this.evento()?.estado === 'Cancelado');
  readonly noEsMia = computed(() => {
    const e = this.evento();
    return e !== null && e.idUsuario !== this.auth.usuarioActual()?.idUsuario;
  });
  // Solo se gestiona una feria propia y no cancelada
  readonly puedeEditar = computed(
    () => this.evento() !== null && !this.cancelada() && !this.noEsMia(),
  );

  readonly tituloModal = computed(() => {
    const a = this.accion();
    if (!a) return '';
    return a.tipo === 'eliminar'
      ? `¿Eliminar el stand ${a.stand.numeroStand}?`
      : `¿Cancelar la reserva del stand ${a.stand.numeroStand}?`;
  });

  readonly mensajeModal = computed(() => {
    const a = this.accion();
    if (!a) return '';
    if (a.tipo === 'eliminar') return 'Se borra el stand y no se puede deshacer.';
    const quien = a.stand.nombreUsuario ?? 'una usuaria';
    return `El stand ${a.stand.numeroStand} está reservado por ${quien}. Va a quedar disponible de nuevo.`;
  });

  constructor() {
    if (!this.id) {
      this.cargando.set(false);
      this.mensajeError.set('La feria que buscás no existe.');
      return;
    }
    this.cargarEvento();
    this.cargarStands(0);
  }

  recargar(): void {
    this.mensajeError.set('');
    this.cargarEvento();
    this.cargarStands(this.pagina());
  }

  // GET /api/eventos/{id}
  private cargarEvento(): void {
    this.eventoService.obtener(this.id).subscribe({
      next: (evento) => this.evento.set(evento),
      error: (err: HttpErrorResponse) => this.mensajeError.set(leerError(err).mensaje),
    });
  }

  // GET /api/stands?idEvento={id}&page=&size=10&sort=numeroStand
  cargarStands(pagina: number): void {
    this.cargando.set(true);
    this.standService
      .listar({ idEvento: this.id }, { page: pagina, size: POR_PAGINA, sort: 'numeroStand' })
      .subscribe({
        next: (resultado) => {
          // Si se borró el último stand de la página, se vuelve a la anterior
          if (resultado.content.length === 0 && pagina > 0) {
            this.cargarStands(pagina - 1);
            return;
          }
          this.stands.set(resultado.content);
          this.pagina.set(resultado.number);
          this.totalPaginas.set(resultado.totalPages);
          this.cargando.set(false);
          this.cargarOcupacion();
        },
        error: (err: HttpErrorResponse) => {
          this.cargando.set(false);
          this.mensajeError.set(leerError(err).mensaje);
        },
      });
  }

  private cargarOcupacion(): void {
    this.standService.ocupacion(this.id).subscribe({
      next: (o) => this.ocupacion.set(o),
    });
  }

  // POST /api/stands o PUT /api/stands/{id}
  guardar(form: NgForm): void {
    this.mensajeOk.set('');
    this.errorForm.set('');
    this.errores.set({});
    if (form.invalid || !this.puedeEditar()) return;

    const cuerpo: StandRequest = {
      numeroStand: this.datos.numeroStand!,
      costoStand: this.datos.costoStand!,
      idEvento: this.id,
    };
    const editado = this.editando();

    this.guardando.set(true);
    const llamada = editado
      ? this.standService.actualizar(editado.idStand, cuerpo)
      : this.standService.crear(cuerpo);
    llamada.subscribe({
      next: (guardado) => {
        this.guardando.set(false);
        this.mensajeOk.set(
          editado
            ? `El stand ${guardado.numeroStand} se actualizó.`
            : `El stand ${guardado.numeroStand} se creó.`,
        );
        this.limpiarFormulario(form);
        this.cargarStands(this.pagina());
      },
      error: (err: HttpErrorResponse) => {
        this.guardando.set(false);
        const { mensaje, errores } = leerError(err);
        this.errorForm.set(mensaje);
        this.errores.set(errores);
      },
    });
  }

  // Un stand ocupado no se edita
  editar(stand: Stand): void {
    if (!stand.estadoStand || !this.puedeEditar()) return;
    this.mensajeOk.set('');
    this.errorForm.set('');
    this.errores.set({});
    this.editando.set(stand);
    this.datos = { numeroStand: stand.numeroStand, costoStand: stand.costoStand };
  }

  cancelarEdicion(form: NgForm): void {
    this.errorForm.set('');
    this.errores.set({});
    this.limpiarFormulario(form);
  }

  private limpiarFormulario(form: NgForm): void {
    this.editando.set(null);
    this.datos = { numeroStand: null, costoStand: null };
    form.resetForm();
  }

  // Un stand ocupado no se borra
  pedirEliminar(stand: Stand): void {
    if (!stand.estadoStand) return;
    this.pedir({ tipo: 'eliminar', stand });
  }

  // Solo los stands ocupados tienen reserva para cancelar
  pedirCancelarReserva(stand: Stand): void {
    if (stand.estadoStand) return;
    this.pedir({ tipo: 'cancelarReserva', stand });
  }

  private pedir(accion: Accion): void {
    this.mensajeOk.set('');
    this.errorModal.set(null);
    this.accion.set(accion);
  }

  cerrarModal(): void {
    if (this.procesando()) return;
    this.accion.set(null);
    this.errorModal.set(null);
  }

  // DELETE /api/stands/{id} o PUT /api/stands/{id}/cancelar-reserva
  confirmarAccion(): void {
    const accion = this.accion();
    if (!accion) return;
    const { tipo, stand } = accion;

    this.procesando.set(true);
    this.errorModal.set(null);
    const llamada =
      tipo === 'eliminar'
        ? this.standService
            .eliminar(stand.idStand)
            .pipe(map(() => `El stand ${stand.numeroStand} se eliminó.`))
        : this.standService
            .cancelarReserva(stand.idStand)
            .pipe(map(() => `Se canceló la reserva del stand ${stand.numeroStand}.`));

    llamada.subscribe({
      next: (mensaje) => {
        this.procesando.set(false);
        this.accion.set(null);
        this.mensajeOk.set(mensaje);
        if (tipo === 'eliminar' && this.editando()?.idStand === stand.idStand) {
          this.editando.set(null);
          this.datos = { numeroStand: null, costoStand: null };
        }
        this.cargarStands(this.pagina());
      },
      error: (err: HttpErrorResponse) => {
        this.procesando.set(false);
        this.errorModal.set(leerError(err).mensaje);
      },
    });
  }
}