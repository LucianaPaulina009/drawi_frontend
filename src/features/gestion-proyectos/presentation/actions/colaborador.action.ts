"use server";

import type {
  ApiActionResult,
  ApiResult,
} from "@/features/shared/domain/types/api-results";
import type {
  CambiarRolData,
  MiembroProyecto,
} from "../../domain/entities/colaborador.entity";
import { colaboradorRepositoryImpl } from "../../infrastructure/repositories/colaborador.repository";
import { CambiarRolRequestSchema } from "../../infrastructure/schemas/colaborador.schemas";

export async function listarMiembrosAction(
  proyectoId: string
): Promise<ApiResult<MiembroProyecto[]>> {
  return colaboradorRepositoryImpl.listarMiembros(proyectoId);
}

export async function cambiarRolAction(
  proyectoId: string,
  colaboradorId: string,
  data: unknown
): Promise<ApiActionResult> {
  const parsed = CambiarRolRequestSchema.safeParse(data);
  if (!parsed.success) {
    const errorMsg =
      parsed.error.issues[0]?.message || "El rol proporcionado no es válido.";
    return {
      ok: false,
      statusCode: 400,
      errors: [errorMsg],
    };
  }

  return colaboradorRepositoryImpl.cambiarRol(
    proyectoId,
    colaboradorId,
    parsed.data as CambiarRolData
  );
}

export async function removerColaboradorAction(
  proyectoId: string,
  colaboradorId: string
): Promise<ApiActionResult> {
  return colaboradorRepositoryImpl.removerColaborador(proyectoId, colaboradorId);
}

export async function bloquearColaboradorAction(
  proyectoId: string,
  colaboradorId: string
): Promise<ApiActionResult> {
  return colaboradorRepositoryImpl.bloquearColaborador(proyectoId, colaboradorId);
}

export async function desbloquearColaboradorAction(
  proyectoId: string,
  colaboradorId: string
): Promise<ApiActionResult> {
  return colaboradorRepositoryImpl.desbloquearColaborador(
    proyectoId,
    colaboradorId
  );
}
