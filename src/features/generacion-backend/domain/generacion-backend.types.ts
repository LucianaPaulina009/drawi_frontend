export type EstadoGeneracionFrontend = "idle" | "generando" | "completado" | "error";

export interface ErrorBloqueante {
  codigo: string;
  mensaje: string;
  elemento_tipo: string;
  elemento_id?: string | null;
  detalle?: string | null;
}

export interface DiagnosticoGeneracionError {
  code: string;
  message: string;
  errores_bloqueantes: ErrorBloqueante[];
}

export interface DescargaBackendResultado {
  nombreArchivo: string;
  blob: Blob;
}
