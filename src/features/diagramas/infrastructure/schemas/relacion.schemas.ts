import { z } from "zod";
import { AccionReferencialSchema, AtributoFkNuevoInputSchema, ReferenciaFkReadResponseSchema } from "./referencia-fk.schemas";

export const TipoRelacionSchema = z.enum(["asociacion", "asociacion_dirigida", "agregacion", "composicion", "dependencia", "realizacion", "herencia"]);
export const ConectorRelacionSchema = z.enum([
  "top", "right", "bottom", "left",
  "top-left", "top-center", "top-right",
  "right-top", "right-center", "right-bottom",
  "bottom-left", "bottom-center", "bottom-right",
  "left-top", "left-center", "left-bottom",
]);
export const CardinalidadSchema = z.string().trim().regex(/^(\*|\d+|\d+\.\.(\d+|\*))$/, "Cardinalidad inválida.");

export const MaterializacionFkInputSchema = z.object({
  idReferenciaFk: z.string().uuid(),
  idAtributoReferenciado: z.string().uuid(),
  idAtributoFk: z.string().uuid().optional(),
  idClaseFk: z.string().uuid().optional(),
  atributoFkNuevo: AtributoFkNuevoInputSchema.optional(),
  onDelete: AccionReferencialSchema.optional(),
  onUpdate: AccionReferencialSchema.optional(),
}).superRefine((datos, contexto) => {
  const reutiliza = Boolean(datos.idAtributoFk);
  const crea = Boolean(datos.idClaseFk && datos.atributoFkNuevo);
  if (reutiliza === crea) contexto.addIssue({ code: "custom", message: "Seleccione un atributo existente o declare uno nuevo." });
});

export const RelacionReadResponseSchema = z.object({
  id: z.string().uuid(),
  id_diagrama: z.string().uuid(),
  id_clase_origen: z.string().uuid(),
  id_clase_destino: z.string().uuid(),
  tipo_relacion: TipoRelacionSchema,
  cardinalidad_origen: CardinalidadSchema,
  cardinalidad_destino: CardinalidadSchema,
  conector_origen: ConectorRelacionSchema,
  conector_destino: ConectorRelacionSchema,
  nombre: z.string().nullable().optional(),
  referencias_fk: z.array(ReferenciaFkReadResponseSchema).default([]),
});

export const CrearRelacionInputSchema = z.object({
  idRelacion: z.string().uuid(),
  idClaseOrigen: z.string().uuid(),
  idClaseDestino: z.string().uuid(),
  tipoRelacion: TipoRelacionSchema,
  cardinalidadOrigen: CardinalidadSchema,
  cardinalidadDestino: CardinalidadSchema,
  conectorOrigen: ConectorRelacionSchema,
  conectorDestino: ConectorRelacionSchema,
  nombre: z.string().trim().min(1).max(100).optional(),
  materializacionFk: z.array(MaterializacionFkInputSchema).optional(),
});

export const ActualizarRelacionInputSchema = CrearRelacionInputSchema
  .omit({ idRelacion: true, idClaseOrigen: true, idClaseDestino: true })
  .extend({ idClaseOrigen: z.string().uuid().optional(), idClaseDestino: z.string().uuid().optional() })
  .partial()
  .refine((datos) => Object.keys(datos).length > 0, "Debe modificar al menos un campo.");
