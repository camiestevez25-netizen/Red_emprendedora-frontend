import { TestBed } from '@angular/core/testing';
import { ErrorCampo } from './error-campo';

describe('ErrorCampo', () => {
  function crear(errores: Record<string, string>, campo: string) {
    const fixture = TestBed.createComponent(ErrorCampo);
    fixture.componentRef.setInput('errores', errores);
    fixture.componentRef.setInput('campo', campo);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('muestra el mensaje del campo indicado', () => {
    const el = crear({ email: 'El email ya está registrado', nombre: 'Obligatorio' }, 'email');
    const span = el.querySelector('span.form-error');
    expect(span?.textContent?.trim()).toBe('El email ya está registrado');
  });

  it('no muestra nada si el campo no tiene error', () => {
    const el = crear({ nombre: 'Obligatorio' }, 'email');
    expect(el.querySelector('.form-error')).toBeNull();
  });

  it('no muestra nada si no hay errores', () => {
    const el = crear({}, 'email');
    expect(el.querySelector('.form-error')).toBeNull();
  });
});