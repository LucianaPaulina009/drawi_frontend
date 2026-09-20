import { z } from "zod";
import { ClaseReadResponseSchema } from "./clase.schemas";
import { RelacionReadResponseSchema } from "./relacion.schemas";
import { EstructuraRelacionNmResponseSchema } from "./estructura-relacion-nm.schemas";

// ── Esquemas de Efectos y Recibo Canónico (Backend → Cliente) ─────────────────

export const EfectosOperacionDiagramaResponseSchema = z.object({
  clases_actualizadas: z.array(ClaseReadResponseSchema).default([]),
  clases_eliminadas: z.array(z.string().uuid()).default([]),
  relaciones_actualizadas: z.array(RelacionReadResponseSchema).default([]),
  relaciones_eliminadas: z.array(z.string().uuid()).default([]),
  estructuras_nm_actualizadas: z.array(EstructuraRelacionNmResponseSchema).default([]),
  estructuras_nm_eliminadas: z.array(z.string().uuid()).default([]),
});

export const ConfirmacionOperacionDiagramaResponseSchema = z.object({
  action_id: z.string().uuid(),
  id_diagrama: z.string().uuid(),
  tipo: z.string(),
  efectos: EfectosOperacionDiagramaResponseSchema,
});

export type ConfirmacionOperacionDiagramaResponse = z.infer<
  typeof ConfirmacionOperacionDiagramaResponseSchema
>;

// ── Esquemas de Petición para la Fachada (Cliente → Backend) ──────────────────

export const OperacionDiagramaRequestSchema = z.object({
  tipo: z.enum([
    "CREAR_CLASE",
    "ACTUALIZAR_CLASE",
    "ELIMINAR_CLASE",
    "CREAR_ATRIBUTO",
    "ACTUALIZAR_ATRIBUTO",
    "ELIMINAR_ATRIBUTO",
    "CREAR_RELACION",
    "RENOMBRAR_RELACION",
    "ELIMINAR_RELACION",
    "CREAR_ESTRUCTURA_NM",
    "ELIMINAR_ESTRUCTURA_NM",
  ]),
  datos: z.record(z.string(), z.unknown()),
});
