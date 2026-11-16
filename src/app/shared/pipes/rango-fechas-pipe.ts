import { Pipe, PipeTransform } from '@angular/core';

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

// Uso: {{ evento.fechaInicio | rangoFechas: evento.fechaFin }}
// El backend manda las fechas como "2026-04-12"
@Pipe({ name: 'rangoFechas' })
export class RangoFechasPipe implements PipeTransform {
  transform(fechaInicio: string | null | undefined, fechaFin?: string | null): string {
    const inicio = leerFecha(fechaInicio);
    if (!inicio) return '';
    const fin = leerFecha(fechaFin) ?? inicio;

    const mismoAnio = inicio.anio === fin.anio;
    const mismoMes = mismoAnio && inicio.mes === fin.mes;

    // Un solo día
    if (mismoMes && inicio.dia === fin.dia) {
      return `${inicio.dia} de ${MESES[inicio.mes]}`;
    }
    // Mismo mes: "12 y 13 de abril" o "12 al 15 de abril"
    if (mismoMes) {
      const union = fin.dia - inicio.dia === 1 ? 'y' : 'al';
      return `${inicio.dia} ${union} ${fin.dia} de ${MESES[fin.mes]}`;
    }
    // Distinto mes, mismo año: "30 de abril al 2 de mayo"
    if (mismoAnio) {
      return `${inicio.dia} de ${MESES[inicio.mes]} al ${fin.dia} de ${MESES[fin.mes]}`;
    }
    // Distinto año
    return `${inicio.dia} de ${MESES[inicio.mes]} de ${inicio.anio} al ${fin.dia} de ${MESES[fin.mes]} de ${fin.anio}`;
  }
}

// Se separa el texto a mano en vez de usar new Date("2026-04-12"):
// new Date lo toma en hora UTC y en Argentina mostraría el día anterior (11 de abril)
function leerFecha(texto: string | null | undefined): { anio: number; mes: number; dia: number } | null {
  if (!texto) return null;
  const [anio, mes, dia] = texto.split('-').map(Number);
  if (!anio || !mes || !dia) return null;
  return { anio, mes: mes - 1, dia };
}