// GET/POST/PUT /api/localidades
export interface localidades {
    idLocalidad?: number; //no se manda al crear
    nombreLocalidad: string; // solo letras max 50
    provinciaLocalidad: string; // solo letras max 50
}