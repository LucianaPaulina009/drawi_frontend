import type { ApiResult } from "@/features/shared/domain/types/api-results";
import type { ConfirmacionOperacionDiagrama, EventoEditor } from "../entities/evento-editor.entity";

export interface OperacionDiagramaRepository {
  procesarOperacion(
    diagramaId: string,
    actionId: string,
    evento: EventoEditor,
  ): Promise<ApiResult<ConfirmacionOperacionDiagrama>>;
}
