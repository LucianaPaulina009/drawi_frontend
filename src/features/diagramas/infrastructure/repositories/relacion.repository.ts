import type { ApiActionResult, ApiResult } from "@/features/shared/domain/types/api-results";
import { apiRequestData, apiRequestStatus } from "@/features/shared/infrastructure/http/api-client";
import type { ActualizarRelacionData, CrearRelacionData, Relacion } from "../../domain/entities/relacion.entity";
import type { RelacionRepository } from "../../domain/repositories/relacion.repository";
import { relacionMapper } from "../mappers/relacion.mapper";
import { RelacionReadResponseSchema } from "../schemas/relacion.schemas";

const baseUrl = (process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000").replace(/\/+$/, "");
const BASE_URL = baseUrl.endsWith("/api") ? `${baseUrl}/diagramas` : `${baseUrl}/api/diagramas`;

export const relacionRepositoryImpl: RelacionRepository = {
  crearRelacion(idDiagrama: string, datos: CrearRelacionData): Promise<ApiResult<Relacion>> {
    return apiRequestData({ url: `${BASE_URL}/${idDiagrama}/relaciones`, method: "POST", body: relacionMapper.toCrearRelacionRequest(datos), responseSchema: RelacionReadResponseSchema, mapData: relacionMapper.toRelacion, fallbackMessage: "No se pudo crear la relación." });
  },
  actualizarRelacion(idDiagrama: string, idRelacion: string, datos: ActualizarRelacionData): Promise<ApiResult<Relacion>> {
    return apiRequestData({ url: `${BASE_URL}/${idDiagrama}/relaciones/${idRelacion}`, method: "PATCH", body: relacionMapper.toActualizarRelacionRequest(datos), responseSchema: RelacionReadResponseSchema, mapData: relacionMapper.toRelacion, fallbackMessage: "No se pudo actualizar la relación." });
  },
  eliminarRelacion(idDiagrama: string, idRelacion: string): Promise<ApiActionResult> {
    return apiRequestStatus({ url: `${BASE_URL}/${idDiagrama}/relaciones/${idRelacion}`, method: "DELETE", fallbackMessage: "No se pudo eliminar la relación." });
  },
};
