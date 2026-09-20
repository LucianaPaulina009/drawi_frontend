import { z } from "zod";

export const CrearEstructuraRelacionNmInputSchema = z.object({
  actionId: z.string().uuid(),
  idEstructura: z.string().uuid(), idClaseOrigen: z.string().uuid(), idClaseDestino: z.string().uuid(),
  idClaseIntermedia: z.string().uuid(), idAtributoInicial: z.string().uuid(),
  idAtributoFkOrigen: z.string().uuid(), idAtributoFkDestino: z.string().uuid(),
  idRelacionOrigen: z.string().uuid(), idRelacionDestino: z.string().uuid(),
  idReferenciaFkOrigen: z.string().uuid(), idReferenciaFkDestino: z.string().uuid(),
  idAtributoReferenciadoOrigen: z.string().uuid(), idAtributoReferenciadoDestino: z.string().uuid(),
  nombreIntermedia: z.string().trim().min(1), posicionX: z.number().finite(), posicionY: z.number().finite(), ancho: z.number().positive().optional(),
});

export const EstructuraRelacionNmResponseSchema = z.object({
  id: z.string().uuid(),
  id_diagrama: z.string().uuid().optional(),
  id_clase_origen: z.string().uuid().optional(),
  id_clase_destino: z.string().uuid().optional(),
  id_clase_intermedia: z.string().uuid(),
  id_relacion_origen: z.string().uuid(),
  id_relacion_destino: z.string().uuid(),
});

