import type {
  ApiActionResult,
  ApiResult,
} from "@/features/shared/domain/types/api-results";
import {
  apiRequestData,
  apiRequestStatus,
} from "@/features/shared/infrastructure/http/api-client";
import type {
  ActualizarAtributoData,
  Atributo,
  CrearAtributoData,
} from "../../domain/entities/atributo.entity";
import type { AtributoRepository } from "../../domain/repositories/atributo.repository";
import { atributoMapper } from "../mappers/atributo.mapper";
import {
  AtributoReadResponseSchema,
  ListaAtributosResponseSchema,
} from "../schemas/atributo.schemas";

const rawBackendUrl = (
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"
).replace(/\/+$/, "");

const BASE_URL = rawBackendUrl.endsWith("/api")
  ? `${rawBackendUrl}/clases`
  : `${rawBackendUrl}/api/clases`;

export const atributoRepositoryImpl: AtributoRepository = {
  listarAtributos(idClase: string): Promise<ApiResult<Atributo[]>> {
    return apiRequestData({
      url: `${BASE_URL}/${idClase}/atributos`,
      method: "GET",
      responseSchema: ListaAtributosResponseSchema,
      mapData: atributoMapper.toListaAtributos,
      fallbackMessage: "Error al obtener los atributos de la clase.",
    });
  },

  obtenerAtributo(
    idClase: string,
    idAtributo: string
  ): Promise<ApiResult<Atributo>> {
    return apiRequestData({
      url: `${BASE_URL}/${idClase}/atributos/${idAtributo}`,
      method: "GET",
      responseSchema: AtributoReadResponseSchema,
      mapData: atributoMapper.toAtributo,
      fallbackMessage: "Error al obtener el atributo.",
    });
  },

  crearAtributo(
    idClase: string,
    datos: CrearAtributoData
  ): Promise<ApiResult<Atributo>> {
    const payload = atributoMapper.toCrearAtributoRequest(datos);
    return apiRequestData({
      url: `${BASE_URL}/${idClase}/atributos`,
      method: "POST",
      body: payload,
      responseSchema: AtributoReadResponseSchema,
      mapData: atributoMapper.toAtributo,
      fallbackMessage: "Error al crear el atributo.",
    });
  },

  actualizarAtributo(
    idClase: string,
    idAtributo: string,
    datos: ActualizarAtributoData
  ): Promise<ApiResult<Atributo>> {
    const payload = atributoMapper.toActualizarAtributoRequest(datos);
    return apiRequestData({
      url: `${BASE_URL}/${idClase}/atributos/${idAtributo}`,
      method: "PATCH",
      body: payload,
      responseSchema: AtributoReadResponseSchema,
      mapData: atributoMapper.toAtributo,
      fallbackMessage: "Error al actualizar el atributo.",
    });
  },

  eliminarAtributo(
    idClase: string,
    idAtributo: string
  ): Promise<ApiActionResult> {
    return apiRequestStatus({
      url: `${BASE_URL}/${idClase}/atributos/${idAtributo}`,
      method: "DELETE",
      fallbackMessage: "Error al eliminar el atributo.",
    });
  },
};
