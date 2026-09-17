import type {
  ApiActionResult,
  ApiResult,
} from "@/features/shared/domain/types/api-results";
import type {
  ActualizarAtributoData,
  Atributo,
  CrearAtributoData,
} from "../entities/atributo.entity";

export interface AtributoRepository {
  listarAtributos(idClase: string): Promise<ApiResult<Atributo[]>>;
  obtenerAtributo(
    idClase: string,
    idAtributo: string
  ): Promise<ApiResult<Atributo>>;
  crearAtributo(
    idClase: string,
    datos: CrearAtributoData
  ): Promise<ApiResult<Atributo>>;
  actualizarAtributo(
    idClase: string,
    idAtributo: string,
    datos: ActualizarAtributoData
  ): Promise<ApiResult<Atributo>>;
  eliminarAtributo(
    idClase: string,
    idAtributo: string
  ): Promise<ApiActionResult>;
}
