// "1500" -> "$ 1.500" (pesos argentinos, sin centavos)
const formato = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatoPrecio(valor: number): string {
  return formato.format(valor);
}