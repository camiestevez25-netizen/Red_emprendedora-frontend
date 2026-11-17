import { Component, input, output } from '@angular/core';

export type TipoModal = 'primario' | 'peligro';

// Modal de confirmación reutilizable. No llama al backend: solo avisa con (confirmar) o (cancelar).
// Uso:
// <app-modal-confirmacion
//   [abierto]="modalAbierto()"
//   titulo="¿Eliminar localidad?"
//   mensaje="Esta acción no se puede deshacer."
//   textoConfirmar="Eliminar"
//   tipo="peligro"
//   [cargando]="eliminando()"
//   [error]="errorModal()"
//   (confirmar)="eliminar()"
//   (cancelar)="cerrarModal()" />
@Component({
  selector: 'app-modal-confirmacion',
  imports: [],
  templateUrl: './modal-confirmacion.html',
  styleUrl: './modal-confirmacion.css',
  host: { '(document:keydown.escape)': 'volver()' },
})
export class ModalConfirmacion {
  readonly abierto = input(false);
  readonly titulo = input.required<string>();
  readonly mensaje = input('');
  readonly textoConfirmar = input('Confirmar');
  readonly textoCancelar = input('Volver');
  readonly tipo = input<TipoModal>('primario');
  readonly cargando = input(false);
  readonly error = input<string | null>(null);

  readonly confirmar = output<void>();
  readonly cancelar = output<void>();

  // Cierra con "Volver", con Escape o tocando afuera, salvo que se esté procesando
  volver(): void {
    if (this.abierto() && !this.cargando()) {
      this.cancelar.emit();
    }
  }
}