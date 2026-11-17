import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { Explorar } from './explorar';
import { EventoService } from '../../../core/services/evento.service';
import { Evento } from '../../../core/models/evento.model';

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

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: EventoService, useValue: { listar: () => of(lista) } },
      ],
    });
  });

  it('ordena por fecha de inicio', () => {
    const c = TestBed.createComponent(Explorar).componentInstance;
    expect(c.filtradas().map((e) => e.id)).toEqual([2, 1]);
  });

  it('busca por nombre sin importar mayúsculas ni tildes', () => {
    const c = TestBed.createComponent(Explorar).componentInstance;
    c.busqueda.set('TANDÍL');
    expect(c.filtradas().map((e) => e.id)).toEqual([1]);
  });
});