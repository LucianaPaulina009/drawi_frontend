import type { ApiActionResult, ApiResult } from "@/features/shared/domain/types/api-results";
import type {
  EventoEditor,
  TipoEventoEditor,
} from "../../domain/entities/evento-editor.entity";
import type { OperacionEditor } from "../../domain/entities/operacion-editor.entity";
import { adaptarOperacionCola } from "../../infrastructure/repositories/cola-editor-indexeddb.repository";
import {
  actualizarClaseAction,
  crearClaseAction,
  eliminarClaseAction,
} from "../actions/clase.action";
import {
  actualizarAtributoAction,
  crearAtributoAction,
  eliminarAtributoAction,
} from "../actions/atributo.action";
import {
  actualizarRelacionAction,
  crearRelacionAction,
  eliminarRelacionAction,
} from "../actions/relacion.action";
import {
  crearEstructuraRelacionNmAction,
  eliminarEstructuraRelacionNmAction,
} from "../actions/estructura-relacion-nm.action";

export type ResultadoEjecucion = "confirmada" | "transitoria" | "definitiva";

export function clasificarResultado(
  resultado: ApiResult<unknown> | ApiActionResult
): ResultadoEjecucion {
  if (resultado.ok) return "confirmada";
  const status = resultado.statusCode;
  // 0 es error de red o fetch abortado; 408 Timeout; 425 Too Early; 429 Rate Limit; >= 500 Server Error
  if (
    status === 0 ||
    status === 408 ||
    status === 425 ||
    status === 429 ||
    (status !== undefined && status >= 500)
  ) {
    return "transitoria";
  }
  return "definitiva";
}

export const demoraReintentoMs = (intentos: number, retryAfterSec?: number): number => {
  if (typeof retryAfterSec === "number" && retryAfterSec > 0) {
    return Math.min(60_000, retryAfterSec * 1_000);
  }
  return Math.min(16_000, 1_000 * 2 ** Math.max(0, intentos));
};

export type DespachadorOperacionEditor = (
  operacion: OperacionEditor
) => Promise<ApiResult<any> | ApiActionResult>;

