import { ApiFileResult } from "@/features/shared/domain/types/api-results";
import { apiRequestFile } from "@/features/shared/infrastructure/http/api-client";
import { GeneracionBackendRepository } from "../../domain/repositories/generacion-backend.repository";

const rawBackendUrl = (
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"
).replace(/\/+$/, "");

const BASE_URL = rawBackendUrl.endsWith("/api")
  ? `${rawBackendUrl}/diagramas`
  : `${rawBackendUrl}/api/diagramas`;

export const generacionBackendRepositoryImpl: GeneracionBackendRepository = {
  solicitarGeneracionBackend(diagramaId: string): Promise<ApiFileResult> {
    return apiRequestFile({
      url: `${BASE_URL}/${diagramaId}/generaciones-backend`,
      method: "POST",
      defaultFileName: `drawi-backend-${diagramaId}.zip`,
      defaultContentType: "application/zip",
      fallbackMessage: "No se pudo generar el backend del diagrama.",
    });
  },
};

export async function solicitarGeneracionBackend(
  diagramaId: string
): Promise<ApiFileResult> {
  return generacionBackendRepositoryImpl.solicitarGeneracionBackend(diagramaId);
}
