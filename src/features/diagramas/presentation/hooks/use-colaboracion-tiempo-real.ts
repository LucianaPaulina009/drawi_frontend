"use client";

import { useEffect, useRef, useCallback } from "react";
import { colaboracionSocketService } from "../../infrastructure/websocket/colaboracion-socket.service";
import type { FrameServidorWS } from "../../infrastructure/schemas/colaboracion.schemas";
import type { EfectosOperacionDiagrama } from "../../domain/entities/evento-editor.entity";
import type { Clase } from "../../domain/entities/clase.entity";
import type { Atributo, TipoDato } from "../../domain/entities/atributo.entity";
import type { Relacion } from "../../domain/entities/relacion.entity";
import type { ReferenciaFk } from "../../domain/entities/referencia-fk.entity";
import type { EstructuraRelacionNm } from "../../domain/entities/estructura-relacion-nm.entity";
import { useColaboracionStore } from "../stores/colaboracion.store";
import { useEditorDiagramaStore } from "../stores/editor-diagrama.store";

export interface UseColaboracionTiempoRealOptions {
  diagramaId: string | null;
  habilitado?: boolean;
}

/**
 * Normaliza efectos recibidos tanto en snake_case (FastAPI WebSocket) como en camelCase (estado local).
 */
export function normalizarEfectosColaboracion(efectosRaw: any): EfectosOperacionDiagrama {
  if (!efectosRaw) {
    return {
      clasesActualizadas: [],
      clasesEliminadas: [],
      relacionesActualizadas: [],
      relacionesEliminadas: [],
      estructurasNmActualizadas: [],
      estructurasNmEliminadas: [],
    };
  }

  const rawClases = efectosRaw.clasesActualizadas || efectosRaw.clases_actualizadas || [];
  const clasesActualizadas: Clase[] = rawClases.map((c: any) => {
    const rawAttrs = c.atributos || [];
    const attrs: Atributo[] = rawAttrs
      .map((a: any) => ({
        id: String(a.id || a.id_atributo || a.idAtributo),
        idClase: String(a.id_clase || a.idClase || c.id || c.id_clase || c.idClase),
        nombre: String(a.nombre || ""),
        tipoDato: (a.tipo_dato || a.tipoDato || "integer") as TipoDato,
        longitud:
          a.longitud !== undefined && a.longitud !== null && Number.isFinite(Number(a.longitud))
            ? Number(a.longitud)
            : null,
        precision:
          a.precision !== undefined && a.precision !== null && Number.isFinite(Number(a.precision))
            ? Number(a.precision)
            : null,
        escala:
          a.escala !== undefined && a.escala !== null && Number.isFinite(Number(a.escala))
            ? Number(a.escala)
            : null,
        permiteNulo:
          a.permite_nulo !== undefined
            ? Boolean(a.permite_nulo)
            : a.permiteNulo !== undefined
            ? Boolean(a.permiteNulo)
            : true,
        esLlavePrimaria: Boolean(a.es_llave_primaria ?? a.esLlavePrimaria ?? false),
        esUnico: Boolean(a.es_unico ?? a.esUnico ?? false),
        valorPorDefecto:
          a.valor_por_defecto !== undefined ? a.valor_por_defecto : a.valorPorDefecto ?? null,
        ordenDePosicion:
          a.orden_de_posicion !== undefined && Number.isFinite(Number(a.orden_de_posicion))
            ? Number(a.orden_de_posicion)
            : a.ordenDePosicion !== undefined && Number.isFinite(Number(a.ordenDePosicion))
            ? Number(a.ordenDePosicion)
            : 1,
        procedencia: (a.procedencia || "manual") as any,
      }))
      .sort((a: Atributo, b: Atributo) => a.ordenDePosicion - b.ordenDePosicion);

    return {
      id: String(c.id || c.id_clase || c.idClase),
      idDiagrama: String(c.id_diagrama || c.idDiagrama || ""),
      nombre: String(c.nombre || "Tabla"),
      posicionX:
        c.posicion_x !== undefined && Number.isFinite(Number(c.posicion_x))
          ? Number(c.posicion_x)
          : c.posicionX !== undefined && Number.isFinite(Number(c.posicionX))
          ? Number(c.posicionX)
          : 0,
      posicionY:
        c.posicion_y !== undefined && Number.isFinite(Number(c.posicion_y))
          ? Number(c.posicion_y)
          : c.posicionY !== undefined && Number.isFinite(Number(c.posicionY))
          ? Number(c.posicionY)
          : 0,
      ancho:
        c.ancho !== undefined && Number.isFinite(Number(c.ancho))
          ? Number(c.ancho)
          : 280,
      atributos: attrs,
    };
  });

  const rawRelaciones =
    efectosRaw.relacionesActualizadas || efectosRaw.relaciones_actualizadas || [];
  const relacionesActualizadas: Relacion[] = rawRelaciones.map((r: any) => {
    const rawRefs = r.referencias_fk || r.referenciasFk || [];
    const refs: ReferenciaFk[] = rawRefs.map((rf: any) => ({
      id: String(rf.id || rf.id_referencia_fk || rf.idReferenciaFk),
      idRelacion: String(rf.id_relacion || rf.idRelacion || r.id || r.id_relacion || r.idRelacion),
      idAtributoFk: String(rf.id_atributo_fk || rf.idAtributoFk),
      idAtributoReferenciado: String(
        rf.id_atributo_referenciado || rf.idAtributoReferenciado
      ),
      onDelete: (rf.on_delete || rf.onDelete || "NO_ACTION") as any,
      onUpdate: (rf.on_update || rf.onUpdate || "NO_ACTION") as any,
    }));

    return {
      id: String(r.id || r.id_relacion || r.idRelacion),
      idDiagrama: String(r.id_diagrama || r.idDiagrama || ""),
      idClaseOrigen: String(r.id_clase_origen || r.idClaseOrigen || ""),
      idClaseDestino: String(r.id_clase_destino || r.idClaseDestino || ""),
      tipoRelacion: (r.tipo_relacion || r.tipoRelacion || "asociacion") as any,
      cardinalidadOrigen: (r.cardinalidad_origen || r.cardinalidadOrigen || "0..*") as any,
      cardinalidadDestino: (r.cardinalidad_destino || r.cardinalidadDestino || "1") as any,
      conectorOrigen: (r.conector_origen || r.conectorOrigen || "right") as any,
      conectorDestino: (r.conector_destino || r.conectorDestino || "left") as any,
      nombre:
        r.nombre !== undefined
          ? r.nombre
          : (r.tipo_relacion || r.tipoRelacion) === "asociacion"
          ? "Asociación"
          : null,
      referenciasFk: refs,
    };
  });

  const rawNm =
    efectosRaw.estructurasNmActualizadas || efectosRaw.estructuras_nm_actualizadas || [];
  const estructurasNmActualizadas: EstructuraRelacionNm[] = rawNm.map((nm: any) => ({
    id: String(nm.id || nm.id_estructura_nm || nm.idEstructuraNm),
    idDiagrama: String(nm.id_diagrama || nm.idDiagrama || ""),
    idClaseOrigen: String(nm.id_clase_origen || nm.idClaseOrigen || ""),
    idClaseDestino: String(nm.id_clase_destino || nm.idClaseDestino || ""),
    idClaseIntermedia: String(nm.id_clase_intermedia || nm.idClaseIntermedia || ""),
    idRelacionOrigen: String(nm.id_relacion_origen || nm.idRelacionOrigen || ""),
    idRelacionDestino: String(nm.id_relacion_destino || nm.idRelacionDestino || ""),
  }));

  const clasesEliminadas = (
    efectosRaw.clasesEliminadas || efectosRaw.clases_eliminadas || []
  ).map(String);
  const relacionesEliminadas = (
    efectosRaw.relacionesEliminadas || efectosRaw.relaciones_eliminadas || []
  ).map(String);
  const estructurasNmEliminadas = (
    efectosRaw.estructurasNmEliminadas || efectosRaw.estructuras_nm_eliminadas || []
  ).map(String);

  return {
    clasesActualizadas,
    clasesEliminadas,
    relacionesActualizadas,
    relacionesEliminadas,
    estructurasNmActualizadas,
    estructurasNmEliminadas,
  };
}

