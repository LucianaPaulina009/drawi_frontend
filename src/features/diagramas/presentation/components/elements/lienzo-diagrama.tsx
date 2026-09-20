"use client";

import { memo, useMemo, useState, useCallback, useRef, type MouseEvent } from "react";
import {
  Background,
  BackgroundVariant,
  ReactFlow,
  useReactFlow,
  type CoordinateExtent,
  type Edge,
  type Connection,
  type Node,
  type NodeChange,
  type OnNodesChange,
  type OnNodeDrag,
  type Viewport,
} from "@xyflow/react";

import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import type { Atributo } from "../../../domain/entities/atributo.entity";
import type { Clase } from "../../../domain/entities/clase.entity";
import type { DiagramaDetalle } from "../../../domain/entities/diagrama.entity";
import type { Relacion } from "../../../domain/entities/relacion.entity";
import type { HerramientaLienzo } from "./barra-herramientas";
import { NodoClaseUml } from "./nodo-clase-uml";
import { EstructuraNmUmlEdge, RelacionUmlEdge } from "./relacion-uml-edge";
import { CapaCursoresRemotos } from "./capa-cursores-remotos";
import { useEditorDiagramaStore } from "../../stores/editor-diagrama.store";
import { useColaboracionStore } from "../../stores/colaboracion.store";
import { colaboracionSocketService } from "../../../infrastructure/websocket/colaboracion-socket.service";
import { proyectarEdgesRelacion, proyectarNodosClase } from "../../selectors/editor-diagrama.selectors";

const NODE_TYPES = {
  claseUml: NodoClaseUml,
};
const EDGE_TYPES = {
  relacionUml: RelacionUmlEdge,
  estructuraNmUml: EstructuraNmUmlEdge,
};

// Límites de área de trabajo finita para el lienzo (16 000 x 12 000 unidades)
const AREA_TRABAJO_EXTENT: CoordinateExtent = [
  [-8000, -6000],
  [8000, 6000],
];

// Cursor SVG personalizado para la herramienta Borrador con hotspot en la punta (4, 20) siguiendo la paleta oficial Drawi (#91bcfb, #003c70, #ffffff)
const CURSOR_BORRADOR_SVG = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none'%3E%3Cpath d='M7 21L2.7 16.7C1.7 15.7 1.7 14.2 2.7 13.3L12.3 3.7C13.3 2.7 14.8 2.7 15.7 3.7L21.3 9.3C22.3 10.3 22.3 11.8 21.3 12.7L13 21H7Z' fill='%2391bcfb' stroke='%23003c70' stroke-width='1.75' stroke-linejoin='round'/%3E%3Cpath d='M5 11L14 20L19 15L10 6L5 11Z' fill='%23ffffff' stroke='%23003c70' stroke-width='1.5' stroke-linejoin='round'/%3E%3Cpath d='M22 21H7' stroke='%23003c70' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E`;
const CURSOR_BORRADOR = `url("${CURSOR_BORRADOR_SVG}") 4 20, crosshair`;

export interface LienzoDiagramaProps {
  idDiagramaActivo: string | null;
  diagramaActivo: DiagramaDetalle | null;
  puedeEditar: boolean;
  cargandoDetalle: boolean;
  herramientaActiva: HerramientaLienzo;
  espacioPresionado: boolean;
  viewportInicial?: Viewport;
  onViewportChange?: (viewport: Viewport) => void;
  onSeleccionarClase?: (idClase: string | null) => void;
  onAbrirPropiedadesClase?: (idClase: string) => void;
  onSeleccionarRelacion?: (idRelacion: string | null) => void;
  onEliminarRelacion?: (relacion: Relacion) => void;
  onRenombrarRelacionInline?: (idRelacion: string, nuevoNombre: string) => void;
  onConectarRelacion?: (conexion: Connection) => void;
  onCrearClaseEnPosicion?: (x: number, y: number) => void;
  onMoverClaseStop?: (idClase: string, x: number, y: number) => void;
  onRedimensionarClaseStop?: (idClase: string, nuevoAncho: number) => void;
  onRenombrarClaseInline?: (idClase: string, nuevoNombre: string) => void;
  onEliminarClase?: (clase: Clase) => void;
  onAgregarAtributo?: (idClase: string) => void;
  onSeleccionarAtributo?: (atributo: Atributo) => void;
  onAbrirPropiedadesAtributo?: (atributo: Atributo) => void;
  onCopiarAtributo?: (atributo: Atributo) => void;
  onReordenarAtributo?: (
    idClase: string,
    idAtributo: string,
    nuevoOrden: number
  ) => void;
  className?: string;
}

