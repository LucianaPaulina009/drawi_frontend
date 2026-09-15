import type {
  ApiActionResult,
  ApiResult,
} from "@/features/shared/domain/types/api-results";
import type {
  ActualizarDiagramaData,
  CrearDiagramaData,
  Diagrama,
  DiagramaDetalle,
} from "../entities/diagrama.entity";

export interface DiagramaRepository {
  listarDiagramas(idProyecto: string): Promise<ApiResult<Diagrama[]>>;
  obtenerDiagrama(
    idProyecto: string,
    idDiagrama: string
  ): Promise<ApiResult<DiagramaDetalle>>;
  crearDiagrama(
    idProyecto: string,
    datos?: CrearDiagramaData
  ): Promise<ApiResult<Diagrama>>;
  actualizarDiagrama(
    idProyecto: string,
    idDiagrama: string,
    datos: ActualizarDiagramaData
  ): Promise<ApiResult<Diagrama>>;
  eliminarDiagrama(
    idProyecto: string,
    idDiagrama: string
  ): Promise<ApiActionResult>;
}
