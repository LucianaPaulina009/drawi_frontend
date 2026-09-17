import { z } from "zod";

export const InvitacionReadResponseSchema = z.object({
  id: z.string(),
  id_proyecto: z.string(),
  codigo_acceso: z.string(),
  fecha_expiracion: z.string(),
});

export const ValidarInvitacionResponseSchema = z.object({
  codigo: z.string(),
  proyecto_id: z.string(),
  proyecto_nombre: z.string(),
  proyecto_slug: z.string(),
  propietario_nombre: z.string(),
  ha_expirado: z.boolean().default(false),
});

export const UnirseInvitacionResponseSchema = z.object({
  proyecto_id: z.string(),
  proyecto_slug: z.string(),
  diagrama_id: z.string().nullable().optional(),
  rol: z.string(),
  mensaje: z.string(),
});
