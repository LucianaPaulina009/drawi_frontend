import type { z } from "zod";
import type { ActualizarReferenciaFkData, CrearReferenciaFkData, ReferenciaFk } from "../../domain/entities/referencia-fk.entity";
import type { ReferenciaFkReadResponseSchema } from "../schemas/referencia-fk.schemas";

export const referenciaFkMapper = {
  toReferenciaFk(raw: z.infer<typeof ReferenciaFkReadResponseSchema>): ReferenciaFk {
    return { id: raw.id, idRelacion: raw.id_relacion, idAtributoFk: raw.id_atributo_fk, idAtributoReferenciado: raw.id_atributo_referenciado, onDelete: raw.on_delete, onUpdate: raw.on_update };
  },
  toCrearReferenciaFkRequest(datos: CrearReferenciaFkData) {
    return { id_referencia_fk: datos.idReferenciaFk, id_atributo_fk: datos.idAtributoFk, id_atributo_referenciado: datos.idAtributoReferenciado, on_delete: datos.onDelete ?? "NO_ACTION", on_update: datos.onUpdate ?? "NO_ACTION" };
  },
  toActualizarReferenciaFkRequest(datos: ActualizarReferenciaFkData) {
    return {
      ...(datos.idAtributoFk && { id_atributo_fk: datos.idAtributoFk }),
      ...(datos.idAtributoReferenciado && { id_atributo_referenciado: datos.idAtributoReferenciado }),
      ...(datos.onDelete && { on_delete: datos.onDelete }),
      ...(datos.onUpdate && { on_update: datos.onUpdate }),
    };
  },
};
