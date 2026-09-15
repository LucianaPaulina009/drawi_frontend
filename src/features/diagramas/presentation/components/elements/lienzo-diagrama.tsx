"use client";

import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import type { DiagramaDetalle } from "../../../domain/entities/diagrama.entity";

export interface LienzoDiagramaProps {
  diagramaActivo: DiagramaDetalle | null;
  cargandoDetalle: boolean;
  className?: string;
}

export function LienzoDiagrama({
  cargandoDetalle,
  className,
}: LienzoDiagramaProps) {
  return (
    <main
      className={cn(
        "relative h-full w-full flex-1 overflow-hidden bg-[#f5f5f5] select-none",
        className
      )}
      style={{
        backgroundImage:
          "radial-gradient(circle, #c5c5c5 1.5px, transparent 1.5px)",
        backgroundSize: "24px 24px",
      }}
      data-purpose="canvas-workspace"
    >
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

      {/* Área central limpia y abierta correspondiente al lienzo de Stitch */}
    </main>
  );
}
