export type TipoInteraccionIa =
  | "CONVERSACION"
  | "GENERACION_BACKEND"
  | "VISION_IMAGEN"
  | "VOZ_AUDIO";

export type EstadoInteraccionIa =
  | "PENDIENTE"
  | "PROCESANDO"
  | "COMPLETADO"
  | "ERROR";

export interface InteraccionIa {
  id: string;
  idDiagrama: string;
  idUsuario: string;
  tipo: TipoInteraccionIa;
  estado: EstadoInteraccionIa;
  entradaUsuario: string | null;
  respuestaIa: string | null;
  claveIdempotencia: string;
  nombreArchivo?: string | null;
  tamanoBytes?: number | null;
  duracionSegundos?: number | null;
  metadatos?: Record<string, unknown> | null;
  creadoEn: string;
  actualizadoEn?: string | null;
  eliminadoEn?: string | null;
}

export interface ListaInteraccionesIa {
  items: InteraccionIa[];
  proximoCursor?: string | null;
  total?: number | null;
}

export interface EnviarMensajeIaData {
  texto: string;
  claveIdempotencia: string;
}
