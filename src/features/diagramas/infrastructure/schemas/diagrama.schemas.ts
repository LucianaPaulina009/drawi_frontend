import { z } from "zod";

// ── Esquemas de Lectura (snake_case desde Backend) ───────────────────────────

export const DiagramaReadResponseSchema = z.object({
  id: z.string(),
  id_proyecto: z.string(),
  nombre: z.string(),
  numero: z.number().int(),
});

export const ListaDiagramasResponseSchema = z.object({
  items: z.array(DiagramaReadResponseSchema),
});

export const DiagramaDetalleResponseSchema = z.object({
  id: z.string(),
  id_proyecto: z.string(),
  nombre: z.string(),
  numero: z.number().int(),
  clases: z.array(z.unknown()).optional().default([]),
});

// ── Esquemas de Mutación / Petición ──────────────────────────────────────────

export const ActualizarDiagramaRequestSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(1, "El nombre no puede estar vacío.")
    .max(50, "El nombre no puede superar 50 caracteres."),
});

export const IdParamSchema = z.string().min(1, "El identificador es obligatorio.");
