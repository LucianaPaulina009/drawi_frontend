import type { z } from "zod";
import type {
  CambiarRolData,
  EstadoColaborador,
  MiembroProyecto,
  RolColaborador,
} from "../../domain/entities/colaborador.entity";
import type {
  ListaMiembrosResponseSchema,
  MiembroReadResponseSchema,
} from "../schemas/colaborador.schemas";

export const colaboradorMapper = {
  toMiembro(
    dto: z.infer<typeof MiembroReadResponseSchema>
  ): MiembroProyecto {
    return {
      id: dto.id,
      usuarioId: dto.usuario_id,
      nombre: dto.nombre,
      email: dto.email,
      avatarUrl: dto.avatar_url ?? null,
      rol: dto.rol as RolColaborador,
      estado: dto.estado as EstadoColaborador,
      esPropietario: dto.es_propietario,
    };
  },

  toListaMiembros(
    dto: z.infer<typeof ListaMiembrosResponseSchema>
  ): MiembroProyecto[] {
    return dto.items.map(colaboradorMapper.toMiembro);
  },

  toCambiarRolRequest(datos: CambiarRolData): { rol: string } {
    return {
      rol: datos.rol,
    };
  },
};
