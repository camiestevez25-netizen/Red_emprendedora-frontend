import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { EventoService } from '../../core/services/evento.service';
import { Evento } from '../../core/models/evento.model';
import { leerError } from '../../core/utils/api-error.util';
import { claveFecha, claveHoy } from '../../shared/utils/fechas';
import { TarjetaFeria } from '../../shared/components/tarjeta-feria/tarjeta-feria';

const CANTIDAD_PROXIMAS = 3;

// Pantalla 1: Inicio (pública). Hero, "¿Cómo funciona?" (#como-funciona) y las 3 próximas ferias
@Component({
  selector: 'app-inicio',
  imports: [RouterLink, TarjetaFeria],
  templateUrl: './inicio.html',
  styleUrl: './inicio.css',
})
export class Inicio implements OnInit {
  protected readonly auth = inject(AuthService);
  private readonly eventoService = inject(EventoService);

  readonly proximas = signal<Evento[]>([]);
  readonly cargando = signal(true);
  readonly mensajeError = signal('');

  // Si la foto del hero no existe, se muestra un bloque con ícono
  readonly fotoFallo = signal(false);

  ngOnInit(): void {
    this.eventoService.listar().subscribe({
      next: (eventos) => {
        this.proximas.set(this.elegirProximas(eventos));
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.mensajeError.set(leerError(err).mensaje);
        this.cargando.set(false);
      },
    });
  }

  // Ferias no canceladas que todavía no terminaron, de la más cercana a la más lejana.
  // Las fechas llegan como texto ("2026-9-20"), por eso se ordena con claveFecha() y no comparando textos
  private elegirProximas(eventos: Evento[]): Evento[] {
    const hoy = claveHoy();
    return eventos
      .filter((e) => e.estado !== 'Cancelado' && claveFecha(e.fechaFin) >= hoy)
      .sort((a, b) => claveFecha(a.fechaInicio) - claveFecha(b.fechaInicio))
      .slice(0, CANTIDAD_PROXIMAS);
  }
}