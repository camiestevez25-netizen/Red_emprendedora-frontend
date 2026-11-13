// GET/POST/PUT /api/localidad
// GET/POST/PUT /api/localidades
export interface Localidad {
  idLocalidad?: number; // no se manda al crear
  nombreLocalidad: string; // solo letras, máx. 50
  provinciaLocalidad: string; // solo letras, máx. 50
}