import type { z } from "zod";
import type { ActualizarRelacionData, CrearRelacionData, Relacion } from "../../domain/entities/relacion.entity";
import type { RelacionReadResponseSchema } from "../schemas/relacion.schemas";
import { referenciaFkMapper } from "./referencia-fk.mapper";

function toMaterializacion(datos: NonNullable<CrearRelacionData["materializacionFk"]>) {
  return datos.map((item) => ({
    id_referencia_fk: item.idReferenciaFk,
    id_atributo_referenciado: item.idAtributoReferenciado,
    ...(item.idAtributoFk && { id_atributo_fk: item.idAtributoFk }),
    ...(item.idClaseFk && { id_clase_fk: item.idClaseFk }),
    ...(item.atributoFkNuevo && { atributo_fk_nuevo: { id_atributo: item.atributoFkNuevo.idAtributo, nombre: item.atributoFkNuevo.nombre, tipo_dato: item.atributoFkNuevo.tipoDato, longitud: item.atributoFkNuevo.longitud ?? null, precision: item.atributoFkNuevo.precision ?? null, escala: item.atributoFkNuevo.escala ?? null, permite_nulo: item.atributoFkNuevo.permiteNulo ?? true, es_unico: item.atributoFkNuevo.esUnico ?? false, valor_por_defecto: item.atributoFkNuevo.valorPorDefecto ?? null } }),
    on_delete: item.onDelete ?? "NO_ACTION", on_update: item.onUpdate ?? "NO_ACTION",
  }));
}

export const relacionMapper = {
  toRelacion(raw: z.infer<typeof RelacionReadResponseSchema>): Relacion {
    return {
      id: raw.id,
      idDiagrama: raw.id_diagrama,
      idClaseOrigen: raw.id_clase_origen,
      idClaseDestino: raw.id_clase_destino,
      tipoRelacion: raw.tipo_relacion,
      cardinalidadOrigen: raw.cardinalidad_origen,
      cardinalidadDestino: raw.cardinalidad_destino,
      conectorOrigen: raw.conector_origen,
      conectorDestino: raw.conector_destino,
      nombre: raw.nombre !== undefined ? raw.nombre : (raw.tipo_relacion === "asociacion" ? "Asociación" : null),
      referenciasFk: raw.referencias_fk.map(referenciaFkMapper.toReferenciaFk),
    };
  },
  toCrearRelacionRequest(datos: CrearRelacionData) {
    return {
      id_relacion: datos.idRelacion,
      id_clase_origen: datos.idClaseOrigen,
      id_clase_destino: datos.idClaseDestino,
      tipo_relacion: datos.tipoRelacion,
      cardinalidad_origen: datos.cardinalidadOrigen,
      cardinalidad_destino: datos.cardinalidadDestino,
      conector_origen: datos.conectorOrigen,
      conector_destino: datos.conectorDestino,
      nombre: datos.nombre,
      materializacion_fk: toMaterializacion(datos.materializacionFk ?? []),
    };
  },
  toActualizarRelacionRequest(datos: ActualizarRelacionData) {
    return {
      ...(datos.nombre !== undefined && { nombre: datos.nombre }),
      ...(datos.idClaseOrigen && { id_clase_origen: datos.idClaseOrigen }),
      ...(datos.idClaseDestino && { id_clase_destino: datos.idClaseDestino }),
      ...(datos.tipoRelacion && { tipo_relacion: datos.tipoRelacion }),
      ...(datos.cardinalidadOrigen && { cardinalidad_origen: datos.cardinalidadOrigen }),
      ...(datos.cardinalidadDestino && { cardinalidad_destino: datos.cardinalidadDestino }),
      ...(datos.conectorOrigen && { conector_origen: datos.conectorOrigen }),
      ...(datos.conectorDestino && { conector_destino: datos.conectorDestino }),
      ...(datos.materializacionFk !== undefined && { materializacion_fk: toMaterializacion(datos.materializacionFk) }),
    };
  },
};
