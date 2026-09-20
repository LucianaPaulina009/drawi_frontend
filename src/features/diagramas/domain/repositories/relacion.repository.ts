import type { ApiActionResult, ApiResult } from "@/features/shared/domain/types/api-results";
import type { ActualizarRelacionData, CrearRelacionData, Relacion } from "../entities/relacion.entity";

export interface RelacionRepository {
  crearRelacion(idDiagrama: string, datos: CrearRelacionData): Promise<ApiResult<Relacion>>;
  actualizarRelacion(idDiagrama: string, idRelacion: string, datos: ActualizarRelacionData): Promise<ApiResult<Relacion>>;
  eliminarRelacion(idDiagrama: string, idRelacion: string): Promise<ApiActionResult>;
}
