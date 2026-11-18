import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LocalidadService } from '../../../core/services/localidad.service';
import { EventoService } from '../../../core/services/evento.service';
import { AuthService } from '../../../core/services/auth.service';
import { Evento, EventoRequest, EventoUpdate } from '../../../core/models/evento.model';
import { Localidad } from '../../../core/models/localidad.model';
import { leerError } from '../../../core/utils/api-error.util';
import { BadgeEstado } from '../../../shared/components/badge-estado/badge-estado';
import { ErrorCampo } from '../../../shared/components/error-campo/error-campo';
import { CancelarFeria } from '../../../shared/components/cancelar-feria/cancelar-feria';
import { StandService } from '../../../core/services/stand.service';

// Igual que EventoRequest, pero la localidad arranca sin elegir
type DatosFeria = Omit<EventoRequest, 'idLocalidad'> & { idLocalidad: number | null };

@Component({
  selector: 'app-feria-form',
  imports: [FormsModule, RouterLink, BadgeEstado, ErrorCampo, CancelarFeria],
  templateUrl: './feria-form.html',
  styleUrl: './feria-form.css',
})
export class FeriaForm {
  private readonly eventoService = inject(EventoService);
  private readonly auth = inject(AuthService);
  private readonly localidadService = inject(LocalidadService);  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly standService = inject(StandService);

  // /organizador/ferias/nueva -> null ; /organizador/ferias/7/editar -> 7
  readonly id = Number(this.route.snapshot.paramMap.get('id')) || null;
  readonly esEdicion = this.id !== null;

  datos: DatosFeria = {
    nombre: '',
    fechaInicio: '',
    fechaFin: '',
    precioEntrada: null,
    metrosCuadrados: '',
    idLocalidad: null,
  };

  readonly evento = signal<Evento | null>(null); // la feria original (solo al editar)
  readonly localidades = signal<Localidad[]>([]);
  readonly cargando = signal(this.esEdicion);
  readonly guardando = signal(false);
  readonly mensajeError = signal('');
  readonly mensajeOk = signal('');
  readonly errores = signal<Record<string, string>>({});
  readonly modalCancelar = signal(false);
  readonly ocupados = signal(0);

  // Con stands reservados el backend no deja cambiar los m²
  readonly metrosBloqueados = computed(() => this.ocupados() > 0);

  readonly cancelada = computed(() => this.evento()?.estado === 'Cancelado');
  readonly noEsMia = computed(() => {
    const e = this.evento();
    return e !== null && e.idUsuario !== this.auth.usuarioActual()?.idUsuario;
  });
  readonly soloLectura = computed(() => this.cancelada() || this.noEsMia());

  constructor() {
    this.cargarLocalidades();
    if (this.esEdicion) this.cargarEvento();
  }

  guardar(form: NgForm): void {
    this.mensajeError.set('');
    this.mensajeOk.set('');
    this.errores.set({});
    if (form.invalid || this.soloLectura()) return;

    // El input de fecha da "2026-04-12": se puede comparar como texto
    if (this.datos.fechaFin < this.datos.fechaInicio) {
      this.errores.set({ fechaFin: 'La fecha de fin no puede ser anterior a la de inicio' });
      return;
    }

    const cuerpo: EventoRequest = {
      nombre: this.datos.nombre.trim(),
      fechaInicio: this.datos.fechaInicio,
      fechaFin: this.datos.fechaFin,
      precioEntrada: this.datos.precioEntrada ?? null, // vacío = el backend lo pone en 0 (gratuita)
      metrosCuadrados: this.datos.metrosCuadrados.trim(),
      idLocalidad: this.datos.idLocalidad!,
    };

    this.guardando.set(true);
    if (this.esEdicion) {
      this.eventoService.actualizar(this.id!, this.soloCambios(cuerpo)).subscribe({
        next: (actualizado) => {
          this.evento.set(actualizado);
          this.guardando.set(false);
          this.mensajeOk.set('Los cambios se guardaron');
        },
        error: (err: HttpErrorResponse) => this.mostrarError(err),
      });
    } else {
      this.eventoService.crear(cuerpo).subscribe({
        // Recién creada no tiene stands: se va directo a cargarlos
        next: (creada) => this.router.navigate(['/organizador/ferias', creada.id, 'stands']),
        error: (err: HttpErrorResponse) => this.mostrarError(err),
      });
    }
  }

  private cargarEvento(): void {
    this.eventoService.obtener(this.id!).subscribe({
      next: (e) => {
        this.datos = {
          nombre: e.nombre,
          fechaInicio: e.fechaInicio,
          fechaFin: e.fechaFin,
          precioEntrada: e.precioEntrada,
          metrosCuadrados: e.metrosCuadrados,
          idLocalidad: e.idLocalidad,
        };
        this.evento.set(e);
        this.cargando.set(false);
        this.contarOcupados();
      },
      error: (err: HttpErrorResponse) => {
        this.cargando.set(false);
        this.mensajeError.set(leerError(err).mensaje);
      },
    });
  }

  // GET /stands/evento/{id}/contar-ocupados
  private contarOcupados(): void {
    this.standService.contarOcupados(this.id!).subscribe({
      next: (n) => this.ocupados.set(n),
    });
  }

  // TEMPORAL: cuando Lou suba LocalidadService, usar localidadService.listar()
  private cargarLocalidades(): void {
    this.localidadService.listar().subscribe({
      next: (lista) => this.localidades.set(lista),
      error: (err: HttpErrorResponse) =>
    this.mensajeError.set(leerError(err).mensaje),
    });
  }

  // En el PUT se manda solo lo que cambió respecto de la feria original
  private soloCambios(cuerpo: EventoRequest): EventoUpdate {
    const original = this.evento()!;
    const cambios: EventoUpdate = {};
    if (cuerpo.nombre !== original.nombre) cambios.nombre = cuerpo.nombre;
    if (cuerpo.fechaInicio !== original.fechaInicio) cambios.fechaInicio = cuerpo.fechaInicio;
    if (cuerpo.fechaFin !== original.fechaFin) cambios.fechaFin = cuerpo.fechaFin;
    if (cuerpo.precioEntrada !== original.precioEntrada) cambios.precioEntrada = cuerpo.precioEntrada ?? 0;
    if (cuerpo.metrosCuadrados !== original.metrosCuadrados) cambios.metrosCuadrados = cuerpo.metrosCuadrados;
    if (cuerpo.idLocalidad !== original.idLocalidad) cambios.idLocalidad = cuerpo.idLocalidad;
    return cambios;
  }

  private mostrarError(err: HttpErrorResponse): void {
    this.guardando.set(false);
    const { mensaje, errores } = leerError(err);
    this.mensajeError.set(mensaje);
    this.errores.set(errores);
  }

  // Si la feria quedó Cancelada, se recarga y el formulario pasa a solo lectura.
  // Si se eliminó, ya no existe: se vuelve al panel.
  feriaCancelada(mensaje: string): void {
    this.modalCancelar.set(false);
    this.eventoService.obtener(this.id!).subscribe({
      next: (e) => {
        this.evento.set(e);
        this.mensajeOk.set(mensaje);
      },
      error: () => this.router.navigate(['/organizador']),
    });
  }

}