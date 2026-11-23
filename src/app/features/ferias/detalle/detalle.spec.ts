import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { Detalle } from './detalle';
import { AuthService } from '../../../core/services/auth.service';
import { EventoService } from '../../../core/services/evento.service';
import { StandService } from '../../../core/services/stand.service';
import { Evento } from '../../../core/models/evento.model';
import { Stand } from '../../../core/models/stand.model';
import { Page } from '../../../core/models/page.model';
import { UsuarioService } from '../../../core/services/usuario.service';

function feria(estado: Evento['estado']): Evento {
  return {
    id: 3,
    nombre: 'Feria del Lago',
    estado,
    fechaInicio: '2099-12-10',
    fechaFin: '2099-12-11',
    precioEntradaTexto: 'Entrada gratuita',
    nombreLocalidad: 'Tandil',
    nombreOrganizador: 'Agus',
    idUsuario: 5 ,
    metrosCuadrados: '200 m²',
  } as Evento;
}

function stand(
  idStand: number,
  numeroStand: number,
  libre: boolean,
  idUsuario: number | null = null,
): Stand {
  return {
    idStand,
    costoStand: 1500,
    estadoStand: libre,
    estadoStandTexto: libre ? 'Disponible' : 'Ocupado',
    numeroStand,
    idEvento: 3,
    nombreEvento: 'Feria del Lago',
    estadoEvento: 'Activo',
    idUsuario,
    nombreUsuario: null,
    nombreEmprendimiento: null,
  };
}

function pagina(content: Stand[]): Page<Stand> {
  return {
    content,
    totalElements: content.length,
    totalPages: 1,
    number: 0,
    size: 500,
    first: true,
    empty: content.length === 0,
  };
}

describe('Detalle', () => {
  const logueada = signal(true);
  let estadoFeria: Evento['estado'];
  let listar: ReturnType<typeof vi.fn>;
  let reservar: ReturnType<typeof vi.fn>;
  let obtenerUsuario: ReturnType<typeof vi.fn>;

  function crear() {
    const fixture = TestBed.createComponent(Detalle);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    logueada.set(true);
    estadoFeria = 'Activo';
    listar = vi.fn(() => of(pagina([stand(1, 1, true), stand(2, 2, false, 9), stand(3, 3, true)])));
    reservar = vi.fn((id: number, idUsuario: number) => of({ ...stand(id, id, false, idUsuario) }));
    obtenerUsuario = vi.fn(() => of({ idUsuario: 5, telefono: '249 412-3456' }));

    TestBed.configureTestingModule({
      imports: [Detalle],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id: '3' }) } },
        },
        {
          provide: AuthService,
          useValue: {
            estaLogueado: logueada,
            usuarioActual: signal({ idUsuario: 7, nombre: 'Cami', email: 'c@c.com' }),
          },
        },
        { provide: EventoService, useValue: { obtener: () => of(feria(estadoFeria)) } },
        { provide: StandService, useValue: { listar, reservar } },
        { provide: UsuarioService, useValue: { obtener: obtenerUsuario } },
      ],
    });
  });

  it('pide la feria y todos sus stands en una sola llamada, ordenados por número', () => {
    const detalle = crear().componentInstance;

    expect(listar).toHaveBeenCalledWith({ idEvento: 3 }, { size: 500, sort: 'numeroStand' });
    expect(detalle.evento()?.nombre).toBe('Feria del Lago');
    expect(detalle.stands().length).toBe(3);
    expect(detalle.disponibles()).toBe(2);
  });

  it('sin sesión, reservar lleva a /login con la ruta para volver', () => {
    logueada.set(false);
    const fixture = crear();
    const router = TestBed.inject(Router);
    const navegar = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture.componentInstance.pedirReserva(stand(1, 1, true));

    expect(navegar).toHaveBeenCalledWith(['/login'], { queryParams: { volver: router.url } });
    expect(fixture.componentInstance.standElegido()).toBeNull();
  });

  it('con sesión, reservar abre el modal con el stand y todavía no llama al backend', () => {
    const detalle = crear().componentInstance;

    detalle.pedirReserva(stand(1, 1, true));

    expect(detalle.standElegido()?.idStand).toBe(1);
    expect(detalle.mensajeModal()).toContain('stand 1');
    expect(reservar).not.toHaveBeenCalled();
  });

  it('al confirmar reserva con el id de la usuaria logueada y marca el stand como ocupado', () => {
    const detalle = crear().componentInstance;

    detalle.pedirReserva(stand(1, 1, true));
    detalle.confirmarReserva();

    expect(reservar).toHaveBeenCalledWith(1, 7);
    expect(detalle.stands().find((s) => s.idStand === 1)?.estadoStand).toBe(false);
    expect(detalle.disponibles()).toBe(1);
    expect(detalle.standElegido()).toBeNull();
    expect(detalle.mensajeOk()).toContain('stand 1');
  });

  it('si el backend rechaza la reserva, muestra su mensaje en el modal y deja el stand libre', () => {
    reservar.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 400,
            error: { status: 400, mensaje: 'El stand ya está ocupado' },
          }),
      ),
    );
    const detalle = crear().componentInstance;

    detalle.pedirReserva(stand(1, 1, true));
    detalle.confirmarReserva();

    expect(detalle.errorModal()).toBe('El stand ya está ocupado');
    expect(detalle.standElegido()?.idStand).toBe(1);
    expect(detalle.reservando()).toBe(false);
    expect(detalle.disponibles()).toBe(2);
  });

  it('muestra "Reservar" en los stands disponibles', () => {
    const el = crear().nativeElement as HTMLElement;
    const botones = Array.from(el.querySelectorAll('button')).filter((b) =>
      b.textContent?.includes('Reservar'),
    );
    expect(botones.length).toBe(2);
  });

  it('en una feria cancelada no muestra acciones de reserva', () => {
    estadoFeria = 'Cancelado';
    const fixture = crear();
    const el = fixture.nativeElement as HTMLElement;

    expect(fixture.componentInstance.cancelada()).toBe(true);
    expect(el.textContent).toContain('cancelada');
    const botones = Array.from(el.querySelectorAll('button')).filter((b) =>
      b.textContent?.includes('Reservar'),
    );
    expect(botones.length).toBe(0);
  });
    it('con sesión pide el teléfono del organizador y muestra el botón de WhatsApp', () => {
    const el = crear().nativeElement as HTMLElement;

    expect(obtenerUsuario).toHaveBeenCalledWith(5);
    expect(el.querySelector('a[href^="https://wa.me/5492494123456"]')).not.toBeNull();
    expect(el.textContent).toContain('Contactar por WhatsApp');
  });

  it('sin sesión no pide el teléfono y ofrece iniciar sesión', () => {
    logueada.set(false);
    const el = crear().nativeElement as HTMLElement;

    expect(obtenerUsuario).not.toHaveBeenCalled();
    expect(el.textContent).toContain('Iniciá sesión para contactar');
    expect(el.querySelector('a[href^="https://wa.me/"]')).toBeNull();
  });

  it('si no se puede traer el teléfono, no hay botón pero la feria se muestra igual', () => {
    obtenerUsuario.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 403 })));
    const fixture = crear();
    const el = fixture.nativeElement as HTMLElement;

    expect(fixture.componentInstance.evento()?.nombre).toBe('Feria del Lago');
    expect(el.querySelector('a[href^="https://wa.me/"]')).toBeNull();
  });
});