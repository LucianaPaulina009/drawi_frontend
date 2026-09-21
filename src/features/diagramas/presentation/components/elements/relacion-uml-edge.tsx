"use client";

import {
  memo,
  useMemo,
  useState,
  useRef,
  useEffect,
  type KeyboardEvent,
  type MouseEvent as ReactMouseEvent,
} from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  Position,
  useInternalNode,
  type EdgeProps,
} from "@xyflow/react";
import type { Clase } from "../../../domain/entities/clase.entity";
import type { EstructuraRelacionNm } from "../../../domain/entities/estructura-relacion-nm.entity";
import type { Relacion, TipoRelacion } from "../../../domain/entities/relacion.entity";

export type RelacionUmlEdgeData = {
  relacion: Relacion;
  seleccionada?: boolean;
  onSeleccionar?: (id: string) => void;
  onEliminar?: (relacion: Relacion) => void;
  onRenombrarInline?: (idRelacion: string, nuevoNombre: string) => void;
  herramientaActiva?: string;
  puedeEditar?: boolean;
  desplazamientoCarril?: number;
  desplazamientoLabel?: number;
};

export type EstructuraNmUmlEdgeData = RelacionUmlEdgeData & {
  estructuraNm: EstructuraRelacionNm;
  claseIntermedia: Clase;
};

function internarExtremoEnNodo(
  x: number,
  y: number,
  position: Position | undefined,
  tieneMarcador = false,
  distancia = 4
): { x: number; y: number } {
  if (tieneMarcador) return { x, y };
  switch (position) {
    case Position.Right:
      return { x: x - distancia, y };
    case Position.Left:
      return { x: x + distancia, y };
    case Position.Top:
      return { x, y: y + distancia };
    case Position.Bottom:
      return { x, y: y - distancia };
    default:
      return { x, y };
  }
}

function getLabelCoordinates(
  x: number,
  y: number,
  position?: Position,
  desplazamiento = 0,
  juntoAMarcador = false
): { x: number; y: number } {
  const offset = juntoAMarcador ? 34 : 26;
  switch (position) {
    case Position.Right:
      return { x: x + offset, y: y + desplazamiento };
    case Position.Left:
      return { x: x - offset, y: y - desplazamiento };
    case Position.Top:
      return { x: x + desplazamiento, y: y - offset };
    case Position.Bottom:
      return { x: x - desplazamiento, y: y + offset };
    default:
      return { x, y };
  }
}

export function obtenerPosicionLabelRelacion(
  x: number,
  y: number,
  _desplazamientoCarril = 0
): { x: number; y: number } {
  // Posiciona la etiqueta directamente en la línea (centrada sobre el trazo)
  return { x, y };
}

export function obtenerPosicionCardinalidad(
  x: number,
  y: number,
  position: Position | undefined,
  desplazamientoCarril: number,
  juntoAMarcador: boolean
): { x: number; y: number } {
  return getLabelCoordinates(
    x,
    y,
    position,
    desplazamientoCarril,
    juntoAMarcador
  );
}

export function debeMostrarCardinalidades(tipo: TipoRelacion): boolean {
  return (
    tipo === "asociacion" ||
    tipo === "asociacion_dirigida" ||
    tipo === "agregacion" ||
    tipo === "composicion"
  );
}

const NOMBRES_TIPO_RELACION: Record<TipoRelacion, string> = {
  asociacion: "Asociación",
  asociacion_dirigida: "Asociación Dirigida",
  agregacion: "Agregación",
  composicion: "Composición",
  dependencia: "Dependencia",
  realizacion: "Realización",
  herencia: "Herencia",
};

export function obtenerNombreVisualTipo(tipo: TipoRelacion): string {
  return NOMBRES_TIPO_RELACION[tipo] ?? tipo;
}

