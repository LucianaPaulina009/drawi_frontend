import type {
  ConfirmacionOperacionDiagrama,
  EventoEditor,
} from "../../domain/entities/evento-editor.entity";
import type { ConfirmacionOperacionDiagramaResponse } from "../schemas/operacion-diagrama.schemas";
import { claseMapper } from "./clase.mapper";
import { relacionMapper } from "./relacion.mapper";

export const operacionDiagramaMapper = {
  toRequest(evento: EventoEditor): { tipo: string; datos: Record<string, unknown> } {
    const { tipo, datos } = evento;

    switch (tipo) {
      case "CREAR_CLASE":
        return {
          tipo,
          datos: {
            id_clase: datos.idClase,
            nombre: datos.nombre,
            posicion_x: datos.posicionX,
            posicion_y: datos.posicionY,
            ancho: datos.ancho,
            ...(datos.idAtributoInicial && { id_atributo_inicial: datos.idAtributoInicial }),
            ...(datos.nombreAtributoInicial && {
              nombre_atributo_inicial: datos.nombreAtributoInicial,
            }),
          },
        };

      case "ACTUALIZAR_CLASE":
        return {
          tipo,
          datos: {
            id_clase: datos.idClase,
            ...(datos.nombre !== undefined && { nombre: datos.nombre }),
            ...(datos.posicionX !== undefined && { posicion_x: datos.posicionX }),
            ...(datos.posicionY !== undefined && { posicion_y: datos.posicionY }),
            ...(datos.ancho !== undefined && { ancho: datos.ancho }),
          },
        };

      case "ELIMINAR_CLASE":
        return {
          tipo,
          datos: {
            id_clase: datos.idClase,
          },
        };

      case "CREAR_ATRIBUTO":
        return {
          tipo,
          datos: {
            id_clase: datos.idClase,
            id_atributo: datos.idAtributo,
            nombre: datos.nombre,
            tipo_dato: datos.tipoDato,
            longitud: datos.longitud ?? null,
            precision: datos.precision ?? null,
            escala: datos.escala ?? null,
            permite_nulo: datos.permiteNulo ?? true,
            es_unico: datos.esUnico ?? false,
            valor_por_defecto: datos.valorPorDefecto ?? null,
            ...(datos.ordenDePosicion !== undefined && {
              orden_de_posicion: datos.ordenDePosicion,
            }),
            es_llave_primaria: false,
          },
        };

      case "ACTUALIZAR_ATRIBUTO":
        return {
          tipo,
          datos: {
            id_clase: datos.idClase,
            id_atributo: datos.idAtributo,
            ...(datos.nombre !== undefined && { nombre: datos.nombre }),
            ...(datos.tipoDato !== undefined && { tipo_dato: datos.tipoDato }),
            ...(datos.longitud !== undefined && { longitud: datos.longitud }),
            ...(datos.precision !== undefined && { precision: datos.precision }),
            ...(datos.escala !== undefined && { escala: datos.escala }),
            ...(datos.permiteNulo !== undefined && { permite_nulo: datos.permiteNulo }),
            ...(datos.esUnico !== undefined && { es_unico: datos.esUnico }),
            ...(datos.valorPorDefecto !== undefined && {
              valor_por_defecto: datos.valorPorDefecto,
            }),
            ...(datos.ordenDePosicion !== undefined && {
              orden_de_posicion: datos.ordenDePosicion,
            }),
            ...(datos.campos && { campos: datos.campos }),
          },
        };

      case "ELIMINAR_ATRIBUTO":
        return {
          tipo,
          datos: {
            id_clase: datos.idClase,
            id_atributo: datos.idAtributo,
          },
        };

      case "CREAR_RELACION":
        return {
          tipo,
          datos: {
            id_relacion: datos.idRelacion,
            id_clase_origen: datos.idClaseOrigen,
            id_clase_destino: datos.idClaseDestino,
            tipo_relacion: datos.tipoRelacion,
            cardinalidad_origen: datos.cardinalidadOrigen,
            cardinalidad_destino: datos.cardinalidadDestino,
            conector_origen: datos.conectorOrigen,
            conector_destino: datos.conectorDestino,
            nombre: datos.nombre ?? (datos.tipoRelacion === "asociacion" ? "Asociación" : null),
            materializacion_fk: (datos.materializacionFk ?? []).map((m) => ({
              id_referencia_fk: m.idReferenciaFk,
              id_atributo_referenciado: m.idAtributoReferenciado,
              ...(m.idAtributoFk && { id_atributo_fk: m.idAtributoFk }),
              ...(m.idClaseFk && { id_clase_fk: m.idClaseFk }),
              ...(m.atributoFkNuevo && {
                atributo_fk_nuevo: {
                  id_atributo: m.atributoFkNuevo.idAtributo,
                  nombre: m.atributoFkNuevo.nombre,
                  tipo_dato: m.atributoFkNuevo.tipoDato,
                  longitud: m.atributoFkNuevo.longitud ?? null,
                  precision: m.atributoFkNuevo.precision ?? null,
                  escala: m.atributoFkNuevo.escala ?? null,
                  permite_nulo: m.atributoFkNuevo.permiteNulo ?? true,
                  es_unico: m.atributoFkNuevo.esUnico ?? false,
                  valor_por_defecto: m.atributoFkNuevo.valorPorDefecto ?? null,
                },
              }),
              on_delete: m.onDelete ?? "NO_ACTION",
              on_update: m.onUpdate ?? "NO_ACTION",
            })),
          },
        };

      case "RENOMBRAR_RELACION":
        return {
          tipo,
          datos: {
            id_relacion: datos.idRelacion,
            nombre: datos.nombre,
          },
        };

      case "ELIMINAR_RELACION":
        return {
          tipo,
          datos: {
            id_relacion: datos.idRelacion,
          },
        };

      case "CREAR_ESTRUCTURA_NM":
        return {
          tipo,
          datos: {
            id_estructura_nm: datos.idEstructuraNm,
            id_clase_origen: datos.idClaseOrigen,
            id_clase_destino: datos.idClaseDestino,
            clase_intermedia: {
              id_clase: datos.claseIntermedia.idClase,
              nombre: datos.claseIntermedia.nombre,
              posicion_x: datos.claseIntermedia.posicionX,
              posicion_y: datos.claseIntermedia.posicionY,
              ancho: datos.claseIntermedia.ancho,
              id_atributo_pk: datos.claseIntermedia.idAtributoPk,
              ...(datos.claseIntermedia.nombreAtributoPk && {
                nombre_atributo_pk: datos.claseIntermedia.nombreAtributoPk,
              }),
            },
            relacion_origen: {
              id_relacion: datos.relacionOrigen.idRelacion,
              cardinalidad_origen: datos.relacionOrigen.cardinalidadOrigen ?? "0..*",
              cardinalidad_destino: datos.relacionOrigen.cardinalidadDestino ?? "1",
              conector_origen: datos.relacionOrigen.conectorOrigen ?? "left",
              conector_destino: datos.relacionOrigen.conectorDestino ?? "right",
              nombre: datos.relacionOrigen.nombre ?? "Asociación",
            },
            relacion_destino: {
              id_relacion: datos.relacionDestino.idRelacion,
              cardinalidad_origen: datos.relacionDestino.cardinalidadOrigen ?? "0..*",
              cardinalidad_destino: datos.relacionDestino.cardinalidadDestino ?? "1",
              conector_origen: datos.relacionDestino.conectorOrigen ?? "right",
              conector_destino: datos.relacionDestino.conectorDestino ?? "left",
              nombre: datos.relacionDestino.nombre ?? "Asociación",
            },
            referencia_fk_origen: {
              id_referencia_fk: datos.referenciaFkOrigen.idReferenciaFk,
              id_atributo_fk: datos.referenciaFkOrigen.idAtributoFk,
              ...(datos.referenciaFkOrigen.nombreAtributoFk && {
                nombre_atributo_fk: datos.referenciaFkOrigen.nombreAtributoFk,
              }),
              on_delete: datos.referenciaFkOrigen.onDelete ?? "CASCADE",
              on_update: datos.referenciaFkOrigen.onUpdate ?? "CASCADE",
            },
            referencia_fk_destino: {
              id_referencia_fk: datos.referenciaFkDestino.idReferenciaFk,
              id_atributo_fk: datos.referenciaFkDestino.idAtributoFk,
              ...(datos.referenciaFkDestino.nombreAtributoFk && {
                nombre_atributo_fk: datos.referenciaFkDestino.nombreAtributoFk,
              }),
              on_delete: datos.referenciaFkDestino.onDelete ?? "CASCADE",
              on_update: datos.referenciaFkDestino.onUpdate ?? "CASCADE",
            },
          },
        };

      case "ELIMINAR_ESTRUCTURA_NM":
        return {
          tipo,
          datos: {
            id_estructura_nm: datos.idEstructuraNm,
          },
        };
    }
  },

  toDomainConfirmacion(
    raw: ConfirmacionOperacionDiagramaResponse
  ): ConfirmacionOperacionDiagrama {
    return {
      actionId: raw.action_id,
      idDiagrama: raw.id_diagrama,
      tipo: raw.tipo as ConfirmacionOperacionDiagrama["tipo"],
      efectos: {
        clasesActualizadas: raw.efectos.clases_actualizadas.map(claseMapper.toClase),
        clasesEliminadas: raw.efectos.clases_eliminadas,
        relacionesActualizadas: raw.efectos.relaciones_actualizadas.map(relacionMapper.toRelacion),
        relacionesEliminadas: raw.efectos.relaciones_eliminadas,
        estructurasNmActualizadas: raw.efectos.estructuras_nm_actualizadas.map((nm) => ({
          id: nm.id,
          idDiagrama: nm.id_diagrama ?? raw.id_diagrama,
          idClaseOrigen: nm.id_clase_origen ?? "",
          idClaseDestino: nm.id_clase_destino ?? "",
          idClaseIntermedia: nm.id_clase_intermedia,
          idRelacionOrigen: nm.id_relacion_origen,
          idRelacionDestino: nm.id_relacion_destino,
        })),
        estructurasNmEliminadas: raw.efectos.estructuras_nm_eliminadas,
      },
    };
  },
};
