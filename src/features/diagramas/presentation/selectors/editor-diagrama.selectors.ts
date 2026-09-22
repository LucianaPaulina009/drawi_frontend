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

export type LadoConector = "top" | "right" | "bottom" | "left";

export function obtenerLadoBase(conector?: string): LadoConector {
  if (!conector) return "right";
  const base = conector.split("-")[0].toLowerCase();
  if (base === "top" || base === "right" || base === "bottom" || base === "left") {
    return base;
  }
  return "right";
}

/**
 * Los conectores persistidos actuales conservan el lado de la tarjeta. La
 * proyección los ancla siempre en su handle canónico central, sin recalcularlo
 * por geometría ni por ocupación. Si en el futuro llega un sub-handle ya
 * guardado, se respeta literalmente para mantener compatibilidad.
 */
function obtenerHandleVisualFijo(
  conector: string | undefined,
  esTarget = false
): string {
  const sinSufijoTarget = (conector ?? "right").replace("-target", "");
  const lado = obtenerLadoBase(sinSufijoTarget);
  const handle = sinSufijoTarget.includes("-")
    ? sinSufijoTarget
    : `${lado}-center`;
  return esTarget ? `${handle}-target` : handle;
}

function calcularLadoGeometrico(
  deltaX: number,
  deltaY: number
): { ladoOrigen: LadoConector; ladoDestino: LadoConector } {
  if (Math.abs(deltaX) >= Math.abs(deltaY)) {
    return deltaX >= 0
      ? { ladoOrigen: "right", ladoDestino: "left" }
      : { ladoOrigen: "left", ladoDestino: "right" };
  }
  return deltaY >= 0
    ? { ladoOrigen: "bottom", ladoDestino: "top" }
    : { ladoOrigen: "top", ladoDestino: "bottom" };
}

function generarCandidatosSubHandles(
  lado: LadoConector,
  deltaX: number,
  deltaY: number
): string[] {
  switch (lado) {
    case "right":
      if (deltaY < -20) return ["right-top", "right-center", "right-bottom"];
      if (deltaY > 20) return ["right-bottom", "right-center", "right-top"];
      return ["right-center", "right-top", "right-bottom"];
    case "left":
      if (deltaY < -20) return ["left-top", "left-center", "left-bottom"];
      if (deltaY > 20) return ["left-bottom", "left-center", "left-top"];
      return ["left-center", "left-top", "left-bottom"];
    case "top":
      if (deltaX < -20) return ["top-left", "top-center", "top-right"];
      if (deltaX > 20) return ["top-right", "top-center", "top-left"];
      return ["top-center", "top-right", "top-left"];
    case "bottom":
      if (deltaX < -20) return ["bottom-left", "bottom-center", "bottom-right"];
      if (deltaX > 20) return ["bottom-right", "bottom-center", "bottom-left"];
      return ["bottom-center", "bottom-right", "bottom-left"];
  }
}

function obtenerOrdenLadosAlternativos(
  ladoPrincipal: LadoConector,
  deltaX: number,
  deltaY: number
): LadoConector[] {
  if (ladoPrincipal === "right" || ladoPrincipal === "left") {
    const vertical: LadoConector = deltaY < 0 ? "top" : "bottom";
    const verticalOpuesta: LadoConector = deltaY < 0 ? "bottom" : "top";
    const opuesto: LadoConector = ladoPrincipal === "right" ? "left" : "right";
    return [ladoPrincipal, vertical, verticalOpuesta, opuesto];
  } else {
    const horizontal: LadoConector = deltaX < 0 ? "left" : "right";
    const horizontalOpuesta: LadoConector = deltaX < 0 ? "right" : "left";
    const opuesto: LadoConector = ladoPrincipal === "top" ? "bottom" : "top";
    return [ladoPrincipal, horizontal, horizontalOpuesta, opuesto];
  }
}

export function seleccionarHandleLibre(
  _nodeId: string,
  ladoPreferido: LadoConector,
  deltaX: number,
  deltaY: number,
  ocupados: Set<string>,
  esTarget = false
): string {
  const suffix = esTarget ? "-target" : "";
  const lados = obtenerOrdenLadosAlternativos(ladoPreferido, deltaX, deltaY);

  for (const lado of lados) {
    const candidatos = generarCandidatosSubHandles(lado, deltaX, deltaY);
    for (const cand of candidatos) {
      const handleKey = `${cand}${suffix}`;
      if (!ocupados.has(handleKey)) {
        ocupados.add(handleKey);
        return cand + suffix;
      }
    }
  }

  // Fallback al candidato principal si todos los handles estuvieran saturados
  const fallback = generarCandidatosSubHandles(ladoPreferido, deltaX, deltaY)[0];
  return `${fallback}${suffix}`;
}