export function obtenerMarcadoresRelacion(
  tipo: TipoRelacion,
  ids: {
    flecha: string;
    triangulo: string;
    diamanteVacio: string;
    diamanteLleno: string;
  }
): { markerStart?: string; markerEnd?: string } {
  switch (tipo) {
    case "asociacion_dirigida":
    case "dependencia":
      return { markerEnd: `url(#${ids.flecha})` };
    case "agregacion":
      return { markerStart: `url(#${ids.diamanteVacio})` };
    case "composicion":
      return { markerStart: `url(#${ids.diamanteLleno})` };
    case "realizacion":
    case "herencia":
      return { markerEnd: `url(#${ids.triangulo})` };
    default:
      return {};
  }
}

/**
 * Genera una ruta estrictamente ortogonal con esquinas en ángulo recto (90°)
 * garantizando que nunca existan líneas inclinadas/diagonales y uniendo
 * directamente los conectores de origen y destino.
 */
export function obtenerRutaOrtogonalConCarril(
  sourceX: number,
  sourceY: number,
  sourcePosition: Position | undefined,
  targetX: number,
  targetY: number,
  targetPosition: Position | undefined,
  _desplazamientoCarril = 0
): [string, number, number] {
  return getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 0,
    offset: 20,
  });
}



export function resolverExtremoRamalNm(
  posicionY: number,
  altura: number,
  centroLineaPrincipalY: number
): { estaArriba: boolean; y: number } {
  const estaArriba = posicionY + altura / 2 < centroLineaPrincipalY;

  return {
    estaArriba,
    y: estaArriba ? posicionY + altura : posicionY,
  };
}

function getRectangularLoopPath(
  sourceX: number,
  sourceY: number,
  sourcePosition: Position = Position.Right,
  targetX: number,
  targetY: number,
  targetPosition: Position = Position.Top,
  offset = 45
): [string, number, number] {
  const getDir = (pos: Position) => {
    switch (pos) {
      case Position.Left:
        return { dx: -1, dy: 0 };
      case Position.Right:
        return { dx: 1, dy: 0 };
      case Position.Top:
        return { dx: 0, dy: -1 };
      case Position.Bottom:
        return { dx: 0, dy: 1 };
      default:
        return { dx: 1, dy: 0 };
    }
  };

  const sDir = getDir(sourcePosition);
  const tDir = getDir(targetPosition);

  const p1X = sourceX + sDir.dx * offset;
  const p1Y = sourceY + sDir.dy * offset;
  const p4X = targetX + tDir.dx * offset;
  const p4Y = targetY + tDir.dy * offset;

  let path = "";
  let midX = (p1X + p4X) / 2;
  let midY = (p1Y + p4Y) / 2;

  if (sDir.dx !== 0 && tDir.dy !== 0) {
    path = `M ${sourceX} ${sourceY} L ${p1X} ${p1Y} L ${p1X} ${p4Y} L ${p4X} ${p4Y} L ${targetX} ${targetY}`;
    midX = p1X;
    midY = (p1Y + p4Y) / 2;
  } else if (sDir.dy !== 0 && tDir.dx !== 0) {
    path = `M ${sourceX} ${sourceY} L ${p1X} ${p1Y} L ${p4X} ${p1Y} L ${p4X} ${p4Y} L ${targetX} ${targetY}`;
    midX = (p1X + p4X) / 2;
    midY = p1Y;
  } else if (sDir.dx !== 0 && tDir.dx !== 0) {
    const farX = Math.max(p1X, p4X) + (sDir.dx < 0 ? -offset : offset);
    path = `M ${sourceX} ${sourceY} L ${farX} ${sourceY} L ${farX} ${targetY} L ${targetX} ${targetY}`;
    midX = farX;
    midY = (sourceY + targetY) / 2;
  } else {
    const farY = Math.min(p1Y, p4Y) + (sDir.dy > 0 ? offset : -offset);
    path = `M ${sourceX} ${sourceY} L ${sourceX} ${farY} L ${targetX} ${farY} L ${targetX} ${targetY}`;
    midX = (sourceX + targetX) / 2;
    midY = farY;
  }

  return [path, midX, midY];
}

