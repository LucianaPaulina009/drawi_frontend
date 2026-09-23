import { ApiFileResult } from "@/features/shared/domain/types/api-results";

export interface GeneracionBackendRepository {
  solicitarGeneracionBackend(diagramaId: string): Promise<ApiFileResult>;
}
