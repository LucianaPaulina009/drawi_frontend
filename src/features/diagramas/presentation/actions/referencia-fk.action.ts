"use server";

import type { ApiActionResult, ApiResult } from "@/features/shared/domain/types/api-results";
import type { ActualizarReferenciaFkData, CrearReferenciaFkData, ReferenciaFk } from "../../domain/entities/referencia-fk.entity";
import { referenciaFkRepositoryImpl } from "../../infrastructure/repositories/referencia-fk.repository";
import { ActualizarReferenciaFkInputSchema, CrearReferenciaFkInputSchema } from "../../infrastructure/schemas/referencia-fk.schemas";
import { IdParamSchema } from "../../infrastructure/schemas/diagrama.schemas";

export async function crearReferenciaFkAction(idRelacion: string, datos: unknown): Promise<ApiResult<ReferenciaFk>> {
  const relacion = IdParamSchema.safeParse(idRelacion); const parsed = CrearReferenciaFkInputSchema.safeParse(datos);
  if (!relacion.success || !parsed.success) return { ok: false, statusCode: 400, errors: [parsed.success ? "Identificador de relación inválido." : (parsed.error.issues[0]?.message ?? "Datos de FK inválidos.")] };
  return referenciaFkRepositoryImpl.crearReferenciaFk(relacion.data, parsed.data as CrearReferenciaFkData);
}
export async function actualizarReferenciaFkAction(idRelacion: string, idReferencia: string, datos: unknown): Promise<ApiResult<ReferenciaFk>> {
  const relacion = IdParamSchema.safeParse(idRelacion); const referencia = IdParamSchema.safeParse(idReferencia); const parsed = ActualizarReferenciaFkInputSchema.safeParse(datos);
  if (!relacion.success || !referencia.success || !parsed.success) return { ok: false, statusCode: 400, errors: [parsed.success ? "Identificadores inválidos." : (parsed.error.issues[0]?.message ?? "Datos de FK inválidos.")] };
  return referenciaFkRepositoryImpl.actualizarReferenciaFk(relacion.data, referencia.data, parsed.data as ActualizarReferenciaFkData);
}
export async function eliminarReferenciaFkAction(idRelacion: string, idReferencia: string): Promise<ApiActionResult> {
  const relacion = IdParamSchema.safeParse(idRelacion); const referencia = IdParamSchema.safeParse(idReferencia);
  if (!relacion.success || !referencia.success) return { ok: false, statusCode: 400, errors: ["Identificadores inválidos."] };
  return referenciaFkRepositoryImpl.eliminarReferenciaFk(relacion.data, referencia.data);
}
