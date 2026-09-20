import type { ApiActionResult, ApiResult } from "@/features/shared/domain/types/api-results";
import { apiRequestData, apiRequestStatus } from "@/features/shared/infrastructure/http/api-client";
import type { ActualizarReferenciaFkData, CrearReferenciaFkData, ReferenciaFk } from "../../domain/entities/referencia-fk.entity";
import type { ReferenciaFkRepository } from "../../domain/repositories/referencia-fk.repository";
import { referenciaFkMapper } from "../mappers/referencia-fk.mapper";
import { ReferenciaFkReadResponseSchema } from "../schemas/referencia-fk.schemas";

const baseUrl = (process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000").replace(/\/+$/, "");
const BASE_URL = baseUrl.endsWith("/api") ? `${baseUrl}/relaciones` : `${baseUrl}/api/relaciones`;

export const referenciaFkRepositoryImpl: ReferenciaFkRepository = {
  crearReferenciaFk(idRelacion: string, datos: CrearReferenciaFkData): Promise<ApiResult<ReferenciaFk>> {
    return apiRequestData({ url: `${BASE_URL}/${idRelacion}/referencias-fk`, method: "POST", body: referenciaFkMapper.toCrearReferenciaFkRequest(datos), responseSchema: ReferenciaFkReadResponseSchema, mapData: referenciaFkMapper.toReferenciaFk, fallbackMessage: "No se pudo crear la referencia FK." });
  },
  actualizarReferenciaFk(idRelacion: string, idReferencia: string, datos: ActualizarReferenciaFkData): Promise<ApiResult<ReferenciaFk>> {
    return apiRequestData({ url: `${BASE_URL}/${idRelacion}/referencias-fk/${idReferencia}`, method: "PATCH", body: referenciaFkMapper.toActualizarReferenciaFkRequest(datos), responseSchema: ReferenciaFkReadResponseSchema, mapData: referenciaFkMapper.toReferenciaFk, fallbackMessage: "No se pudo actualizar la referencia FK." });
  },
  eliminarReferenciaFk(idRelacion: string, idReferencia: string): Promise<ApiActionResult> {
    return apiRequestStatus({ url: `${BASE_URL}/${idRelacion}/referencias-fk/${idReferencia}`, method: "DELETE", fallbackMessage: "No se pudo eliminar la referencia FK." });
  },
};
