import { z } from "zod";
import { AtributoReadResponseSchema } from "./atributo.schemas";

// ── Esquemas de Lectura (snake_case desde Backend) ───────────────────────────

export const ClaseReadResponseSchema = z.object({
  id: z.string(),
  id_diagrama: z.string(),
  nombre: z.string(),
  posicion_x: z.number(),
  posicion_y: z.number(),
  ancho: z.number(),
  atributos: z.array(AtributoReadResponseSchema).optional().default([]),
});

export const ListaClasesResponseSchema = z.object({
  items: z.array(ClaseReadResponseSchema),
});

export const ClaseDetalleResponseSchema = ClaseReadResponseSchema;

// ── Esquemas de Mutación / Petición ──────────────────────────────────────────

export const CrearClaseInputSchema = z.object({
  idClase: z.string().uuid("El ID de clase debe ser un UUID válido.").optional(),
  idAtributoInicial: z
    .string()
    .uuid("El ID de atributo inicial debe ser un UUID válido.")
    .optional(),
  nombre: z
    .string()
    .trim()
    .min(1, "El nombre de la clase no puede estar vacío.")
    .max(50, "El nombre no puede superar 50 caracteres.")
    .optional()
    .default("Tabla"),
  posicionX: z.number(),
  posicionY: z.number(),
  ancho: z.number().positive("El ancho debe ser positivo.").optional().default(280),
});

export const ActualizarClaseInputSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(1, "El nombre de la clase no puede estar vacío.")
    .max(50, "El nombre no puede superar 50 caracteres.")
    .optional(),
  posicionX: z.number().optional(),
  posicionY: z.number().optional(),
  ancho: z.number().positive("El ancho debe ser positivo.").optional(),
});
