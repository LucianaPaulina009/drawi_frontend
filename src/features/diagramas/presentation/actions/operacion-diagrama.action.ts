"use server";

import { z } from "zod";

import type { ApiResult } from "@/features/shared/domain/types/api-results";
import type {
  ConfirmacionOperacionDiagrama,
  EventoEditor,
} from "../../domain/entities/evento-editor.entity";
import { operacionDiagramaMapper } from "../../infrastructure/mappers/operacion-diagrama.mapper";
import { operacionDiagramaRepositoryImpl } from "../../infrastructure/repositories/operacion-diagrama.repository";
import { OperacionDiagramaRequestSchema } from "../../infrastructure/schemas/operacion-diagrama.schemas";

const ActionIdSchema = z.string().min(1, "El actionId es obligatorio.");
const DiagramaIdSchema = z.string().min(1, "El identificador de diagrama es obligatorio.");

export async function procesarOperacionDiagramaAction(
  diagramaId: string,
  actionId: string,
  evento: EventoEditor
): Promise<ApiResult<ConfirmacionOperacionDiagrama>> {
  const parsedDiagrama = DiagramaIdSchema.safeParse(diagramaId);
  const parsedActionId = ActionIdSchema.safeParse(actionId);

  if (!parsedDiagrama.success || !parsedActionId.success) {
    return {
      ok: false,
      statusCode: 400,
      errors: [
        ...(!parsedDiagrama.success ? parsedDiagrama.error.issues.map((i) => i.message) : []),
        ...(!parsedActionId.success ? parsedActionId.error.issues.map((i) => i.message) : []),
      ],
    };
  }

  // Validación sintáctica previa mediante Zod safeParse
  try {
    const rawRequest = operacionDiagramaMapper.toRequest(evento);
    const parsedRequest = OperacionDiagramaRequestSchema.safeParse(rawRequest);

    if (!parsedRequest.success) {
      return {
        ok: false,
        statusCode: 400,
        errors: parsedRequest.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
      };
    }
  } catch (error) {
    return {
      ok: false,
      statusCode: 400,
      errors: [error instanceof Error ? error.message : "Error al procesar el payload del evento."],
    };
  }

  return operacionDiagramaRepositoryImpl.procesarOperacion(
    parsedDiagrama.data,
    parsedActionId.data,
    evento
  );
}
