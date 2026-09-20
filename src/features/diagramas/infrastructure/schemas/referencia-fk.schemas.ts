import { z } from "zod";
import { TipoDatoSchema } from "./atributo.schemas";

export const AccionReferencialSchema = z.enum(["NO_ACTION", "RESTRICT", "CASCADE", "SET_NULL", "SET_DEFAULT"]);

export const ReferenciaFkReadResponseSchema = z.object({
  id: z.string().uuid(),
  id_relacion: z.string().uuid(),
  id_atributo_fk: z.string().uuid(),
  id_atributo_referenciado: z.string().uuid(),
  on_delete: AccionReferencialSchema,
  on_update: AccionReferencialSchema,
});

export const CrearReferenciaFkInputSchema = z.object({
  idReferenciaFk: z.string().uuid(),
  idAtributoFk: z.string().uuid(),
  idAtributoReferenciado: z.string().uuid(),
  onDelete: AccionReferencialSchema.optional(),
  onUpdate: AccionReferencialSchema.optional(),
});

export const ActualizarReferenciaFkInputSchema = CrearReferenciaFkInputSchema
  .omit({ idReferenciaFk: true })
  .partial()
  .refine((datos) => Object.keys(datos).length > 0, "Debe modificar al menos un campo.");

export const AtributoFkNuevoInputSchema = z.object({
  idAtributo: z.string().uuid(),
  nombre: z.string().trim().min(1).max(50),
  tipoDato: TipoDatoSchema,
  longitud: z.number().int().positive().nullable().optional(),
  precision: z.number().int().positive().nullable().optional(),
  escala: z.number().int().min(0).nullable().optional(),
  permiteNulo: z.boolean().optional(),
  esUnico: z.boolean().optional(),
  valorPorDefecto: z.string().nullable().optional(),
});