export function normalizarEventoEditor(operacion: OperacionEditor): EventoEditor | null {
  const opAdaptada = adaptarOperacionCola(operacion);
  if (opAdaptada.reconciliacionRequerida || opAdaptada.errorDefinitivo) {
    return null;
  }

  const p = (opAdaptada.payload ?? {}) as Record<string, any>;
  const tipo = opAdaptada.tipo as TipoEventoEditor;

  switch (tipo) {
    case "CREAR_CLASE":
      return {
        tipo: "CREAR_CLASE",
        datos: {
          idClase: p.idClase ?? p.classId ?? p.id_clase ?? p.datos?.id,
          nombre: p.nombre ?? p.datos?.nombre ?? "Tabla",
          posicionX: p.posicionX ?? p.posicion_x ?? p.datos?.posicion_x ?? p.datos?.posicionX ?? 0,
          posicionY: p.posicionY ?? p.posicion_y ?? p.datos?.posicion_y ?? p.datos?.posicionY ?? 0,
          ancho: p.ancho ?? p.datos?.ancho ?? 220,
          idAtributoInicial: p.idAtributoInicial ?? p.atributoInicialId ?? p.datos?.atributoInicialId,
          nombreAtributoInicial: p.nombreAtributoInicial ?? p.datos?.nombreAtributoInicial,
        },
      };

    case "ACTUALIZAR_CLASE":
      return {
        tipo: "ACTUALIZAR_CLASE",
        datos: {
          idClase: p.idClase ?? p.id_clase ?? p.claseId ?? p.datos?.id,
          nombre: p.nombre ?? p.datos?.nombre,
          posicionX: p.posicionX ?? p.posicion_x ?? p.datos?.posicion_x ?? p.datos?.posicionX,
          posicionY: p.posicionY ?? p.posicion_y ?? p.datos?.posicion_y ?? p.datos?.posicionY,
          ancho: p.ancho ?? p.datos?.ancho,
        },
      };

    case "ELIMINAR_CLASE":
      return {
        tipo: "ELIMINAR_CLASE",
        datos: {
          idClase: p.idClase ?? p.id_clase ?? p.claseId,
        },
      };

    case "CREAR_ATRIBUTO":
      return {
        tipo: "CREAR_ATRIBUTO",
        datos: {
          idClase: p.idClase ?? p.id_clase ?? p.claseId,
          idAtributo: p.idAtributo ?? p.id_atributo ?? p.datos?.id,
          nombre: p.nombre ?? p.datos?.nombre ?? "atributo",
          tipoDato: p.tipoDato ?? p.tipo_dato ?? p.datos?.tipo_dato ?? "integer",
          longitud: p.longitud ?? p.datos?.longitud ?? null,
          precision: p.precision ?? p.datos?.precision ?? null,
          escala: p.escala ?? p.datos?.escala ?? null,
          permiteNulo: p.permiteNulo ?? p.permite_nulo ?? p.datos?.permite_nulo ?? true,
          esUnico: p.esUnico ?? p.es_unico ?? p.datos?.es_unico ?? false,
          valorPorDefecto: p.valorPorDefecto ?? p.valor_por_defecto ?? p.datos?.valor_por_defecto ?? null,
          ordenDePosicion: p.ordenDePosicion ?? p.orden_de_posicion ?? p.datos?.orden_de_posicion,
        },
      };

    case "ACTUALIZAR_ATRIBUTO":
      return {
        tipo: "ACTUALIZAR_ATRIBUTO",
        datos: {
          idClase: p.idClase ?? p.id_clase ?? p.claseId,
          idAtributo: p.idAtributo ?? p.id_atributo ?? p.atributoId,
          nombre: p.nombre ?? p.datos?.nombre,
          tipoDato: p.tipoDato ?? p.tipo_dato ?? p.datos?.tipo_dato,
          longitud: p.longitud ?? p.datos?.longitud,
          precision: p.precision ?? p.datos?.precision,
          escala: p.escala ?? p.datos?.escala,
          permiteNulo: p.permiteNulo ?? p.permite_nulo ?? p.datos?.permite_nulo,
          esUnico: p.esUnico ?? p.es_unico ?? p.datos?.es_unico,
          valorPorDefecto: p.valorPorDefecto ?? p.valor_por_defecto ?? p.datos?.valor_por_defecto,
          ordenDePosicion: p.ordenDePosicion ?? p.orden_de_posicion ?? p.datos?.orden_de_posicion,
          campos: p.campos,
        },
      };

    case "ELIMINAR_ATRIBUTO":
      return {
        tipo: "ELIMINAR_ATRIBUTO",
        datos: {
          idClase: p.idClase ?? p.id_clase ?? p.claseId,
          idAtributo: p.idAtributo ?? p.id_atributo ?? p.atributoId,
        },
      };

    case "CREAR_RELACION":
      return {
        tipo: "CREAR_RELACION",
        datos: {
          idRelacion: p.idRelacion ?? p.id_relacion ?? p.datos?.id,
          idClaseOrigen: p.idClaseOrigen ?? p.id_clase_origen ?? p.datos?.id_clase_origen,
          idClaseDestino: p.idClaseDestino ?? p.id_clase_destino ?? p.datos?.id_clase_destino,
          tipoRelacion: p.tipoRelacion ?? p.tipo_relacion ?? p.datos?.tipo_relacion,
          cardinalidadOrigen: p.cardinalidadOrigen ?? p.cardinalidad_origen ?? p.datos?.cardinalidad_origen,
          cardinalidadDestino: p.cardinalidadDestino ?? p.cardinalidad_destino ?? p.datos?.cardinalidad_destino,
          conectorOrigen: p.conectorOrigen ?? p.conector_origen ?? p.datos?.conector_origen,
          conectorDestino: p.conectorDestino ?? p.conector_destino ?? p.datos?.conector_destino,
          nombre: p.nombre ?? p.datos?.nombre,
          materializacionFk: p.materializacionFk ?? p.materializacion_fk ?? p.datos?.materializacion_fk,
        },
      };

    case "RENOMBRAR_RELACION":
      return {
        tipo: "RENOMBRAR_RELACION",
        datos: {
          idRelacion: p.idRelacion ?? p.id_relacion ?? p.relacionId,
          nombre: p.nombre ?? p.datos?.nombre ?? "Asociación",
        },
      };

    case "ELIMINAR_RELACION":
      return {
        tipo: "ELIMINAR_RELACION",
        datos: {
          idRelacion: p.idRelacion ?? p.id_relacion ?? p.relacionId,
        },
      };

    case "CREAR_ESTRUCTURA_NM":
      return {
        tipo: "CREAR_ESTRUCTURA_NM",
        datos: p as any,
      };

    case "ELIMINAR_ESTRUCTURA_NM":
      return {
        tipo: "ELIMINAR_ESTRUCTURA_NM",
        datos: {
          idEstructuraNm: p.idEstructuraNm ?? p.id_estructura_nm ?? p.datos?.idEstructuraNm,
        },
      };

    default:
      return null;
  }
}

