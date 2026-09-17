import type {
  ApiActionResult,
  ApiResult,
} from "@/features/shared/domain/types/api-results";
import type {
  CambiarRolData,
  MiembroProyecto,
} from "../entities/colaborador.entity";

export interface ColaboradorRepository {
  listarMiembros(proyectoId: string): Promise<ApiResult<MiembroProyecto[]>>;
  cambiarRol(
    proyectoId: string,
    colaboradorId: string,
    datos: CambiarRolData
  ): Promise<ApiActionResult>;
  removerColaborador(
    proyectoId: string,
    colaboradorId: string
  ): Promise<ApiActionResult>;
  bloquearColaborador(
    proyectoId: string,
    colaboradorId: string
  ): Promise<ApiActionResult>;
  desbloquearColaborador(
    proyectoId: string,
    colaboradorId: string
  ): Promise<ApiActionResult>;
}
