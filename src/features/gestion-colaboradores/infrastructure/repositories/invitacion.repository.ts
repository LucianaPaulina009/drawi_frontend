import type { ApiResult } from "@/features/shared/domain/types/api-results";
import { apiRequestData } from "@/features/shared/infrastructure/http/api-client";
import type {
  Invitacion,
  UnirseInvitacionResult,
  ValidacionInvitacion,
} from "../../domain/entities/invitacion.entity";
import type { InvitacionRepository } from "../../domain/repositories/invitacion.repository";
import { invitacionMapper } from "../mappers/invitacion.mapper";
import {
  InvitacionReadResponseSchema,
  UnirseInvitacionResponseSchema,
  ValidarInvitacionResponseSchema,
} from "../schemas/invitacion.schemas";

const rawBackendUrl = (
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"
).replace(/\/+$/, "");

const API_ROOT = rawBackendUrl.endsWith("/api")
  ? rawBackendUrl
  : `${rawBackendUrl}/api`;

export const invitacionRepositoryImpl: InvitacionRepository = {
  obtenerInvitacion(proyectoId: string): Promise<ApiResult<Invitacion>> {
    return apiRequestData({
      url: `${API_ROOT}/proyectos/${proyectoId}/invitacion`,
      method: "POST",
      responseSchema: InvitacionReadResponseSchema,
      mapData: invitacionMapper.toInvitacion,
      fallbackMessage: "Error al obtener o generar el enlace de invitación.",
    });
  },

  validarInvitacion(codigo: string): Promise<ApiResult<ValidacionInvitacion>> {
    return apiRequestData({
      url: `${API_ROOT}/invitaciones/${codigo}`,
      method: "GET",
      responseSchema: ValidarInvitacionResponseSchema,
      mapData: invitacionMapper.toValidacion,
      fallbackMessage: "Error al validar la invitación del proyecto.",
    });
  },

  unirseProyecto(codigo: string): Promise<ApiResult<UnirseInvitacionResult>> {
    return apiRequestData({
      url: `${API_ROOT}/invitaciones/${codigo}/unirse`,
      method: "POST",
      responseSchema: UnirseInvitacionResponseSchema,
      mapData: invitacionMapper.toUnirseResult,
      fallbackMessage: "Error al unirse al proyecto.",
    });
  },
};
