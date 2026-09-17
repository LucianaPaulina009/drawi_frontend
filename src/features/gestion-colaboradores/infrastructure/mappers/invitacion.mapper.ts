import type { z } from "zod";
import type {
  Invitacion,
  UnirseInvitacionResult,
  ValidacionInvitacion,
} from "../../domain/entities/invitacion.entity";
import type {
  InvitacionReadResponseSchema,
  UnirseInvitacionResponseSchema,
  ValidarInvitacionResponseSchema,
} from "../schemas/invitacion.schemas";

export const invitacionMapper = {
  toInvitacion(dto: z.infer<typeof InvitacionReadResponseSchema>): Invitacion {
    return {
      id: dto.id,
      idProyecto: dto.id_proyecto,
      codigoAcceso: dto.codigo_acceso,
      fechaExpiracion: dto.fecha_expiracion,
    };
  },

  toValidacion(
    dto: z.infer<typeof ValidarInvitacionResponseSchema>
  ): ValidacionInvitacion {
    return {
      codigo: dto.codigo,
      proyectoId: dto.proyecto_id,
      proyectoNombre: dto.proyecto_nombre,
      proyectoSlug: dto.proyecto_slug,
      propietarioNombre: dto.propietario_nombre,
      haExpirado: dto.ha_expirado,
    };
  },

  toUnirseResult(
    dto: z.infer<typeof UnirseInvitacionResponseSchema>
  ): UnirseInvitacionResult {
    return {
      proyectoId: dto.proyecto_id,
      proyectoSlug: dto.proyecto_slug,
      diagramaId: dto.diagrama_id ?? null,
      rol: dto.rol,
      mensaje: dto.mensaje,
    };
  },
};
