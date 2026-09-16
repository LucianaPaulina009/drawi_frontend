import type {
  ApiActionResult,
  ApiResult,
} from "@/features/shared/domain/types/api-results";
import {
  apiRequestData,
  apiRequestStatus,
} from "@/features/shared/infrastructure/http/api-client";
import type {
  CambiarRolData,
  MiembroProyecto,
} from "../../domain/entities/colaborador.entity";
import type { ColaboradorRepository } from "../../domain/repositories/colaborador.repository";
import { colaboradorMapper } from "../mappers/colaborador.mapper";
import { ListaMiembrosResponseSchema } from "../schemas/colaborador.schemas";

const rawBackendUrl = (
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"
).replace(/\/+$/, "");

const API_ROOT = rawBackendUrl.endsWith("/api")
  ? rawBackendUrl
  : `${rawBackendUrl}/api`;

export const colaboradorRepositoryImpl: ColaboradorRepository = {
  listarMiembros(proyectoId: string): Promise<ApiResult<MiembroProyecto[]>> {
    return apiRequestData({
      url: `${API_ROOT}/proyectos/${proyectoId}/miembros`,
      method: "GET",
      responseSchema: ListaMiembrosResponseSchema,
      mapData: colaboradorMapper.toListaMiembros,
      fallbackMessage: "Error al listar los miembros del proyecto.",
    });
  },

  cambiarRol(
    proyectoId: string,
    colaboradorId: string,
    datos: CambiarRolData
  ): Promise<ApiActionResult> {
    const payload = colaboradorMapper.toCambiarRolRequest(datos);
    return apiRequestStatus({
      url: `${API_ROOT}/proyectos/${proyectoId}/miembros/${colaboradorId}/rol`,
      method: "PATCH",
      body: payload,
      fallbackMessage: "Error al actualizar el rol del miembro.",
    });
  },

  removerColaborador(
    proyectoId: string,
    colaboradorId: string
  ): Promise<ApiActionResult> {
    return apiRequestStatus({
      url: `${API_ROOT}/proyectos/${proyectoId}/miembros/${colaboradorId}`,
      method: "DELETE",
      fallbackMessage: "Error al remover al miembro del proyecto.",
    });
  },

  bloquearColaborador(
    proyectoId: string,
    colaboradorId: string
  ): Promise<ApiActionResult> {
    return apiRequestStatus({
      url: `${API_ROOT}/proyectos/${proyectoId}/miembros/${colaboradorId}/bloquear`,
      method: "POST",
      fallbackMessage: "Error al bloquear al miembro en el proyecto.",
    });
  },

  desbloquearColaborador(
    proyectoId: string,
    colaboradorId: string
  ): Promise<ApiActionResult> {
    return apiRequestStatus({
      url: `${API_ROOT}/proyectos/${proyectoId}/miembros/${colaboradorId}/desbloquear`,
      method: "POST",
      fallbackMessage: "Error al desbloquear al miembro en el proyecto.",
    });
  },
};
