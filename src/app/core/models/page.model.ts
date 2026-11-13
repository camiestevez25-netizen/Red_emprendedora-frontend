// Page<T> que devuelve Spring (por ejemplo GET /api/stands)
export interface Page<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    number: number; // página actual, empieza en 0
    size: number;
    numberOfElements?: number;
    first: boolean;
    last?: boolean;
    empty: boolean;
}