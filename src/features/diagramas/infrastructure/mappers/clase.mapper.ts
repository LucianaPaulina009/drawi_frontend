import type { z } from "zod";
import type {
  ActualizarClaseData,
  Clase,
  CrearClaseData,
} from "../../domain/entities/clase.entity";
import type {
  ClaseReadResponseSchema,
  ListaClasesResponseSchema,
} from "../schemas/clase.schemas";
import { atributoMapper } from "./atributo.mapper";

export const claseMapper = {
  toClase(raw: z.infer<typeof ClaseReadResponseSchema>): Clase {
    const rawAtributos = raw.atributos || [];
    const atributosOrdenados = [...rawAtributos]
      .sort((a, b) => a.orden_de_posicion - b.orden_de_posicion)
      .map(atributoMapper.toAtributo);

    return {
      id: raw.id,
      idDiagrama: raw.id_diagrama,
      nombre: raw.nombre,
      posicionX: raw.posicion_x,
      posicionY: raw.posicion_y,
      ancho: raw.ancho,
      atributos: atributosOrdenados,
    };
  },

  toListaClases(raw: z.infer<typeof ListaClasesResponseSchema>): Clase[] {
    return raw.items.map(claseMapper.toClase);
  },

  toCrearClaseRequest(data: CrearClaseData): Record<string, unknown> {
    const payload: Record<string, unknown> = {
      posicion_x: data.posicionX,
      posicion_y: data.posicionY,
      ancho: data.ancho ?? 280,
    };

    if (data.idClase) {
      payload.id_clase = data.idClase;
    }
    if (data.idAtributoInicial) {
      payload.id_atributo_inicial = data.idAtributoInicial;
    }
    if (data.nombre && data.nombre.trim()) {
      payload.nombre = data.nombre.trim();
    }

    return payload;
  },

  toActualizarClaseRequest(data: ActualizarClaseData): Record<string, unknown> {
    const payload: Record<string, unknown> = {};

    if (data.nombre !== undefined) {
      payload.nombre = data.nombre.trim();
    }
    if (data.posicionX !== undefined) {
      payload.posicion_x = data.posicionX;
    }
    if (data.posicionY !== undefined) {
      payload.posicion_y = data.posicionY;
    }
    if (data.ancho !== undefined) {
      payload.ancho = data.ancho;
    }

    return payload;
  },
};
