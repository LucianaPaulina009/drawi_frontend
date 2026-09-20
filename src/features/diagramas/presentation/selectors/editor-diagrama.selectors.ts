import type { Edge, Node } from "@xyflow/react";

import type { Clase } from "../../domain/entities/clase.entity";
import type { EstructuraRelacionNm } from "../../domain/entities/estructura-relacion-nm.entity";
import type { Relacion } from "../../domain/entities/relacion.entity";

/** Proyecciones puras: React Flow no conserva el modelo de negocio. */
export function proyectarNodosClase(
  clases: Clase[],
  claseSeleccionadaId: string | null,
  dragPreviews: Record<string, { posicionX: number; posicionY: number }> = {},
  bloqueos: Record<string, { idUsuario: string; nombreUsuario: string; expiraEn?: number }> = {},
  miUsuarioId: string | null = null
): Node[] {
  const ahora = Date.now();
  return clases.map((clase) => {
    const preview = dragPreviews[clase.id];
    const previewValido =
      preview &&
      Number.isFinite(preview.posicionX) &&
      Number.isFinite(preview.posicionY);

    const posX = previewValido
      ? preview.posicionX
      : Number.isFinite(clase.posicionX)
      ? clase.posicionX
      : 0;

    const posY = previewValido
      ? preview.posicionY
      : Number.isFinite(clase.posicionY)
      ? clase.posicionY
      : 0;

    const rawLock = bloqueos[clase.id];
    const lockValido = rawLock && (!rawLock.expiraEn || rawLock.expiraEn > ahora);
    const lock = lockValido ? rawLock : undefined;
    const estaBloqueada = Boolean(lock);
    const bloqueadaPorOtro = Boolean(lock && miUsuarioId && lock.idUsuario !== miUsuarioId);
    const bloqueadaPorMi = Boolean(lock && miUsuarioId && lock.idUsuario === miUsuarioId);

    return {
      id: clase.id,
      type: "claseUml",
      position: { x: posX, y: posY },
      selected: clase.id === claseSeleccionadaId,
      data: {
        clase,
        bloqueoInfo: lock
          ? {
              estaBloqueada,
              bloqueadaPorOtro,
              bloqueadaPorMi,
              nombreUsuarioBloqueo: lock.nombreUsuario,
            }
          : undefined,
      },
    };
  });
}

function resolverHandlesEntreClases(origen: Clase, destino: Clase) {
  const centroOrigenX = origen.posicionX + origen.ancho / 2;
  const centroOrigenY = origen.posicionY + 70;
  const centroDestinoX = destino.posicionX + destino.ancho / 2;
  const centroDestinoY = destino.posicionY + 70;
  const deltaX = centroDestinoX - centroOrigenX;
  const deltaY = centroDestinoY - centroOrigenY;

  if (Math.abs(deltaX) >= Math.abs(deltaY)) {
    return deltaX >= 0
      ? { sourceHandle: "right", targetHandle: "left-target" }
      : { sourceHandle: "left", targetHandle: "right-target" };
  }

  return deltaY >= 0
    ? { sourceHandle: "bottom", targetHandle: "top-target" }
    : { sourceHandle: "top", targetHandle: "bottom-target" };
}

/**
 * Proyecta las relaciones persistidas y sustituye las dos aristas internas de
 * una estructura N:M por una sola arista visual compuesta. La estructura de
 * dominio no cambia: solo se modifica su representación en React Flow.
 */
export function proyectarEdgesRelacion(
  relaciones: Relacion[],
  relacionSeleccionadaId: string | null,
  estructurasNm: EstructuraRelacionNm[] = [],
  clases: Clase[] = []
): Edge[] {
  const relacionesPorId = new Map(relaciones.map((relacion) => [relacion.id, relacion]));
  const clasesPorId = new Map(clases.map((clase) => [clase.id, clase]));
  const estructurasVisuales = estructurasNm.filter((estructura) => {
    const origen = clasesPorId.get(estructura.idClaseOrigen);
    const destino = clasesPorId.get(estructura.idClaseDestino);
    return Boolean(
      origen &&
        destino &&
        origen.id !== destino.id &&
        clasesPorId.has(estructura.idClaseIntermedia) &&
        relacionesPorId.has(estructura.idRelacionOrigen)
    );
  });
  const idsRelacionesNm = new Set(
    estructurasVisuales.flatMap((estructura) => [
      estructura.idRelacionOrigen,
      estructura.idRelacionDestino,
    ])
  );

  const edgesNormales = relaciones
    .filter((relacion) => !idsRelacionesNm.has(relacion.id))
    .map((relacion) => ({
    id: relacion.id,
    type: "relacionUml",
    source: relacion.idClaseOrigen,
    target: relacion.idClaseDestino,
    sourceHandle: relacion.conectorOrigen,
    targetHandle: `${relacion.conectorDestino}-target`,
    selected: relacion.id === relacionSeleccionadaId,
    data: { relacion },
    }));

  const edgesNm = estructurasVisuales.flatMap((estructura) => {
    const origen = clasesPorId.get(estructura.idClaseOrigen);
    const destino = clasesPorId.get(estructura.idClaseDestino);
    const intermedia = clasesPorId.get(estructura.idClaseIntermedia);
    const relacionOrigen = relacionesPorId.get(estructura.idRelacionOrigen);

    if (!origen || !destino || !intermedia || !relacionOrigen) {
      return [];
    }

    const handles = resolverHandlesEntreClases(origen, destino);
    return [{
      id: `estructura-nm:${estructura.id}`,
      type: "estructuraNmUml",
      source: origen.id,
      target: destino.id,
      sourceHandle: handles.sourceHandle,
      targetHandle: handles.targetHandle,
      selected:
        relacionSeleccionadaId === estructura.idRelacionOrigen ||
        relacionSeleccionadaId === estructura.idRelacionDestino,
      data: {
        relacion: relacionOrigen,
        estructuraNm: estructura,
        claseIntermedia: intermedia,
      },
    }];
  });

  return [...edgesNormales, ...edgesNm];
}
