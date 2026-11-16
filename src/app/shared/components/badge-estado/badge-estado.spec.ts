import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BadgeEstado } from './badge-estado';

describe('BadgeEstado', () => {
  function crear(estado: string) {
    const fixture = TestBed.createComponent(BadgeEstado);
    fixture.componentRef.setInput('estado', estado);
    fixture.detectChanges();
    return fixture.nativeElement.querySelector('span') as HTMLElement;
  }

  it('muestra el texto y la clase del estado', () => {
    const span = crear('Agotado');
    expect(span.textContent?.trim()).toBe('Agotado');
    expect(span.classList).toContain('badge');
    expect(span.classList).toContain('badge-agotado');
  });

  it('funciona con los estados de stand', () => {
    expect(crear('Ocupado').classList).toContain('badge-ocupado');
  });
});
