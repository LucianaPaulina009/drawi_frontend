import { z } from "zod";

export const TipoDatoSchema = z.enum([
  "integer",
  "bigint",
  "varchar",
  "text",
  "decimal",
  "boolean",
  "date",
  "timestamp",
]);

// ── Esquemas de Lectura (snake_case desde Backend) ───────────────────────────

export const AtributoReadResponseSchema = z.object({
  id: z.string(),
  id_clase: z.string(),
  tipo_dato: TipoDatoSchema,
  nombre: z.string(),
  longitud: z.number().int().nullable(),
  precision: z.number().int().nullable(),
  escala: z.number().int().nullable(),
  es_llave_primaria: z.boolean(),
  permite_nulo: z.boolean(),
  es_unico: z.boolean(),
  valor_por_defecto: z.string().nullable(),
  orden_de_posicion: z.number().int(),
});

export const ListaAtributosResponseSchema = z.object({
  items: z.array(AtributoReadResponseSchema),
});

// ── Esquemas de Mutación / Petición ──────────────────────────────────────────

export const CrearAtributoInputSchema = z.object({
  idAtributo: z.string().uuid("El ID de atributo debe ser un UUID válido.").optional(),
  tipoDato: TipoDatoSchema,
  nombre: z
    .string()
    .trim()
    .min(1, "El nombre del atributo es obligatorio.")
    .max(50, "El nombre no puede superar 50 caracteres."),
  longitud: z.number().int().min(1).nullable().optional(),
  precision: z.number().int().min(1).nullable().optional(),
  escala: z.number().int().min(0).nullable().optional(),
  esLlavePrimaria: z.boolean().optional().default(false),
  permiteNulo: z.boolean().optional().default(true),
  esUnico: z.boolean().optional().default(false),
  valorPorDefecto: z.string().trim().nullable().optional(),
  ordenDePosicion: z.number().int().min(1).nullable().optional(),
});

export const ActualizarAtributoInputSchema = z.object({
  tipoDato: TipoDatoSchema.optional(),
  nombre: z
    .string()
    .trim()
    .min(1, "El nombre del atributo es obligatorio.")
    .max(50, "El nombre no puede superar 50 caracteres.")
    .optional(),
  longitud: z.number().int().min(1).nullable().optional(),
  precision: z.number().int().min(1).nullable().optional(),
  escala: z.number().int().min(0).nullable().optional(),
  esLlavePrimaria: z.boolean().optional(),
  permiteNulo: z.boolean().optional(),
  esUnico: z.boolean().optional(),
  valorPorDefecto: z.string().trim().nullable().optional(),
  ordenDePosicion: z.number().int().min(1).nullable().optional(),
});
