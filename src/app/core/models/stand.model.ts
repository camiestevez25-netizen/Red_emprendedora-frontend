// GET /api/stands (paginando), GET /api/stands/{id}
export interface Stand {
    idStand: number;
    costoStand: number;
    estadoStand: boolean; // true = Disponible, false= Ocupado
    estadoStandTexto: 'Disponible' | 'Ocupado';
    numeroStand: number;
    idEvento: number;
    nombreEvento: string;
    estadoEvento: string;
    idUsuario: number | null;
    nombreUsuario: string | null;
    nombreEmprendimiento: string | null;
}

// POST /api/stands y PUT /api/stands/{id}
export interface StandRequest {
    costoStand: number; // > 0
    numeroStand: number; // >= 1
    idEvento: number;
}

// Filtros de GET /api/stands (más page, size y sort)
export interface StandFiltro {
    idEvento?: number;
    estadoStand?: boolean;
    numeroStand?: number;
    nombreEvento?: string;
    idUsuario?: number;
}