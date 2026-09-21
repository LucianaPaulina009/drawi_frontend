import { z } from "zod";

export const TipoInteraccionIaValores = [
  "texto",
  "audio",
  "imagen",
  "generacion_backend",
  "accion",
  "resultado",
  "error",
  "TEXTO",
  "AUDIO",
  "IMAGEN",
  "GENERACION_BACKEND",
  "ACCION",
  "RESULTADO",
  "ERROR",
  "CONVERSACION",
  "VISION_IMAGEN",
  "VOZ_AUDIO",
] as const;

export const TipoInteraccionIaSchema = z.enum(TipoInteraccionIaValores);

export const EstadoInteraccionIaValores = [
  "pendiente",
  "procesando",
  "completado",
  "error",
  "PENDIENTE",
  "PROCESANDO",
  "COMPLETADO",
  "ERROR",
] as const;

export const EstadoInteraccionIaSchema = z.enum(EstadoInteraccionIaValores);

export const InteraccionIaResponseSchema = z.object({
  id: z.string(),
  idDiagrama: z.string().optional(),
  id_diagrama: z.string().optional(),
  idUsuario: z.string().optional(),
  id_usuario: z.string().optional(),
  tipo: TipoInteraccionIaSchema.optional(),
  tipoInteraccion: TipoInteraccionIaSchema.optional(),
  tipo_interaccion: TipoInteraccionIaSchema.optional(),
  estado: EstadoInteraccionIaSchema,
  entradaUsuario: z.string().nullable().optional(),
  entrada_usuario: z.string().nullable().optional(),
  respuestaIa: z.string().nullable().optional(),
  respuesta_ia: z.string().nullable().optional(),
  urlImagen: z.string().nullable().optional(),
  url_imagen: z.string().nullable().optional(),
  claveIdempotencia: z.string().optional(),
  clave_idempotencia: z.string().optional(),
  nombreArchivo: z.string().nullable().optional(),
  nombre_archivo: z.string().nullable().optional(),
  tamanoBytes: z.number().nullable().optional(),
  tamano_bytes: z.number().nullable().optional(),
  duracionSegundos: z.number().nullable().optional(),
  duracion_segundos: z.number().nullable().optional(),
  metadatos: z.record(z.string(), z.unknown()).nullable().optional(),
  creadoEn: z.string().nullable().optional(),
  creado_en: z.string().nullable().optional(),
  actualizadoEn: z.string().nullable().optional(),
  actualizado_en: z.string().nullable().optional(),
  eliminadoEn: z.string().nullable().optional(),
  eliminado_en: z.string().nullable().optional(),
});

export type InteraccionIaResponse = z.infer<typeof InteraccionIaResponseSchema>;

export const ListaInteraccionesIaResponseSchema = z.object({
  items: z.array(InteraccionIaResponseSchema),
  proximoCursor: z.string().nullable().optional(),
  proximo_cursor: z.string().nullable().optional(),
  siguienteCursor: z.string().nullable().optional(),
  siguiente_cursor: z.string().nullable().optional(),
  total: z.number().nullable().optional(),
});

export type ListaInteraccionesIaResponse = z.infer<
  typeof ListaInteraccionesIaResponseSchema
>;

export const EnviarMensajeIaRequestSchema = z.object({
  texto: z.string().min(1, "El mensaje no puede estar vacío").max(4000),
  claveIdempotencia: z.string().min(1, "Clave de idempotencia inválida"),
});

export type EnviarMensajeIaRequest = z.infer<typeof EnviarMensajeIaRequestSchema>;
