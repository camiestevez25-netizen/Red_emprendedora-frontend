import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { EventoService } from '../../../core/services/evento.service';
import { OcupacionStands, StandService } from '../../../core/services/stand.service';
import { EstadoEvento, Evento } from '../../../core/models/evento.model';
import { leerError } from '../../../core/utils/api-error.util';
import { claveFecha } from '../../../shared/utils/fechas';
import { BadgeEstado } from '../../../shared/components/badge-estado/badge-estado';
import { Paginador } from '../../../shared/components/paginador/paginador';
import { CancelarFeria } from '../../../shared/components/cancelar-feria/cancelar-feria';
import { RangoFechasPipe } from '../../../shared/pipes/rango-fechas-pipe';

const FERIAS_POR_PAGINA = 8;

// Mis ferias (/organizador/ferias): todas las ferias de la organizadora logueada,
// con filtro por estado, paginador (en el front) y acciones Editar, Stands y Cancelar
@Component({
  selector: 'app-mis-ferias',
  imports: [FormsModule, RouterLink, BadgeEstado, Paginador, CancelarFeria, RangoFechasPipe],
  templateUrl: './mis-ferias.html',
  styleUrl: './mis-ferias.css',
})
export class MisFerias {
  private readonly auth = inject(AuthService);
  private readonly eventoService = inject(EventoService);
  private readonly standService = inject(StandService);

  readonly estados: EstadoEvento[] = ['Activo', 'Agotado', 'Cancelado'];

  readonly ferias = signal<Evento[]>([]);
  readonly cargando = signal(true);
  readonly mensajeError = signal('');
  readonly mensajeOk = signal('');

  // Ocupación de stands por feria (ocupados / total), con el servicio de Cami
  readonly ocupaciones = signal<Record<number, OcupacionStands>>({});

  // Filtro y paginador (todo en el front: el GET de eventos devuelve una lista, no una página)
  readonly filtroEstado = signal<EstadoEvento | ''>('');
  readonly pagina = signal(0);

  // Feria que se está por cancelar (abre el modal de Agus)
  readonly feriaACancelar = signal<Evento | null>(null);

  // Filtradas por estado y ordenadas por fecha de inicio (la más próxima primero)
  readonly filtradas = computed(() => {
    const estado = this.filtroEstado();
    return this.ferias()
      .filter((f) => !estado || f.estado === estado)
      .sort((a, b) => claveFecha(a.fechaInicio) - claveFecha(b.fechaInicio));
  });

  readonly totalPaginas = computed(() => Math.ceil(this.filtradas().length / FERIAS_POR_PAGINA));

  readonly feriasDePagina = computed(() => {
    const desde = this.pagina() * FERIAS_POR_PAGINA;
    return this.filtradas().slice(desde, desde + FERIAS_POR_PAGINA);
  });

  constructor() {
    this.cargar();
  }

  // GET /api/eventos?idUsuario= (solo las de la organizadora logueada)
  cargar(): void {
    const usuario = this.auth.usuarioActual();
    if (!usuario) return;

    this.cargando.set(true);
    this.mensajeError.set('');
    this.eventoService.listar({ idUsuario: usuario.idUsuario }).subscribe({
      next: (lista) => {
        this.ferias.set(lista);
        this.cargando.set(false);
        this.cargarOcupacion(lista);
      },
      error: (err: HttpErrorResponse) => {
        this.ferias.set([]);
        this.cargando.set(false);
        this.mensajeError.set(leerError(err).mensaje);
      },
    });
  }

  cambiarEstado(estado: EstadoEvento | ''): void {
    this.filtroEstado.set(estado);
    this.pagina.set(0); // al filtrar se vuelve a la primera página
  }

  irAPagina(n: number): void {
    this.pagina.set(n);
  }

  pedirCancelar(feria: Evento): void {
    this.mensajeOk.set('');
    this.feriaACancelar.set(feria);
  }

  // (cancelada) del componente de Agus emite el mensaje del backend:
  // "Evento eliminado" o que se canceló en lugar de borrarse
  alCancelar(mensaje: string): void {
    this.feriaACancelar.set(null);
    this.mensajeOk.set(mensaje);
    this.cargar(); // la feria cambió de estado o desapareció
  }

  // Pide la ocupación de todas las ferias a la vez (igual que el Panel)
  private cargarOcupacion(lista: Evento[]): void {
    this.ocupaciones.set({});
    if (lista.length === 0) return;

    const pedidos: Record<number, Observable<OcupacionStands>> = {};
    for (const f of lista) pedidos[f.id] = this.standService.ocupacion(f.id);

    forkJoin(pedidos).subscribe({
      next: (resultado) => this.ocupaciones.set(resultado),
      error: () => this.ocupaciones.set({}), // si falla, la columna muestra "—"
    });
  }
}