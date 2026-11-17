import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { EventoService } from '../../../core/services/evento.service';
import { Evento } from '../../../core/models/evento.model';
import { leerError } from '../../../core/utils/api-error.util';
import { BadgeEstado } from '../../../shared/components/badge-estado/badge-estado';
import { RangoFechasPipe } from '../../../shared/pipes/rango-fechas-pipe';
import { claveFecha, claveHoy } from '../../../shared/utils/fechas';

@Component({
  selector: 'app-panel',
  imports: [RouterLink, BadgeEstado, RangoFechasPipe],
  templateUrl: './panel.html',
  styleUrl: './panel.css',
})
export class Panel {
  private readonly auth = inject(AuthService);
  private readonly eventoService = inject(EventoService);

  readonly nombre = computed(() => this.auth.usuarioActual()?.nombre ?? '');
  readonly ferias = signal<Evento[]>([]);
  readonly cargando = signal(true);
  readonly mensajeError = signal('');

  readonly total = computed(() => this.ferias().length);
  readonly activas = computed(() => this.ferias().filter((f) => f.estado === 'Activo').length);
  readonly agotadas = computed(() => this.ferias().filter((f) => f.estado === 'Agotado').length);

  // Próximas: no canceladas y que todavía no terminaron, las 3 que empiezan antes
  readonly proximas = computed(() => {
    const hoy = claveHoy();
    return this.ferias()
      .filter((f) => f.estado !== 'Cancelado' && claveFecha(f.fechaFin) >= hoy)
      .sort((a, b) => claveFecha(a.fechaInicio) - claveFecha(b.fechaInicio))
      .slice(0, 3);
  });

  constructor() {
    this.cargar();
  }

  cargar(): void {
    const usuario = this.auth.usuarioActual();
    if (!usuario) return;

    this.cargando.set(true);
    this.mensajeError.set('');
    this.eventoService.listar({ idUsuario: usuario.idUsuario }).subscribe({
      next: (lista) => {
        this.ferias.set(lista);
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.ferias.set([]);
        this.cargando.set(false);
        this.mensajeError.set(leerError(err).mensaje);
      },
    });
  }
}