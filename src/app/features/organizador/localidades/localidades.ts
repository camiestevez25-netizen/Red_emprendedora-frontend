import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { LocalidadService } from '../../../core/services/localidad.service';
import { Localidad } from '../../../core/models/localidad.model';
import { leerError } from '../../../core/utils/api-error.util';
import { ModalConfirmacion } from '../../../shared/components/modal-confirmacion/modal-confirmacion';
import { ErrorCampo } from '../../../shared/components/error-campo/error-campo';

// Pantalla 13: Gestión de localidades (solo ORGANIZADOR, lo controla rolGuard en la ruta)
@Component({
  selector: 'app-localidades',
  imports: [FormsModule, ModalConfirmacion, ErrorCampo],
  templateUrl: './localidades.html',
  styleUrl: './localidades.css',
})
export class Localidades implements OnInit {
  private readonly localidadService = inject(LocalidadService);

  // Mismo patrón que el backend (LocalidadDTO): solo letras y espacios
  readonly soloLetras = '^[A-Za-zÁÉÍÓÚÑáéíóúñ\\s]+$';

  // Lista
  readonly localidades = signal<Localidad[]>([]);
  readonly cargando = signal(true);
  readonly mensajeError = signal('');
  readonly mensajeOk = signal('');

  // Formulario de alta / edición
  readonly formAbierto = signal(false);
  readonly editando = signal<Localidad | null>(null);
  datos: Localidad = { nombreLocalidad: '', provinciaLocalidad: '' };
  readonly guardando = signal(false);
  readonly errorForm = signal('');
  readonly errores = signal<Record<string, string>>({});

  // Eliminación (con modal de confirmación)
  readonly aEliminar = signal<Localidad | null>(null);
  readonly eliminando = signal(false);
  readonly errorEliminar = signal<string | null>(null);
  readonly mensajeEliminar = computed(() => {
    const l = this.aEliminar();
    return l ? `Se va a eliminar ${l.nombreLocalidad}, ${l.provinciaLocalidad}. Esta acción no se puede deshacer.` : '';
  });

  ngOnInit(): void {
    this.cargar();
  }

  // GET /api/localidades, ordenadas por provincia y después por nombre
  cargar(): void {
    this.cargando.set(true);
    this.mensajeError.set('');
    this.localidadService.listar().subscribe({
      next: (lista) => {
        this.localidades.set(this.ordenar(lista));
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.mensajeError.set(leerError(err).mensaje);
        this.cargando.set(false);
      },
    });
  }

  nueva(): void {
    this.editando.set(null);
    this.datos = { nombreLocalidad: '', provinciaLocalidad: '' };
    this.abrirFormulario();
  }

  editar(localidad: Localidad): void {
    this.editando.set(localidad);
    this.datos = { nombreLocalidad: localidad.nombreLocalidad, provinciaLocalidad: localidad.provinciaLocalidad };
    this.abrirFormulario();
  }

  cerrarFormulario(): void {
    this.formAbierto.set(false);
    this.editando.set(null);
  }

  // POST o PUT según si se está editando
  guardar(form: NgForm): void {
    if (form.invalid) return; // los mensajes aparecen porque form.submitted pasa a true

    // El backend compara sin distinguir mayúsculas, pero sí tildes ("Junin" y "Junín" serían distintas).
    // Por eso se controla acá también, ignorando tildes, mayúsculas y espacios de más.
    if (this.estaRepetida()) {
      this.errorForm.set('Ya existe esa localidad en esa provincia');
      return;
    }

    this.guardando.set(true);
    this.errorForm.set('');
    this.errores.set({});
    this.mensajeOk.set('');

    const datos: Localidad = {
      nombreLocalidad: this.datos.nombreLocalidad.trim(),
      provinciaLocalidad: this.datos.provinciaLocalidad.trim(),
    };
    const editando = this.editando();
    const pedido = editando?.idLocalidad != null
      ? this.localidadService.actualizar(editando.idLocalidad, datos)
      : this.localidadService.crear(datos);

    pedido.subscribe({
      next: (guardada) => {
        const resto = this.localidades().filter((l) => l.idLocalidad !== guardada.idLocalidad);
        this.localidades.set(this.ordenar([...resto, guardada]));
        this.mensajeOk.set(editando ? 'Localidad actualizada.' : 'Localidad agregada.');
        this.guardando.set(false);
        this.cerrarFormulario();
      },
      error: (err: HttpErrorResponse) => {
        const { mensaje, errores } = leerError(err);
        this.errorForm.set(mensaje); // ej. "Ya existe esa localidad en esa provincia"
        this.errores.set(errores);
        this.guardando.set(false);
      },
    });
  }

  pedirEliminar(localidad: Localidad): void {
    this.errorEliminar.set(null);
    this.aEliminar.set(localidad);
  }

  cancelarEliminar(): void {
    this.aEliminar.set(null);
  }

  // DELETE /api/localidades/{id}. Si tiene usuarios o eventos, el backend no deja y se muestra su mensaje en el modal
  eliminar(): void {
    const localidad = this.aEliminar();
    if (localidad?.idLocalidad == null) return;

    this.eliminando.set(true);
    this.errorEliminar.set(null);
    this.mensajeOk.set('');

    this.localidadService.eliminar(localidad.idLocalidad).subscribe({
      next: () => {
        this.localidades.set(this.localidades().filter((l) => l.idLocalidad !== localidad.idLocalidad));
        this.mensajeOk.set('Localidad eliminada.');
        this.eliminando.set(false);
        this.aEliminar.set(null);
      },
      error: (err: HttpErrorResponse) => {
        this.errorEliminar.set(leerError(err).mensaje);
        this.eliminando.set(false);
      },
    });
  }

  private abrirFormulario(): void {
    this.errorForm.set('');
    this.errores.set({});
    this.mensajeOk.set('');
    this.formAbierto.set(true);
  }

  // true si ya hay otra localidad con el mismo nombre y provincia (sin contar la que se está editando)
  private estaRepetida(): boolean {
    const id = this.editando()?.idLocalidad;
    const nombre = this.normalizar(this.datos.nombreLocalidad);
    const provincia = this.normalizar(this.datos.provinciaLocalidad);
    return this.localidades().some(
      (l) =>
        l.idLocalidad !== id &&
        this.normalizar(l.nombreLocalidad) === nombre &&
        this.normalizar(l.provinciaLocalidad) === provincia,
    );
  }

  // "  Junín " -> "junin" (sin tildes, en minúscula y sin espacios de más)
  private normalizar(texto: string): string {
    return texto
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .replace(/\s+/g, ' ')
      .toLowerCase();
  }

  private ordenar(lista: Localidad[]): Localidad[] {
    return [...lista].sort(
      (a, b) =>
        a.provinciaLocalidad.localeCompare(b.provinciaLocalidad, 'es') ||
        a.nombreLocalidad.localeCompare(b.nombreLocalidad, 'es'),
    );
  }
}