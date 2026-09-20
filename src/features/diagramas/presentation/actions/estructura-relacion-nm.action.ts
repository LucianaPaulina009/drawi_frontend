"use server";

import { apiRequestData } from "@/features/shared/infrastructure/http/api-client";
import { IdParamSchema } from "../../infrastructure/schemas/diagrama.schemas";
import { CrearEstructuraRelacionNmInputSchema, EstructuraRelacionNmResponseSchema } from "../../infrastructure/schemas/estructura-relacion-nm.schemas";

const baseUrl = (process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000").replace(/\/+$/, "");
const base = baseUrl.endsWith("/api") ? `${baseUrl}/diagramas` : `${baseUrl}/api/diagramas`;

export async function crearEstructuraRelacionNmAction(idDiagrama: string, datos: unknown) {
  const diagrama = IdParamSchema.safeParse(idDiagrama);
  const entrada = CrearEstructuraRelacionNmInputSchema.safeParse(datos);
  if (!diagrama.success || !entrada.success) return { ok: false as const, statusCode: 400, errors: ["Datos de estructura N:M inválidos."] };
  const { actionId, ...body } = entrada.data;
  return apiRequestData({
    url: `${base}/${diagrama.data}/estructuras-nm`, method: "POST", body: {
      id_estructura: body.idEstructura, id_clase_origen: body.idClaseOrigen, id_clase_destino: body.idClaseDestino,
      id_clase_intermedia: body.idClaseIntermedia, id_atributo_inicial: body.idAtributoInicial,
      id_atributo_fk_origen: body.idAtributoFkOrigen, id_atributo_fk_destino: body.idAtributoFkDestino,
      id_relacion_origen: body.idRelacionOrigen, id_relacion_destino: body.idRelacionDestino,
      id_referencia_fk_origen: body.idReferenciaFkOrigen, id_referencia_fk_destino: body.idReferenciaFkDestino,
      id_atributo_referenciado_origen: body.idAtributoReferenciadoOrigen,
      id_atributo_referenciado_destino: body.idAtributoReferenciadoDestino,
      nombre_intermedia: body.nombreIntermedia, posicion_x: body.posicionX, posicion_y: body.posicionY, ancho: body.ancho,
    }, headers: { "Idempotency-Key": actionId }, responseSchema: EstructuraRelacionNmResponseSchema,
    mapData: (respuesta) => ({ id: respuesta.id, idClaseIntermedia: respuesta.id_clase_intermedia, idRelacionOrigen: respuesta.id_relacion_origen, idRelacionDestino: respuesta.id_relacion_destino }),
    fallbackMessage: "No se pudo crear la estructura muchos-a-muchos.",
  });
}

export async function eliminarEstructuraRelacionNmAction(idDiagrama: string, idEstructura: string) {
  const diagrama = IdParamSchema.safeParse(idDiagrama);
  const estructura = IdParamSchema.safeParse(idEstructura);
  if (!diagrama.success || !estructura.success) return { ok: false as const, statusCode: 400, errors: ["Identificadores inválidos."] };
  const { apiRequestStatus } = await import("@/features/shared/infrastructure/http/api-client");
  return apiRequestStatus({
    url: `${base}/${diagrama.data}/estructuras-nm/${estructura.data}`,
    method: "DELETE",
    fallbackMessage: "Error al eliminar la estructura N:M.",
  });
}

