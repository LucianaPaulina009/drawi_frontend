"use client";

import { memo, useMemo, useState } from "react";
import {
  Background,
  BackgroundVariant,
  ReactFlow,
  type CoordinateExtent,
  type Edge,
  type Node,
  type Viewport,
} from "@xyflow/react";

import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import type { DiagramaDetalle } from "../../../domain/entities/diagrama.entity";
import type { HerramientaLienzo } from "./barra-herramientas";

const EMPTY_NODES: Node[] = [];
const EMPTY_EDGES: Edge[] = [];

// Límites de área de trabajo finita inicial para 009 (16 000 x 12 000 unidades)
const AREA_TRABAJO_EXTENT: CoordinateExtent = [
  [-8000, -6000],
  [8000, 6000],
];

export interface LienzoDiagramaProps {
  idDiagramaActivo: string | null;
  diagramaActivo: DiagramaDetalle | null;
  cargandoDetalle: boolean;
  herramientaActiva: HerramientaLienzo;
  espacioPresionado: boolean;
  viewportInicial?: Viewport;
  onViewportChange?: (viewport: Viewport) => void;
  className?: string;
}

export const LienzoDiagrama = memo(function LienzoDiagrama({
  idDiagramaActivo,
  cargandoDetalle,
  herramientaActiva,
  espacioPresionado,
  viewportInicial = { x: 0, y: 0, zoom: 1 },
  onViewportChange,
  className,
}: LienzoDiagramaProps) {
  const [arrastrando, setArrastrando] = useState(false);

  // Pan habilitado con botón izquierdo (0) y central (1) si está en Mano o Espacio;
  // solo central (1) si está en Selección.
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
    return "cursor-default";
  }, [herramientaActiva, espacioPresionado, arrastrando]);

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
        nodes={EMPTY_NODES}
        edges={EMPTY_EDGES}
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
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        onPaneContextMenu={(event) => {
          event.preventDefault();
        }}
        onMoveStart={() => setArrastrando(true)}
        onMoveEnd={() => setArrastrando(false)}
        proOptions={{ hideAttribution: true }}
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
