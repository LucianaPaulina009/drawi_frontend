import type { ApiResult } from "@/features/shared/domain/types/api-results";
import { apiRequestData } from "@/features/shared/infrastructure/http/api-client";
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
      },
      responseSchema: InteraccionIaResponseSchema,
      mapData: interaccionIaMapper.toDomain,
      fallbackMessage: "Error al comunicarse con el asistente DRAWI.",
    });
  },
};
