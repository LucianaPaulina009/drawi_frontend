import type {
  ApiFileResult,
  ApiResult,
} from "@/features/shared/domain/types/api-results";
import type { ResultadoImportacionEa } from "../entities/intercambio-enterprise-architect.entity";

export interface IntercambioEnterpriseArchitectRepository {
  exportarDiagramaEa(
    idDiagrama: string,
    idProyecto: string
  ): Promise<ApiFileResult>;
  importarDiagramaEa(
    idDiagrama: string,
    idProyecto: string,
    archivo: File
  ): Promise<ApiResult<ResultadoImportacionEa>>;
}
