import { formatoPrecio } from './precio';

describe('formatoPrecio', () => {
  it('muestra el monto con separador de miles y sin centavos', () => {
    expect(formatoPrecio(1500)).toMatch(/1\D500$/);
    expect(formatoPrecio(1500)).not.toContain(',00');
  });

  it('funciona con montos chicos', () => {
    expect(formatoPrecio(800)).toContain('800');
  });
});
