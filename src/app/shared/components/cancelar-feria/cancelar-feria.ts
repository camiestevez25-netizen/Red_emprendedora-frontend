import { Component, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Evento } from '../../../core/models/evento.model';
import { EventoService } from '../../../core/services/evento.service';
import { StandService } from '../../../core/services/stand.service';
import { leerError } from '../../../core/utils/api-error.util';
import { ModalConfirmacion } from '../modal-confirmacion/modal-confirmacion';

// Uso:
// <app-cancelar-feria [evento]="feria" [abierto]="modalAbierto()"
//   (cancelada)="alCancelar($event)" (cerrar)="modalAbierto.set(false)" />
// (cancelada) emite el mensaje del backend ("Evento eliminado" o "...se canceló en lugar de borrarse")
@Component({
  selector: 'app-cancelar-feria',
  imports: [ModalConfirmacion],
  templateUrl: './cancelar-feria.html',
})
export class CancelarFeria {
  private readonly eventoService = inject(EventoService);
  private readonly standService = inject(StandService);

  readonly evento = input.required<Evento>();
  readonly abierto = input(false);

  readonly cancelada = output<string>();
  readonly cerrar = output<void>();

  readonly ocupados = signal<number | null>(null); // null = todavía no se sabe
  readonly procesando = signal(false);
  readonly error = signal<string | null>(null);

  readonly titulo = computed(() => `¿Cancelar "${this.evento().nombre}"?`);
  readonly mensaje = computed(() => {
    const n = this.ocupados();
    if (n === null) return 'Revisando si la feria tiene stands reservados…';
    if (n > 0) {
      const stands = n === 1 ? '1 stand reservado' : `${n} stands reservados`;
      return `Tiene ${stands}, así que no se borra: queda en estado Cancelada.`;
    }
    return 'No tiene stands reservados, así que se va a eliminar junto con sus stands. No se puede deshacer.';
  });

  constructor() {
    // Cada vez que se abre, se vuelve a contar (pueden haber reservado mientras tanto)
    effect(() => {
      if (this.abierto()) untracked(() => this.revisarReservas());
    });
  }

  confirmar(): void {
    this.procesando.set(true);
    this.error.set(null);
    this.eventoService.eliminar(this.evento().id).subscribe({
      next: (respuesta) => {
        this.procesando.set(false);
        this.cancelada.emit(respuesta.mensaje);
      },
      error: (err: HttpErrorResponse) => {
        this.procesando.set(false);
        this.error.set(leerError(err).mensaje);
      },
    });
  }

  private revisarReservas(): void {
    this.ocupados.set(null);
    this.error.set(null);
    this.standService.contarOcupados(this.evento().id).subscribe({
      next: (n) => this.ocupados.set(n),
      error: (err: HttpErrorResponse) => this.error.set(leerError(err).mensaje),
    });
  }
}