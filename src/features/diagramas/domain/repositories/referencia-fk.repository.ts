import type { ApiActionResult, ApiResult } from "@/features/shared/domain/types/api-results";
import type { ActualizarReferenciaFkData, CrearReferenciaFkData, ReferenciaFk } from "../entities/referencia-fk.entity";

export interface ReferenciaFkRepository {
  crearReferenciaFk(idRelacion: string, datos: CrearReferenciaFkData): Promise<ApiResult<ReferenciaFk>>;
  actualizarReferenciaFk(idRelacion: string, idReferencia: string, datos: ActualizarReferenciaFkData): Promise<ApiResult<ReferenciaFk>>;
  eliminarReferenciaFk(idRelacion: string, idReferencia: string): Promise<ApiActionResult>;
}
