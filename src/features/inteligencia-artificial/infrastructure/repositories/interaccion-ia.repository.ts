import type { ApiResult } from "@/features/shared/domain/types/api-results";
import {
  apiRequestData,
  apiRequestFormData,
} from "@/features/shared/infrastructure/http/api-client";
import type {
  EnviarMensajeIaData,
  InteraccionIa,
  ListaInteraccionesIa,
} from "../../domain/entities/interaccion-ia.entity";
import type { InteraccionIaRepository } from "../../domain/repositories/interaccion-ia.repository";
import { interaccionIaMapper } from "../mappers/interaccion-ia.mapper";
import {
  InteraccionIaResponseSchema,
  ListaInteraccionesIaResponseSchema,
} from "../schemas/interaccion-ia.schemas";
import {
  TranscripcionIaResponse,
  TranscripcionIaResponseSchema,
} from "../schemas/transcripcion-ia.schemas";

const rawBackendUrl = (
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"
).replace(/\/+$/, "");

const BASE_URL = rawBackendUrl.endsWith("/api")
  ? `${rawBackendUrl}/diagramas`
  : `${rawBackendUrl}/api/diagramas`;

export const interaccionIaRepositoryImpl: InteraccionIaRepository = {
  listarInteracciones(
    idDiagrama: string,
    cursor?: string,
    limite?: number
  ): Promise<ApiResult<ListaInteraccionesIa>> {
    const params = new URLSearchParams();
    if (cursor) params.set("cursor", cursor);
    if (limite) params.set("limite", limite.toString());
    const queryString = params.toString() ? `?${params.toString()}` : "";

    return apiRequestData({
      url: `${BASE_URL}/${idDiagrama}/interacciones-ia${queryString}`,
      method: "GET",
      responseSchema: ListaInteraccionesIaResponseSchema,
      mapData: interaccionIaMapper.toListaDomain,
      fallbackMessage: "Error al obtener el historial de interacciones IA.",
    });
  },

  enviarMensaje(
    idDiagrama: string,
    datos: EnviarMensajeIaData
  ): Promise<ApiResult<InteraccionIa>> {
    return apiRequestData({
      url: `${BASE_URL}/${idDiagrama}/interacciones-ia`,
      method: "POST",
      body: {
        texto: datos.texto.trim(),
        claveIdempotencia: datos.claveIdempotencia,
        tipoInteraccion: datos.tipoInteraccion,
      },
      responseSchema: InteraccionIaResponseSchema,
      mapData: interaccionIaMapper.toDomain,
      fallbackMessage: "Error al comunicarse con el asistente DRAWI.",
    });
  },

  enviarAudio(
    idDiagrama: string,
    blob: Blob,
    claveIdempotencia: string,
    mimeType?: string,
    duracionSegundos?: number
  ): Promise<ApiResult<InteraccionIa>> {
    const formData = new FormData();
    const type = mimeType || blob.type || "audio/webm";
    const extension = type.includes("ogg")
      ? "ogg"
      : type.includes("wav")
      ? "wav"
      : type.includes("mp4") || type.includes("m4a")
      ? "m4a"
      : type.includes("mp3") || type.includes("mpeg")
      ? "mp3"
      : "webm";
    formData.append("audio", blob, `grabacion.${extension}`);
    formData.append("clave_idempotencia", claveIdempotencia);
    if (duracionSegundos !== undefined && duracionSegundos > 0) {
      formData.append("duracion_segundos", duracionSegundos.toString());
    }

    return apiRequestFormData({
      url: `${BASE_URL}/${idDiagrama}/interacciones-ia/audio`,
      method: "POST",
      body: formData,
      responseSchema: InteraccionIaResponseSchema,
      mapData: interaccionIaMapper.toDomain,
      fallbackMessage: "Error al procesar la grabación de voz con el asistente DRAWI.",
    });
  },

  enviarImagen(
    idDiagrama: string,
    blob: Blob,
    claveIdempotencia: string,
    nombreArchivo?: string
  ): Promise<ApiResult<InteraccionIa>> {
    const formData = new FormData();
    const fileName = nombreArchivo || "diagrama.png";
    formData.append("imagen", blob, fileName);
    formData.append("clave_idempotencia", claveIdempotencia);

    return apiRequestFormData({
      url: `${BASE_URL}/${idDiagrama}/interacciones-ia/imagen`,
      method: "POST",
      body: formData,
      responseSchema: InteraccionIaResponseSchema,
      mapData: interaccionIaMapper.toDomain,
      fallbackMessage: "Error al procesar la imagen con el asistente DRAWI.",
    });
  },

  transcribirAudio(
    idDiagrama: string,
    blob: Blob,
    mimeType?: string,
    duracionSegundos?: number
  ): Promise<ApiResult<TranscripcionIaResponse>> {
    const formData = new FormData();
    const type = mimeType || blob.type || "audio/webm";
    const extension = type.includes("ogg")
      ? "ogg"
      : type.includes("wav")
      ? "wav"
      : type.includes("mp4") || type.includes("m4a")
      ? "m4a"
      : type.includes("mp3") || type.includes("mpeg")
      ? "mp3"
      : "webm";
    formData.append("audio", blob, `grabacion.${extension}`);
    if (duracionSegundos !== undefined && duracionSegundos > 0) {
      formData.append("duracion_segundos", duracionSegundos.toString());
    }

    return apiRequestFormData({
      url: `${BASE_URL}/${idDiagrama}/transcripciones-ia`,
      method: "POST",
      body: formData,
      responseSchema: TranscripcionIaResponseSchema,
      fallbackMessage: "Error al transcribir el audio grabado.",
    });
  },
};
