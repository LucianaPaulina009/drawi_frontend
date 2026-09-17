import type {
  ApiActionResult,
  ApiResult,
} from "@/features/shared/domain/types/api-results";
import {
  apiRequestData,
  apiRequestStatus,
} from "@/features/shared/infrastructure/http/api-client";
import type {
  ActualizarClaseData,
  Clase,
  CrearClaseData,
} from "../../domain/entities/clase.entity";
import type { ClaseRepository } from "../../domain/repositories/clase.repository";
import { claseMapper } from "../mappers/clase.mapper";
import {
  ClaseDetalleResponseSchema,
  ClaseReadResponseSchema,
  ListaClasesResponseSchema,
} from "../schemas/clase.schemas";

const rawBackendUrl = (
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"
).replace(/\/+$/, "");

const BASE_URL = rawBackendUrl.endsWith("/api")
  ? `${rawBackendUrl}/diagramas`
  : `${rawBackendUrl}/api/diagramas`;

export const claseRepositoryImpl: ClaseRepository = {
  listarClases(idDiagrama: string): Promise<ApiResult<Clase[]>> {
    return apiRequestData({
      url: `${BASE_URL}/${idDiagrama}/clases`,
      method: "GET",
      responseSchema: ListaClasesResponseSchema,
      mapData: claseMapper.toListaClases,
      fallbackMessage: "Error al obtener las clases del diagrama.",
    });
  },

  obtenerClase(
    idDiagrama: string,
    idClase: string
  ): Promise<ApiResult<Clase>> {
    return apiRequestData({
      url: `${BASE_URL}/${idDiagrama}/clases/${idClase}`,
      method: "GET",
      responseSchema: ClaseDetalleResponseSchema,
      mapData: claseMapper.toClase,
      fallbackMessage: "Error al obtener la información de la clase.",
    });
  },

  crearClase(
    idDiagrama: string,
    datos: CrearClaseData
  ): Promise<ApiResult<Clase>> {
    const payload = claseMapper.toCrearClaseRequest(datos);
    return apiRequestData({
      url: `${BASE_URL}/${idDiagrama}/clases`,
      method: "POST",
      body: payload,
      responseSchema: ClaseDetalleResponseSchema,
      mapData: claseMapper.toClase,
      fallbackMessage: "Error al crear la clase UML.",
    });
  },

  actualizarClase(
    idDiagrama: string,
    idClase: string,
    datos: ActualizarClaseData
  ): Promise<ApiResult<Clase>> {
    const payload = claseMapper.toActualizarClaseRequest(datos);
    return apiRequestData({
      url: `${BASE_URL}/${idDiagrama}/clases/${idClase}`,
      method: "PATCH",
      body: payload,
      responseSchema: ClaseReadResponseSchema,
      mapData: (raw) => {
        // preserve existing attributes if backend returned ClaseRead without full attributes
        return claseMapper.toClase(raw);
      },
      fallbackMessage: "Error al actualizar la clase UML.",
    });
  },

  eliminarClase(
    idDiagrama: string,
    idClase: string
  ): Promise<ApiActionResult> {
    return apiRequestStatus({
      url: `${BASE_URL}/${idDiagrama}/clases/${idClase}`,
      method: "DELETE",
      fallbackMessage: "Error al eliminar la clase UML.",
    });
  },
};
