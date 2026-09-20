import type { ApiResult } from "@/features/shared/domain/types/api-results";
import { apiRequestData } from "@/features/shared/infrastructure/http/api-client";
import type {
  ConfirmacionOperacionDiagrama,
  EventoEditor,
} from "../../domain/entities/evento-editor.entity";
import type { OperacionDiagramaRepository } from "../../domain/repositories/operacion-diagrama.repository";
import { operacionDiagramaMapper } from "../mappers/operacion-diagrama.mapper";
import { ConfirmacionOperacionDiagramaResponseSchema } from "../schemas/operacion-diagrama.schemas";

const rawBackendUrl = (
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"
).replace(/\/+$/, "");

const BASE_URL = rawBackendUrl.endsWith("/api")
  ? `${rawBackendUrl}/diagramas`
  : `${rawBackendUrl}/api/diagramas`;

export const operacionDiagramaRepositoryImpl: OperacionDiagramaRepository = {
  procesarOperacion(
    diagramaId: string,
    actionId: string,
    evento: EventoEditor
  ): Promise<ApiResult<ConfirmacionOperacionDiagrama>> {
    const payload = operacionDiagramaMapper.toRequest(evento);

    return apiRequestData({
      url: `${BASE_URL}/${diagramaId}/operaciones`,
      method: "POST",
      headers: {
        "Idempotency-Key": actionId,
      },
      body: payload,
      responseSchema: ConfirmacionOperacionDiagramaResponseSchema,
      mapData: operacionDiagramaMapper.toDomainConfirmacion,
      fallbackMessage: "Error al procesar la operación en el diagrama.",
    });
  },
};
