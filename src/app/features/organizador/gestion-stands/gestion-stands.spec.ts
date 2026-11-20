import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { NgForm } from '@angular/forms';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { GestionStands } from './gestion-stands';
import { AuthService } from '../../../core/services/auth.service';
import { EventoService } from '../../../core/services/evento.service';
import { StandService } from '../../../core/services/stand.service';
import { Evento } from '../../../core/models/evento.model';
import { Stand } from '../../../core/models/stand.model';
import { Page } from '../../../core/models/page.model';

function feria(estado: Evento['estado'] = 'Activo', idUsuario = 7): Evento {
  return { id: 3, nombre: 'Feria del Lago', estado, idUsuario } as Evento;
}

function stand(idStand: number, numeroStand: number, libre = true): Stand {
  return {
    idStand,
    costoStand: 1500,
    estadoStand: libre,
    estadoStandTexto: libre ? 'Disponible' : 'Ocupado',
    numeroStand,
    idEvento: 3,
    nombreEvento: 'Feria del Lago',
    estadoEvento: 'Activo',
    idUsuario: libre ? null : 9,
    nombreUsuario: libre ? null : 'Ana',
    nombreEmprendimiento: libre ? null : 'Cerámica Ana',
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

// Un formulario invalidado para llamar a guardar() sin renderizar la pantalla
function formulario(invalido = false): NgForm {
  return { invalid: invalido, resetForm: vi.fn() } as unknown as NgForm;
}

function errorHttp(status: number, cuerpo: object): HttpErrorResponse {
  return new HttpErrorResponse({ status, error: { status, ...cuerpo } });
}

describe('GestionStands', () => {
  let evento: Evento;
  let listar: ReturnType<typeof vi.fn>;
  let crear: ReturnType<typeof vi.fn>;
  let actualizar: ReturnType<typeof vi.fn>;
  let eliminar: ReturnType<typeof vi.fn>;
  let cancelarReserva: ReturnType<typeof vi.fn>;

  function crearPantalla() {
    const fixture = TestBed.createComponent(GestionStands);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    evento = feria();
    listar = vi.fn(() => of(pagina([stand(1, 1), stand(2, 2, false)])));
    crear = vi.fn((cuerpo: { numeroStand: number }) => of(stand(10, cuerpo.numeroStand)));
    actualizar = vi.fn((id: number, cuerpo: { numeroStand: number }) =>
      of(stand(id, cuerpo.numeroStand)),
    );
    eliminar = vi.fn(() => of(undefined));
    cancelarReserva = vi.fn((id: number) => of(stand(id, id)));

    TestBed.configureTestingModule({
      imports: [GestionStands],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id: '3' }) } },
        },
        { provide: AuthService, useValue: { usuarioActual: signal({ idUsuario: 7 }) } },
        { provide: EventoService, useValue: { obtener: () => of(evento) } },
        {
          provide: StandService,
          useValue: {
            listar,
            crear,
            actualizar,
            eliminar,
            cancelarReserva,
            ocupacion: () => of({ ocupados: 1, total: 2 }),
          },
        },
      ],
    });
  });

  it('pide la primera página de stands de la feria, de a 10 y ordenados por número', () => {
    const pantalla = crearPantalla().componentInstance;

    expect(listar).toHaveBeenCalledWith(
      { idEvento: 3 },
      { page: 0, size: 10, sort: 'numeroStand' },
    );
    expect(pantalla.stands().length).toBe(2);
    expect(pantalla.ocupacion()).toEqual({ ocupados: 1, total: 2 });
  });

  it('agregar un stand lo crea con el id de la feria y recarga la lista', () => {
    const pantalla = crearPantalla().componentInstance;
    pantalla.datos = { numeroStand: 5, costoStand: 2000 };

    pantalla.guardar(formulario());

    expect(crear).toHaveBeenCalledWith({ numeroStand: 5, costoStand: 2000, idEvento: 3 });
    expect(pantalla.mensajeOk()).toContain('stand 5');
    expect(listar).toHaveBeenCalledTimes(2);
  });

  it('si el formulario es inválido no llama al backend', () => {
    const pantalla = crearPantalla().componentInstance;

    pantalla.guardar(formulario(true));

    expect(crear).not.toHaveBeenCalled();
  });

  it('muestra los errores de validación del backend junto a cada campo', () => {
    crear.mockReturnValue(
      throwError(() =>
        errorHttp(400, {
          mensaje: 'Datos inválidos',
          errores: { costoStand: 'Debe ser mayor a 0' },
        }),
      ),
    );
    const pantalla = crearPantalla().componentInstance;
    pantalla.datos = { numeroStand: 5, costoStand: 2000 };

    pantalla.guardar(formulario());

    expect(pantalla.errorForm()).toBe('Datos inválidos');
    expect(pantalla.errores()).toEqual({ costoStand: 'Debe ser mayor a 0' });
    expect(pantalla.guardando()).toBe(false);
  });

  it('solo se edita un stand disponible; al guardar hace PUT con su id', () => {
    const pantalla = crearPantalla().componentInstance;

    pantalla.editar(stand(2, 2, false)); // ocupado
    expect(pantalla.editando()).toBeNull();

    pantalla.editar(stand(1, 1));
    expect(pantalla.editando()?.idStand).toBe(1);
    expect(pantalla.datos).toEqual({ numeroStand: 1, costoStand: 1500 });

    pantalla.datos = { numeroStand: 1, costoStand: 1800 };
    pantalla.guardar(formulario());

    expect(actualizar).toHaveBeenCalledWith(1, { numeroStand: 1, costoStand: 1800, idEvento: 3 });
    expect(pantalla.editando()).toBeNull();
  });

  it('eliminar pide confirmación y recién al confirmar borra el stand', () => {
    const pantalla = crearPantalla().componentInstance;

    pantalla.pedirEliminar(stand(1, 1));
    expect(pantalla.accion()?.tipo).toBe('eliminar');
    expect(eliminar).not.toHaveBeenCalled();

    pantalla.confirmarAccion();

    expect(eliminar).toHaveBeenCalledWith(1);
    expect(pantalla.accion()).toBeNull();
    expect(pantalla.mensajeOk()).toContain('stand 1');
    expect(listar).toHaveBeenCalledTimes(2);
  });

  it('un stand ocupado no se puede eliminar', () => {
    const pantalla = crearPantalla().componentInstance;

    pantalla.pedirEliminar(stand(2, 2, false));

    expect(pantalla.accion()).toBeNull();
  });

  it('cancelar reserva pide confirmación, solo en ocupados, y llama al backend al confirmar', () => {
    const pantalla = crearPantalla().componentInstance;

    pantalla.pedirCancelarReserva(stand(1, 1)); // disponible: no tiene reserva
    expect(pantalla.accion()).toBeNull();

    pantalla.pedirCancelarReserva(stand(2, 2, false));
    expect(pantalla.mensajeModal()).toContain('Ana');
    pantalla.confirmarAccion();

    expect(cancelarReserva).toHaveBeenCalledWith(2);
    expect(pantalla.mensajeOk()).toContain('stand 2');
  });

  it('si el backend rechaza la acción, muestra su mensaje en el modal y no lo cierra', () => {
    eliminar.mockReturnValue(
      throwError(() => errorHttp(403, { mensaje: 'No podés modificar stands de otra feria' })),
    );
    const pantalla = crearPantalla().componentInstance;

    pantalla.pedirEliminar(stand(1, 1));
    pantalla.confirmarAccion();

    expect(pantalla.errorModal()).toBe('No podés modificar stands de otra feria');
    expect(pantalla.accion()).not.toBeNull();
    expect(pantalla.procesando()).toBe(false);
  });

  it('si se borra el último stand de una página, vuelve a la anterior', () => {
    listar.mockImplementation((_filtro: unknown, pag: { page: number }) =>
      of(pag.page === 1 ? pagina([], 1, 2) : pagina([stand(1, 1)], 0, 2)),
    );
    const pantalla = crearPantalla().componentInstance;

    pantalla.cargarStands(1);

    expect(pantalla.pagina()).toBe(0);
    expect(pantalla.stands().length).toBe(1);
  });

  it('en una feria cancelada no hay formulario ni acciones', () => {
    evento = feria('Cancelado');
    const fixture = crearPantalla();
    const el = fixture.nativeElement as HTMLElement;

    expect(fixture.componentInstance.puedeEditar()).toBe(false);
    expect(el.querySelector('form')).toBeNull();
    expect(el.textContent).toContain('cancelada');
    expect(el.textContent).not.toContain('Cancelar reserva');
  });

  it('en la feria de otra organizadora solo se puede mirar', () => {
    evento = feria('Activo', 99);
    const fixture = crearPantalla();

    expect(fixture.componentInstance.noEsMia()).toBe(true);
    expect(fixture.componentInstance.puedeEditar()).toBe(false);
    expect((fixture.nativeElement as HTMLElement).querySelector('form')).toBeNull();
  });

  it('en una feria propia muestra el formulario y las acciones de cada stand', () => {
    const el = crearPantalla().nativeElement as HTMLElement;

    expect(el.querySelector('form')).not.toBeNull();
    expect(el.textContent).toContain('Editar');
    expect(el.textContent).toContain('Eliminar');
    expect(el.textContent).toContain('Cancelar reserva');
  });
});