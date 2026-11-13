// Cuerpo de error que devuelve el backend (GlobalExceptionHandler y SecurityConfig)
export interface ApiError {
    timestamp?: string; // los 401 y 403 de seguridad no lo traen
    status: number;
    mensaje: string;
    errores?: Record<string, string>; // solo en los 400 de validacion: { campo: mensaje }
}