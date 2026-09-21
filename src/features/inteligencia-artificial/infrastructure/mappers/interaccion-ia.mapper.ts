import type {
  InteraccionIa,
  ListaInteraccionesIa,
} from "../../domain/entities/interaccion-ia.entity";
import type {
  InteraccionIaResponse,
  ListaInteraccionesIaResponse,
} from "../schemas/interaccion-ia.schemas";

export const interaccionIaMapper = {
  toDomain(dto: InteraccionIaResponse): InteraccionIa {
    const rawTipo = (dto.tipo ?? dto.tipoInteraccion ?? dto.tipo_interaccion ?? "CONVERSACION").toUpperCase();
    const tipo =
      rawTipo === "TEXTO" || rawTipo === "CONVERSACION"
        ? "CONVERSACION"
        : rawTipo === "GENERACION_BACKEND"
        ? "GENERACION_BACKEND"
        : rawTipo === "IMAGEN" || rawTipo === "VISION_IMAGEN"
        ? "VISION_IMAGEN"
        : rawTipo === "AUDIO" || rawTipo === "VOZ_AUDIO"
        ? "VOZ_AUDIO"
        : "CONVERSACION";

    const rawEstado = (dto.estado ?? "COMPLETADO").toUpperCase();
    const estado =
      rawEstado === "PROCESANDO"
        ? "PROCESANDO"
        : rawEstado === "PENDIENTE"
        ? "PENDIENTE"
        : rawEstado === "ERROR"
        ? "ERROR"
        : "COMPLETADO";

    return {
      id: dto.id,
      idDiagrama: dto.idDiagrama ?? dto.id_diagrama ?? "",
      idUsuario: dto.idUsuario ?? dto.id_usuario ?? "",
      tipo,
      estado,
      entradaUsuario: dto.entradaUsuario ?? dto.entrada_usuario ?? null,
      respuestaIa: dto.respuestaIa ?? dto.respuesta_ia ?? null,
      claveIdempotencia: dto.claveIdempotencia ?? dto.clave_idempotencia ?? "",
      nombreArchivo: dto.nombreArchivo ?? dto.nombre_archivo ?? null,
      tamanoBytes: dto.tamanoBytes ?? dto.tamano_bytes ?? null,
      duracionSegundos: dto.duracionSegundos ?? dto.duracion_segundos ?? null,
      metadatos: dto.metadatos ?? null,
      creadoEn: dto.creadoEn ?? dto.creado_en ?? new Date().toISOString(),
      actualizadoEn: dto.actualizadoEn ?? dto.actualizado_en ?? null,
      eliminadoEn: dto.eliminadoEn ?? dto.eliminado_en ?? null,
    };
  },

  toListaDomain(dto: ListaInteraccionesIaResponse): ListaInteraccionesIa {
    return {
      items: (dto.items || []).map(interaccionIaMapper.toDomain),
      proximoCursor:
        dto.siguienteCursor ??
        dto.siguiente_cursor ??
        dto.proximoCursor ??
        dto.proximo_cursor ??
        null,
      total: dto.total ?? null,
    };
  },
};
