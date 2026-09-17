"use server";

import type { ApiResult } from "@/features/shared/domain/types/api-results";
import type {
  Invitacion,
  UnirseInvitacionResult,
  ValidacionInvitacion,
} from "../../domain/entities/invitacion.entity";
import { invitacionRepositoryImpl } from "../../infrastructure/repositories/invitacion.repository";

export async function obtenerInvitacionAction(
  proyectoId: string
): Promise<ApiResult<Invitacion>> {
  return invitacionRepositoryImpl.obtenerInvitacion(proyectoId);
}

export async function validarInvitacionAction(
  codigo: string
): Promise<ApiResult<ValidacionInvitacion>> {
  return invitacionRepositoryImpl.validarInvitacion(codigo);
}

export async function unirseProyectoAction(
  codigo: string
): Promise<ApiResult<UnirseInvitacionResult>> {
  return invitacionRepositoryImpl.unirseProyecto(codigo);
}
