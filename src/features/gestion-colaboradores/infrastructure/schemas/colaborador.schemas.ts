import { z } from "zod";

export const RolColaboradorSchema = z.enum(["ver", "editor", "comentarista"]);

export const CambiarRolRequestSchema = z.object({
  rol: RolColaboradorSchema,
});

export const MiembroReadResponseSchema = z.object({
  id: z.string(),
  usuario_id: z.string(),
  nombre: z.string(),
  email: z.string(),
  avatar_url: z.string().nullable().optional(),
  rol: z.string(),
  estado: z.string(),
  es_propietario: z.boolean(),
});

export const ListaMiembrosResponseSchema = z.object({
  items: z.array(MiembroReadResponseSchema),
});