export async function despacharAccionEspecifica(
  idDiagrama: string,
  actionId: string,
  evento: EventoEditor
): Promise<ApiResult<any> | ApiActionResult> {
  switch (evento.tipo) {
    case "CREAR_CLASE": {
      const d = evento.datos;
      return crearClaseAction(idDiagrama, {
        idClase: d.idClase,
        idAtributoInicial: d.idAtributoInicial,
        nombre: d.nombre,
        posicionX: d.posicionX,
        posicionY: d.posicionY,
        ancho: d.ancho,
      });
    }

    case "ACTUALIZAR_CLASE": {
      const d = evento.datos;
      return actualizarClaseAction(idDiagrama, d.idClase, {
        nombre: d.nombre,
        posicionX: d.posicionX,
        posicionY: d.posicionY,
        ancho: d.ancho,
      });
    }

    case "ELIMINAR_CLASE": {
      return eliminarClaseAction(idDiagrama, evento.datos.idClase);
    }

    case "CREAR_ATRIBUTO": {
      const d = evento.datos;
      return crearAtributoAction(d.idClase, {
        idAtributo: d.idAtributo,
        nombre: d.nombre,
        tipoDato: d.tipoDato,
        longitud: d.longitud,
        precision: d.precision,
        escala: d.escala,
        permiteNulo: d.permiteNulo,
        esUnico: d.esUnico,
        valorPorDefecto: d.valorPorDefecto,
        ordenDePosicion: d.ordenDePosicion,
      });
    }

    case "ACTUALIZAR_ATRIBUTO": {
      const d = evento.datos;
      return actualizarAtributoAction(d.idClase, d.idAtributo, {
        nombre: d.nombre,
        tipoDato: d.tipoDato,
        longitud: d.longitud,
        precision: d.precision,
        escala: d.escala,
        permiteNulo: d.permiteNulo,
        esUnico: d.esUnico,
        valorPorDefecto: d.valorPorDefecto,
        ordenDePosicion: d.ordenDePosicion,
      });
    }

    case "ELIMINAR_ATRIBUTO": {
      return eliminarAtributoAction(evento.datos.idClase, evento.datos.idAtributo);
    }

    case "CREAR_RELACION": {
      const d = evento.datos;
      return crearRelacionAction(idDiagrama, {
        idRelacion: d.idRelacion,
        idClaseOrigen: d.idClaseOrigen,
        idClaseDestino: d.idClaseDestino,
        tipoRelacion: d.tipoRelacion,
        cardinalidadOrigen: d.cardinalidadOrigen,
        cardinalidadDestino: d.cardinalidadDestino,
        conectorOrigen: d.conectorOrigen,
        conectorDestino: d.conectorDestino,
        nombre: d.nombre,
        materializacionFk: d.materializacionFk ?? [],
      });
    }

    case "RENOMBRAR_RELACION": {
      return actualizarRelacionAction(idDiagrama, evento.datos.idRelacion, {
        nombre: evento.datos.nombre,
      });
    }

    case "ELIMINAR_RELACION": {
      return eliminarRelacionAction(idDiagrama, evento.datos.idRelacion);
    }

    case "CREAR_ESTRUCTURA_NM": {
      const p = evento.datos as Record<string, any>;
      const cInter = p.claseIntermedia || p.clase_intermedia || {};
      const rOrig = p.relacionOrigen || p.relacion_origen || {};
      const rDest = p.relacionDestino || p.relacion_destino || {};
      const refOrig = p.referenciaFkOrigen || p.referencia_fk_origen || {};
      const refDest = p.referenciaFkDestino || p.referencia_fk_destino || {};

      return crearEstructuraRelacionNmAction(idDiagrama, {
        actionId,
        idEstructura: p.idEstructuraNm ?? p.id_estructura_nm ?? p.idEstructura ?? actionId,
        idClaseOrigen: p.idClaseOrigen ?? p.id_clase_origen,
        idClaseDestino: p.idClaseDestino ?? p.id_clase_destino,
        idClaseIntermedia: cInter.idClase ?? cInter.id_clase ?? p.idClaseIntermedia ?? p.id_clase_intermedia,
        idAtributoInicial: cInter.idAtributoPk ?? cInter.id_atributo_pk ?? p.idAtributoInicial ?? p.id_atributo_inicial,
        idAtributoFkOrigen: refOrig.idAtributoFk ?? refOrig.id_atributo_fk ?? p.idAtributoFkOrigen ?? p.id_atributo_fk_origen,
        idAtributoFkDestino: refDest.idAtributoFk ?? refDest.id_atributo_fk ?? p.idAtributoFkDestino ?? p.id_atributo_fk_destino,
        idRelacionOrigen: rOrig.idRelacion ?? rOrig.id_relacion ?? p.idRelacionOrigen ?? p.id_relacion_origen,
        idRelacionDestino: rDest.idRelacion ?? rDest.id_relacion ?? p.idRelacionDestino ?? p.id_relacion_destino,
        idReferenciaFkOrigen: refOrig.idReferenciaFk ?? refOrig.id_referencia_fk ?? p.idReferenciaFkOrigen ?? p.id_referencia_fk_origen,
        idReferenciaFkDestino: refDest.idReferenciaFk ?? refDest.id_referencia_fk ?? p.idReferenciaFkDestino ?? p.id_referencia_fk_destino,
        idAtributoReferenciadoOrigen: refOrig.idAtributoReferenciado ?? refOrig.id_atributo_referenciado ?? p.idAtributoReferenciadoOrigen ?? p.id_atributo_referenciado_origen,
        idAtributoReferenciadoDestino: refDest.idAtributoReferenciado ?? refDest.id_atributo_referenciado ?? p.idAtributoReferenciadoDestino ?? p.id_atributo_referenciado_destino,
        nombreIntermedia: cInter.nombre ?? p.nombreIntermedia ?? p.nombre_intermedia ?? "Intermedia",
        posicionX: cInter.posicionX ?? cInter.posicion_x ?? p.posicionX ?? p.posicion_x ?? 0,
        posicionY: cInter.posicionY ?? cInter.posicion_y ?? p.posicionY ?? p.posicion_y ?? 0,
        ancho: cInter.ancho ?? p.ancho ?? 280,
      });
    }

    case "ELIMINAR_ESTRUCTURA_NM": {
      const idEstructura = evento.datos.idEstructuraNm;
      return eliminarEstructuraRelacionNmAction(idDiagrama, idEstructura);
    }

    default:
      return {
        ok: false,
        statusCode: 400,
        errors: [`Tipo de evento desconocido: ${(evento as any).tipo}`],
      };
  }
}

export const crearDespachadorOperacionEditor = (
  ejecutorAccion = despacharAccionEspecifica
): DespachadorOperacionEditor => {
  return async (operacion: OperacionEditor): Promise<ApiResult<any> | ApiActionResult> => {
    const evento = normalizarEventoEditor(operacion);
    if (!evento) {
      return {
        ok: false,
        statusCode: 400,
        errors: [`Operación de editor no reconocida o no procesable: ${operacion.tipo}.`],
      };
    }

    const idDiagrama =
      operacion.idDiagrama ||
      operacion.diagramId ||
      (operacion.scopeKey ? operacion.scopeKey.split(":")[1] : undefined);

    if (!idDiagrama) {
      return {
        ok: false,
        statusCode: 400,
        errors: ["Identificador de diagrama no encontrado en la operación."],
      };
    }

    console.debug(
      `[EjecutorOperacion] Despachando operación al backend: tipo=${operacion.tipo}, actionId=${operacion.actionId}, diagrama=${idDiagrama}, datos=`,
      evento.datos
    );

    return ejecutorAccion(idDiagrama, operacion.actionId, evento);
  };
};

export const despacharOperacionEditor: DespachadorOperacionEditor =
  crearDespachadorOperacionEditor(despacharAccionEspecifica);

