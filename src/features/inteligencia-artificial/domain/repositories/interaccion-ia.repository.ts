import type { ApiResult } from "@/features/shared/domain/types/api-results";
import type {
  EnviarMensajeIaData,
  InteraccionIa,
  ListaInteraccionesIa,
} from "../entities/interaccion-ia.entity";
import type { TranscripcionIaResponse } from "../../infrastructure/schemas/transcripcion-ia.schemas";

export interface OpcionesListarInteracciones {
  cursor?: string;
  limite?: number;
  offset?: number;
}

export interface InteraccionIaRepository {
  listarInteracciones(
    idDiagrama: string,
    cursorUopciones?: string | OpcionesListarInteracciones,
    limite?: number
  ): Promise<ApiResult<ListaInteraccionesIa>>;

  enviarMensaje(
    idDiagrama: string,
    datos: EnviarMensajeIaData
  ): Promise<ApiResult<InteraccionIa>>;

  enviarAudio(
    idDiagrama: string,
    blob: Blob,
    claveIdempotencia: string,
    mimeType?: string,
    duracionSegundos?: number
  ): Promise<ApiResult<InteraccionIa>>;

  enviarImagen(
    idDiagrama: string,
    blob: Blob,
    claveIdempotencia: string,
    nombreArchivo?: string
  ): Promise<ApiResult<InteraccionIa>>;

  transcribirAudio(
    idDiagrama: string,
    blob: Blob,
    mimeType?: string,
    duracionSegundos?: number
  ): Promise<ApiResult<TranscripcionIaResponse>>;
}
