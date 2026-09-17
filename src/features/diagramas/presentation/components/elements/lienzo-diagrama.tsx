"use client";

import { memo, useMemo, useState, useEffect, useCallback, useRef, type MouseEvent } from "react";
import {
  applyNodeChanges,
  Background,
  BackgroundVariant,
  ReactFlow,
  useReactFlow,
  type CoordinateExtent,
  type Edge,
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
import type { HerramientaLienzo } from "./barra-herramientas";
import { NodoClaseUml } from "./nodo-clase-uml";

const EMPTY_EDGES: Edge[] = [];

const NODE_TYPES = {
  claseUml: NodoClaseUml,
};

// Límites de área de trabajo finita para 009 (16 000 x 12 000 unidades)
const AREA_TRABAJO_EXTENT: CoordinateExtent = [
  [-8000, -6000],
  [8000, 6000],
];

export interface LienzoDiagramaProps {
  idDiagramaActivo: string | null;
  diagramaActivo: DiagramaDetalle | null;
  clases: Clase[];
  claseSeleccionadaId: string | null;
  puedeEditar: boolean;
  cargandoDetalle: boolean;
  herramientaActiva: HerramientaLienzo;
  espacioPresionado: boolean;
  viewportInicial?: Viewport;
  onViewportChange?: (viewport: Viewport) => void;
  onSeleccionarClase?: (idClase: string | null) => void;
  onCrearClaseEnPosicion?: (x: number, y: number) => void;
  onMoverClaseStop?: (idClase: string, x: number, y: number) => void;
  onRedimensionarClaseStop?: (idClase: string, nuevoAncho: number) => void;
  onRenombrarClaseInline?: (idClase: string, nuevoNombre: string) => void;
  onEliminarClase?: (clase: Clase) => void;
  onAgregarAtributo?: (idClase: string) => void;
  onSeleccionarAtributo?: (atributo: Atributo) => void;
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
  clases,
  claseSeleccionadaId,
  puedeEditar,
  cargandoDetalle,
  herramientaActiva,
  espacioPresionado,
  viewportInicial = { x: 0, y: 0, zoom: 1 },
  onViewportChange,
  onSeleccionarClase,
  onCrearClaseEnPosicion,
  onMoverClaseStop,
  onRedimensionarClaseStop,
  onRenombrarClaseInline,
  onEliminarClase,
  onAgregarAtributo,
  onSeleccionarAtributo,
  onCopiarAtributo,
  onReordenarAtributo,
  className,
}: LienzoDiagramaProps) {
  const [arrastrando, setArrastrando] = useState(false);
  const reactFlowInstance = useReactFlow();

  // Ref para proteger el estado de nodos mientras se realiza un arrastre activo
  const isDraggingNodeRef = useRef(false);

  // Estado local controlado de nodos de React Flow para renderizado continuo a 60fps
  const [nodes, setNodes] = useState<Node[]>([]);

  // Sincronizar nodos con la lista de clases manteniendo la posición cuando no se está arrastrando
  useEffect(() => {
    if (isDraggingNodeRef.current) return;

    setNodes(() =>
      clases.map((clase) => ({
        id: clase.id,
        type: "claseUml",
        position: { x: clase.posicionX, y: clase.posicionY },
        selected: clase.id === claseSeleccionadaId,
        data: {
          clase,
          puedeEditar,
          onSeleccionarClase,
          onRedimensionarClaseStop,
          onRenombrarClaseInline,
          onAgregarAtributo,
          onSeleccionarAtributo,
          onCopiarAtributo,
          onReordenarAtributo,
        },
      }))
    );
  }, [
    clases,
    claseSeleccionadaId,
    puedeEditar,
    onSeleccionarClase,
    onRedimensionarClaseStop,
    onRenombrarClaseInline,
    onAgregarAtributo,
    onSeleccionarAtributo,
    onCopiarAtributo,
    onReordenarAtributo,
  ]);

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
      return "cursor-pointer";
    }
    return "cursor-default";
  }, [herramientaActiva, espacioPresionado, arrastrando, puedeEditar]);

  // Manejador local de cambios de nodos: React Flow actualiza la posición local instantáneamente sin interferencias
  const handleNodesChange: OnNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes((nds) => applyNodeChanges(changes, nds));
  }, []);

  // Inicio de arrastre de nodo
  const handleNodeDragStart: OnNodeDrag = useCallback(() => {
    isDraggingNodeRef.current = true;
  }, []);

  // Manejo de clic sobre el pane (espacio vacío del lienzo)
  const handlePaneClick = useCallback(
    (event: MouseEvent) => {
      if (herramientaActiva === "clase" && puedeEditar && onCrearClaseEnPosicion) {
        const flowPos = reactFlowInstance.screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });

        // Clamping to workspace extent
        const clampedX = Math.max(-7800, Math.min(7800, flowPos.x));
        const clampedY = Math.max(-5800, Math.min(5800, flowPos.y));

        onCrearClaseEnPosicion(Math.round(clampedX), Math.round(clampedY));
      } else if (herramientaActiva === "seleccion") {
        onSeleccionarClase?.(null);
      }
    },
    [
      herramientaActiva,
      puedeEditar,
      onCrearClaseEnPosicion,
      onSeleccionarClase,
      reactFlowInstance,
    ]
  );

  // Manejo de clic sobre un nodo
  const handleNodeClick = useCallback(
    (_: MouseEvent, node: Node) => {
      if (herramientaActiva === "borrador" && puedeEditar) {
        const claseEncontrada = clases.find((c) => c.id === node.id);
        if (claseEncontrada && onEliminarClase) {
          onEliminarClase(claseEncontrada);
        }
      } else {
        onSeleccionarClase?.(node.id);
      }
    },
    [herramientaActiva, puedeEditar, clases, onEliminarClase, onSeleccionarClase]
  );

  // Manejo de finalización de arrastre de nodo: emite un único evento al soltar y reactiva sincronización
  const handleNodeDragStop: OnNodeDrag = useCallback(
    (_event, node) => {
      isDraggingNodeRef.current = false;
      if (puedeEditar && onMoverClaseStop) {
        onMoverClaseStop(
          node.id,
          Math.round(node.position.x),
          Math.round(node.position.y)
        );
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
      <ReactFlow
        key={idDiagramaActivo || "diagrama-default"}
        nodes={nodes}
        edges={EMPTY_EDGES}
        nodeTypes={NODE_TYPES}
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
        nodesConnectable={false}
        elementsSelectable={true}
        onNodesChange={handleNodesChange}
        onNodeDragStart={handleNodeDragStart}
        onNodeDragStop={handleNodeDragStop}
        onPaneClick={handlePaneClick}
        onNodeClick={handleNodeClick}
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
