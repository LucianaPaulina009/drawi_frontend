import type { ApiResult } from "@/features/shared/domain/types/api-results";
import type {
  EnviarMensajeIaData,
  InteraccionIa,
  ListaInteraccionesIa,
} from "../entities/interaccion-ia.entity";

export interface InteraccionIaRepository {
  listarInteracciones(
    idDiagrama: string,
    cursor?: string,
    limite?: number
  ): Promise<ApiResult<ListaInteraccionesIa>>;

  enviarMensaje(
    idDiagrama: string,
    datos: EnviarMensajeIaData
  ): Promise<ApiResult<InteraccionIa>>;
}
