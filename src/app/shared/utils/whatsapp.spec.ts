import { enlaceWhatsapp } from './whatsapp';

describe('enlaceWhatsapp', () => {
  it('limpia espacios y guiones y agrega el prefijo de Argentina', () => {
    expect(enlaceWhatsapp('249 412-3456')).toBe('https://wa.me/5492494123456');
  });

  it('saca el 0 inicial del código de área', () => {
    expect(enlaceWhatsapp('0249 4123456')).toBe('https://wa.me/5492494123456');
  });

  it('respeta un número que ya viene en formato internacional', () => {
    expect(enlaceWhatsapp('+54 9 249 412 3456')).toBe('https://wa.me/5492494123456');
    expect(enlaceWhatsapp('542494123456')).toBe('https://wa.me/5492494123456');
  });

  it('codifica el mensaje', () => {
    expect(enlaceWhatsapp('2494123456', 'Hola! Feria "Lago"')).toBe(
      'https://wa.me/5492494123456?text=Hola!%20Feria%20%22Lago%22',
    );
  });

  it('devuelve null si el número no sirve', () => {
    expect(enlaceWhatsapp(null)).toBeNull();
    expect(enlaceWhatsapp('')).toBeNull();
    expect(enlaceWhatsapp('12345')).toBeNull();
    expect(enlaceWhatsapp('0249 15 4123456')).toBeNull(); // con el 15 no se puede armar bien
  });
});