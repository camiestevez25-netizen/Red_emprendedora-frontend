export type EstadoEvento = 'Activo' | 'Agotado' | 'Cancelado';

//GET /api/eventos y GET /api/eventos/{id}
export interface Evento {
    id: number;
    nombre: string;
    fechaInicio: string; // uuuu-M-d
    fechaFin: string;
    estado: EstadoEvento;
    precioEntrada: number | null;
    estradaGratuita: boolean;
    precioEntradaTexto: string;
    metrosCuadrados: string;
    idLocalidad: number;
    nombreLocalidad: string;
    idUsuario: number;
    nombreOrganizador: string;
}

// POST /api/eventos
export interface EventoRequest {
    nombre: string;
    fehcaInicio: string;
    fechaFin: string;
    precioEntrada: number | null;
    metrosCuadrados: string;
    idLocalidad: number;
}

// PUT /api/eventos/{id}: solo se modifica lo que se manda
export type EventoUpdate = Partial<EventoRequest>;

// Filtros de GET /api/eventos
export interface EventoFiltro {
    estado?: EstadoEvento;
    idLocalidad?: number;
    idUsuario?: number;
}