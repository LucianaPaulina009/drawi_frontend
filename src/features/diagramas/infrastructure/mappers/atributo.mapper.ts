import type { z } from "zod";
import type {
  ActualizarAtributoData,
  Atributo,
  CrearAtributoData,
  TipoDato,
} from "../../domain/entities/atributo.entity";
import type {
  AtributoReadResponseSchema,
  ListaAtributosResponseSchema,
} from "../schemas/atributo.schemas";

function sanitizarConfiguracionTipo(
  tipoDato: TipoDato | undefined,
  longitud?: number | null,
  precision?: number | null,
  escala?: number | null
): {
  longitud: number | null | undefined;
  precision: number | null | undefined;
  escala: number | null | undefined;
} {
  if (!tipoDato) {
    return { longitud, precision, escala };
  }
  if (tipoDato === "varchar") {
    return {
      longitud: longitud !== undefined ? longitud : null,
      precision: null,
      escala: null,
    };
  }
  if (tipoDato === "decimal") {
    return {
      longitud: null,
      precision: precision !== undefined ? precision : null,
      escala: escala !== undefined ? escala : null,
    };
  }
  return {
    longitud: null,
    precision: null,
    escala: null,
  };
}

export const atributoMapper = {
  toAtributo(raw: z.infer<typeof AtributoReadResponseSchema>): Atributo {
    return {
      id: raw.id,
      idClase: raw.id_clase,
      tipoDato: raw.tipo_dato,
      nombre: raw.nombre,
      longitud: raw.longitud,
      precision: raw.precision,
      escala: raw.escala,
      esLlavePrimaria: raw.es_llave_primaria,
      permiteNulo: raw.permite_nulo,
      esUnico: raw.es_unico,
      valorPorDefecto: raw.valor_por_defecto,
      ordenDePosicion: raw.orden_de_posicion,
      procedencia: raw.procedencia,
    };
  },

  toListaAtributos(
    raw: z.infer<typeof ListaAtributosResponseSchema>
  ): Atributo[] {
    return [...raw.items]
      .sort((a, b) => a.orden_de_posicion - b.orden_de_posicion)
      .map(atributoMapper.toAtributo);
  },

  toCrearAtributoRequest(data: CrearAtributoData): Record<string, unknown> {
    const { longitud, precision, escala } = sanitizarConfiguracionTipo(
      data.tipoDato,
      data.longitud,
      data.precision,
      data.escala
    );

    const esPk = Boolean(data.esLlavePrimaria);
    const permiteNulo = esPk ? false : (data.permiteNulo ?? true);

    const payload: Record<string, unknown> = {
      tipo_dato: data.tipoDato,
      nombre: data.nombre.trim(),
      longitud,
      precision,
      escala,
      es_llave_primaria: esPk,
      permite_nulo: permiteNulo,
      es_unico: Boolean(data.esUnico),
      valor_por_defecto: data.valorPorDefecto ? data.valorPorDefecto.trim() : null,
    };

    if (data.idAtributo) {
      payload.id_atributo = data.idAtributo;
    }
    if (data.ordenDePosicion !== undefined && data.ordenDePosicion !== null) {
      payload.orden_de_posicion = data.ordenDePosicion;
    }

    return payload;
  },

  toActualizarAtributoRequest(
    data: ActualizarAtributoData
  ): Record<string, unknown> {
    const payload: Record<string, unknown> = {};

    if (data.tipoDato !== undefined) {
      payload.tipo_dato = data.tipoDato;
      const { longitud, precision, escala } = sanitizarConfiguracionTipo(
        data.tipoDato,
        data.longitud,
        data.precision,
        data.escala
      );
      payload.longitud = longitud;
      payload.precision = precision;
      payload.escala = escala;
    } else {
      if (data.longitud !== undefined) payload.longitud = data.longitud;
      if (data.precision !== undefined) payload.precision = data.precision;
      if (data.escala !== undefined) payload.escala = data.escala;
    }

    if (data.nombre !== undefined) {
      payload.nombre = data.nombre.trim();
    }
    if (data.esLlavePrimaria !== undefined) {
      payload.es_llave_primaria = data.esLlavePrimaria;
      if (data.esLlavePrimaria) {
        payload.permite_nulo = false;
      }
    }
    if (data.permiteNulo !== undefined && !data.esLlavePrimaria) {
      payload.permite_nulo = data.permiteNulo;
    }
    if (data.esUnico !== undefined) {
      payload.es_unico = data.esUnico;
    }
    if (data.valorPorDefecto !== undefined) {
      payload.valor_por_defecto = data.valorPorDefecto
        ? data.valorPorDefecto.trim()
        : null;
    }
    if (data.ordenDePosicion !== undefined && data.ordenDePosicion !== null) {
      payload.orden_de_posicion = data.ordenDePosicion;
    }

    return payload;
  },
};
