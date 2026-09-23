import { z } from "zod";

export const ColorProyectoSchema = z.enum([
  "celeste",
  "rojo",
  "verde",
  "azul",
  "naranja",
  "amarillo",
  "morado",
]);

export const IconoProyectoSchema = z.enum([
  "finanza",
  "almacen",
  "estrella",
  "dinero",
  "caja",
]);

// ── Esquemas de Lectura (snake_case desde el Backend) ─────────────────────────

export const ProyectoReadResponseSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  color: z.string(),
  icono: z.string(),
  fecha_actualizacion: z.string(),
  es_favorito: z.boolean(),
  slug: z.string(),
  propietario_id: z.string().optional(),
  es_dueno: z.boolean().optional(),
});


export const ListaProyectosResponseSchema = z.object({
  items: z.array(ProyectoReadResponseSchema),
});

export const ProyectoCreadoResponseSchema = z.object({
  slug: z.string(),
});

// ── Esquemas de Mutación / Petición (camelCase) ──────────────────────────────

export const ActualizarProyectoRequestSchema = z
  .object({
    nombre: z
      .string()
      .trim()
      .min(1, "El nombre no puede estar vacío.")
      .max(40, "El nombre no puede superar 40 caracteres.")
      .optional(),
    color: ColorProyectoSchema.optional(),
    icono: IconoProyectoSchema.optional(),
  })
  .refine(
    (data) =>
      data.nombre !== undefined ||
      data.color !== undefined ||
      data.icono !== undefined,
    {
      message: "Debe proporcionar al menos un campo para actualizar.",
    }
  );

export const ActualizarProyectoFormSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(1, "El nombre del proyecto es obligatorio.")
    .max(40, "El nombre no puede superar 40 caracteres."),
  color: ColorProyectoSchema,
  icono: IconoProyectoSchema,
});
