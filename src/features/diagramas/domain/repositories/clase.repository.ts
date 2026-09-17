import type {
  ApiActionResult,
  ApiResult,
} from "@/features/shared/domain/types/api-results";
import type {
  ActualizarClaseData,
  Clase,
  CrearClaseData,
} from "../entities/clase.entity";

export interface ClaseRepository {
  listarClases(idDiagrama: string): Promise<ApiResult<Clase[]>>;
  obtenerClase(idDiagrama: string, idClase: string): Promise<ApiResult<Clase>>;
  crearClase(
    idDiagrama: string,
    datos: CrearClaseData
  ): Promise<ApiResult<Clase>>;
  actualizarClase(
    idDiagrama: string,
    idClase: string,
    datos: ActualizarClaseData
  ): Promise<ApiResult<Clase>>;
  eliminarClase(idDiagrama: string, idClase: string): Promise<ApiActionResult>;
}