export function resolverHandlesEntreClases(
  origen: Clase,
  destino: Clase,
  ocupadosPorNodo?: Map<string, Set<string>>,
  conectorOrigenHint?: string,
  conectorDestinoHint?: string
): { sourceHandle: string; targetHandle: string } {
  const centroOrigenX = (origen.posicionX ?? 0) + (origen.ancho || 220) / 2;
  const centroOrigenY = (origen.posicionY ?? 0) + 70;
  const centroDestinoX = (destino.posicionX ?? 0) + (destino.ancho || 220) / 2;
  const centroDestinoY = (destino.posicionY ?? 0) + 70;
  const deltaX = centroDestinoX - centroOrigenX;
  const deltaY = centroDestinoY - centroOrigenY;

  const ocupadosOrigen = ocupadosPorNodo
    ? ocupadosPorNodo.get(origen.id) ?? new Set<string>()
    : new Set<string>();
  const ocupadosDestino = ocupadosPorNodo
    ? ocupadosPorNodo.get(destino.id) ?? new Set<string>()
    : new Set<string>();

  if (ocupadosPorNodo) {
    if (!ocupadosPorNodo.has(origen.id)) ocupadosPorNodo.set(origen.id, ocupadosOrigen);
    if (!ocupadosPorNodo.has(destino.id)) ocupadosPorNodo.set(destino.id, ocupadosDestino);
  }

  // Caso recursivo (origen === destino)
  if (origen.id === destino.id) {
    const sourceHandle = seleccionarHandleLibre(
      origen.id,
      "right",
      100,
      100,
      ocupadosOrigen,
      false
    );
    const targetHandle = seleccionarHandleLibre(
      origen.id,
      "top",
      100,
      -100,
      ocupadosOrigen,
      true
    );
    return { sourceHandle, targetHandle };
  }

  const geo = calcularLadoGeometrico(deltaX, deltaY);
  const ladoOrigen = conectorOrigenHint
    ? obtenerLadoBase(conectorOrigenHint)
    : geo.ladoOrigen;
  const ladoDestino = conectorDestinoHint
    ? obtenerLadoBase(conectorDestinoHint)
    : geo.ladoDestino;

  const sourceHandle = seleccionarHandleLibre(
    origen.id,
    ladoOrigen,
    deltaX,
    deltaY,
    ocupadosOrigen,
    false
  );

  const targetHandle = seleccionarHandleLibre(
    destino.id,
    ladoDestino,
    -deltaX,
    -deltaY,
    ocupadosDestino,
    true
  );

  return { sourceHandle, targetHandle };
}

/**
 * Proyecta los edges directamente. Las relaciones pueden superponerse y cruzarse
 * libremente sin requerir desvíos artificiales de carril.
 */
function asignarCarrilesVisuales(
  edges: Edge[],
  _clasesPorId?: Map<string, Clase>
): Edge[] {
  return edges.map((edge) => ({
    ...edge,
    data: {
      ...edge.data,
      desplazamientoCarril: 0,
      desplazamientoLabel: 0,
    },
  }));
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
  const ocupadosPorNodo = new Map<string, Set<string>>();

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

  // Ordenar determinísticamente las relaciones para garantizar estabilidad absoluta en renders y colaboración
  const relacionesNormales = relaciones
    .filter((relacion) => !idsRelacionesNm.has(relacion.id))
    .sort((a, b) => a.id.localeCompare(b.id));

  const edgesNormales = relacionesNormales.map((relacion) => {
    return {
      id: relacion.id,
      type: "relacionUml",
      source: relacion.idClaseOrigen,
      target: relacion.idClaseDestino,
      sourceHandle: obtenerHandleVisualFijo(relacion.conectorOrigen),
      targetHandle: obtenerHandleVisualFijo(relacion.conectorDestino, true),
      selected: relacion.id === relacionSeleccionadaId,
      data: { relacion },
    };
  });

  const edgesNm = estructurasVisuales.flatMap((estructura) => {
    const origen = clasesPorId.get(estructura.idClaseOrigen);
    const destino = clasesPorId.get(estructura.idClaseDestino);
    const intermedia = clasesPorId.get(estructura.idClaseIntermedia);
    const relacionOrigen = relacionesPorId.get(estructura.idRelacionOrigen);
    const relacionDestino = relacionesPorId.get(estructura.idRelacionDestino);

    if (!origen || !destino || !intermedia || !relacionOrigen) {
      return [];
    }

    const conectorOrigen =
      relacionOrigen.idClaseOrigen === origen.id
        ? relacionOrigen.conectorOrigen
        : relacionOrigen.conectorDestino || "right";

    const conectorDestino =
      relacionDestino
        ? relacionDestino.idClaseOrigen === destino.id
          ? relacionDestino.conectorOrigen
          : relacionDestino.conectorDestino
        : relacionOrigen.conectorDestino || "left";

    return [{
      id: `estructura-nm:${estructura.id}`,
      type: "estructuraNmUml",
      source: origen.id,
      target: destino.id,
      sourceHandle: obtenerHandleVisualFijo(conectorOrigen),
      targetHandle: obtenerHandleVisualFijo(conectorDestino, true),
      selected:
        relacionSeleccionadaId === estructura.idRelacionOrigen ||
        relacionSeleccionadaId === estructura.idRelacionDestino,
      data: {
        relacion: relacionOrigen,
        relacionOrigen,
        relacionDestino,
        estructuraNm: estructura,
        claseIntermedia: intermedia,
      },
    }];
  });

  return [...asignarCarrilesVisuales(edgesNormales, clasesPorId), ...edgesNm];
}
