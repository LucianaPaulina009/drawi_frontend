import type { ApiResult } from "@/features/shared/domain/types/api-results";
import type {
  Invitacion,
  UnirseInvitacionResult,
  ValidacionInvitacion,
} from "../entities/invitacion.entity";

export interface InvitacionRepository {
  obtenerInvitacion(proyectoId: string): Promise<ApiResult<Invitacion>>;
  validarInvitacion(codigo: string): Promise<ApiResult<ValidacionInvitacion>>;
  unirseProyecto(codigo: string): Promise<ApiResult<UnirseInvitacionResult>>;
}
