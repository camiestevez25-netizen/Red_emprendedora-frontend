import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { CancelarFeria } from './cancelar-feria';
import { EventoService } from '../../../core/services/evento.service';
import { StandService } from '../../../core/services/stand.service';
import { Evento } from '../../../core/models/evento.model';

describe('CancelarFeria', () => {
  let eliminado: number | undefined;

  function crear(ocupados: number): CancelarFeria {
    TestBed.configureTestingModule({
      imports: [CancelarFeria],
      providers: [
        { provide: StandService, useValue: { contarOcupados: () => of(ocupados) } },
        {
          provide: EventoService,
          useValue: {
            eliminar: (id: number) => {
              eliminado = id;
              return of({ mensaje: 'Evento eliminado' });
            },
          },
        },
      ],
    });
    const fixture = TestBed.createComponent(CancelarFeria);
    fixture.componentRef.setInput('evento', { id: 7, nombre: 'Feria X' } as Evento);
    fixture.componentRef.setInput('abierto', true);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  it('avisa que queda Cancelada si tiene stands reservados', () => {
    expect(crear(2).mensaje()).toContain('Cancelada');
  });

  it('avisa que se elimina si no tiene reservas', () => {
    expect(crear(0).mensaje()).toContain('eliminar');
  });

  it('hace el DELETE y emite el mensaje del backend', () => {
    const c = crear(0);
    let recibido = '';
    c.cancelada.subscribe((m) => (recibido = m));
    c.confirmar();
    expect(eliminado).toBe(7);
    expect(recibido).toBe('Evento eliminado');
  });
});