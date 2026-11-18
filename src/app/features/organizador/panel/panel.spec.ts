import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { Panel } from './panel';
import { AuthService } from '../../../core/services/auth.service';
import { EventoService } from '../../../core/services/evento.service';
import { Evento } from '../../../core/models/evento.model';
import {StandService } from '../../../core/services/stand.service';

function feria(id: number, estado: Evento['estado'], inicio: string, fin: string): Evento {
  return { id, nombre: `Feria ${id}`, estado, fechaInicio: inicio, fechaFin: fin } as Evento;
}

describe('Panel', () => {
  const lista = [
    feria(1, 'Activo', '2099-12-10', '2099-12-11'),
    feria(2, 'Agotado', '2099-9-20', '2099-9-21'),
    feria(3, 'Cancelado', '2099-1-5', '2099-1-6'),
    feria(4, 'Activo', '2000-1-1', '2000-1-2'), // ya terminó
    feria(5, 'Activo', '2099-10-1', '2099-10-2'),
    feria(6, 'Activo', '2099-11-1', '2099-11-2'),
  ];
  let panel: Panel;
  let idPedido: number | undefined;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [Panel],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { usuarioActual: signal({ idUsuario: 7, nombre: 'Agus', email: 'a@a.com' }) } },
        {
          provide: EventoService,
          useValue: {
            listar: (filtro: { idUsuario?: number }) => {
              idPedido = filtro.idUsuario;
              return of(lista);
            },
          },
        },
        { provide: StandService, useValue: { ocupacion: (id: number) => of({ ocupados: id, total: 10 }) } },
      ],
    });
    panel = TestBed.createComponent(Panel).componentInstance;
  });

  it('pide solo las ferias de la usuaria logueada', () => {
    expect(idPedido).toBe(7);
  });

  it('cuenta creadas, activas y agotadas', () => {
    expect(panel.total()).toBe(6);
    expect(panel.activas()).toBe(4);
    expect(panel.agotadas()).toBe(1);
  });

  it('muestra las 3 próximas sin canceladas ni terminadas, ordenadas por fecha', () => {
    expect(panel.proximas().map((f) => f.id)).toEqual([2, 5, 6]);
  });

  it('suma los stands de todas las ferias y guarda la ocupación de cada una', () => {
  expect(panel.ocupacionLista()).toBe(true);
  expect(panel.standsTotales()).toBe(60); // 6 ferias x 10 stands
  expect(panel.ocupaciones()[2]).toEqual({ ocupados: 2, total: 10 });
  });
});