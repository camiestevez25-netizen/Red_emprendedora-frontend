import { RangoFechasPipe } from './rango-fechas-pipe';

describe('RangoFechasPipe', () => {
  const pipe = new RangoFechasPipe();

  it('un solo día', () => {
    expect(pipe.transform('2026-04-12', '2026-04-12')).toBe('12 de abril');
  });
  it('dos días seguidos', () => {
    expect(pipe.transform('2026-04-12', '2026-04-13')).toBe('12 y 13 de abril');
  });
  it('varios días del mismo mes', () => {
    expect(pipe.transform('2026-04-12', '2026-04-15')).toBe('12 al 15 de abril');
  });
  it('meses distintos', () => {
    expect(pipe.transform('2026-04-30', '2026-05-02')).toBe('30 de abril al 2 de mayo');
  });
  it('años distintos', () => {
    expect(pipe.transform('2026-12-30', '2027-01-02')).toBe('30 de diciembre de 2026 al 2 de enero de 2027');
  });
  it('sin fecha devuelve vacío', () => {
    expect(pipe.transform(null)).toBe('');
  });
});