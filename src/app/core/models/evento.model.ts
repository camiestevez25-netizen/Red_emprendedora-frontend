export type EstadoEvento = 'Activo' | 'Agotado' | 'Cancelado';

// GET /api/eventos y GET /api/eventos/{id}
export interface Evento {
  id: number;
  nombre: string;
  fechaInicio: string; // "2026-4-12" (formato uuuu-M-d)
  fechaFin: string;
  estado: EstadoEvento;
  precioEntrada: number | null;
  entradaGratuita: boolean;
  precioEntradaTexto: string;
  metrosCuadrados: string;
  idLocalidad: number;
  nombreLocalidad: string;
  idUsuario: number;
  nombreOrganizador: string;
}

// POST /api/eventos
export interface EventoRequest {
  nombre: string; // máx. 50
  fechaInicio: string; // uuuu-M-d
  fechaFin: string;
  precioEntrada: number | null; // >= 0
  metrosCuadrados: string; // máx. 25
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