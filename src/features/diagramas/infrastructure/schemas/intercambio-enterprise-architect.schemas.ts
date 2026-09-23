import { z } from "zod";
import type { ResultadoImportacionEa } from "../../domain/entities/intercambio-enterprise-architect.entity";

export const ResultadoImportacionEaResponseSchema = z.object({
  diagrama_id: z.string(),
  clases_importadas: z.number(),
  atributos_importados: z.number(),
  relaciones_importadas: z.number(),
  estructuras_nm_importadas: z.number(),
  advertencias: z.array(z.string()).default([]),
});

export type ResultadoImportacionEaResponse = z.infer<
  typeof ResultadoImportacionEaResponseSchema
>;

export const intercambioEaMapper = {
  toResultadoImportacion(
    raw: ResultadoImportacionEaResponse
  ): ResultadoImportacionEa {
    return {
      diagramaId: raw.diagrama_id,
      clasesImportadas: raw.clases_importadas,
      atributosImportados: raw.atributos_importados,
      relacionesImportadas: raw.relaciones_importadas,
      estructurasNmImportadas: raw.estructuras_nm_importadas,
      advertencias: raw.advertencias ?? [],
    };
  },
};
