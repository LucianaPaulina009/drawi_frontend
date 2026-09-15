import type { ApiResult, ApiActionResult } from "@/features/shared/domain/types/api-results";
import type {
  ActualizarProyectoData,
  Proyecto,
  ProyectoCreado,
} from "../entities/proyecto.entity";

export interface ProyectoRepository {
  listarProyectos(): Promise<ApiResult<Proyecto[]>>;
  listarFavoritos(): Promise<ApiResult<Proyecto[]>>;
  crearProyecto(): Promise<ApiResult<ProyectoCreado>>;
  actualizarProyecto(
    id: string,
    datos: ActualizarProyectoData
  ): Promise<ApiActionResult>;
  eliminarProyecto(id: string): Promise<ApiActionResult>;
  agregarFavorito(id: string): Promise<ApiActionResult>;
  desmarcarFavorito(id: string): Promise<ApiActionResult>;
}