export const RelacionUmlEdge = memo(function RelacionUmlEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}: EdgeProps) {
  const edgeData = data as RelacionUmlEdgeData | undefined;
  // React Flow garantiza la relación en los edges persistidos; el valor vacío
  // solo permite mantener el orden de Hooks durante el primer render defensivo.
  const relacion = edgeData?.relacion ?? ({
    id: id,
    idDiagrama: "",
    idClaseOrigen: "",
    idClaseDestino: "",
    tipoRelacion: "asociacion",
    cardinalidadOrigen: "",
    cardinalidadDestino: "",
    conectorOrigen: "right",
    conectorDestino: "left",
    referenciasFk: [],
  } satisfies Relacion);

  const esRecursiva = relacion.idClaseOrigen === relacion.idClaseDestino;
  const desplazamientoCarril = edgeData?.desplazamientoCarril ?? 0;
  const desplazamientoLabel = edgeData?.desplazamientoLabel ?? 0;

  const seleccionada = Boolean(edgeData?.seleccionada);
  const color = seleccionada ? "#2563eb" : "#475569";
  const dash =
    relacion.tipoRelacion === "dependencia" ||
    relacion.tipoRelacion === "realizacion"
      ? "6 4"
      : undefined;

  const markerArrowId = `marker-arrow-${id}`;
  const markerTriangleId = `marker-triangle-${id}`;
  const markerDiamondHollowId = `marker-diamond-hollow-${id}`;
  const markerDiamondFilledId = `marker-diamond-filled-${id}`;

  const { markerStart, markerEnd } = obtenerMarcadoresRelacion(
    relacion.tipoRelacion,
    {
      flecha: markerArrowId,
      triangulo: markerTriangleId,
      diamanteVacio: markerDiamondHollowId,
      diamanteLleno: markerDiamondFilledId,
    }
  );

  const [path, labelX, labelY] = useMemo(() => {
    const src = internarExtremoEnNodo(sourceX, sourceY, sourcePosition, Boolean(markerStart));
    const tgt = internarExtremoEnNodo(targetX, targetY, targetPosition, Boolean(markerEnd));
    if (esRecursiva) {
      return getRectangularLoopPath(
        src.x,
        src.y,
        sourcePosition,
        tgt.x,
        tgt.y,
        targetPosition
      );
    }
    return obtenerRutaOrtogonalConCarril(
      src.x,
      src.y,
      sourcePosition,
      tgt.x,
      tgt.y,
      targetPosition,
      desplazamientoCarril
    );
  }, [
    desplazamientoCarril,
    esRecursiva,
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    markerStart,
    markerEnd,
  ]);

  const sourceLabelPos = esRecursiva
    ? { x: sourceX + 28, y: sourceY - 24 + desplazamientoLabel }
    : obtenerPosicionCardinalidad(
        sourceX,
        sourceY,
        sourcePosition,
        desplazamientoLabel,
        Boolean(markerStart)
      );

  const targetLabelPos = esRecursiva
    ? { x: targetX + 28, y: targetY + 24 - desplazamientoLabel }
    : obtenerPosicionCardinalidad(
        targetX,
        targetY,
        targetPosition,
        desplazamientoLabel,
        Boolean(markerEnd)
      );

  const mostrarCardinalidades = debeMostrarCardinalidades(relacion.tipoRelacion);

  const esAsociacion = relacion.tipoRelacion === "asociacion";
  const nombreVisualTipo = obtenerNombreVisualTipo(relacion.tipoRelacion);
  const posicionLabel = obtenerPosicionLabelRelacion(
    labelX,
    labelY,
    desplazamientoLabel
  );

  // Estado de edición inline para el nombre de Asociación
  const [editandoNombre, setEditandoNombre] = useState(false);
  const [nombreBorrador, setNombreBorrador] = useState(relacion.nombre || nombreVisualTipo);
  const yaConfirmadoRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setNombreBorrador(relacion.nombre || nombreVisualTipo);
  }, [relacion.nombre, nombreVisualTipo]);

  useEffect(() => {
    if (editandoNombre) {
      yaConfirmadoRef.current = false;
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editandoNombre]);

  if (!edgeData?.relacion) return null;

  const handleConfirmarRenombrado = () => {
    if (yaConfirmadoRef.current) return;
    yaConfirmadoRef.current = true;
    setEditandoNombre(false);

    const clean = nombreBorrador.trim();
    if (clean && clean !== relacion.nombre) {
      edgeData?.onRenombrarInline?.(relacion.id, clean);
    } else {
      setNombreBorrador(relacion.nombre || "Asociación");
    }
  };

  const handleCancelarRenombrado = () => {
    yaConfirmadoRef.current = true;
    setEditandoNombre(false);
    setNombreBorrador(relacion.nombre || "Asociación");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleConfirmarRenombrado();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancelarRenombrado();
    }
  };

  return (
    <>
      <svg style={{ position: "absolute", width: 0, height: 0, pointerEvents: "none" }}>
        <defs>
          <marker
            id={markerArrowId}
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="8"
            markerHeight="8"
            orient="auto-start-reverse"
          >
            <path
              d="M 0 1 L 9 5 L 0 9"
              fill="none"
              stroke={color}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </marker>
          <marker
            id={markerTriangleId}
            viewBox="0 0 12 12"
            refX="11"
            refY="6"
            markerWidth="10"
            markerHeight="10"
            orient="auto-start-reverse"
          >
            <polygon
              points="1,1 11,6 1,11"
              fill="#ffffff"
              stroke={color}
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </marker>
          <marker
            id={markerDiamondHollowId}
            viewBox="0 0 14 14"
            refX="1"
            refY="7"
            markerWidth="12"
            markerHeight="12"
            orient="auto"
          >
            <polygon
              points="1,7 7,2 13,7 7,12"
              fill="#ffffff"
              stroke={color}
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </marker>
          <marker
            id={markerDiamondFilledId}
            viewBox="0 0 14 14"
            refX="1"
            refY="7"
            markerWidth="12"
            markerHeight="12"
            orient="auto"
          >
            <polygon
              points="1,7 7,2 13,7 7,12"
              fill={color}
              stroke={color}
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </marker>
        </defs>
      </svg>

      <BaseEdge
        path={path}
        markerStart={markerStart}
        markerEnd={markerEnd}
        style={{
          stroke: color,
          strokeWidth: seleccionada ? 2.5 : 1.75,
          strokeDasharray: dash,
          pointerEvents: "none",
        }}
      />
      <path
        d={path}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        className="cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          if (edgeData?.herramientaActiva === "borrador" && edgeData?.puedeEditar) {
            edgeData?.onEliminar?.(relacion);
          } else {
            edgeData?.onSeleccionar?.(id);
          }
        }}
        onDoubleClick={(e) => {
          e.stopPropagation();
          if (esAsociacion && edgeData?.puedeEditar) {
            setEditandoNombre(true);
          }
        }}
      />

      {/* Nombre de la relación en la línea (editable si es asociación) */}
      <EdgeLabelRenderer>
        <div
          className="nodrag nopan pointer-events-auto absolute"
          style={{
            transform: `translate(-50%, -50%) translate(${posicionLabel.x}px,${posicionLabel.y}px)`,
          }}
        >
          {esAsociacion && editandoNombre ? (
            <input
              ref={inputRef}
              value={nombreBorrador}
              onChange={(e) => setNombreBorrador(e.target.value)}
              onBlur={handleConfirmarRenombrado}
              onKeyDown={handleKeyDown}
              className="h-6 rounded border border-[#91bcfb] bg-white px-1.5 text-center text-xs font-semibold text-slate-800 shadow-md outline-none ring-2 ring-[#91bcfb]/30"
              style={{ minWidth: "80px", maxWidth: "180px" }}
              aria-label="Renombrar relación Asociación"
            />
          ) : (
            <button
              type="button"
              className="cursor-pointer rounded border border-slate-200/80 bg-white/95 px-2 py-0.5 text-[10px] font-semibold text-slate-700 shadow-xs backdrop-blur-xs transition-colors hover:border-[#91bcfb] hover:text-[#003c70] focus:outline-none focus:ring-1 focus:ring-[#91bcfb]"
              onClick={(e) => {
                e.stopPropagation();
                edgeData?.onSeleccionar?.(id);
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                if (esAsociacion && edgeData?.puedeEditar) {
                  setEditandoNombre(true);
                }
              }}
              onKeyDown={(e) => {
                if (esAsociacion && edgeData?.puedeEditar && (e.key === "Enter" || e.key === "F2")) {
                  e.preventDefault();
                  setEditandoNombre(true);
                }
              }}
              title={esAsociacion ? "Doble clic para renombrar Asociación" : nombreVisualTipo}
            >
              {relacion.nombre || nombreVisualTipo}
            </button>
          )}
        </div>
      </EdgeLabelRenderer>

      {mostrarCardinalidades && (
        <EdgeLabelRenderer>
          <div
            className="pointer-events-none absolute rounded-md border border-slate-200/80 bg-white/95 px-1.5 py-0.5 text-[10px] font-bold text-slate-700 shadow-xs backdrop-blur-xs nodrag nopan"
            style={{
              transform: `translate(-50%, -50%) translate(${sourceLabelPos.x}px,${sourceLabelPos.y}px)`,
            }}
          >
            {relacion.cardinalidadOrigen}
          </div>
          <div
            className="pointer-events-none absolute rounded-md border border-slate-200/80 bg-white/95 px-1.5 py-0.5 text-[10px] font-bold text-slate-700 shadow-xs backdrop-blur-xs nodrag nopan"
            style={{
              transform: `translate(-50%, -50%) translate(${targetLabelPos.x}px,${targetLabelPos.y}px)`,
            }}
          >
            {relacion.cardinalidadDestino}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
});
/**
 * Proyección visual única de una estructura N:M persistida. Las dos relaciones
 * 1:N internas siguen existiendo en dominio, pero el lienzo las comunica como
 * una línea de asociación principal A–B y un ramal ortogonal desde el centro
 * hacia la clase intermedia.
 */
