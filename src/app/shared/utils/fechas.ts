// Las fechas llegan como texto y no siempre con dos dígitos
// Comparar los textos ordena mal 
// asi que se pasan a un numero comparable

export function claveFecha(texto: string | null | undefined): number {
    if (!texto) return 0;
    const [anio, mes, dia] = texto.split('-').map(Number);
    if (!anio || !mes || !dia) return 0;
    return anio * 10000 + mes * 100 + dia;
}

export function claveHoy(): number {
    const hoy = new Date();
    return hoy.getFullYear() * 10000 + (hoy.getMonth() + 1) *100 + hoy.getDate();
}