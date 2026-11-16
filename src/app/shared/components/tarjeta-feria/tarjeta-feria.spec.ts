import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TarjetaFeria } from './tarjeta-feria';
import { Evento } from '../../../core/models/evento.model';

const evento: Evento = {
  id: 7,
  nombre: 'Feria de Artesanos',
  fechaInicio: '2026-04-12',
  fechaFin: '2026-04-13',
  estado: 'Activo',
  precioEntrada: 0,
  entradaGratuita: true,
  precioEntradaTexto: 'Entrada gratuita',
  metrosCuadrados: '150',
  idLocalidad: 1,
  nombreLocalidad: 'San Isidro',
  idUsuario: 2,
  nombreOrganizador: 'Asociación',
};

describe('TarjetaFeria', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
  });

  it('muestra los datos de la feria y linkea al detalle', () => {
    const fixture = TestBed.createComponent(TarjetaFeria);
    fixture.componentRef.setInput('evento', evento);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('h3')?.textContent).toContain('Feria de Artesanos');
    expect(el.textContent).toContain('12 y 13 de abril');
    expect(el.textContent).toContain('San Isidro');
    expect(el.textContent).toContain('Entrada gratuita');
    expect(el.querySelector('.badge-activo')).toBeTruthy();
    expect(el.querySelector('a')?.getAttribute('href')).toBe('/ferias/7');
  });
});