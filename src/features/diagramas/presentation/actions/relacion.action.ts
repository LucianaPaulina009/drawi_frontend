"use server";

import type { ApiActionResult, ApiResult } from "@/features/shared/domain/types/api-results";
import type { ActualizarRelacionData, CrearRelacionData, Relacion } from "../../domain/entities/relacion.entity";
import { relacionRepositoryImpl } from "../../infrastructure/repositories/relacion.repository";
import { ActualizarRelacionInputSchema, CrearRelacionInputSchema } from "../../infrastructure/schemas/relacion.schemas";
import { IdParamSchema } from "../../infrastructure/schemas/diagrama.schemas";

export async function crearRelacionAction(idDiagrama: string, datos: unknown): Promise<ApiResult<Relacion>> {
  const diagrama = IdParamSchema.safeParse(idDiagrama); const parsed = CrearRelacionInputSchema.safeParse(datos);
  if (!diagrama.success || !parsed.success) return { ok: false, statusCode: 400, errors: [parsed.success ? "Identificador de diagrama inválido." : (parsed.error.issues[0]?.message ?? "Datos de relación inválidos.")] };
  return relacionRepositoryImpl.crearRelacion(diagrama.data, parsed.data as CrearRelacionData);
}
export async function actualizarRelacionAction(idDiagrama: string, idRelacion: string, datos: unknown): Promise<ApiResult<Relacion>> {
  const diagrama = IdParamSchema.safeParse(idDiagrama); const relacion = IdParamSchema.safeParse(idRelacion); const parsed = ActualizarRelacionInputSchema.safeParse(datos);
  if (!diagrama.success || !relacion.success || !parsed.success) return { ok: false, statusCode: 400, errors: [parsed.success ? "Identificadores inválidos." : (parsed.error.issues[0]?.message ?? "Datos de relación inválidos.")] };
  return relacionRepositoryImpl.actualizarRelacion(diagrama.data, relacion.data, parsed.data as ActualizarRelacionData);
}
export async function eliminarRelacionAction(idDiagrama: string, idRelacion: string): Promise<ApiActionResult> {
  const diagrama = IdParamSchema.safeParse(idDiagrama); const relacion = IdParamSchema.safeParse(idRelacion);
  if (!diagrama.success || !relacion.success) return { ok: false, statusCode: 400, errors: ["Identificadores inválidos."] };
  return relacionRepositoryImpl.eliminarRelacion(diagrama.data, relacion.data);
}
