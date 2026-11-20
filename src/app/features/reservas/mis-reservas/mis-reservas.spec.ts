import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { MisReservas } from './mis-reservas';
import { AuthService } from '../../../core/services/auth.service';
import { StandService } from '../../../core/services/stand.service';
import { Stand } from '../../../core/models/stand.model';
import { Page } from '../../../core/models/page.model';

function reserva(idStand: number, numeroStand: number, estadoEvento = 'Activo'): Stand {
  return {
    idStand,
    costoStand: 1500,
    estadoStand: false,
    estadoStandTexto: 'Ocupado',
    numeroStand,
    idEvento: 3,
    nombreEvento: 'Feria del Lago',
    estadoEvento,
    idUsuario: 7,
    nombreUsuario: 'Cami',
    nombreEmprendimiento: null,
  };
}

function pagina(content: Stand[], number = 0, totalPages = 1): Page<Stand> {
  return {
    content,
    totalElements: content.length,
    totalPages,
    number,
    size: 10,
    first: number === 0,
    empty: content.length === 0,
  };
}

describe('MisReservas', () => {
  let listar: ReturnType<typeof vi.fn>;
  let cancelarReserva: ReturnType<typeof vi.fn>;

  function crear() {
    const fixture = TestBed.createComponent(MisReservas);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    listar = vi.fn(() => of(pagina([reserva(1, 4), reserva(2, 5)])));
    cancelarReserva = vi.fn((id: number) => of(reserva(id, id)));

    TestBed.configureTestingModule({
      imports: [MisReservas],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { usuarioActual: signal({ idUsuario: 7 }) } },
        { provide: StandService, useValue: { listar, cancelarReserva } },
      ],
    });
  });

  it('pide solo los stands de la usuaria logueada, de a 10', () => {
    const pantalla = crear().componentInstance;

    expect(listar).toHaveBeenCalledWith({ idUsuario: 7 }, { page: 0, size: 10 });
    expect(pantalla.reservas().length).toBe(2);
    expect(pantalla.total()).toBe(2);
  });

  it('muestra cada reserva con el nombre de la feria y el número de stand', () => {
    const el = crear().nativeElement as HTMLElement;

    expect(el.textContent).toContain('Feria del Lago');
    expect(el.textContent).toContain('Stand 4');
    expect(el.textContent).toContain('Stand 5');
  });

  it('sin reservas, muestra un mensaje y un link para explorar ferias', () => {
    listar.mockReturnValue(of(pagina([])));
    const el = crear().nativeElement as HTMLElement;

    expect(el.textContent).toContain('Todavía no reservaste ningún stand');
    expect(el.querySelector('a[href="/ferias"]')).not.toBeNull();
  });

  it('cancelar pide confirmación y recién al confirmar llama al backend', () => {
    const pantalla = crear().componentInstance;

    pantalla.pedirCancelar(reserva(1, 4));
    expect(pantalla.standElegido()?.idStand).toBe(1);
    expect(pantalla.mensajeModal()).toContain('stand 4');
    expect(cancelarReserva).not.toHaveBeenCalled();

    pantalla.confirmarCancelacion();

    expect(cancelarReserva).toHaveBeenCalledWith(1);
    expect(pantalla.standElegido()).toBeNull();
    expect(pantalla.mensajeOk()).toContain('stand 4');
    expect(listar).toHaveBeenCalledTimes(2);
  });

  it('si el backend rechaza la cancelación, muestra su mensaje en el modal y no lo cierra', () => {
    cancelarReserva.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 400,
            error: { status: 400, mensaje: 'La feria ya empezó' },
          }),
      ),
    );
    const pantalla = crear().componentInstance;

    pantalla.pedirCancelar(reserva(1, 4));
    pantalla.confirmarCancelacion();

    expect(pantalla.errorModal()).toBe('La feria ya empezó');
    expect(pantalla.standElegido()).not.toBeNull();
    expect(pantalla.procesando()).toBe(false);
  });

  it('si se cancela la última reserva de una página, vuelve a la anterior', () => {
    listar.mockImplementation((_filtro: unknown, pag: { page: number }) =>
      of(pag.page === 1 ? pagina([], 1, 2) : pagina([reserva(1, 4)], 0, 2)),
    );
    const pantalla = crear().componentInstance;

    pantalla.cargar(1);

    expect(pantalla.pagina()).toBe(0);
    expect(pantalla.reservas().length).toBe(1);
  });

  it('en una feria cancelada no hay botón para cancelar la reserva', () => {
    listar.mockReturnValue(of(pagina([reserva(1, 4, 'Cancelado')])));
    const fixture = crear();
    const el = fixture.nativeElement as HTMLElement;

    expect(fixture.componentInstance.puedeCancelar(reserva(1, 4, 'Cancelado'))).toBe(false);
    expect(el.textContent).not.toContain('Cancelar reserva');
  });

  it('muestra el error si no se pueden cargar las reservas', () => {
    listar.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 500,
            error: { status: 500, mensaje: 'Error del servidor' },
          }),
      ),
    );
    const pantalla = crear().componentInstance;

    expect(pantalla.mensajeError()).toBe('Error del servidor');
    expect(pantalla.cargando()).toBe(false);
  });
});