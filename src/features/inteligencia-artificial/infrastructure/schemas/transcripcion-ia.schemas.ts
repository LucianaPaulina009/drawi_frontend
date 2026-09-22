import { z } from "zod";

export const TranscripcionIaResponseSchema = z.object({
  texto: z.string(),
  idioma: z.string().optional().nullable(),
});

export type TranscripcionIaResponse = z.infer<
  typeof TranscripcionIaResponseSchema
>;
