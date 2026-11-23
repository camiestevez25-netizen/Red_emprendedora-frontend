import { Component, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { EventoService } from '../../../core/services/evento.service';
import { StandService } from '../../../core/services/stand.service';
import { Evento } from '../../../core/models/evento.model';
import { Stand } from '../../../core/models/stand.model';
import { leerError } from '../../../core/utils/api-error.util';
import { BadgeEstado } from '../../../shared/components/badge-estado/badge-estado';
import { ModalConfirmacion } from '../../../shared/components/modal-confirmacion/modal-confirmacion';
import { RangoFechasPipe } from '../../../shared/pipes/rango-fechas-pipe';
import { formatoPrecio } from '../../../shared/utils/precio';
import { UsuarioService } from '../../../core/services/usuario.service';
import { enlaceWhatsapp } from '../../../shared/utils/whatsapp';

const CANTIDAD_FOTOS = 4;

@Component({
  selector: 'app-detalle',
  imports: [RouterLink, BadgeEstado, ModalConfirmacion, RangoFechasPipe],
  templateUrl: './detalle.html',
  styleUrl: './detalle.css',
})
export class Detalle {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly eventoService = inject(EventoService);
  private readonly standService = inject(StandService);
  private readonly usuarioService = inject(UsuarioService);

  // /ferias/7 -> 7
  private readonly id = Number(this.route.snapshot.paramMap.get('id'));

  readonly precio = formatoPrecio;
    // Contacto (RF6): el teléfono del organizador solo se pide con sesión iniciada
  readonly logueada = computed(() => this.auth.estaLogueado());
  readonly rutaVolver = `/ferias/${this.id}`;
  readonly telefonoOrganizador = signal<string | null>(null);
  readonly enlaceContacto = computed(() => {
    const feria = this.evento();
    if (!feria) return null;
    return enlaceWhatsapp(
      this.telefonoOrganizador(),
      `Hola! Vi la feria "${feria.nombre}" en Red Emprendedora y quiero consultarte.`,
    );
  });

  readonly evento = signal<Evento | null>(null);
  readonly stands = signal<Stand[]>([]);
  readonly cargando = signal(true);
  readonly mensajeError = signal('');

  // Reserva: el stand que se está por reservar abre el modal de confirmación
  readonly standElegido = signal<Stand | null>(null);
  readonly reservando = signal(false);
  readonly errorModal = signal<string | null>(null);
  readonly mensajeOk = signal('');

  // Foto fija según el id: feria-1.jpg ... feria-4.jpg en public/img/ (igual que tarjeta-feria)
  readonly imagen = computed(() => {
    const e = this.evento();
    return e ? `img/feria-${(e.id % CANTIDAD_FOTOS) + 1}.jpg` : '';
  });
  readonly imagenFallo = signal(false);

  readonly cancelada = computed(() => this.evento()?.estado === 'Cancelado');
  readonly disponibles = computed(() => this.stands().filter((s) => s.estadoStand).length);

  readonly mensajeModal = computed(() => {
    const stand = this.standElegido();
    const feria = this.evento();
    if (!stand || !feria) return '';
    return `Vas a reservar el stand ${stand.numeroStand} de "${feria.nombre}" por ${formatoPrecio(stand.costoStand)}.`;
  });

  constructor() {
    this.cargar();
  }

  // GET /api/eventos/{id} y GET /api/stands?idEvento={id}&size=500&sort=numeroStand (una sola página)
  cargar(): void {
    if (!this.id) {
      this.cargando.set(false);
      this.mensajeError.set('La feria que buscás no existe.');
      return;
    }

    this.cargando.set(true);
    this.mensajeError.set('');
    forkJoin({
      evento: this.eventoService.obtener(this.id),
      stands: this.standService.listar({ idEvento: this.id }, { size: 500, sort: 'numeroStand' }),
    }).subscribe({
      next: ({ evento, stands }) => {
        this.evento.set(evento);
        this.stands.set(stands.content);
        this.cargando.set(false);
        this.cargarContacto(evento.idUsuario);
      },
      error: (err: HttpErrorResponse) => {
        this.cargando.set(false);
        this.mensajeError.set(leerError(err).mensaje);
      },
    });
    
  }

  esMio(stand: Stand): boolean {
    const usuario = this.auth.usuarioActual();
    return usuario !== null && stand.idUsuario === usuario.idUsuario;
  }

  // Sin sesión lleva a /login y vuelve a esta feria después de entrar
  pedirReserva(stand: Stand): void {
    if (!this.auth.estaLogueado()) {
      this.router.navigate(['/login'], { queryParams: { volver: this.router.url } });
      return;
    }
    this.mensajeOk.set('');
    this.errorModal.set(null);
    this.standElegido.set(stand);
  }

  cerrarModal(): void {
    if (this.reservando()) return;
    this.standElegido.set(null);
    this.errorModal.set(null);
  }

  // PUT /api/stands/{id}/reservar?idUsuario=
  confirmarReserva(): void {
    const stand = this.standElegido();
    const usuario = this.auth.usuarioActual();
    if (!stand || !usuario) return;

    this.reservando.set(true);
    this.errorModal.set(null);
    this.standService.reservar(stand.idStand, usuario.idUsuario).subscribe({
      next: (reservado) => {
        this.stands.update((lista) =>
          lista.map((s) => (s.idStand === reservado.idStand ? reservado : s)),
        );
        this.reservando.set(false);
        this.standElegido.set(null);
        this.mensajeOk.set(`Reservaste el stand ${reservado.numeroStand}.`);
        this.refrescarEstadoFeria();
      },
      error: (err: HttpErrorResponse) => {
        this.reservando.set(false);
        this.errorModal.set(leerError(err).mensaje);
      },
    });
  }

  // Si se reservó el último stand, la feria pasa a "Agotado": se vuelve a pedir para mostrarlo
  private refrescarEstadoFeria(): void {
    this.eventoService.obtener(this.id).subscribe({
      next: (evento) => this.evento.set(evento),
    });
  }
    // GET /api/usuarios/{id}: solo con sesión. Si falla (403, etc.) simplemente no hay botón
  private cargarContacto(idOrganizador: number): void {
    this.telefonoOrganizador.set(null);
    if (!this.auth.estaLogueado()) return;

    this.usuarioService.obtener(idOrganizador).subscribe({
      next: (organizador) => this.telefonoOrganizador.set(organizador.telefono),
      error: () => this.telefonoOrganizador.set(null),
    });
  }
}