"use server";

import { z } from "zod";
import type { ApiResult } from "@/features/shared/domain/types/api-results";
import type {
  InteraccionIa,
  ListaInteraccionesIa,
} from "../../domain/entities/interaccion-ia.entity";
import { interaccionIaRepositoryImpl } from "../../infrastructure/repositories/interaccion-ia.repository";
import { EnviarMensajeIaRequestSchema } from "../../infrastructure/schemas/interaccion-ia.schemas";

const IdDiagramaParamSchema = z
  .string()
  .min(1, "Identificador de diagrama inválido");

export async function listarInteraccionesIaAction(
  idDiagrama: string,
  cursor?: string,
  limite?: number
): Promise<ApiResult<ListaInteraccionesIa>> {
  const parsedDiagrama = IdDiagramaParamSchema.safeParse(idDiagrama);
  if (!parsedDiagrama.success) {
    return {
      ok: false,
      statusCode: 400,
      errors: ["Identificador de diagrama inválido."],
    };
  }

  return interaccionIaRepositoryImpl.listarInteracciones(
    parsedDiagrama.data,
    cursor,
    limite
  );
}

export async function enviarMensajeIaAction(
  idDiagrama: string,
  datos: unknown
): Promise<ApiResult<InteraccionIa>> {
  const parsedDiagrama = IdDiagramaParamSchema.safeParse(idDiagrama);
  if (!parsedDiagrama.success) {
    return {
      ok: false,
      statusCode: 400,
      errors: ["Identificador de diagrama inválido."],
    };
  }

  const parsedBody = EnviarMensajeIaRequestSchema.safeParse(datos);
  if (!parsedBody.success) {
    const errorMsg =
      parsedBody.error.issues[0]?.message ||
      "El mensaje enviado contiene datos inválidos.";
    return {
      ok: false,
      statusCode: 400,
      errors: [errorMsg],
    };
  }

  return interaccionIaRepositoryImpl.enviarMensaje(
    parsedDiagrama.data,
    parsedBody.data
  );
}