export const EstructuraNmUmlEdge = memo(function EstructuraNmUmlEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}: EdgeProps) {
  const edgeData = data as EstructuraNmUmlEdgeData | undefined;
  const relacion = edgeData?.relacion;
  const claseIntermedia = edgeData?.claseIntermedia;
  const nodoIntermedio = useInternalNode(claseIntermedia?.id ?? "");

  const extremoOrigen = internarExtremoEnNodo(sourceX, sourceY, sourcePosition);
  const extremoDestino = internarExtremoEnNodo(targetX, targetY, targetPosition);

  const [lineaPrincipal, centroX, centroY] = useMemo(
    () =>
      obtenerRutaOrtogonalConCarril(
        extremoOrigen.x,
        extremoOrigen.y,
        sourcePosition,
        extremoDestino.x,
        extremoDestino.y,
        targetPosition,
        edgeData?.desplazamientoCarril ?? 0
      ),
    [
      extremoDestino.x,
      extremoDestino.y,
      extremoOrigen.x,
      extremoOrigen.y,
      sourcePosition,
      targetPosition,
      edgeData?.desplazamientoCarril,
    ]
  );

  if (!relacion || !claseIntermedia) return null;

  const alturaIntermedia = nodoIntermedio?.measured?.height ?? 100;
  const anchoIntermedia =
    nodoIntermedio?.measured?.width ?? claseIntermedia.ancho ?? 220;
  const posicionIntermediaX =
    nodoIntermedio?.internals?.positionAbsolute?.x ?? claseIntermedia.posicionX ?? 0;
  const posicionIntermediaY =
    nodoIntermedio?.internals?.positionAbsolute?.y ?? claseIntermedia.posicionY ?? 0;

  const extremoIntermedia = resolverExtremoRamalNm(
    posicionIntermediaY,
    alturaIntermedia,
    centroY
  );
  const extremoRamalX = posicionIntermediaX + anchoIntermedia / 2;
  const quiebreRamalY = Math.round((centroY + extremoIntermedia.y) / 2);
  const ramal =
    Math.abs(centroX - extremoRamalX) < 1
      ? `M ${centroX} ${centroY} L ${extremoRamalX} ${extremoIntermedia.y}`
      : `M ${centroX} ${centroY} L ${centroX} ${quiebreRamalY} L ${extremoRamalX} ${quiebreRamalY} L ${extremoRamalX} ${extremoIntermedia.y}`;

  const seleccionada = Boolean(edgeData?.seleccionada);
  const color = seleccionada ? "#2563eb" : "#475569";
  const desplazamientoLabel = edgeData?.desplazamientoLabel ?? 0;

  // Cardinalidades en los extremos de la línea principal (igual que RelacionUmlEdge)
  const sourceLabelPos = obtenerPosicionCardinalidad(
    sourceX,
    sourceY,
    sourcePosition,
    desplazamientoLabel,
    false
  );
  const targetLabelPos = obtenerPosicionCardinalidad(
    targetX,
    targetY,
    targetPosition,
    desplazamientoLabel,
    false
  );

  const cardinalidadOrigen = relacion.cardinalidadOrigen?.trim() || "0..*";
  const cardinalidadDestino = relacion.cardinalidadDestino?.trim() || "0..*";

  const handleSeleccion = (event: ReactMouseEvent<SVGPathElement>) => {
    event.stopPropagation();
    if (edgeData?.herramientaActiva === "borrador" && edgeData?.puedeEditar) {
      edgeData?.onEliminar?.(relacion);
      return;
    }
    edgeData?.onSeleccionar?.(relacion.id);
  };

  return (
    <>
      {/* Línea principal A-B (sólida, con la misma estética de asociación) */}
      <BaseEdge
        path={lineaPrincipal}
        style={{
          stroke: color,
          strokeWidth: seleccionada ? 2.5 : 1.75,
          pointerEvents: "none",
        }}
      />
      {/* Ramal ortogonal hacia la clase intermedia (discontinua según UML) */}
      <BaseEdge
        path={ramal}
        style={{
          stroke: color,
          strokeWidth: seleccionada ? 2.5 : 1.75,
          strokeDasharray: "6 4",
          pointerEvents: "none",
        }}
      />
      {/* Hitbox ampliada para selección y borrado en la línea principal */}
      <path
        d={lineaPrincipal}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        className="cursor-pointer"
        onClick={handleSeleccion}
      />
      {/* Hitbox ampliada para selección y borrado en el ramal */}
      <path
        d={ramal}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        className="cursor-pointer"
        onClick={handleSeleccion}
      />
      {/* Cardinalidades en los extremos A y B */}
      <EdgeLabelRenderer>
        <div
          className="pointer-events-none absolute rounded-md border border-slate-200/80 bg-white/95 px-1.5 py-0.5 text-[10px] font-bold text-slate-700 shadow-xs backdrop-blur-xs nodrag nopan"
          style={{
            transform: `translate(-50%, -50%) translate(${sourceLabelPos.x}px,${sourceLabelPos.y}px)`,
          }}
        >
          {cardinalidadOrigen}
        </div>
        <div
          className="pointer-events-none absolute rounded-md border border-slate-200/80 bg-white/95 px-1.5 py-0.5 text-[10px] font-bold text-slate-700 shadow-xs backdrop-blur-xs nodrag nopan"
          style={{
            transform: `translate(-50%, -50%) translate(${targetLabelPos.x}px,${targetLabelPos.y}px)`,
          }}
        >
          {cardinalidadDestino}
        </div>
      </EdgeLabelRenderer>
    </>
  );
});
