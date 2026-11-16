import { Component, computed, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Evento } from '../../../core/models/evento.model';
import { BadgeEstado } from '../badge-estado/badge-estado';
import { RangoFechasPipe } from '../../pipes/rango-fechas-pipe';

const CANTIDAD_FOTOS = 4;

// Uso: <app-tarjeta-feria [evento]="evento" />                        (vertical, Explorá ferias)
//      <app-tarjeta-feria [evento]="evento" variante="horizontal" />  (Inicio)
@Component({
  selector: 'app-tarjeta-feria',
  imports: [RouterLink, BadgeEstado, RangoFechasPipe],
  templateUrl: './tarjeta-feria.html',
  styleUrl: './tarjeta-feria.css',
})
export class TarjetaFeria {
  readonly evento = input.required<Evento>();
  readonly variante = input<'vertical' | 'horizontal'>('vertical');

  // Foto fija según el id: feria-1.jpg ... feria-4.jpg en public/img/
  readonly imagen = computed(() => `img/feria-${(this.evento().id % CANTIDAD_FOTOS) + 1}.jpg`);
  // Si la imagen no existe, se muestra el bloque con el ícono
  readonly imagenFallo = signal(false);
}