/**
 * Hook para coordinar la colaboración en tiempo real sobre un diagrama.
 * Maneja el ciclo de vida del socket, suscripción a eventos de sala,
 * deduplicación de mutaciones remotas y despacho al editor store.
 */
export function useColaboracionTiempoReal({
  diagramaId,
  habilitado = true,
}: UseColaboracionTiempoRealOptions) {
  const procesadosRef = useRef<Set<string>>(new Set());

  // Limpiar historial de actionIds deduplicados cuando cambia el diagrama
  useEffect(() => {
    procesadosRef.current.clear();
  }, [diagramaId]);

  const procesarFrameServidor = useCallback((frame: FrameServidorWS) => {
    const colabStore = useColaboracionStore.getState();
    const editorStore = useEditorDiagramaStore.getState();

    switch (frame.tipo) {
      case "SALA_UNIDA": {
        const p = frame.payload;
        colabStore.setSalaUnida(p);
        break;
      }

      case "MUTACION_CONFIRMADA": {
        const p = frame.payload;
        const actionId = p.actionId;

        // Deduplicación defensiva
        if (actionId && procesadosRef.current.has(actionId)) {
          return;
        }
        if (actionId) {
          procesadosRef.current.add(actionId);
          // Limitar tamaño del set de deduplicación
          if (procesadosRef.current.size > 200) {
            const primerElemento = procesadosRef.current.values().next().value;
            if (primerElemento) procesadosRef.current.delete(primerElemento);
          }
        }

        const efectosRaw = p.efectos;
        if (efectosRaw) {
          const efectosNormalizados = normalizarEfectosColaboracion(efectosRaw);

          // Si la mutación afecta clases con drag preview efímero activo, limpiar el preview
          for (const c of efectosNormalizados.clasesActualizadas) {
            if (c.id) {
              colabStore.limpiarDragPreview(c.id);
            }
          }

          // Aplicar el cambio remoto sobre la base confirmada del store y re-proyectar pendientes
          editorStore.aplicarCambioRemoto(efectosNormalizados, actionId);
        }
        break;
      }

      case "BLOQUEO_CLASE_CONCEDIDO": {
        const p = frame.payload;
        colabStore.concederBloqueo({
          idClase: p.idClase,
          idUsuario: p.idUsuario,
          nombreUsuario: p.nombreUsuario,
          expiraEn: p.expiraEn,
        });
        break;
      }

      case "BLOQUEO_CLASE_LIBERADO": {
        const p = frame.payload;
        colabStore.liberarBloqueo(p.idClase);
        break;
      }

      case "BLOQUEO_CLASE_DENEGADO": {
        // Bloqueo denegado por el servidor
        break;
      }

      case "CURSOR_ACTUALIZADO": {
        const p = frame.payload;
        colabStore.actualizarCursorRemoto({
          idUsuario: p.idUsuario,
          nombreUsuario: p.nombreUsuario,
          color: p.color,
          x: p.x,
          y: p.y,
          actualizadoEn: p.actualizadoEn,
        });
        break;
      }

      case "DRAG_CLASE_ACTUALIZADO": {
        const p = frame.payload;
        colabStore.actualizarDragPreview({
          idClase: p.idClase,
          idUsuario: p.idUsuario,
          posicionX: p.posicionX,
          posicionY: p.posicionY,
        });
        break;
      }

      case "PARTICIPANTE_DESCONECTADO": {
        const p = frame.payload;
        colabStore.removerParticipante(p.idUsuario);
        break;
      }

      default:
        break;
    }
  }, []);

  // Efecto principal de conexión y suscripción
  useEffect(() => {
    if (!habilitado || !diagramaId) {
      colaboracionSocketService.desconectar();
      useColaboracionStore.getState().resetear();
      return;
    }

    const socket = colaboracionSocketService;

    // Conectar a la sala del diagrama
    socket.conectar(diagramaId);

    // Suscribir a mensajes entrantes
    const desuscribir = socket.suscribirMensaje(procesarFrameServidor);

    // Al cambiar de diagrama o desmontar, cerrar conexión y limpiar estado efímero
    // (Importante: la cola local IndexedDB NO se toca aquí)
    return () => {
      desuscribir();
      socket.desconectar();
      useColaboracionStore.getState().resetear();
    };
  }, [diagramaId, habilitado, procesarFrameServidor]);

  // Funciones de emisión expuestas a componentes del editor
  const moverCursor = useCallback((x: number, y: number) => {
    colaboracionSocketService.moverCursor(x, y);
  }, []);

  const arrastrarClasePreview = useCallback(
    (idClase: string, posicionX: number, posicionY: number) => {
      colaboracionSocketService.arrastrarClasePreview(idClase, posicionX, posicionY);
    },
    []
  );

  const solicitarBloqueoClase = useCallback((idClase: string) => {
    colaboracionSocketService.solicitarBloqueoClase(idClase);
  }, []);

  const renovarBloqueoClase = useCallback((idClase: string) => {
    colaboracionSocketService.renovarBloqueoClase(idClase);
  }, []);

  const liberarBloqueoClase = useCallback((idClase: string) => {
    colaboracionSocketService.liberarBloqueoClase(idClase);
  }, []);

  const estadoConexion = useColaboracionStore((s) => s.estadoConexion);
  const miUsuarioId = useColaboracionStore((s) => s.miUsuarioId);
  const puedeEditar = useColaboracionStore((s) => s.puedeEditar);
  const bloqueosClases = useColaboracionStore((s) => s.bloqueosClases);
  const cursoresRemotos = useColaboracionStore((s) => s.cursoresRemotos);
  const dragPreviews = useColaboracionStore((s) => s.dragPreviews);

  return {
    estadoConexion,
    miUsuarioId,
    puedeEditar,
    bloqueosClases,
    cursoresRemotos,
    dragPreviews,
    moverCursor,
    arrastrarClasePreview,
    solicitarBloqueoClase,
    renovarBloqueoClase,
    liberarBloqueoClase,
  };
}
