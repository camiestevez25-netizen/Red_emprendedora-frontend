import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { Explorar } from './explorar';
import { EventoService } from '../../../core/services/evento.service';
import { Evento } from '../../../core/models/evento.model';
import { LocalidadService } from '../../../core/services/localidad.service';
import { EventoFiltro } from '../../../core/models/evento.model';

function feria(id: number, nombre: string, fechaInicio: string): Evento {
  return {
    id, nombre, fechaInicio, fechaFin: fechaInicio, estado: 'Activo',
    precioEntrada: 0, entradaGratuita: true, precioEntradaTexto: 'Entrada gratuita',
    metrosCuadrados: '100', idLocalidad: 1, nombreLocalidad: 'Tandil',
    idUsuario: 1, nombreOrganizador: 'Org',
  };
}

describe('Explorar', () => {
  const lista = [
    feria(1, 'Feria Emprende en Tandil', '2026-04-19'),
    feria(2, 'Feria de Artesanos', '2026-04-12'),
  ];

  let ultimoFiltro: EventoFiltro = {};

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: EventoService,
          useValue: {
            listar: (filtro: EventoFiltro) => {
              ultimoFiltro = filtro;
              return of(lista);
            },
          },
        },
        {
          provide: LocalidadService,
          useValue: { listar: () => of ([{ idLocalidad: 3, nombreLocalidad: 'Tandil', provinciaLocalidad: 'Buenos Aires' }]) },
        },
      ],
    });
  });

  it('filtra por localidad en el backend y limpia los filtros', () => {
    const c = TestBed.createComponent(Explorar).componentInstance;
    expect(c.localidades().length).toBe(1);

    c.cambiarLocalidad(3);
    expect(ultimoFiltro).toEqual({ idLocalidad: 3 });

    c.limpiarFiltros();
    expect(ultimoFiltro).toEqual({});
  });
});