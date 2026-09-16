import type { z } from "zod";
import type {
  ActualizarProyectoData,
  ColorProyecto,
  IconoProyecto,
  Proyecto,
  ProyectoCreado,
} from "../../domain/entities/proyecto.entity";
import type {
  ListaProyectosResponseSchema,
  ProyectoCreadoResponseSchema,
  ProyectoReadResponseSchema,
} from "../schemas/proyecto.schemas";

const COLORES_VALIDOS: readonly ColorProyecto[] = [
  "celeste",
  "rojo",
  "verde",
  "azul",
  "naranja",
  "amarillo",
  "morado",
];

const ICONOS_VALIDOS: readonly IconoProyecto[] = [
  "finanza",
  "almacen",
  "estrella",
  "dinero",
  "caja",
];

function normalizarColor(color: string): ColorProyecto {
  return COLORES_VALIDOS.includes(color as ColorProyecto)
    ? (color as ColorProyecto)
    : "celeste";
}

function normalizarIcono(icono: string): IconoProyecto {
  return ICONOS_VALIDOS.includes(icono as IconoProyecto)
    ? (icono as IconoProyecto)
    : "caja";
}

export const proyectoMapper = {
  // ── Mapeos de Lectura (snake_case -> camelCase de dominio) ────────────────
  toProyecto(raw: z.infer<typeof ProyectoReadResponseSchema>): Proyecto {
    return {
      id: raw.id,
      nombre: raw.nombre,
      color: normalizarColor(raw.color),
      icono: normalizarIcono(raw.icono),
      fechaActualizacion: raw.fecha_actualizacion,
      esFavorito: raw.es_favorito,
      slug: raw.slug,
      propietarioId: raw.propietario_id,
    };
  },

  toListaProyectos(
    raw: z.infer<typeof ListaProyectosResponseSchema>
  ): Proyecto[] {
    return raw.items.map((item) => proyectoMapper.toProyecto(item));
  },

  toProyectoCreado(
    raw: z.infer<typeof ProyectoCreadoResponseSchema>
  ): ProyectoCreado {
    return {
      slug: raw.slug,
    };
  },

  // ── Mapeos de Comandos (camelCase de dominio -> snake_case de backend) ────
  toActualizarProyectoRequest(datos: ActualizarProyectoData) {
    const payload: {
      nombre?: string;
      color?: ColorProyecto;
      icono?: IconoProyecto;
    } = {};

    if (datos.nombre !== undefined) payload.nombre = datos.nombre;
    if (datos.color !== undefined) payload.color = datos.color;
    if (datos.icono !== undefined) payload.icono = datos.icono;

    return payload;
  },
};