export const LienzoDiagrama = memo(function LienzoDiagrama({
  idDiagramaActivo,
  puedeEditar,
  cargandoDetalle,
  herramientaActiva,
  espacioPresionado,
  viewportInicial = { x: 0, y: 0, zoom: 1 },
  onViewportChange,
  onSeleccionarClase,
  onAbrirPropiedadesClase,
  onSeleccionarRelacion,
  onEliminarRelacion,
  onRenombrarRelacionInline,
  onConectarRelacion,
  onCrearClaseEnPosicion,
  onMoverClaseStop,
  onRedimensionarClaseStop,
  onRenombrarClaseInline,
  onEliminarClase,
  onAgregarAtributo,
  onSeleccionarAtributo,
  onAbrirPropiedadesAtributo,
  onCopiarAtributo,
  onReordenarAtributo,
  className,
}: LienzoDiagramaProps) {
  const detalleConfirmado = useEditorDiagramaStore((estado) => estado.detalleConfirmado);
  const clasesStore = useEditorDiagramaStore((estado) => estado.clases);
  const relacionesStore = useEditorDiagramaStore((estado) => estado.relaciones);
  const estructurasNmStore = useEditorDiagramaStore((estado) => estado.estructurasNm);
  const actualizarPosicionClaseDuranteArrastre = useEditorDiagramaStore(
    (estado) => estado.actualizarPosicionClaseDuranteArrastre
  );
  // Mientras llega el detalle del nuevo diagrama nunca proyectar el dominio de
  // la página anterior, aunque React Flow conserve un frame de renderizado.
  const detalleCoincide = detalleConfirmado?.id === idDiagramaActivo;
  const clases = useMemo(
    () => (detalleCoincide ? clasesStore : []),
    [clasesStore, detalleCoincide]
  );
  const relaciones = useMemo(
    () => (detalleCoincide ? relacionesStore : []),
    [relacionesStore, detalleCoincide]
  );
  const estructurasNm = useMemo(
    () => (detalleCoincide ? estructurasNmStore : []),
    [estructurasNmStore, detalleCoincide]
  );
  const claseSeleccionadaId = useEditorDiagramaStore((estado) => estado.claseSeleccionadaId);
  const relacionSeleccionadaId = useEditorDiagramaStore((estado) => estado.relacionSeleccionadaId);
  const dragPreviews = useColaboracionStore((s) => s.dragPreviews);
  const bloqueosClases = useColaboracionStore((s) => s.bloqueosClases);
  const miUsuarioId = useColaboracionStore((s) => s.miUsuarioId);

  const [arrastrando, setArrastrando] = useState(false);
  const reactFlowInstance = useReactFlow();

  // Ref para proteger el estado de nodos mientras se realiza un arrastre activo
  const isDraggingNodeRef = useRef(false);
  const posicionInicialArrastreRef = useRef<{ id: string; x: number; y: number } | null>(null);

  // Throttling refs para cursores y arrastre
  const ultimoEnvioCursorRef = useRef(0);
  const ultimoEnvioDragRef = useRef(0);

  // React Flow recibe una proyección pura de Zustand y estado efímero de colaboración.
  const nodes = useMemo<Node[]>(
    () =>
      proyectarNodosClase(
        clases,
        claseSeleccionadaId,
        dragPreviews,
        bloqueosClases,
        miUsuarioId
      ).map((node) => {
        const clase = node.data.clase as Clase;
        return {
          ...node,
          data: {
            ...node.data,
            clase,
            puedeEditar,
            onSeleccionarClase,
            onAbrirPropiedadesClase,
            onRedimensionarClaseStop,
            onRenombrarClaseInline,
            onAgregarAtributo,
            onSeleccionarAtributo,
            onAbrirPropiedadesAtributo,
            onCopiarAtributo,
            onReordenarAtributo,
            modoRelacion: herramientaActiva === "relacion",
          },
        };
      }),
    [
      clases,
      claseSeleccionadaId,
      dragPreviews,
      bloqueosClases,
      miUsuarioId,
      puedeEditar,
      herramientaActiva,
      onSeleccionarClase,
      onAbrirPropiedadesClase,
      onRedimensionarClaseStop,
      onRenombrarClaseInline,
      onAgregarAtributo,
      onSeleccionarAtributo,
      onAbrirPropiedadesAtributo,
      onCopiarAtributo,
      onReordenarAtributo,
    ]
  );

  const edges = useMemo<Edge[]>(
    () =>
      proyectarEdgesRelacion(relaciones, relacionSeleccionadaId, estructurasNm, clases).map((edge) => {
        const relacion = edge.data?.relacion as Relacion;
        return {
        ...edge,
        data: {
          // La arista compuesta N:M necesita conservar la estructura y la
          // clase intermedia del selector. Sin estos datos el edge personalizado
          // se descarta defensivamente y no llega a dibujar sus líneas.
          ...edge.data,
          relacion,
          seleccionada: Boolean(edge.selected),
          onSeleccionar: onSeleccionarRelacion,
          onEliminar: onEliminarRelacion,
          onRenombrarInline: onRenombrarRelacionInline,
          herramientaActiva,
          puedeEditar,
        },
      };
      }),
    [
      relaciones,
      relacionSeleccionadaId,
      estructurasNm,
      clases,
      onSeleccionarRelacion,
      onEliminarRelacion,
      onRenombrarRelacionInline,
      herramientaActiva,
      puedeEditar,
    ]
  );

  // Pan habilitado con botón izquierdo (0) y central (1) si está en Mano o Espacio;
  // solo central (1) si está en Selección, Clase o Borrador.
  const panOnDrag = useMemo(() => {
    if (herramientaActiva === "mano" || espacioPresionado) {
      return [0, 1];
    }
    return [1];
  }, [herramientaActiva, espacioPresionado]);

  // Estilo de cursor dinámico
  const cursorClass = useMemo(() => {
    if (herramientaActiva === "mano" || espacioPresionado) {
      return arrastrando ? "cursor-grabbing" : "cursor-grab";
    }
    if (herramientaActiva === "clase" && puedeEditar) {
      return "cursor-crosshair";
    }
    if (herramientaActiva === "borrador" && puedeEditar) {
      return "modo-borrador-activo";
    }
    return "cursor-default";
  }, [herramientaActiva, espacioPresionado, arrastrando, puedeEditar]);

  // Solo el arrastre escribe una posición temporal en Zustand. React Flow no
  // conserva ni sincroniza una copia separada del dominio.
  const handleNodesChange: OnNodesChange = useCallback((changes: NodeChange[]) => {
    for (const change of changes) {
      if (
        change.type === "position" &&
        change.position &&
        Number.isFinite(change.position.x) &&
        Number.isFinite(change.position.y)
      ) {
        actualizarPosicionClaseDuranteArrastre(
          change.id,
          Math.round(change.position.x),
          Math.round(change.position.y)
        );
      }
    }
  }, [actualizarPosicionClaseDuranteArrastre]);

  // Emisión de posición del cursor con throttling (~40ms)
  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      const ahora = Date.now();
      if (ahora - ultimoEnvioCursorRef.current >= 40) {
        ultimoEnvioCursorRef.current = ahora;
        const flowPos = reactFlowInstance.screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });
        if (Number.isFinite(flowPos.x) && Number.isFinite(flowPos.y)) {
          colaboracionSocketService.moverCursor(
            Math.round(flowPos.x),
            Math.round(flowPos.y)
          );
        }
      }
    },
    [reactFlowInstance]
  );

  // Emisión de preview de arrastre con throttling (~20ms)
  const handleNodeDrag: OnNodeDrag = useCallback((_event, node) => {
    const ahora = Date.now();
    const posX = node?.position?.x;
    const posY = node?.position?.y;
    if (
      Number.isFinite(posX) &&
      Number.isFinite(posY) &&
      ahora - ultimoEnvioDragRef.current >= 20
    ) {
      ultimoEnvioDragRef.current = ahora;
      colaboracionSocketService.arrastrarClasePreview(
        node.id,
        Math.round(posX),
        Math.round(posY)
      );
    }
  }, []);

  // Inicio de arrastre de nodo con verificación y solicitud de lock
  const handleNodeDragStart: OnNodeDrag = useCallback((_event, node) => {
    const lock = useColaboracionStore.getState().bloqueosClases[node.id];
    const miId = useColaboracionStore.getState().miUsuarioId;
    if (lock && miId && lock.idUsuario !== miId) {
      // Bloqueada por otro usuario: no permitir interacción
      return;
    }

    colaboracionSocketService.solicitarBloqueoClase(node.id);
    isDraggingNodeRef.current = true;
    const posX = node?.position?.x;
    const posY = node?.position?.y;
    if (Number.isFinite(posX) && Number.isFinite(posY)) {
      posicionInicialArrastreRef.current = {
        id: node.id,
        x: Math.round(posX),
        y: Math.round(posY),
      };
    }
  }, []);

  // Manejo de clic sobre el pane (espacio vacío del lienzo)
  const handlePaneClick = useCallback(
    (event: MouseEvent) => {
      if (herramientaActiva === "clase" && puedeEditar && onCrearClaseEnPosicion) {
        const flowPos = reactFlowInstance.screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });

        if (Number.isFinite(flowPos.x) && Number.isFinite(flowPos.y)) {
          // Clamping to workspace extent
          const clampedX = Math.max(-7800, Math.min(7800, flowPos.x));
          const clampedY = Math.max(-5800, Math.min(5800, flowPos.y));

          onCrearClaseEnPosicion(Math.round(clampedX), Math.round(clampedY));
        }
      } else if (herramientaActiva === "seleccion") {
        onSeleccionarClase?.(null);
        onSeleccionarRelacion?.(null);
      }
    },
    [
      herramientaActiva,
      puedeEditar,
      onCrearClaseEnPosicion,
      onSeleccionarClase,
      onSeleccionarRelacion,
      reactFlowInstance,
    ]
  );

  // Manejo de clic simple sobre un nodo
  const handleNodeClick = useCallback(
    (_: MouseEvent, node: Node) => {
      if (herramientaActiva === "borrador" && puedeEditar) {
        const claseEncontrada = clases.find((c) => c.id === node.id);
        if (claseEncontrada && onEliminarClase) {
          onEliminarClase(claseEncontrada);
        }
      } else {
        onSeleccionarClase?.(node.id);
        onSeleccionarRelacion?.(null);
      }
    },
    [herramientaActiva, puedeEditar, clases, onEliminarClase, onSeleccionarClase, onSeleccionarRelacion]
  );

  // Manejo de doble clic sobre un nodo de clase
  const handleNodeDoubleClick = useCallback(
    (_: MouseEvent, node: Node) => {
      if (herramientaActiva === "seleccion") {
        onAbrirPropiedadesClase?.(node.id);
      }
    },
    [herramientaActiva, onAbrirPropiedadesClase]
  );

  // Manejo de finalización de arrastre de nodo con liberación de lock
  const handleNodeDragStop: OnNodeDrag = useCallback(
    (_event, node) => {
      isDraggingNodeRef.current = false;
      const inicio = posicionInicialArrastreRef.current;
      posicionInicialArrastreRef.current = null;
      colaboracionSocketService.liberarBloqueoClase(node.id);

      const posX = node?.position?.x;
      const posY = node?.position?.y;
      if (!Number.isFinite(posX) || !Number.isFinite(posY)) {
        console.warn(
          `[handleNodeDragStop] Posición inválida ignorada para clase ${node?.id}: x=${posX}, y=${posY}`
        );
        return;
      }

      const finalX = Math.round(posX);
      const finalY = Math.round(posY);

      const cambioReal =
        !inicio ||
        inicio.id !== node.id ||
        inicio.x !== finalX ||
        inicio.y !== finalY;

      if (puedeEditar && onMoverClaseStop && cambioReal) {
        onMoverClaseStop(node.id, finalX, finalY);
      }
    },
    [puedeEditar, onMoverClaseStop]
  );

  return (
    <main
      className={cn(
        "relative h-full w-full flex-1 overflow-hidden bg-[#f5f5f5] select-none",
        cursorClass,
        className
      )}
      data-purpose="canvas-workspace"
    >
      {herramientaActiva === "borrador" && puedeEditar && (
        <style>{`
          .modo-borrador-activo,
          .modo-borrador-activo *,
          .modo-borrador-activo .react-flow__pane,
          .modo-borrador-activo .react-flow__node,
          .modo-borrador-activo .react-flow__node *,
          .modo-borrador-activo .react-flow__edge,
          .modo-borrador-activo .react-flow__edge *,
          .modo-borrador-activo .react-flow__edge path {
            cursor: ${CURSOR_BORRADOR} !important;
          }
        `}</style>
      )}
      <ReactFlow
        key={idDiagramaActivo || "diagrama-default"}
        nodes={nodes}
        edges={edges}
        nodeTypes={NODE_TYPES}
        edgeTypes={EDGE_TYPES}
        defaultViewport={viewportInicial}
        onViewportChange={onViewportChange}
        translateExtent={AREA_TRABAJO_EXTENT}
        nodeExtent={AREA_TRABAJO_EXTENT}
        minZoom={0.25}
        maxZoom={2}
        panOnDrag={panOnDrag}
        panOnScroll={false}
        zoomOnScroll={false}
        zoomActivationKeyCode="Control"
        zoomOnDoubleClick={false}
        nodesDraggable={puedeEditar && herramientaActiva === "seleccion" && !espacioPresionado}
        nodesConnectable={puedeEditar && herramientaActiva === "relacion"}
        elementsSelectable={true}
        onNodesChange={handleNodesChange}
        onMouseMove={handleMouseMove}
        onNodeDrag={handleNodeDrag}
        onNodeDragStart={handleNodeDragStart}
        onNodeDragStop={handleNodeDragStop}
        onPaneClick={handlePaneClick}
        onNodeClick={handleNodeClick}
        onNodeDoubleClick={handleNodeDoubleClick}
        onConnect={(conexion) => {
          if (puedeEditar && herramientaActiva === "relacion") {
            onConectarRelacion?.(conexion);
          }
        }}
        onEdgeClick={(_event, edge) => {
          const relacionDelEdge = edge.data?.relacion as Relacion | undefined;
          if (herramientaActiva === "borrador" && puedeEditar) {
            const rel = relacionDelEdge ?? relaciones.find((r) => r.id === edge.id);
            if (rel) {
              onEliminarRelacion?.(rel);
            }
          } else {
            onSeleccionarClase?.(null);
            onSeleccionarRelacion?.(relacionDelEdge?.id ?? edge.id);
          }
        }}
        onPaneContextMenu={(event) => {
          event.preventDefault();
        }}
        onMoveStart={() => setArrastrando(true)}
        onMoveEnd={() => setArrastrando(false)}
        className="h-full w-full"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1.5}
          color="#c5c5c5"
          className="bg-[#f5f5f5]"
        />
        <CapaCursoresRemotos />
      </ReactFlow>

      {/* Indicador sutil de carga no invasivo */}
      {cargandoDetalle && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
          <div className="flex items-center gap-2 rounded-full border border-slate-200/90 bg-white/95 px-4 py-2 shadow-md backdrop-blur-xs">
            <Spinner className="h-3.5 w-3.5 text-slate-700" />
            <span className="text-xs font-medium text-slate-700">
              Cargando página...
            </span>
          </div>
        </div>
      )}
    </main>
  );
});
