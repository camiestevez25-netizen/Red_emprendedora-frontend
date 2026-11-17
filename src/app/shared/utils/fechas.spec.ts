import { claveFecha } from './fechas';

describe('claveFecha', () => {
    it('ordena bien fechas cony sin ceros', () => {
        expect(claveFecha('2026-9-20')).toBeLessThan(claveFecha('2026-12-10'));
        expect(claveFecha('2026-09-20')).toBe(claveFecha('2026-9-20'));
    });

    it('devuelve 0 si a fecha no se puede leer', () => {
        expect(claveFecha('')).toBe(0);
        expect(claveFecha('hola')).toBe(0);
    });
});